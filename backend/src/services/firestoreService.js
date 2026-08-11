import { db } from '../config/firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';

function computeInitials(name) {
  if (!name || typeof name !== 'string') return 'MG';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'MG';
  if (parts.length === 1) {
    const single = parts[0];
    return single.length >= 2 ? single.slice(0, 2).toUpperCase() : single.toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const firestoreService = {
  /**
   * Retrieves user profile from Firestore collection `users/{userId}`.
   * If document does not exist, returns initialized default structure.
   */
  getUserProfile: async (userId, userEmail = null, userName = null) => {
    if (!db) {
      throw new Error('Cloud Firestore is not initialized. Verify Firebase credentials.');
    }

    const userRef = db.collection('users').doc(userId);
    const doc = await userRef.get();

    if (doc.exists) {
      return { id: userId, ...doc.data() };
    }

    // Default initial profile payload matching frontend contract
    const fallbackName = userName || (userEmail ? userEmail.split('@')[0] : 'User');
    const defaultProfile = {
      userId,
      name: fallbackName,
      email: userEmail || '',
      initials: computeInitials(fallbackName),
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      diagnosis: 'Migraine with sensory aura (episodic)',
      hasMigraines: 'Yes',
      frequency: '1–3 times a month',
      severity: 6,
      duration: '4–12 hours',
      usesMedication: 'Yes',
      baselineTriggers: [
        'Barometric drops (>6 hPa)',
        'Sleep disruption (<6.5 hrs)',
        'Bright fluorescent lighting',
        'High sensory overload',
        'Skipped meals / dehydration',
      ],
      selectedFactors: ['Sleep', 'Stress', 'Screen time', 'Hydration', 'Meals'],
      emergencyProtocol: {
        prescribedMedication: 'Rizatriptan 10mg orally at onset',
        secondaryAction: 'Cold compress, dark room, 500ml electrolyte water',
        emergencyContact: 'Neurology Clinic - (555) 392-8110',
      },
      currentRiskScore: 18,
      riskCategory: 'LOW',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Auto-create document on first request if it does not exist
    await userRef.set(defaultProfile);
    return { id: userId, ...defaultProfile };
  },

  /**
   * Updates fields in `users/{userId}` document.
   */
  updateUserProfile: async (userId, updates) => {
    if (!db) {
      throw new Error('Cloud Firestore is not initialized. Verify Firebase credentials.');
    }

    const userRef = db.collection('users').doc(userId);

    // Recompute initials if name is updated
    const updatePayload = { ...updates };
    if (updates.name && typeof updates.name === 'string') {
      updatePayload.name = updates.name.trim();
      updatePayload.initials = computeInitials(updates.name);
    }

    updatePayload.updatedAt = new Date().toISOString();

    await userRef.set(updatePayload, { merge: true });

    // Fetch and return fresh document
    const updatedDoc = await userRef.get();
    return { id: userId, ...updatedDoc.data() };
  },

  /**
   * Saves or updates a daily check-in under `users/{userId}/daily_checkins/{YYYY-MM-DD}`.
   * If migraine_occurrence is true, also writes to `migraine_episodes` subcollection.
   */
  saveDailyCheckin: async (userId, logData) => {
    if (!db) {
      throw new Error('Cloud Firestore is not initialized.');
    }

    const date = logData.date || new Date().toISOString().split('T')[0];
    const checkinRef = db.collection('users').doc(userId).collection('daily_checkins').doc(date);

    const isMigraine = Boolean(logData.migraine_occurrence);

    const checkinDoc = {
      checkinId: date,
      date,
      sleep_hours: Number(logData.sleep_hours),
      sleep_quality: Number(logData.sleep_quality),
      daily_stress: Number(logData.daily_stress),
      mood: Number(logData.mood),
      screen_time: Number(logData.screen_time),
      hydration: Number(logData.hydration),
      meal_skipped: String(logData.meal_skipped || 'No'),
      caffeine: String(logData.caffeine || 'None'),
      exercise: String(logData.exercise || 'None'),
      migraine_occurrence: isMigraine,
      migraine_severity: isMigraine ? Number(logData.migraine_severity || 0) : null,
      migraine_duration: isMigraine ? String(logData.migraine_duration || '') : null,
      symptoms: isMigraine && Array.isArray(logData.symptoms) ? logData.symptoms : [],
      updatedAt: new Date().toISOString(),
    };

    const existingDoc = await checkinRef.get();
    if (!existingDoc.exists) {
      checkinDoc.createdAt = new Date().toISOString();
    }

    await checkinRef.set(checkinDoc, { merge: true });

    // Store migraine episode details in subcollection if migraine occurred
    if (isMigraine) {
      const episodeRef = checkinRef.collection('migraine_episodes').doc('primary');
      await episodeRef.set(
        {
          checkinDate: date,
          severity: Number(logData.migraine_severity || 0),
          duration: String(logData.migraine_duration || ''),
          symptoms: Array.isArray(logData.symptoms) ? logData.symptoms : [],
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }

    return { success: true, entry: checkinDoc };
  },

  /**
   * Retrieves daily check-in logs for user up to limit.
   */
  getDailyLogs: async (userId, limit = 30) => {
    if (!db) {
      throw new Error('Cloud Firestore is not initialized.');
    }

    const checkinsRef = db.collection('users').doc(userId).collection('daily_checkins');
    const snapshot = await checkinsRef.orderBy('date', 'desc').limit(limit).get();

    if (snapshot.empty) {
      return [];
    }

    const logs = [];
    snapshot.forEach((doc) => {
      logs.push({ id: doc.id, ...doc.data() });
    });

    return logs;
  },

  /**
   * Retrieves today's check-in log for user.
   */
  getTodayCheckin: async (userId, targetDate = null) => {
    if (!db) {
      throw new Error('Cloud Firestore is not initialized.');
    }

    const date = targetDate || new Date().toISOString().split('T')[0];
    const checkinRef = db.collection('users').doc(userId).collection('daily_checkins').doc(date);
    const doc = await checkinRef.get();

    if (doc.exists) {
      return { id: doc.id, ...doc.data() };
    }
    return null;
  },

  /**
   * Saves completed PSS-10 assessment to `users/{userId}/pss_assessments/{assessmentId}`
   * and updates latest summary in `users/{userId}`.
   */
  savePssAssessment: async (userId, assessmentData) => {
    if (!db) {
      throw new Error('Cloud Firestore is not initialized.');
    }

    const assessmentRef = db.collection('users').doc(userId).collection('pss_assessments').doc();
    const assessmentId = assessmentRef.id;

    const completedAt = assessmentData.completedAt || new Date().toISOString();

    const record = {
      assessmentId,
      score: Number(assessmentData.score),
      category: String(assessmentData.category),
      interpretation: String(assessmentData.interpretation || ''),
      answers: assessmentData.answers,
      completedAt,
      createdAt: new Date().toISOString(),
    };

    await assessmentRef.set(record);

    // Update summary pssScore on user profile document
    const userRef = db.collection('users').doc(userId);
    await userRef.set(
      {
        pssScore: {
          score: Number(assessmentData.score),
          category: String(assessmentData.category),
          lastTaken: completedAt,
        },
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return { success: true, assessmentId, ...record };
  },

  /**
   * Retrieves user's latest completed PSS assessment.
   */
  getLatestPssAssessment: async (userId) => {
    if (!db) {
      throw new Error('Cloud Firestore is not initialized.');
    }

    const snapshot = await db
      .collection('users')
      .doc(userId)
      .collection('pss_assessments')
      .orderBy('completedAt', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  },

  /**
   * Retrieves PSS assessment history for user.
   */
  getPssAssessmentHistory: async (userId, limit = 10) => {
    if (!db) {
      throw new Error('Cloud Firestore is not initialized.');
    }

    const snapshot = await db
      .collection('users')
      .doc(userId)
      .collection('pss_assessments')
      .orderBy('completedAt', 'desc')
      .limit(limit)
      .get();

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  },
};


