import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { auth } from '../../config/firebase';
import { authService } from '../../services/authService';
import { ROUTES } from '../../utils/constants';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute() {
  const location = useLocation();
  const [authState, setAuthState] = useState({
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    let isMounted = true;

    if (!auth) {
      setAuthState({
        isLoading: false,
        isAuthenticated: authService.isAuthenticated(),
      });
      return;
    }

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!isMounted) return;
      const isAuthed = Boolean(user || authService.isAuthenticated());
      setAuthState({
        isLoading: false,
        isAuthenticated: isAuthed,
      });
    });

    return () => {
      isMounted = false;
      unsubscribe();
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
