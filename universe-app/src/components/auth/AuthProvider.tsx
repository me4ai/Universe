import React, { createContext, useContext, useState, useEffect } from 'react';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import { auth0Config } from '../../config/auth0-config';
import { CircularProgress, Box } from '@mui/material';

interface AuthState {
  isAuthenticated: boolean;
  user: any;
  isLoading: boolean;
  error: Error | null;
  roles: string[];
  login: (options?: any) => void;
  logout: () => void;
  loginWithSocial: (provider: string) => void;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Auth0Provider
      domain={auth0Config.domain}
      clientId={auth0Config.clientId}
      authorizationParams={{
        redirect_uri: auth0Config.redirectUri,
        audience: auth0Config.audience,
        scope: auth0Config.scope
      }}
    >
      <AuthStateProvider>
        {children}
      </AuthStateProvider>
    </Auth0Provider>
  );
};

const AuthStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { 
    isAuthenticated, 
    user, 
    isLoading, 
    error,
    loginWithRedirect, 
    logout,
    getAccessTokenSilently 
  } = useAuth0();
  
  const [userData, setUserData] = useState<any>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);

  useEffect(() => {
    const getUserMetadata = async () => {
      try {
        const accessToken = await getAccessTokenSilently();
        const userDetailsByIdUrl = `https://${auth0Config.domain}/api/v2/users/${user?.sub}`;

        const metadataResponse = await fetch(userDetailsByIdUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const { user_metadata } = await metadataResponse.json();
        setUserData({ ...user, ...user_metadata });
        
        // Extract roles from user
        const roles = user?.[`${auth0Config.audience}/roles`] || [];
        setUserRoles(roles);
      } catch (e) {
        console.error(e);
      }
    };

    if (user) {
      getUserMetadata();
    }
  }, [getAccessTokenSilently, user]);

  const loginWithSocial = (provider: string) => {
    loginWithRedirect({
      connection: provider,
    });
  };

  const hasRole = (role: string): boolean => {
    return userRoles.includes(role);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  const value = {
    isAuthenticated,
    user: userData,
    isLoading,
    error,
    roles: userRoles,
    login: loginWithRedirect,
    logout: () => logout({ logoutParams: { returnTo: window.location.origin } }),
    loginWithSocial,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
