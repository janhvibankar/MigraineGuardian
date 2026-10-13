import { Router } from 'express';
import { verifyFirebaseToken, optionalFirebaseToken } from '../middleware/verifyFirebaseToken.js';
import {
  listChatSessionsController,
  getChatHistoryController,
  saveChatHistoryController,
  deleteChatSessionController,
  clearChatHistoryController,
  proxyChatMessageController,
} from '../controllers/chatController.js';

const router = Router();

// ── Authenticated Conversation Management & History Endpoints ──

// GET /api/chat/sessions & /api/chat/history/list — Retrieve list of all conversations for user
router.get('/sessions', verifyFirebaseToken, listChatSessionsController);
router.get('/history/list', verifyFirebaseToken, listChatSessionsController);

// GET /api/chat/history?sessionId=... — Retrieve chat history for specific conversation
router.get('/history', verifyFirebaseToken, getChatHistoryController);

// POST /api/chat/history — Save or update conversation transcript
router.post('/history', verifyFirebaseToken, saveChatHistoryController);

// DELETE /api/chat/sessions/:sessionId — Delete a specific conversation
router.delete('/sessions/:sessionId', verifyFirebaseToken, deleteChatSessionController);

// DELETE /api/chat/history — Delete specific session or clear history
router.delete('/history', verifyFirebaseToken, (req, res, next) => {
  if (req.query.sessionId) {
    return deleteChatSessionController(req, res, next);
  }
  return clearChatHistoryController(req, res, next);
});

// POST /api/chat/clear — Clear chat conversation
router.post('/clear', verifyFirebaseToken, clearChatHistoryController);

// ── RAG Educational Message Proxy Endpoints ──
// Uses optionalFirebaseToken so both authenticated users and guests can receive educational answers
router.post('/message', optionalFirebaseToken, proxyChatMessageController);
router.post('/', optionalFirebaseToken, proxyChatMessageController);

export default router;
