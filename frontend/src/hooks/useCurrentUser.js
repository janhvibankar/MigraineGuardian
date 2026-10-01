import { useState, useEffect } from 'react';
import { auth } from '../config/firebase.js';
import { authService } from '../services/authService';

/**
 * Reactive hook to access and update the currently authenticated user
 */
export function useCurrentUser() {
  const [user, setUser] = useState(() => authService.getCurrentUser());

  useEffect(() => {
    const handleUserUpdate = (e) => {
      if (e?.detail !== undefined) {
        setUser(e.detail);
      } else {
        setUser(authService.getCurrentUser());
      }
    };

    window.addEventListener('migraineguardian_user_updated', handleUserUpdate);
    window.addEventListener('storage', handleUserUpdate);

    let unsubscribeAuth = null;
    if (auth && typeof auth.onAuthStateChanged === 'function') {
      unsubscribeAuth = auth.onAuthStateChanged((firebaseUser) => {
        if (!firebaseUser) {
          setUser(null);
        } else {
          setUser(authService.getCurrentUser());
        }
      });
    }

    return () => {
      window.removeEventListener('migraineguardian_user_updated', handleUserUpdate);
      window.removeEventListener('storage', handleUserUpdate);
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, []);

  return user;
}

