// context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import type { User } from '../types';

interface AuthContextType {
  user:    User | null;
  loading: boolean;
  login:   (email: string, password: string) => Promise<User>;
  logout:  () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restaurer la session au démarrage
  useEffect(() => {
    AsyncStorage.multiGet(['queue_token', 'queue_user']).then(([[, token], [, userStr]]) => {
      if (token && userStr) setUser(JSON.parse(userStr));
    }).finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const { data } = await api.post('/auth/login', { email, password });
    const { token, user: u } = data;
    await AsyncStorage.multiSet([
      ['queue_token', token],
      ['queue_user',  JSON.stringify(u)],
    ]);
    setUser(u);
    return u;
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['queue_token', 'queue_user']);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
};
