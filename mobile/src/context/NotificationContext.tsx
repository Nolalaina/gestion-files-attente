// context/NotificationContext.tsx — Aurora Midnight
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { API_URLS, IS_DEV } from '../config/env';
import { Colors, Radius, Spacing, Type } from '../types/theme';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}
interface MegaNotif {
  title: string;
  text: string;
  type: ToastType;
}

interface NotificationContextType {
  addToast: (msg: string, type?: ToastType) => void;
  showMega: (notif: MegaNotif) => void;
  socket: Socket | null;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

const TONE: Record<ToastType, { bg: string; accent: string }> = {
  success: { bg: Colors.successSoft, accent: Colors.success },
  error: { bg: Colors.dangerSoft, accent: Colors.danger },
  info: { bg: Colors.infoSoft, accent: Colors.info },
  warning: { bg: Colors.warningSoft, accent: Colors.warning },
};

const getSocketUrl = (): string => {
  const apiUrl = IS_DEV ? API_URLS.dev_device : API_URLS.production;
  return apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
};

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [megaNotif, setMegaNotif] = useState<MegaNotif | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts((current) => [...current, { id, message, type }]);
    setTimeout(
      () => setToasts((current) => current.filter((toast) => toast.id !== id)),
      3500
    );
  }, []);

  const showMega = useCallback((notif: MegaNotif) => {
    setMegaNotif(notif);
  }, []);

  useEffect(() => {
    const connection = io(getSocketUrl(), { transports: ['websocket'] });
    setSocket(connection);

    if (user?.role === 'admin' || user?.role === 'agent') {
      connection.emit('join_admin');
    }

    connection.on('ticket:called', (ticket: any) => {
      setMegaNotif({
        title: 'Ticket appelé',
        text: `Le ticket ${ticket.number} est appelé au guichet ${ticket.counter || 1}.`,
        type: 'success',
      });
      addToast(`Ticket ${ticket.number} appelé.`, 'success');
    });

    connection.on('ticket:done', (ticket: any) => {
      addToast(`Service terminé pour le ticket ${ticket.number}.`, 'info');
    });

    return () => {
      connection.disconnect();
    };
  }, [user, addToast]);

  return (
    <NotificationContext.Provider value={{ addToast, showMega, socket }}>
      {children}

      <View style={styles.toastContainer} pointerEvents="none">
        {toasts.map((toast) => {
          const tone = TONE[toast.type];
          return (
            <View
              key={toast.id}
              style={[styles.toast, { backgroundColor: tone.bg, borderColor: tone.accent }]}
            >
              <View style={[styles.toastMark, { backgroundColor: tone.accent }]} />
              <Text style={styles.toastText}>{toast.message}</Text>
            </View>
          );
        })}
      </View>

      <Modal visible={!!megaNotif} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.megaCard}>
            <View
              style={[
                styles.megaBar,
                { backgroundColor: megaNotif ? TONE[megaNotif.type].accent : Colors.primary },
              ]}
            />
            <Text style={styles.megaTitle}>{megaNotif?.title}</Text>
            <Text style={styles.megaText}>{megaNotif?.text}</Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setMegaNotif(null)}
              accessibilityRole="button"
              accessibilityLabel="Fermer la notification"
            >
              <Text style={styles.closeBtnText}>Compris</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </NotificationContext.Provider>
  );
}

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification doit être utilisé dans NotificationProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 50,
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 10000,
  },
  toast: {
    padding: Spacing.lg,
    borderRadius: Radius.sm,
    marginTop: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
  },
  toastMark: { width: 3, height: 24, borderRadius: Radius.pill },
  toastText: { flex: 1, color: Colors.text, fontWeight: '500', fontSize: Type.sm },

  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  megaCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  megaBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  megaTitle: {
    fontSize: Type.xl,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  megaText: {
    fontSize: Type.sm,
    color: Colors.muted,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 21,
  },
  closeBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    borderRadius: Radius.sm,
    width: '100%',
    alignItems: 'center',
  },
  closeBtnText: { color: Colors.onPrimary, fontWeight: '600', fontSize: Type.md },
});
