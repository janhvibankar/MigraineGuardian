import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  browserPopupRedirectResolver,
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase.js';
import { apiClient } from './apiClient.js';
import { storageService } from './storageService.js';
import { pssService } from './pssService.js';
import { triggerBackgroundWarmup } from './warmupService.js';

export function isMobileBrowser() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || window.opera || '';
  const isTouchScreen = Boolean(
    typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 0
  );
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;
  return mobileRegex.test(ua) || (isTouchScreen && /Macintosh/i.test(ua));
}

let googleSignInPromise = null;
let redirectResultPromise = null;

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

export function buildLocalUserFromFirebase(firebaseUser) {
  if (!firebaseUser) return null;
  const displayName = firebaseUser.displayName || formatNameFromEmail(firebaseUser.email) || 'User';
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    name: displayName,
    displayName,
    photoURL: firebaseUser.photoURL || null,
    initials: computeInitials(displayName),
  };
}

function notifyUserChanged(user) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('migraineguardian_user_updated', { detail: user }));
  }
}

/**
 * Detects transient IndexedDB errors thrown by Firebase Auth when a mobile page
 * loses focus, triggers autofill/keyboards, switches apps, or initiates OAuth popups.
 */
export function isTransientDatabaseClosingError(err) {
  if (!err) return false;
  const msg = (err.message || '').toLowerCase();
  return (
    msg.includes('closing/hidden') ||
    msg.includes('database is closing') ||
    msg.includes('ishiding') ||
    msg.includes('connection is closing') ||
    (err.name === 'AbortError' && msg.includes('closing')) ||
    (err.name === 'InvalidStateError' && msg.includes('database'))
  );
}

/**
 * Executes an idempotent authentication operation with brief bounded delay
 * to allow transient mobile browser IndexedDB connection locks to settle.
 * Does NOT dispatch synthetic DOM events or alter global persistence state.
 */
export async function executeAuthWithRetry(authOp, maxRetries = 2, baseDelayMs = 250) {
  let attempt = 0;
  while (true) {
    try {
      return await authOp();
    } catch (err) {
      if (isTransientDatabaseClosingError(err) && attempt < maxRetries) {
        attempt++;
        console.warn(`[authService] Transient DB closing condition detected during sign-in. Retrying attempt ${attempt}/${maxRetries}...`);
        await new Promise((resolve) => setTimeout(resolve, baseDelayMs * attempt));
        continue;
      }
      throw err;
    }
  }
}

/**
 * Safe development/production diagnostic logging helper.
 * Records operation name, failure stage, error code, and error message.
 * In development/debug mode, records stack trace.
 * NEVER logs passwords, ID tokens, refresh tokens, API keys, or user credentials.
 */
export function logSafeAuthDiagnostic(operation, stage, err) {
  const isDev =
    typeof window !== 'undefined' &&
    ((typeof import.meta !== 'undefined' && import.meta.env?.DEV) ||
      window.location?.hostname === 'localhost' ||
      window.location?.hostname === '127.0.0.1');

  const diagnostic = {
    operation,
    stage,
    errorCode: err?.code || 'unknown',
    errorMessage: err?.message || String(err),
    errorName: err?.name || 'Error',
  };

  if (isDev && err?.stack) {
    diagnostic.stack = err.stack;
  }

  console.warn(`[authService Diagnostic] ${operation} failed during ${stage}:`, diagnostic);
  return diagnostic;
}

export function formatFirebaseError(err, context = 'default') {
  const code = err?.code || '';
  switch (code) {
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for OAuth operations. Please verify authorized domains in Firebase Console.';
    case 'auth/web-storage-unsupported':
      return 'Third-party storage access is restricted in this browser. Please use standard redirect sign-in.';
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
    case 'auth/network-request-failed':
      return 'Network connection issue. Please check your internet connection and try again.';
    case 'auth/argument-error':
      return 'Authentication configuration error. Please refresh the page or try another sign-in method.';
    default:
      break;
  }

  if (isTransientDatabaseClosingError(err)) {
    if (context === 'google') {
      return 'Authentication storage was temporarily busy during Google sign-in. Please tap Continue with Google again.';
    }
    if (context === 'signup') {
      return 'Authentication storage is momentarily busy. Please try signing in.';
    }
    return 'Authentication storage is momentarily busy. Please tap Sign In again.';
  }

  return err?.message || 'Authentication failed. Please try again.';
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
  storageService.removeItem('migraineguardian_preferences');

  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    window.localStorage.removeItem('migraineguardian_token');
    window.localStorage.removeItem('migraineguardian_user');
    window.localStorage.removeItem('migraineguardian_authenticated');
    window.localStorage.removeItem('daily_checkin_draft');
    window.localStorage.removeItem('daily_checkin_today');
    window.localStorage.removeItem('migraineguardian_today_forecast');
    window.localStorage.removeItem('pss_score_latest');
    window.localStorage.removeItem('migraineguardian_preferences');

    // Clean any user-specific forecast cache keys
    try {
      const keysToRemove = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith('migraineguardian_forecast_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => window.localStorage.removeItem(k));
    } catch (_) { }
  }
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
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      window.localStorage.removeItem('migraineguardian_guest_onboarding');
    }
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

      let profileOk = true;
      if (Object.keys(updates).length > 0) {
        const res = await apiClient.patch('/user/profile', updates);
        profileOk = Boolean(res && res.ok);
      }

      let pssOk = true;
      if (guestData.pssAnswers) {
        const pssRes = await pssService.submitAssessment(guestData.pssAnswers);
        pssOk = Boolean(pssRes);
      }

      // Re-fetch profile to sync state
      await authService.fetchUserProfile();

      // Clean up guest draft only once transfer succeeds
      if (profileOk && pssOk) {
        authService.clearGuestOnboarding();
        return true;
      }
      return false;
    } catch (err) {
      console.warn('[authService] Error transferring guest onboarding data to user profile:', err.message);
      return false;
    }
  },

  /**
   * Background synchronization of user profile, server sync, and guest onboarding transfer.
   * Runs non-blockingly so the user navigates immediately to the Dashboard without waiting
   * on sleeping Render backend cold-starts.
   */
  syncUserInBackground: async (initialUser, retryAttempts = 2) => {
    try {
      // Defer warm-up pings slightly (1500ms) so critical login profile sync and dashboard data load first
      setTimeout(() => {
        triggerBackgroundWarmup(true);
      }, 1500);

      // Run profile patch and guest onboarding transfer concurrently
      const profilePromise = initialUser?.name
        ? apiClient.patch('/user/profile', { name: initialUser.name, email: initialUser.email }).catch(() => { })
        : Promise.resolve();

      const guestPromise = authService.transferGuestOnboardingToUser();

      await Promise.allSettled([profilePromise, guestPromise]);
      const updatedProfile = await authService.fetchUserProfile();
      if (updatedProfile) {
        notifyUserChanged(updatedProfile);
      }
      return updatedProfile || initialUser;
    } catch (err) {
      console.warn('[authService] Background user profile sync attempt failed:', err.message);
      if (retryAttempts > 0) {
        setTimeout(() => {
          authService.syncUserInBackground(initialUser, retryAttempts - 1);
        }, 3000);
      }
      return initialUser;
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
    console.time('[Auth] Email Login');
    try {
      // Clear previous account's cached data before signing in
      clearUserScopedData();

      // 1. Authenticate using Firebase Auth with mobile lifecycle retry
      const userCredential = await executeAuthWithRetry(() =>
        signInWithEmailAndPassword(auth, email, password)
      );
      const token = await userCredential.user.getIdToken();
      storageService.setItem('migraineguardian_token', token);
      storageService.setItem('migraineguardian_authenticated', true);

      const initialUser = buildLocalUserFromFirebase(userCredential.user);
      storageService.setItem('migraineguardian_user', initialUser);
      notifyUserChanged(initialUser);

      // Background synchronization (non-blocking)
      authService.syncUserInBackground(initialUser);

      console.timeEnd('[Auth] Email Login');
      return { success: true, user: initialUser };
    } catch (err) {
      console.timeEnd('[Auth] Email Login');
      logSafeAuthDiagnostic('login (email/password)', 'sign-in request', err);
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
      logSafeAuthDiagnostic('signup (email/password)', 'account creation request', err);
      return {
        success: false,
        error: formatFirebaseError(err, 'signup'),
      };
    }
  },

  handleRedirectResult: async () => {
    if (typeof window === 'undefined') {
      return { success: false, redirectHandled: false };
    }
    if (redirectResultPromise) {
      return redirectResultPromise;
    }

    redirectResultPromise = (async () => {
      try {
        if (!auth) {
          return { success: false, redirectHandled: false };
        }

        if (typeof auth.authStateReady === 'function') {
          await auth.authStateReady();
        }

        const resolver =
          typeof browserPopupRedirectResolver === 'function' ||
            (browserPopupRedirectResolver && typeof browserPopupRedirectResolver === 'object' && !('code' in browserPopupRedirectResolver))
            ? browserPopupRedirectResolver
            : undefined;

        let result = null;
        try {
          result = await getRedirectResult(auth, resolver);
        } catch (redirectErr) {
          if (typeof window !== 'undefined' && window.sessionStorage) {
            try {
              window.sessionStorage.removeItem('mg_google_redirect_in_flight');
            } catch (e) {
              // Ignore storage errors
            }
          }
          logSafeAuthDiagnostic('handleRedirectResult', 'getRedirectResult error', redirectErr);
          return {
            success: false,
            redirectHandled: true,
            error: formatFirebaseError(redirectErr, 'google'),
          };
        }

        const hadRedirectFlag =
          typeof window !== 'undefined' &&
          window.sessionStorage &&
          window.sessionStorage.getItem('mg_google_redirect_in_flight') === 'true';

        if (typeof window !== 'undefined' && window.sessionStorage) {
          try {
            window.sessionStorage.removeItem('mg_google_redirect_in_flight');
          } catch (e) {
            // Ignore storage errors
          }
        }

        const firebaseUser = result?.user || (hadRedirectFlag ? auth.currentUser : null);

        if (!firebaseUser) {
          return { success: false, redirectHandled: false };
        }

        const initialUser = buildLocalUserFromFirebase(firebaseUser);
        const token = await firebaseUser.getIdToken();
        storageService.setItem('migraineguardian_token', token);
        storageService.setItem('migraineguardian_authenticated', true);
        storageService.setItem('migraineguardian_user', initialUser);
        notifyUserChanged(initialUser);

        // Run profile patch, fetch & guest transfer non-blockingly in background
        authService.syncUserInBackground(initialUser);

        return { success: true, redirectHandled: true, user: initialUser };
      } catch (err) {
        logSafeAuthDiagnostic('handleRedirectResult', 'redirect result processing', err);
        return {
          success: false,
          redirectHandled: true,
          error: formatFirebaseError(err, 'google'),
        };
      }
    })();

    return redirectResultPromise;
  },

  loginWithGoogle: async () => {
    // Serialize Google sign-in to prevent concurrent requests or race conditions
    if (googleSignInPromise) {
      return googleSignInPromise;
    }

    googleSignInPromise = (async () => {
      console.time('[Auth] Google Sign-In');
      try {
        if (!auth) {
          return { success: false, error: 'Authentication service is not initialized.' };
        }

        if (typeof auth.authStateReady === 'function') {
          await auth.authStateReady();
        }

        const resolver =
          typeof browserPopupRedirectResolver === 'function' ||
            (browserPopupRedirectResolver && typeof browserPopupRedirectResolver === 'object' && !('code' in browserPopupRedirectResolver))
            ? browserPopupRedirectResolver
            : undefined;

        const mobile = isMobileBrowser();

        if (mobile) {
          // On physical mobile devices (iOS Safari, Android Chrome), popups open in background tabs
          // that drop IndexedDB connection state ('Database is closing/hidden') or are blocked.
          // Directly invoke full-page redirect for seamless mobile OAuth completion.
          if (typeof window !== 'undefined' && window.sessionStorage) {
            try {
              window.sessionStorage.setItem('mg_google_redirect_in_flight', 'true');
            } catch (e) {
              // Ignore sessionStorage error
            }
          }
          logSafeAuthDiagnostic('loginWithGoogle (mobile)', 'initiating full-page OAuth redirect');
          await signInWithRedirect(auth, googleProvider, resolver);
          return { success: true, pendingRedirect: true };
        }

        // On desktop environments, execute popup flow
        let result = null;
        try {
          result = await signInWithPopup(auth, googleProvider, resolver);
        } catch (popupErr) {
          const code = popupErr?.code || '';
          const isPopupBlocked =
            code === 'auth/popup-blocked' ||
            code === 'auth/cancelled-popup-request' ||
            code === 'auth/operation-not-supported-in-this-environment' ||
            code === 'auth/web-storage-unsupported' ||
            isTransientDatabaseClosingError(popupErr);

          if (isPopupBlocked) {
            logSafeAuthDiagnostic('loginWithGoogle (desktop)', 'popup blocked/unavailable, falling back to redirect', popupErr);
            if (typeof window !== 'undefined' && window.sessionStorage) {
              try {
                window.sessionStorage.setItem('mg_google_redirect_in_flight', 'true');
              } catch (e) {
                // Ignore sessionStorage error
              }
            }
            await signInWithRedirect(auth, googleProvider, resolver);
            return { success: true, pendingRedirect: true };
          }
          throw popupErr;
        }

        if (result && result.user) {
          const firebaseUser = result.user;
          const initialUser = buildLocalUserFromFirebase(firebaseUser);
          const token = await firebaseUser.getIdToken();
          storageService.setItem('migraineguardian_token', token);
          storageService.setItem('migraineguardian_authenticated', true);
          storageService.setItem('migraineguardian_user', initialUser);
          notifyUserChanged(initialUser);

          // Run profile patch, fetch & guest transfer non-blockingly in background
          authService.syncUserInBackground(initialUser);

          console.timeEnd('[Auth] Google Sign-In');
          return { success: true, user: initialUser };
        }

        return { success: false, error: 'Authentication did not return a user.' };
      } catch (err) {
        logSafeAuthDiagnostic('loginWithGoogle', 'sign-in request', err);
        return {
          success: false,
          error: formatFirebaseError(err, 'google'),
        };
      } finally {
        googleSignInPromise = null;
      }
    })();

    return googleSignInPromise;
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
      logSafeAuthDiagnostic('changePassword', 'password change request', err);
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
