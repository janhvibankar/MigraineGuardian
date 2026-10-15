import { firestoreService } from '../services/firestoreService.js';

export function getRagServiceUrl() {
  const rawUrl = process.env.RAG_SERVICE_URL || 'https://migraine-rag-chatbot.onrender.com/api/chat';
  const clean = rawUrl.trim().replace(/\/+$/, '');
  if (!clean.endsWith('/api/chat')) {
    if (clean.endsWith('/api')) {
      return `${clean}/chat`;
    }
    return `${clean}/api/chat`;
  }
  return clean;
}

const RAG_TIMEOUT_MS = 45000;
const RAG_TOTAL_BUDGET_MS = 55000;
const activeChatRequests = new Map();

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
    const requestKey = `${cleanSessionId}_${message.trim().slice(0, 32)}`;

    // Prevent duplicate overlapping requests for the same session query
    if (activeChatRequests.has(requestKey)) {
      console.log(`[RAG Proxy] Awaiting in-flight RAG request for key: ${requestKey}`);
      try {
        const deduplicatedResponse = await activeChatRequests.get(requestKey);
        if (deduplicatedResponse) {
          return res.status(200).json(deduplicatedResponse);
        }
      } catch (_) {}
    }

    let chatResolver;
    const chatPromise = new Promise((resolve) => {
      chatResolver = resolve;
    });
    activeChatRequests.set(requestKey, chatPromise);

    const startTime = Date.now();
    let attempt = 0;
    let lastError = null;
    let wasWarming = false;

    try {
      while (true) {
        attempt++;
        const elapsedSoFar = Date.now() - startTime;
        const remainingBudget = RAG_TOTAL_BUDGET_MS - elapsedSoFar;

        if (remainingBudget <= 2000) {
          console.warn(`[RAG Proxy] Total budget of ${RAG_TOTAL_BUDGET_MS}ms exceeded after ${attempt} attempts`);
          break;
        }

        const attemptTimeoutMs = Math.min(RAG_TIMEOUT_MS, remainingBudget);
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), attemptTimeoutMs);

        try {
          const ragUrl = getRagServiceUrl();
          console.log(`[RAG Proxy] Calling external RAG service (attempt ${attempt}, budget remaining ${remainingBudget}ms): ${ragUrl}`);
          const ragRes = await fetch(ragUrl, {
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

            // Only retry transient 502/503/504 (cold-start spin-up on Render free tier)
            const isTransient = [502, 503, 504].includes(ragRes.status);
            if (!isTransient) {
              // Non-retryable permanent errors (400, 401, 403, 404, 422, 429) fail immediately
              return res.status(ragRes.status).json({
                success: false,
                error: {
                  code: 'RAG_SERVICE_HTTP_ERROR',
                  status: ragRes.status,
                  message: `External assistant returned HTTP ${ragRes.status}`,
                },
              });
            }

            wasWarming = true;
            const delay = Math.min(2000 * Math.pow(1.5, attempt - 1), 5000);
            if (Date.now() - startTime + delay >= RAG_TOTAL_BUDGET_MS - 2000) {
              break;
            }
            await new Promise((r) => setTimeout(r, delay));
            continue;
          }

          const ragData = await ragRes.json();
          const successPayload = {
            success: true,
            data: {
              answer: ragData.answer,
              sources: Array.isArray(ragData.sources) ? ragData.sources : [],
              language: ragData.language || lang,
              sessionId: cleanSessionId,
            },
          };

          if (typeof chatResolver === 'function') {
            chatResolver(successPayload);
          }

          return res.status(200).json(successPayload);
        } catch (err) {
          clearTimeout(timer);
          lastError = err;
          console.warn(`[RAG Proxy] Attempt ${attempt} failed: ${err.message}`);

          const isTransient =
            err.name === 'AbortError' ||
            err.code === 'ECONNREFUSED' ||
            err.cause?.code === 'ECONNREFUSED' ||
            err.message?.includes('fetch failed');

          if (!isTransient) {
            break;
          }

          wasWarming = true;
          const delay = Math.min(2000 * Math.pow(1.5, attempt - 1), 5000);
          if (Date.now() - startTime + delay >= RAG_TOTAL_BUDGET_MS - 2000) {
            break;
          }
          await new Promise((r) => setTimeout(r, delay));
        }
      }

      const isTimeout = lastError?.name === 'AbortError' && !wasWarming;
      return res.status(isTimeout ? 504 : 503).json({
        success: false,
        error: {
          code: wasWarming ? 'RAG_SERVICE_WARMING' : (isTimeout ? 'RAG_SERVICE_TIMEOUT' : 'RAG_SERVICE_UNAVAILABLE'),
          message: wasWarming
            ? 'Assistant service is warming up. Please send your message again shortly.'
            : (isTimeout
              ? 'Assistant request timed out. Please try again.'
              : 'Unable to connect to assistant service. Please try again.'),
        },
      });
    } finally {
      activeChatRequests.delete(requestKey);
      if (typeof chatResolver === 'function') {
        chatResolver(null);
      }
    }
  } catch (error) {
    next(error);
  }
}
