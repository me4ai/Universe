import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { CircularProgress, Box, Alert } from '@mui/material';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  fallbackPath?: string;
}

export const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  requiredRoles = [],
  fallbackPath = '/unauthorized'
}) => {
  const { isAuthenticated, isLoading, hasRole } = useAuth();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const hasRequiredRole = requiredRoles.length === 0 || requiredRoles.some(role => hasRole(role));

  if (!hasRequiredRole) {
    return (
      <Box p={3}>
        <Alert severity="error">
          You don't have the required permissions to access this page.
        </Alert>
      </Box>
    );
  }

  return <>{children}</>;
};
