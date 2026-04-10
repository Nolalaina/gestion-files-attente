import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getApiUrl } from '../config/env';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast { id: number; message: string; type: ToastType; }
interface MegaNotif { icon: string; title: string; text: string; type: ToastType; }

interface NotificationContextType {
  addToast: (msg: string, type?: ToastType) => void;
  showMega: (notif: MegaNotif) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

const { width } = Dimensions.get('window');

const COLORS: Record<ToastType, string> = {
  success: '#10b981', error: '#ef4444', info: '#2563eb', warning: '#f59e0b'
};

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [megaNotif, setMegaNotif] = useState<MegaNotif | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const s = io(getApiUrl().replace('/api', ''));
    setSocket(s);

    if (user?.role === 'admin' || user?.role === 'agent') {
      s.emit('join_admin');
    }

    s.on('ticket:called', (ticket: any) => {
      // Logic for user's own ticket could be added here
      setMegaNotif({
        icon: '🔊',
        title: 'TICKET APPELÉ !',
        text: `Le ticket ${ticket.number} est appelé au guichet ${ticket.counter || 1}.`,
        type: 'success'
      });
    });

    return () => { s.disconnect(); };
  }, [user]);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts((t: Toast[]) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t: Toast[]) => t.filter((x: Toast) => x.id !== id)), 3500);
  }, []);

  const showMega = useCallback((notif: MegaNotif) => {
    setMegaNotif(notif);
  }, []);

  return (
    <NotificationContext.Provider value={{ addToast, showMega }}>
      {children}
      
      {/* Toasts */}
      <View style={styles.toastContainer} pointerEvents="none">
        {toasts.map((t: Toast) => (
          <View key={t.id} style={[styles.toast, { backgroundColor: COLORS[t.type] }]}>
            <Text style={styles.toastText}>{t.message}</Text>
          </View>
        ))}
      </View>

      {/* Mega Notif Modal */}
      <Modal visible={!!megaNotif} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.megaCard}>
            <View style={[styles.glow, { backgroundColor: megaNotif ? COLORS[megaNotif.type] : '#fff' }]} />
            <Text style={styles.megaIcon}>{megaNotif?.icon}</Text>
            <Text style={styles.megaTitle}>{megaNotif?.title}</Text>
            <Text style={styles.megaText}>{megaNotif?.text}</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setMegaNotif(null)}>
              <Text style={styles.closeBtnText}>Compris</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </NotificationContext.Provider>
  );
}

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification doit être utilisé dans NotificationProvider');
  return ctx;
};

const styles = StyleSheet.create({
  toastContainer: { position: 'absolute', top: 50, left: 16, right: 16, zIndex: 10000 },
  toast: { 
    padding: 16, borderRadius: 12, marginTop: 8, flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 
  },
  toastText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  
  modalOverlay: { 
    flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)', 
    justifyContent: 'center', alignItems: 'center', padding: 24 
  },
  megaCard: { 
    width: '100%', backgroundColor: '#fff', borderRadius: 32, padding: 32, 
    alignItems: 'center', overflow: 'hidden', elevation: 20
  },
  glow: { 
    position: 'absolute', top: -100, width: 200, height: 200, 
    borderRadius: 100, opacity: 0.1, transform: [{ scale: 2 }] 
  },
  megaIcon: { fontSize: 64, marginBottom: 24 },
  megaTitle: { fontSize: 24, fontWeight: '900', color: '#0f172a', textAlign: 'center', marginBottom: 12 },
  megaText: { fontSize: 16, color: '#64748b', textAlign: 'center', marginBottom: 32, lineHeight: 24 },
  closeBtn: { 
    backgroundColor: '#2563eb', paddingVertical: 16, paddingHorizontal: 48, 
    borderRadius: 16, width: '100%', alignItems: 'center' 
  },
  closeBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
