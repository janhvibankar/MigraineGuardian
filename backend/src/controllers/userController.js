import { firestoreService } from '../services/firestoreService.js';

export async function getUserProfileController(req, res, next) {
  try {
    const userId = req.user.uid;
    const email = req.user.email;
    const name = req.user.name;

    const profile = await firestoreService.getUserProfile(userId, email, name);

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateUserProfileController(req, res, next) {
  try {
    const userId = req.user.uid;
    const allowedFields = [
      'name',
      'age',
      'gender',
      'diagnosis',
      'hasMigraines',
      'frequency',
      'severity',
      'duration',
      'usesMedication',
      'baselineTriggers',
      'selectedFactors',
      'emergencyProtocol',
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: 'No valid user profile fields provided for update.',
        },
      });
    }

    const updatedProfile = await firestoreService.updateUserProfile(userId, updates);

    return res.status(200).json({
      success: true,
      message: 'User profile updated successfully in Firestore.',
      data: updatedProfile,
    });
  } catch (error) {
    next(error);
  }
}
