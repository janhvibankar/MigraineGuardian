import { Router } from 'express';
import { verifyFirebaseToken } from '../middleware/verifyFirebaseToken.js';
import {
  getChatHistoryController,
  saveChatHistoryController,
  clearChatHistoryController,
} from '../controllers/chatController.js';

const router = Router();

// Enforce Firebase Authentication for chat history endpoints
router.use(verifyFirebaseToken);

// GET /api/chat/history?sessionId=... — Retrieve chat history for authenticated user
router.get('/history', getChatHistoryController);

// POST /api/chat/history — Save or sync conversation transcript
router.post('/history', saveChatHistoryController);

// DELETE /api/chat/history & POST /api/chat/clear — Clear chat conversation
router.delete('/history', clearChatHistoryController);
router.post('/clear', clearChatHistoryController);

export default router;
