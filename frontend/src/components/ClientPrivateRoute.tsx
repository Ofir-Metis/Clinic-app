/**
 * ClientPrivateRoute - Protected route wrapper for client authentication
 * Separate from coach authentication system
 */

import React from 'react';
import { Navigate } from 'react-router-dom';

interface ClientPrivateRouteProps {
  children: React.ReactNode;
}

const ClientPrivateRoute: React.FC<ClientPrivateRouteProps> = ({ children }) => {
  // Check for client token (separate from coach token)
  const clientToken = localStorage.getItem('clientToken');
  
  if (!clientToken) {
    // Redirect to client login if not authenticated
    return <Navigate to="/client/login" replace />;
  }

  return <>{children}</>;
};

export default ClientPrivateRoute;