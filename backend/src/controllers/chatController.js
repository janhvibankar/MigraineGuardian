import { firestoreService } from '../services/firestoreService.js';

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'https://migraine-rag-chatbot.onrender.com/api/chat';
const RAG_TIMEOUT_MS = 45000;

export async function listChatSessionsController(req, res, next) {
  try {
    const userId = req.user.uid;
    const limit = parseInt(req.query.limit, 10) || 50;

    const sessions = await firestoreService.listChatSessions(userId, limit);

    return res.status(200).json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
}

export async function getChatHistoryController(req, res, next) {
  try {
    const userId = req.user.uid;
    const sessionId = req.query.sessionId || null;

    const session = await firestoreService.getChatSession(userId, sessionId);

    return res.status(200).json({
      success: true,
      data: session || { sessionId, title: 'New Conversation', messages: [] },
    });
  } catch (error) {
    next(error);
  }
}

export async function saveChatHistoryController(req, res, next) {
  try {
    const userId = req.user.uid;
    const { sessionId, messages, title } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Payload "messages" must be an array.' },
      });
    }

    const result = await firestoreService.saveChatSession(userId, sessionId, messages, title);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteChatSessionController(req, res, next) {
  try {
    const userId = req.user.uid;
    const sessionId = req.params.sessionId || req.query.sessionId || req.body?.sessionId;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: { message: 'sessionId is required to delete a chat session.' },
      });
    }

    await firestoreService.deleteChatSession(userId, sessionId);

    return res.status(200).json({
      success: true,
      message: 'Chat session deleted successfully.',
      sessionId,
    });
  } catch (error) {
    next(error);
  }
}

export async function clearChatHistoryController(req, res, next) {
  try {
    const userId = req.user.uid;
    const sessionId = req.query.sessionId || req.body?.sessionId || null;

    await firestoreService.clearChatSession(userId, sessionId);

    return res.status(200).json({
      success: true,
      message: 'Chat history cleared successfully.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Proxy controller for RAG Chatbot queries.
 * Server-side forward to external RAG backend eliminates browser CORS restrictions
 * and avoids exposing tokens or credentials to external third-party hosts.
 */
export async function proxyChatMessageController(req, res, next) {
  try {
    const { message, sessionId, language = 'en' } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Query message is required.' },
      });
    }

    const lang = ['en', 'hi', 'mr'].includes(language) ? language : 'en';
    const cleanSessionId = sessionId || `sess_${Date.now()}`;

    const maxAttempts = 3;
    let lastError = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), RAG_TIMEOUT_MS);

      try {
        console.log(`[RAG Proxy] Calling external RAG service (attempt ${attempt}/${maxAttempts}): ${RAG_SERVICE_URL}`);
        const ragRes = await fetch(RAG_SERVICE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            message: message.trim(),
            sessionId: cleanSessionId,
            language: lang,
          }),
          signal: controller.signal,
        });

        clearTimeout(timer);

        if (!ragRes.ok) {
          console.warn(`[RAG Proxy] External RAG returned HTTP ${ragRes.status}`);
          // If 502/503/504 (service spinning up on Render free tier), retry
          if ([502, 503, 504].includes(ragRes.status) && attempt < maxAttempts) {
            await new Promise((r) => setTimeout(r, 2000));
            continue;
          }
          return res.status(ragRes.status).json({
            success: false,
            error: {
              code: 'RAG_SERVICE_HTTP_ERROR',
              status: ragRes.status,
              message: `External assistant returned HTTP ${ragRes.status}`,
            },
          });
        }

        const ragData = await ragRes.json();

        return res.status(200).json({
          success: true,
          data: {
            answer: ragData.answer,
            sources: Array.isArray(ragData.sources) ? ragData.sources : [],
            language: ragData.language || lang,
            sessionId: cleanSessionId,
          },
        });
      } catch (err) {
        clearTimeout(timer);
        lastError = err;
        console.warn(`[RAG Proxy] Attempt ${attempt} failed: ${err.message}`);
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
    }

    const isTimeout = lastError?.name === 'AbortError';
    return res.status(isTimeout ? 504 : 503).json({
      success: false,
      error: {
        code: isTimeout ? 'RAG_SERVICE_TIMEOUT' : 'RAG_SERVICE_UNAVAILABLE',
        message: isTimeout
          ? 'Assistant request timed out. Please try again.'
          : 'Unable to connect to assistant service. Please try again.',
      },
    });
  } catch (error) {
    next(error);
  }
}
