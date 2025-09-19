import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { logger } from '../services/logger';
import api from '../services/api';

export interface User {
  id: number;
  username: string;
  stakeholderId: number;
  // Stakeholder info
  type: string;
  subType?: string;
  accessLevel?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  communityId?: number;
  portalAccessEnabled: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkPermission: (action: string, resource?: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Check for existing token on app load
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // TODO: Verify token with backend and get user info
      // For now, we'll implement this when we build the backend
      logger.info('Found existing auth token', 'AuthContext');
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<void> => {
    try {
      logger.info('Attempting login', 'AuthContext', { username });
      
      const response = await api.post<{
        success: boolean;
        message: string;
        token: string;
        user: User;
      }>('/auth/login', { username, password });
      
      // Store token
      localStorage.setItem('authToken', response.token);
      
      // Set user data
      setUser(response.user);
      
      // Dispatch event to reset app state on login
      window.dispatchEvent(new CustomEvent('auth:login'));
      
      logger.info('Login successful', 'AuthContext', { userId: response.user.id });
    } catch (error) {
      logger.error('Login failed', 'AuthContext', { username }, error as Error);
      throw error;
    }
  };

  const logout = () => {
    logger.info('User logging out', 'AuthContext', { userId: user?.id });
    
    // Clear token and user data
    localStorage.removeItem('authToken');
    setUser(null);
    
    // Dispatch event to reset app state
    window.dispatchEvent(new CustomEvent('auth:logout'));
  };

  const checkPermission = (action: string, resource?: string): boolean => {
    if (!user || !user.portalAccessEnabled) return false;

    // Permission logic based on stakeholder type
    switch (user.type) {
      case 'Company Employee':
        // Company employees with Admin/Full access can do most things
        if (user.accessLevel === 'Admin') return true;
        if (user.accessLevel === 'Full') {
          return action !== 'delete' && action !== 'admin';
        }
        if (user.accessLevel === 'Partial') {
          return action === 'view' || action === 'create';
        }
        return false;

      case 'Community Employee':
        // Community employees have limited access to their community
        if (user.accessLevel === 'Full') {
          return action !== 'delete' && action !== 'admin';
        }
        return action === 'view';

      case 'Board Member':
        // Board members can view and some management actions
        if (user.subType === 'President') {
          return action !== 'admin'; // Almost everything except system admin
        }
        return action === 'view' || action === 'create';

      case 'Resident':
        // Residents can mainly view and create tickets for themselves
        if (user.subType === 'Owner') {
          return action === 'view' || action === 'create';
        }
        return action === 'view';

      case 'Vendor':
        // Vendors have very limited access
        return action === 'view' && resource === 'own-tickets';

      default:
        return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      login,
      logout,
      checkPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
