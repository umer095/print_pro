// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface User {
  id: number;
  fullName: string;
  email: string;
  role?: string;
}

interface Tenant {
  id: number;
  companyName: string;
  address?: string;
  phoneNumber?: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  tenant: Tenant | null;
  isAuthenticated: boolean;
  login: (token: string, user: User, tenant: Tenant) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);

  // Load auth data from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');
    const storedTenant = localStorage.getItem('tenant');

    if (storedToken && storedUser && storedTenant) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setTenant(JSON.parse(storedTenant));
    }
  }, []);

  // Persist to localStorage whenever auth state changes
  useEffect(() => {
    if (token && user && tenant) {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('tenant', JSON.stringify(tenant));
    } else {
      // Clear all auth-related items when any auth state is null
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('tenant');
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('savedEmail');
    }
  }, [token, user, tenant]);

  const login = (newToken: string, newUser: User, newTenant: Tenant) => {
    setToken(newToken);
    setUser(newUser);
    setTenant(newTenant);
  };

  const logout = () => {
    // Clear localStorage immediately
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('tenant');
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('savedEmail');
    
    // Then update state
    setToken(null);
    setUser(null);
    setTenant(null);
  };

  const value: AuthContextType = {
    token,
    user,
    tenant,
    isAuthenticated: !!token && !!user && !!tenant,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};