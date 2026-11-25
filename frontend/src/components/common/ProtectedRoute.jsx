import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { auth } from '../../config/firebase';
import { authService } from '../../services/authService';
import { storageService } from '../../services/storageService';
import { ROUTES } from '../../utils/constants';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute() {
  const location = useLocation();
  const [authState, setAuthState] = useState(() => {
    // If a Google redirect is in flight, remain in loading state so route guard does not eject prematurely
    const redirectInFlight =
      (typeof window !== 'undefined' && window.sessionStorage?.getItem('mg_google_redirect_in_flight') === 'true') ||
      (typeof window !== 'undefined' && window.localStorage?.getItem('mg_google_redirect_in_flight') === 'true');

    const isAuthed = Boolean(
      (auth && auth.currentUser) ||
      storageService.getItem('migraineguardian_authenticated')
    );
    return {
      isLoading: redirectInFlight || (!isAuthed && Boolean(auth)),
      isAuthenticated: isAuthed,
    };
  });

  useEffect(() => {
    let isMounted = true;

    async function checkAuthWithRedirect() {
      if (!auth) {
        if (isMounted) {
          setAuthState({
            isLoading: false,
            isAuthenticated: false,
          });
        }
        return;
      }

      // Check if redirect result is resolving in background
      try {
        const res = await authService.handleRedirectResult();
        if (!isMounted) return;
        if (res && res.success && res.user) {
          setAuthState({
            isLoading: false,
            isAuthenticated: true,
          });
          return;
        }
      } catch (err) {
        console.warn('[ProtectedRoute] Redirect check error:', err);
      }

      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (!isMounted) return;
        setAuthState({
          isLoading: false,
          isAuthenticated: Boolean(user),
        });
      });

      return unsubscribe;
    }

    let unsubFn;
    checkAuthWithRedirect().then((fn) => {
      unsubFn = fn;
    });

    return () => {
      isMounted = false;
      if (typeof unsubFn === 'function') {
        unsubFn();
      }
    };
  }, []);

  if (authState.isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-canvas text-brand-dark space-y-3">
        <Loader2 className="w-8 h-8 text-brand-teal animate-spin" />
        <span className="text-body-md font-semibold text-brand-dark">
          Verifying secure session...
        </span>
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
