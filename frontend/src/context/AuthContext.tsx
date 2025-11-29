import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { logger } from '../services/logger';
import api from '../services/api';

export interface User {
  id: string; // Changed to string (GUID)
  username: string;
  stakeholderId: string | null; // Changed to string (GUID) and nullable
  organizationId?: string; // Added
  databaseName?: string; // Added
  // Stakeholder info
  type: string | null;
  subType?: string | null;
  accessLevel?: string | null;
  department?: string | null;
  title?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  communityId?: number | null;
  portalAccessEnabled: boolean;
  mustChangePassword?: boolean; // Added
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mustChangePassword: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
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
  const mustChangePassword = user?.mustChangePassword || false;

  // Check for existing token on app load
  // Note: Token validation happens on each API request via authenticateToken middleware
  // If token is invalid, the backend will return 401 and user will be logged out
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
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
        mustChangePassword?: boolean;
      }>('/auth/login', { username, password });
      
      // Store token
      localStorage.setItem('authToken', response.token);
      
      // Set user data (include mustChangePassword from response)
      const userData = {
        ...response.user,
        mustChangePassword: response.mustChangePassword || response.user.mustChangePassword || false
      };
      setUser(userData);
      
      // Dispatch event to reset app state on login
      window.dispatchEvent(new CustomEvent('auth:login'));
      
      logger.info('Login successful', 'AuthContext', { 
        userId: userData.id,
        mustChangePassword: userData.mustChangePassword 
      });
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

  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    try {
      logger.info('Changing password', 'AuthContext', { userId: user?.id });
      
      await api.put('/auth/change-password', {
        currentPassword,
        newPassword
      });
      
      // Update user to clear mustChangePassword flag
      if (user) {
        setUser({
          ...user,
          mustChangePassword: false
        });
      }
      
      logger.info('Password changed successfully', 'AuthContext', { userId: user?.id });
    } catch (error) {
      logger.error('Password change failed', 'AuthContext', { userId: user?.id }, error as Error);
      throw error;
    }
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
      mustChangePassword,
      login,
      logout,
      changePassword,
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
