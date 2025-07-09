import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Protects a route by ensuring a user token exists in localStorage.
 * Redirects unauthenticated users to the login page.
 */
const PrivateRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default PrivateRoute;

