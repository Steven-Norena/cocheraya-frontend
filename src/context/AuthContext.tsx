import React, { createContext, useContext, useState, useEffect } from 'react';
import authService, { AuthResponseData, LoginRequest, RegisterRequest } from '../services/authService';
import walletService from '../services/walletService';

interface AuthContextType {
  user: AuthResponseData | null;
  balance: number | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<AuthResponseData>;
  register: (data: RegisterRequest) => Promise<AuthResponseData>;
  logout: () => void;
  refreshBalance: () => Promise<number>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthResponseData | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = authService.getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
      // Fetch balance immediately if logged in
      walletService.getBalance()
        .then(res => setBalance(res.balance))
        .catch(() => setBalance(0));
    }
    setIsLoading(false);
  }, []);

  const login = async (data: LoginRequest) => {
    setIsLoading(true);
    try {
      const response = await authService.login(data);
      localStorage.setItem('token', response.token);
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }
      localStorage.setItem('userId', response.userId.toString());
      localStorage.setItem('name', response.name);
      localStorage.setItem('email', response.email);
      localStorage.setItem('role', response.role);
      
      setUser(response);
      
      // Fetch balance
      try {
        const balRes = await walletService.getBalance();
        setBalance(balRes.balance);
      } catch {
        setBalance(0);
      }
      
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterRequest) => {
    setIsLoading(true);
    try {
      const response = await authService.register(data);
      // Login automatically upon successful registration (since register returns token)
      localStorage.setItem('token', response.token);
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }
      localStorage.setItem('userId', response.userId.toString());
      localStorage.setItem('name', response.name);
      localStorage.setItem('email', response.email);
      localStorage.setItem('role', response.role);
      
      setUser(response);
      setBalance(0); // Brand new user has 0.00 balance
      
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setBalance(null);
  };

  const refreshBalance = async (): Promise<number> => {
    if (!user) return 0;
    try {
      const res = await walletService.getBalance();
      setBalance(res.balance);
      return res.balance;
    } catch {
      return balance || 0;
    }
  };

  const value: AuthContextType = {
    user,
    balance,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshBalance,
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
