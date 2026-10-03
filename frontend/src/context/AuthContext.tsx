import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, LoginCredentials, SignupData, Role } from '../types/auth';
import { authService } from '../services/auth';

interface AuthContextType {
  user: AuthUser | null;
  role: Role | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: LoginCredentials, expectedRole?: Role) => Promise<void>;
  signup: (data: SignupData, targetRole: 'USER' | 'RIDER') => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Restore session on startup
    const saved = authService.getSavedSession();
    if (saved) {
      setUser(saved);
    }
    setLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials, expectedRole?: Role) => {
    const authenticated = await authService.login(credentials, expectedRole);
    setUser(authenticated);
  };

  const signup = async (data: SignupData, targetRole: 'USER' | 'RIDER') => {
    const newUser = await authService.signup(data, targetRole);
    setUser(newUser);
  };

  const logout = () => {
    authService.clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : null,
        isAuthenticated: !!user,
        loading,
        login,
        signup,
        logout,
      }}
    >
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
