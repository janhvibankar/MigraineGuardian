import { Router } from 'express';
import { verifyFirebaseToken } from '../middleware/verifyFirebaseToken.js';
import {
  getUserProfileController,
  updateUserProfileController,
} from '../controllers/userController.js';

const router = Router();

// Apply Firebase ID Token verification middleware to all user routes
router.use(verifyFirebaseToken);

// GET /api/user/profile — Get authenticated user's profile
router.get('/profile', getUserProfileController);

// PATCH /api/user/profile — Update user profile fields in Firestore
router.patch('/profile', updateUserProfileController);

export default router;
