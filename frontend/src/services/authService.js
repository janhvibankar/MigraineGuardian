import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase.js';
import { apiClient } from './apiClient.js';
import { storageService } from './storageService.js';
import { MOCK_USER } from '../data/mockUser.js';

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
    case 'auth/network-request-failed':
      return 'Network connection error. Please check your internet connection.';
    default:
      return err?.message || 'Authentication failed. Please try again.';
  }
}

export const authService = {
  getCurrentUser: () => {
    const cachedUser = storageService.getItem('migraineguardian_user', null);
    if (cachedUser) {
      const name = cachedUser.name || formatNameFromEmail(cachedUser.email) || 'User';
      return {
        ...MOCK_USER,
        ...cachedUser,
        name,
        initials: computeInitials(name),
      };
    }
    return MOCK_USER;
  },

  fetchUserProfile: async () => {
    const res = await apiClient.get('/user/profile');
    if (res.ok && res.data) {
      const user = {
        ...MOCK_USER,
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
      // 1. Authenticate using Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      storageService.setItem('migraineguardian_token', token);

      // 2. Fetch authenticated profile from Express API gateway
      const profile = await authService.fetchUserProfile();
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
      // 1. Create account via Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      await updateProfile(userCredential.user, { displayName });
      const token = await userCredential.user.getIdToken();
      storageService.setItem('migraineguardian_token', token);

      // 2. Initialize user profile in backend Firestore
      const res = await apiClient.patch('/user/profile', { name: displayName, email: cleanEmail });
      const user = res.ok && res.data ? res.data : { ...MOCK_USER, name: displayName, email: cleanEmail };

      user.initials = computeInitials(user.name);
      storageService.setItem('migraineguardian_user', user);
      storageService.setItem('migraineguardian_authenticated', true);
      notifyUserChanged(user);

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
      // 1. Authenticate via Google OAuth Popup
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      const displayName = firebaseUser.displayName || formatNameFromEmail(firebaseUser.email) || 'User';
      const token = await firebaseUser.getIdToken();
      storageService.setItem('migraineguardian_token', token);

      // 2. Sync profile name with backend
      await apiClient.patch('/user/profile', { name: displayName });

      // 3. Fetch full authenticated user profile from Express backend
      const user = await authService.fetchUserProfile();

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
    storageService.clearAll();
    notifyUserChanged(null);
    return { success: true };
  },

  updateUserProfile: async (updates) => {
    const res = await apiClient.patch('/user/profile', updates);
    let updated;
    if (res.ok && res.data) {
      updated = {
        ...MOCK_USER,
        ...res.data,
        initials: computeInitials(res.data.name || 'User'),
      };
    } else {
      const current = authService.getCurrentUser();
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
};

