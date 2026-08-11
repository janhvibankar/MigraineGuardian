import { useState, useEffect } from 'react';
import { authService } from '../services/authService';

/**
 * Reactive hook to access and update the currently authenticated user
 */
export function useCurrentUser() {
  const [user, setUser] = useState(() => authService.getCurrentUser());

  useEffect(() => {
    const handleUserUpdate = (e) => {
      if (e.detail) {
        setUser(e.detail);
      } else {
        setUser(authService.getCurrentUser());
      }
    };

    window.addEventListener('migraineguardian_user_updated', handleUserUpdate);
    window.addEventListener('storage', handleUserUpdate);

    return () => {
      window.removeEventListener('migraineguardian_user_updated', handleUserUpdate);
      window.removeEventListener('storage', handleUserUpdate);
    };
  }, []);

  return user;
}
