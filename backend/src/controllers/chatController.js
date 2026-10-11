import { firestoreService } from '../services/firestoreService.js';

export async function getChatHistoryController(req, res, next) {
  try {
    const userId = req.user.uid;
    const sessionId = req.query.sessionId || null;

    const session = await firestoreService.getChatSession(userId, sessionId);

    return res.status(200).json({
      success: true,
      data: session || { sessionId, messages: [] },
    });
  } catch (error) {
    next(error);
  }
}

export async function saveChatHistoryController(req, res, next) {
  try {
    const userId = req.user.uid;
    const { sessionId, messages } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Payload "messages" must be an array.' },
      });
    }

    const result = await firestoreService.saveChatSession(userId, sessionId, messages);

    return res.status(200).json({
      success: true,
      data: result,
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
