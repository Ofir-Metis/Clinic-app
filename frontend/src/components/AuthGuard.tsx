import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Simple authentication guard that runs before any routing
 * Directly checks localStorage and redirects to login if not authenticated
 */
const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Public routes that don't require authentication
    const publicRoutes = ['/login', '/register', '/reset/request', '/reset/confirm', '/auth', '/client/login', '/client/register', '/client/forgot-password'];
    const isPublicRoute = publicRoutes.some(route => location.pathname.startsWith(route));

    if (!isPublicRoute) {
      // Check authentication
      const accessToken = localStorage.getItem('accessToken') ||
                         localStorage.getItem('clinic_access_token') ||
                         localStorage.getItem('authToken') ||
                         localStorage.getItem('token');

      const userData = localStorage.getItem('user') ||
                      localStorage.getItem('clinic_user');

      const isAuthenticated = !!(accessToken && userData);

      if (!isAuthenticated) {
        // Redirect to appropriate login page based on current path
        const loginPath = location.pathname.startsWith('/client') ? '/client/login' : '/login';
        navigate(loginPath, { replace: true, state: { from: location.pathname } });
        return;
      }
    }

    setIsChecking(false);
  }, [location.pathname, navigate, location]);

  // Don't render children until auth check is complete
  if (isChecking) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;