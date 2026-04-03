// context/ToastContext.tsx
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast { id: number; message: string; type: ToastType; }
interface ToastContextType { addToast: (msg: string, type?: ToastType) => void; }

const ToastContext = createContext<ToastContextType | null>(null);

const COLORS: Record<ToastType, string> = {
  success: '#10b981', error: '#ef4444', info: '#2563eb', warning: '#f59e0b'
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <View style={styles.container} pointerEvents="none">
        {toasts.map(t => (
          <View key={t.id} style={[styles.toast, { backgroundColor: COLORS[t.type] }]}>
            <Text style={styles.text}>{t.message}</Text>
          </View>
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast doit être utilisé dans ToastProvider');
  return ctx;
};

const styles = StyleSheet.create({
  container: { position: 'absolute', bottom: 90, left: 16, right: 16, zIndex: 9999 },
  toast:     { padding: 14, borderRadius: 10, marginTop: 8,
               shadowColor: '#000', shadowOpacity: .15, shadowRadius: 8, elevation: 4 },
  text:      { color: '#fff', fontWeight: '600', fontSize: 14 },
});
