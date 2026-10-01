import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase.js';
import { apiClient } from './apiClient.js';
import { storageService } from './storageService.js';
import { pssService } from './pssService.js';

export function computeInitials(name) {
  if (!name || typeof name !== 'string') return 'MG';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'MG';
  if (parts.length === 1) {
    const single = parts[0];
    return single.length >= 2 ? single.slice(0, 2).toUpperCase() : single.toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatNameFromEmail(email) {
  if (!email || typeof email !== 'string') return 'User';
  const username = email.split('@')[0] || '';
  if (!username) return 'User';
  const cleaned = username.replace(/[0-9_.-]+/g, ' ').trim();
  if (!cleaned) return 'User';
  const words = cleaned.split(/\s+/).filter(Boolean);
  return words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function notifyUserChanged(user) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('migraineguardian_user_updated', { detail: user }));
  }
}

function formatFirebaseError(err) {
  const code = err?.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address format.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 8 characters.';
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please check your credentials and try again.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials and try again.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completing.';
    case 'auth/popup-blocked':
      return 'Google sign-in popup was blocked by your browser. Please allow popups for this site.';
    case 'auth/cancelled-popup-request':
      return 'Google sign-in request was cancelled.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with the same email address using a different sign-in method.';
    case 'auth/requires-recent-login':
      return 'For security, please log out and log back in before changing your password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again in a few minutes.';
    default:
      return err?.message || 'Authentication failed. Please try again.';
  }
}

export function clearUserScopedData() {
  storageService.removeItem('migraineguardian_token');
  storageService.removeItem('migraineguardian_user');
  storageService.removeItem('migraineguardian_authenticated');
  storageService.removeItem('daily_checkin_today');
  storageService.removeItem('daily_checkin_draft');
  storageService.removeItem('migraineguardian_daily_logs');
  storageService.removeItem('migraineguardian_today_forecast');
  storageService.removeItem('pss_score_latest');
  storageService.removeItem('migraineguardian_read_notifications');

  localStorage.removeItem('migraineguardian_token');
  localStorage.removeItem('migraineguardian_user');
  localStorage.removeItem('migraineguardian_authenticated');
  localStorage.removeItem('daily_checkin_draft');
  localStorage.removeItem('daily_checkin_today');
  localStorage.removeItem('migraineguardian_today_forecast');
  localStorage.removeItem('pss_score_latest');
}

export const authService = {
  /**
   * Retrieves the currently cached authenticated user profile, or null if unauthenticated.
   */
  getCurrentUser: () => {
    // If Firebase Auth is loaded and there is no authenticated user, return null
    if (auth && !auth.currentUser) {
      return null;
    }
    const cachedUser = storageService.getItem('migraineguardian_user', null);
    if (cachedUser) {
      const name = cachedUser.name || formatNameFromEmail(cachedUser.email) || 'User';
      return {
        ...cachedUser,
        name,
        initials: computeInitials(name),
      };
    }
    return null;
  },

  /**
   * Checks whether there is an actively authenticated user session in Firebase.
   */
  isAuthenticated: () => {
    return Boolean(auth && auth.currentUser);
  },

  /**
   * Retrieves temporary guest onboarding state without requiring an account.
   */
  getGuestOnboarding: () => {
    return storageService.getItem('migraineguardian_guest_onboarding', null);
  },

  /**
   * Persists temporary guest onboarding state in isolated client storage.
   */
  saveGuestOnboarding: (data) => {
    const current = storageService.getItem('migraineguardian_guest_onboarding', {}) || {};
    const updated = {
      ...current,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    storageService.setItem('migraineguardian_guest_onboarding', updated);
    return updated;
  },

  /**
   * Clears temporary guest onboarding state.
   */
  clearGuestOnboarding: () => {
    storageService.removeItem('migraineguardian_guest_onboarding');
    localStorage.removeItem('migraineguardian_guest_onboarding');
  },

  /**
   * Explicitly transfers temporary guest onboarding data to the authenticated user's Firestore record.
   */
  transferGuestOnboardingToUser: async () => {
    const guestData = storageService.getItem('migraineguardian_guest_onboarding', null);
    if (!guestData) return;

    try {
      const updates = {};
      if (guestData.name) updates.name = guestData.name;
      if (guestData.age) updates.age = guestData.age;
      if (guestData.gender) updates.gender = guestData.gender;
      if (guestData.hasMigraines !== undefined) updates.hasMigraines = guestData.hasMigraines;
      if (guestData.frequency) updates.frequency = guestData.frequency;
      if (guestData.severity !== undefined) updates.severity = guestData.severity;
      if (guestData.duration) updates.duration = guestData.duration;
      if (guestData.usesMedication !== undefined) updates.usesMedication = guestData.usesMedication;
      if (guestData.selectedFactors) updates.selectedFactors = guestData.selectedFactors;

      if (Object.keys(updates).length > 0) {
        await apiClient.patch('/user/profile', updates);
      }

      if (guestData.pssAnswers) {
        await pssService.submitAssessment(guestData.pssAnswers);
      }

      // Re-fetch profile to sync state
      await authService.fetchUserProfile();

      // Clean up guest draft once transferred
      authService.clearGuestOnboarding();
    } catch (err) {
      console.warn('[authService] Error transferring guest onboarding data to user profile:', err.message);
    }
  },

  /**
   * Fetches the user profile from Express API gateway for the current authenticated user.
   */
  fetchUserProfile: async () => {
    if (!auth || !auth.currentUser) {
      return null;
    }
    const res = await apiClient.get('/user/profile');
    if (res.ok && res.data) {
      const user = {
        ...res.data,
        initials: computeInitials(res.data.name || 'User'),
      };
      storageService.setItem('migraineguardian_user', user);
      storageService.setItem('migraineguardian_authenticated', true);
      notifyUserChanged(user);
      return user;
    }
    return authService.getCurrentUser();
  },

  login: async (emailInput, password) => {
    const email = emailInput?.trim() || '';
    try {
      // Clear previous account's cached data before signing in
      clearUserScopedData();

      // 1. Authenticate using Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      storageService.setItem('migraineguardian_token', token);
      storageService.setItem('migraineguardian_authenticated', true);

      // 2. Fetch authenticated profile from Express API gateway
      const profile = await authService.fetchUserProfile();

      // 3. Migrate any guest onboarding data to the authenticated account
      await authService.transferGuestOnboardingToUser();

      return { success: true, user: profile };
    } catch (err) {
      console.warn('[authService] Firebase Auth login error:', err.code || err.message);
      return {
        success: false,
        error: formatFirebaseError(err),
      };
    }
  },

  signup: async ({ name, email, password }) => {
    const cleanEmail = email?.trim() || '';
    const displayName = name?.trim() || formatNameFromEmail(cleanEmail) || 'User';

    try {
      // Clear previous account's cached data before signing up
      clearUserScopedData();

      // 1. Create account via Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      await updateProfile(userCredential.user, { displayName });
      const token = await userCredential.user.getIdToken();
      storageService.setItem('migraineguardian_token', token);
      storageService.setItem('migraineguardian_authenticated', true);

      // 2. Initialize user profile in backend Firestore
      const res = await apiClient.patch('/user/profile', { name: displayName, email: cleanEmail });
      const user = res.ok && res.data ? res.data : { name: displayName, email: cleanEmail };

      user.initials = computeInitials(user.name);
      storageService.setItem('migraineguardian_user', user);
      notifyUserChanged(user);

      // 3. Migrate any guest onboarding data to the newly created account
      await authService.transferGuestOnboardingToUser();

      return { success: true, user };
    } catch (err) {
      console.warn('[authService] Firebase Auth signup error:', err.code || err.message);
      return {
        success: false,
        error: formatFirebaseError(err),
      };
    }
  },

  loginWithGoogle: async () => {
    try {
      // Clear previous account's cached data before Google sign-in
      clearUserScopedData();

      // 1. Authenticate via Google OAuth Popup
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      const displayName = firebaseUser.displayName || formatNameFromEmail(firebaseUser.email) || 'User';
      const token = await firebaseUser.getIdToken();
      storageService.setItem('migraineguardian_token', token);
      storageService.setItem('migraineguardian_authenticated', true);

      // 2. Sync profile name with backend
      await apiClient.patch('/user/profile', { name: displayName });

      // 3. Fetch full authenticated user profile from Express backend
      const user = await authService.fetchUserProfile();

      // 4. Migrate any guest onboarding data to the account
      await authService.transferGuestOnboardingToUser();

      return { success: true, user };
    } catch (err) {
      console.warn('[authService] Google Auth error:', err.code || err.message);
      return {
        success: false,
        error: formatFirebaseError(err),
      };
    }
  },

  logout: async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('[authService] Sign out error:', e.message);
    }
    // Clean all authenticated user storage
    clearUserScopedData();

    notifyUserChanged(null);
    return { success: true };
  },

  updateUserProfile: async (updates) => {
    const res = await apiClient.patch('/user/profile', updates);
    let updated;
    if (res.ok && res.data) {
      updated = {
        ...res.data,
        initials: computeInitials(res.data.name || 'User'),
      };
    } else {
      const current = authService.getCurrentUser() || {};
      updated = { ...current, ...updates };
      if (updates.name) {
        updated.name = updates.name.trim();
        updated.initials = computeInitials(updated.name);
      }
    }

    storageService.setItem('migraineguardian_user', updated);
    notifyUserChanged(updated);
    return updated;
  },

  changePassword: async (currentPassword, newPassword) => {
    try {
      const user = auth?.currentUser;
      if (!user) {
        return {
          success: false,
          error: 'You must be signed in to change your password.',
        };
      }

      if (!currentPassword || !newPassword) {
        return {
          success: false,
          error: 'Current password and new password are required.',
        };
      }

      if (newPassword.length < 8) {
        return {
          success: false,
          error: 'New password must be at least 8 characters long.',
        };
      }

      if (!user.email) {
        return {
          success: false,
          error: 'User email not found. Please log in again.',
        };
      }

      // Reauthenticate user with current password
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password in Firebase Authentication
      await updatePassword(user, newPassword);

      // Refresh ID token in storage
      const token = await user.getIdToken(true);
      storageService.setItem('migraineguardian_token', token);

      return {
        success: true,
        message: 'Password changed successfully.',
      };
    } catch (err) {
      console.warn('[authService] changePassword error:', err.code || err.message);
      return {
        success: false,
        error: formatFirebaseError(err),
      };
    }
  },
};

// Global Firebase auth state listener to keep storage in sync
let lastTrackedUid = null;
if (auth && typeof auth.onAuthStateChanged === 'function') {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      if (lastTrackedUid && lastTrackedUid !== user.uid) {
        // UID changed without explicit logout; invalidate previous user cache
        clearUserScopedData();
      }
      lastTrackedUid = user.uid;

      try {
        const token = await user.getIdToken();
        storageService.setItem('migraineguardian_token', token);
        storageService.setItem('migraineguardian_authenticated', true);
      } catch (e) {
        console.warn('[authService] Token refresh error:', e);
      }
    } else {
      lastTrackedUid = null;
      // If Firebase says no user is authenticated, wipe all authenticated session data
      clearUserScopedData();
      notifyUserChanged(null);
    }
  });
}

export default authService;
