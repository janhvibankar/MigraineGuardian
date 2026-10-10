/**
 * Chat Service (Connected to External RAG Chatbot Backend)
 *
 * Connects to the real Migraine RAG backend API with multilingual support (en, hi, mr).
 * Target API URL configured via VITE_RAG_API_URL environment variable.
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

  checkHealth: async () => {
    try {
      const baseUrl = getRagApiBaseUrl();
      const response = await apiClient.get(`${baseUrl}/health`);
      return response.ok && response.data?.status === 'ok';
    } catch {
      return false;
    }
  },

  sendMessage: async (query, options = {}) => {
    // The RAG backend only accepts explicit language codes: 'en', 'hi', 'mr'.
    // Callers should always pass options.language resolved by detectMessageLanguage.
    // Default to 'en' (never 'auto') so the backend never falls back to its own
    // unreliable auto-detection, which can return English for Marathi/Hindi input.
    let language = 'en';
    let sessionId = getOrCreateSessionId();

    if (typeof options === 'string') {
      // Legacy: caller passed language code directly as a string
      if (['en', 'hi', 'mr'].includes(options)) {
        language = options;
      }
    } else if (options && typeof options === 'object') {
      // Accept only explicit supported codes — 'auto' is NOT forwarded to the RAG API.
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

    const baseUrl = getRagApiBaseUrl();
    const endpoint = `${baseUrl}/api/chat`;

    try {
      const response = await apiClient.post(endpoint, {
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

      // If backend returned non-ok status or malformed response
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
