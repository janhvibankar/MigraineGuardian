import { Router } from 'express';
import { verifyFirebaseToken } from '../middleware/verifyFirebaseToken.js';
import {
  getPssQuestionsController,
  submitPssAssessmentController,
  getLatestPssAssessmentController,
  getPssAssessmentHistoryController,
} from '../controllers/pssController.js';

const router = Router();

// Public endpoint for question definitions
router.get('/questions', getPssQuestionsController);

// Protected endpoints requiring Firebase Authentication
router.use(verifyFirebaseToken);

// POST /api/pss/submit — Submit answers and compute PSS-10 score
router.post('/submit', submitPssAssessmentController);

// GET /api/pss/latest — Retrieve user's latest PSS assessment
router.get('/latest', getLatestPssAssessmentController);

// GET /api/pss/history — Retrieve PSS assessment history list
router.get('/history', getPssAssessmentHistoryController);

export default router;
