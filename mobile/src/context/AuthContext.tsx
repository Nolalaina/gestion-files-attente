// context/AuthContext.tsx - iOS Optimized
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import type { User } from '../types';

interface AuthContextType {
  user:    User | null;
  loading: boolean;
  error:   string | null;
  login:   (email: string, password: string) => Promise<User>;
  register: (payload: any) => Promise<any>;
  logout:  () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // Restaurer la session au démarrage - avec gestion iOS
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const [tokenData, userData] = await Promise.all([
          AsyncStorage.getItem('queue_token'),
          AsyncStorage.getItem('queue_user'),
        ]);
        
        if (tokenData && userData) {
          try {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
          } catch (e) {
            // Invalid session data - cleanup
            await AsyncStorage.removeItem('queue_user');
          }
        }
      } catch (e) {
        // AsyncStorage unavailable
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    setError(null);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const { token, user: u } = data;
      
      // Save to storage with retry (iOS fix)
      let retryCount = 0;
      while (retryCount < 3) {
        try {
          await AsyncStorage.multiSet([
            ['queue_token', token],
            ['queue_user',  JSON.stringify(u)],
          ]);
          break;
        } catch (e) {
          retryCount++;
          if (retryCount >= 3) throw e;
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      setUser(u);
      return u;
    } catch (e: any) {
      const errorMsg = e?.response?.data?.message || e?.message || 'Erreur de connexion';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const register = async (payload: any): Promise<any> => {
    setError(null);
    try {
      const { data } = await api.post('/auth/register', payload);
      return data;
    } catch (e: any) {
      const errorMsg = e?.response?.data?.message || e?.message || 'Erreur enregistrement';
      setError(errorMsg);
      throw e;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['queue_token', 'queue_user']);
      setUser(null);
      setError(null);
    } catch (e) {
      console.warn('⚠️ Logout error:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
};
