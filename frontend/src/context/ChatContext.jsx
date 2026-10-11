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
  const [isTyping, setIsTyping] = useState(false);
  const [lastUserQuery, setLastUserQuery] = useState('');
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const prevUidRef = useRef(null);

  // Load chat history from backend when user is authenticated
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
          setLastUserQuery('');
        }
        prevUidRef.current = null;
        return;
      }

      // If switching accounts or freshly logging in
      if (currentUid !== prevUidRef.current) {
        prevUidRef.current = currentUid;
        if (!isMounted) return;

        setIsLoadingHistory(true);
        try {
          const currentSid = chatService.getSessionId();
          const historyRes = await chatService.fetchPersistedHistory(currentSid);

          if (isMounted) {
            if (historyRes.success && Array.isArray(historyRes.messages) && historyRes.messages.length > 0) {
              setMessages(historyRes.messages);
              if (historyRes.sessionId) {
                setSessionId(historyRes.sessionId);
                try {
                  sessionStorage.setItem('mg_rag_chat_session_id', historyRes.sessionId);
                } catch (_) {}
              }
            } else {
              setMessages([createWelcomeMessage(language)]);
            }
          }
        } catch (err) {
          console.warn('[ChatContext] Failed to restore history from backend:', err.message);
          if (isMounted) {
            setMessages([createWelcomeMessage(language)]);
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

    try {
      const reply = await chatService.sendMessage(query, {
        language: chatLanguage,
        sessionId,
      });

      const updatedWithReply = [...updatedWithUser, reply];
      setMessages(updatedWithReply);

      // Persist transcript to backend for authenticated user
      chatService.savePersistedHistory(sessionId, updatedWithReply).catch((err) => {
        console.warn('[ChatContext] Async background save error:', err.message);
      });
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
    const newSid = chatService.resetSession();
    setSessionId(newSid);
    setMessages([createWelcomeMessage(language)]);
    setLastUserQuery('');

    // Clear from backend
    try {
      await chatService.clearPersistedHistory(oldSid);
    } catch (err) {
      console.warn('[ChatContext] Error clearing remote chat:', err.message);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        sessionId,
        isTyping,
        lastUserQuery,
        isWidgetOpen,
        setIsWidgetOpen,
        isLoadingHistory,
        sendMessage,
        retryLast,
        clearConversation,
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
