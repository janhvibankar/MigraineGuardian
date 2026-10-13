import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { chatService } from '../services/chatService';
import { useTranslation } from '../hooks/useTranslation';
import { detectMessageLanguage } from '../utils/detectMessageLanguage';
import { auth } from '../config/firebase';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const { t, language } = useTranslation();

  const createWelcomeMessage = (lang) => ({
    id: 'welcome',
    sender: 'assistant',
    text: t('chat.welcomeMessage'),
    sources: [],
    time: t('common.justNow', 'Just now'),
  });

  const [messages, setMessages] = useState([createWelcomeMessage(language)]);
  const [sessionId, setSessionId] = useState(() => chatService.getSessionId());
  const [activeSessionTitle, setActiveSessionTitle] = useState('New Conversation');
  const [sessionsList, setSessionsList] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [lastUserQuery, setLastUserQuery] = useState('');
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const prevUidRef = useRef(null);

  // Load chat sessions & active history from backend when user is authenticated
  const refreshSessionsList = async () => {
    try {
      const list = await chatService.listSessions();
      setSessionsList(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn('[ChatContext] Error loading sessions list:', err.message);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = auth?.onAuthStateChanged?.(async (user) => {
      const currentUid = user?.uid || null;

      // If user signed out, reset state to clean welcome message
      if (!currentUid) {
        if (prevUidRef.current !== null && isMounted) {
          const newSid = chatService.resetSession();
          setSessionId(newSid);
          setMessages([createWelcomeMessage(language)]);
          setActiveSessionTitle('New Conversation');
          setSessionsList([]);
          setLastUserQuery('');
        }
        prevUidRef.current = null;
        return;
      }

      // If freshly logging in or switching accounts
      if (currentUid !== prevUidRef.current) {
        prevUidRef.current = currentUid;
        if (!isMounted) return;

        setIsLoadingHistory(true);
        try {
          // 1. Fetch user's conversation history list
          const list = await chatService.listSessions();
          if (isMounted) {
            setSessionsList(Array.isArray(list) ? list : []);
          }

          // 2. Fetch currently active conversation (or latest)
          const currentSid = chatService.getSessionId();
          const historyRes = await chatService.fetchPersistedHistory(currentSid);

          if (isMounted) {
            if (historyRes.success && Array.isArray(historyRes.messages) && historyRes.messages.length > 0) {
              setMessages(historyRes.messages);
              setActiveSessionTitle(historyRes.title || 'Conversation');
              if (historyRes.sessionId) {
                setSessionId(historyRes.sessionId);
                chatService.setSessionId(historyRes.sessionId);
              }
            } else if (Array.isArray(list) && list.length > 0 && !currentSid) {
              // If no explicit session ID was active in sessionStorage, load user's latest conversation
              const latest = list[0];
              const latestRes = await chatService.fetchPersistedHistory(latest.sessionId);
              if (latestRes.success && Array.isArray(latestRes.messages)) {
                setMessages(latestRes.messages);
                setSessionId(latest.sessionId);
                setActiveSessionTitle(latest.title || 'Conversation');
                chatService.setSessionId(latest.sessionId);
              }
            } else {
              setMessages([createWelcomeMessage(language)]);
              setActiveSessionTitle('New Conversation');
            }
          }
        } catch (err) {
          console.warn('[ChatContext] Failed to restore history from backend:', err.message);
          if (isMounted) {
            setMessages([createWelcomeMessage(language)]);
            setActiveSessionTitle('New Conversation');
          }
        } finally {
          if (isMounted) setIsLoadingHistory(false);
        }
      }
    });

    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [language]);

  // Update welcome message on language switch if conversation hasn't started
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'welcome') {
        return [createWelcomeMessage(language)];
      }
      return prev;
    });
  }, [language, t]);

  /**
   * Action 1: Creates a fresh, isolated conversation with a new conversation ID.
   * Does NOT wipe prior conversations from history.
   */
  const startNewChat = () => {
    const newSid = chatService.resetSession();
    setSessionId(newSid);
    setMessages([createWelcomeMessage(language)]);
    setActiveSessionTitle('New Conversation');
    setLastUserQuery('');
  };

  /**
   * Action 2: Restores a previously saved conversation by sessionId.
   */
  const switchSession = async (targetSessionId) => {
    if (!targetSessionId || targetSessionId === sessionId) return;

    setIsLoadingHistory(true);
    try {
      const historyRes = await chatService.fetchPersistedHistory(targetSessionId);
      if (historyRes.success && Array.isArray(historyRes.messages)) {
        setMessages(historyRes.messages.length > 0 ? historyRes.messages : [createWelcomeMessage(language)]);
        setSessionId(targetSessionId);
        setActiveSessionTitle(historyRes.title || 'Conversation');
        chatService.setSessionId(targetSessionId);
      }
    } catch (err) {
      console.warn('[ChatContext] Failed to switch conversation session:', err.message);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  /**
   * Action 3: Deletes a specific conversation from Firestore and updates state.
   */
  const deleteSession = async (targetSessionId) => {
    if (!targetSessionId) return;

    try {
      await chatService.deleteSession(targetSessionId);
      setSessionsList((prev) => prev.filter((s) => s.sessionId !== targetSessionId));

      // If active session was deleted, start a fresh conversation
      if (targetSessionId === sessionId) {
        startNewChat();
      }
    } catch (err) {
      console.warn('[ChatContext] Error deleting session:', err.message);
    }
  };

  const sendMessage = async (textToSend, customLanguage = null) => {
    const query = (textToSend || '').trim();
    if (!query || isTyping) return;

    setLastUserQuery(query);

    const chatLanguage = customLanguage || detectMessageLanguage(query, language);

    const userMsg = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedWithUser = [...messages, userMsg];
    setMessages(updatedWithUser);
    setIsTyping(true);

    // Compute title if current title is default
    let currentTitle = activeSessionTitle;
    if (currentTitle === 'New Conversation' || !currentTitle) {
      const rawText = query.replace(/[\r\n]+/g, ' ');
      currentTitle = rawText.length > 40 ? `${rawText.substring(0, 38)}...` : rawText;
      setActiveSessionTitle(currentTitle);
    }

    try {
      const reply = await chatService.sendMessage(query, {
        language: chatLanguage,
        sessionId,
      });

      const updatedWithReply = [...updatedWithUser, reply];
      setMessages(updatedWithReply);

      // Persist transcript to backend for authenticated user
      await chatService.savePersistedHistory(sessionId, updatedWithReply, currentTitle);
      // Refresh conversation list in background to update title/timestamp
      refreshSessionsList();
    } catch (err) {
      console.error('[ChatContext] Exception sending message:', err);
    } finally {
      setIsTyping(false);
    }
  };

  const retryLast = () => {
    if (lastUserQuery) {
      sendMessage(lastUserQuery);
    }
  };

  const clearConversation = async () => {
    const oldSid = sessionId;
    startNewChat();

    // Clear from backend
    try {
      await chatService.deleteSession(oldSid);
      setSessionsList((prev) => prev.filter((s) => s.sessionId !== oldSid));
    } catch (err) {
      console.warn('[ChatContext] Error clearing remote chat:', err.message);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        sessionId,
        activeSessionTitle,
        sessionsList,
        isTyping,
        lastUserQuery,
        isWidgetOpen,
        setIsWidgetOpen,
        isLoadingHistory,
        sendMessage,
        retryLast,
        startNewChat,
        switchSession,
        deleteSession,
        clearConversation,
        refreshSessionsList,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
