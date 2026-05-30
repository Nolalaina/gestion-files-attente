// hooks/useQueue.ts
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useNotification } from '../context/NotificationContext';
import type { Ticket, QueueData } from '../types';

interface UseQueueResult {
  waiting:  Ticket[];
  called:   Ticket[];
  total:    number;
  loading:  boolean;
  refresh:  () => Promise<void>;
}

export function useQueue(serviceId: number): UseQueueResult {
  const { socket } = useNotification();
  const [waiting,  setWaiting]  = useState<Ticket[]>([]);
  const [called,   setCalled]   = useState<Ticket[]>([]);
  const [loading,  setLoading]  = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get<{ success: boolean; data: QueueData }>(`/queues/${serviceId}`);
      setWaiting(data.data.waiting);
      setCalled(data.data.called);
    } catch {/* silencieux */ }
  }, [serviceId]);

  useEffect(() => {
    refresh().finally(() => setLoading(false));

    if (!socket) return;

    // Rejoindre la room spécifique au service
    socket.emit('join_queue', serviceId);

    // Écouter les mises à jour
    const handleUpdate = () => {
      console.log(`[Socket] Refreshing queue for service ${serviceId}`);
      refresh();
    };

    socket.on('ticket:created', handleUpdate);
    socket.on('ticket:called',  handleUpdate);
    socket.on('ticket:serving', handleUpdate);
    socket.on('ticket:done',    handleUpdate);
    socket.on('ticket:absent',  handleUpdate);

    return () => {
      socket.off('ticket:created', handleUpdate);
      socket.off('ticket:called',  handleUpdate);
      socket.off('ticket:serving', handleUpdate);
      socket.off('ticket:done',    handleUpdate);
      socket.off('ticket:absent',  handleUpdate);
      socket.emit('leave_queue', serviceId);
    };
  }, [serviceId, socket, refresh]);

  return { waiting, called, total: waiting.length, loading, refresh };
}
