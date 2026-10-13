/**
 * Chat Service (Connected to External RAG Chatbot Backend via Express API Gateway)
 *
 * Connects to the real Migraine RAG backend API with multilingual support (en, hi, mr).
 * Uses the backend gateway /chat/message endpoint to eliminate browser CORS restrictions
 * and ensure seamless token handling across local and cloud environments.
 */

import { apiClient } from './apiClient';
import { MOCK_CHAT_DATA } from '../data/mockChat';
import { translate } from '../i18n';

const SESSION_STORAGE_KEY = 'mg_rag_chat_session_id';

const getRagApiBaseUrl = () => {
  const url = import.meta.env.VITE_CHATBOT_API_URL || import.meta.env.VITE_RAG_API_URL || '';
  if (url.endsWith('/api/chat')) {
    return url.substring(0, url.length - 9);
  }
  return url.replace(/\/+$/, '');
};

function getOrCreateSessionId() {
  try {
    let sid = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!sid || !/^[A-Za-z0-9_-]{1,64}$/.test(sid)) {
      sid = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      sessionStorage.setItem(SESSION_STORAGE_KEY, sid);
    }
    return sid;
  } catch {
    return `sess_${Date.now()}`;
  }
}

function getErrorKeyForStatus(status) {
  switch (status) {
    case 400:
      return 'chat.errorBadRequest';
    case 429:
      return 'chat.errorRateLimit';
    case 500:
      return 'chat.errorServerError';
    case 503:
    case 504:
    case 0:
      return 'chat.errorServerUnavailable';
    default:
      return 'chat.errorMessage';
  }
}

export const chatService = {
  getInitialChatContext: () => {
    return MOCK_CHAT_DATA;
  },

  getSuggestedQuestions: () => {
    return MOCK_CHAT_DATA.suggestedQuestions;
  },

  getConversationHistory: () => {
    return MOCK_CHAT_DATA.conversationHistory;
  },

  getSessionId: () => {
    return getOrCreateSessionId();
  },

  resetSession: () => {
    try {
      const newSid = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      sessionStorage.setItem(SESSION_STORAGE_KEY, newSid);
      return newSid;
    } catch {
      return `sess_${Date.now()}`;
    }
  },

  setSessionId: (newSid) => {
    try {
      if (newSid) {
        sessionStorage.setItem(SESSION_STORAGE_KEY, newSid);
      }
    } catch (_) {}
  },

  /**
   * Retrieves list of all persisted conversation sessions for current authenticated user.
   */
  listSessions: async () => {
    try {
      const response = await apiClient.get('/chat/sessions');
      if (response.ok && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (err) {
      console.warn('[chatService] Error listing chat sessions:', err.message);
      return [];
    }
  },

  /**
   * Retrieves messages for a specific conversation session.
   */
  fetchPersistedHistory: async (sessionId = null) => {
    try {
      const endpoint = sessionId ? `/chat/history?sessionId=${encodeURIComponent(sessionId)}` : '/chat/history';
      const response = await apiClient.get(endpoint);
      if (response.ok && response.data) {
        return {
          success: true,
          sessionId: response.data.sessionId || sessionId,
          title: response.data.title || 'Conversation',
          messages: Array.isArray(response.data.messages) ? response.data.messages : [],
        };
      }
      return { success: false, messages: [] };
    } catch (err) {
      console.warn('[chatService] Error fetching persisted history:', err.message);
      return { success: false, messages: [] };
    }
  },

  /**
   * Saves or updates messages in a specific conversation session.
   */
  savePersistedHistory: async (sessionId, messages, title = null) => {
    try {
      const response = await apiClient.post('/chat/history', {
        sessionId,
        messages,
        title,
      });
      return response.ok;
    } catch (err) {
      console.warn('[chatService] Error saving persisted history:', err.message);
      return false;
    }
  },

  /**
   * Deletes a specific conversation session.
   */
  deleteSession: async (sessionId) => {
    try {
      if (!sessionId) return false;
      const response = await apiClient.delete(`/chat/sessions/${encodeURIComponent(sessionId)}`);
      return response.ok;
    } catch (err) {
      console.warn('[chatService] Error deleting session:', err.message);
      return false;
    }
  },

  clearPersistedHistory: async (sessionId = null) => {
    try {
      const response = await apiClient.post('/chat/clear', { sessionId });
      return response.ok;
    } catch (err) {
      console.warn('[chatService] Error clearing persisted history:', err.message);
      return false;
    }
  },

  checkHealth: async () => {
    try {
      const baseUrl = getRagApiBaseUrl();
      if (baseUrl) {
        const response = await apiClient.get(`${baseUrl}/health`);
        if (response.ok && response.data?.status === 'ok') return true;
      }
      const gwRes = await apiClient.get('/health');
      return gwRes.ok;
    } catch {
      return false;
    }
  },

  /**
   * Sends user query to the RAG Assistant.
   * Routes via backend gateway /chat/message to completely prevent browser CORS errors
   * and avoid leaking sensitive user tokens or API secrets.
   */
  sendMessage: async (query, options = {}) => {
    let language = 'en';
    let sessionId = getOrCreateSessionId();

    if (typeof options === 'string') {
      if (['en', 'hi', 'mr'].includes(options)) {
        language = options;
      }
    } else if (options && typeof options === 'object') {
      if (options.language && ['en', 'hi', 'mr'].includes(options.language)) {
        language = options.language;
      }
      if (options.sessionId) {
        sessionId = options.sessionId;
      }
    }

    console.debug(
      '[chatService] Resolved language for RAG API:',
      language,
      '| sessionId:', sessionId
    );

    // Primary route: Express gateway proxy (immune to CORS restrictions)
    const primaryEndpoint = '/chat/message';

    try {
      const response = await apiClient.post(primaryEndpoint, {
        message: query,
        sessionId,
        language,
      });

      if (response.ok && response.data && typeof response.data.answer === 'string' && response.data.answer.trim()) {
        return {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: response.data.answer,
          language: response.data.language || language,
          sources: Array.isArray(response.data.sources) ? response.data.sources : [],
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: false,
        };
      }

      // If gateway returns non-ok status or malformed response
      const status = response.status || 0;
      const isMalformed = response.ok && (!response.data || typeof response.data.answer !== 'string');
      const errorKey = isMalformed ? 'chat.errorMalformedResponse' : getErrorKeyForStatus(status);
      const errorText = translate(language, errorKey);

      console.warn(`[chatService] API request returned status ${status}. ErrorKey: ${errorKey}`);

      return {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: errorText,
        language,
        sources: [],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
        errorKey,
      };
    } catch (error) {
      console.error('[chatService] Exception during send message:', error);
      const errorKey = 'chat.errorServerUnavailable';
      const errorText = translate(language, errorKey);

      return {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: errorText,
        language,
        sources: [],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
        errorKey,
      };
    }
  },
};

export default chatService;
