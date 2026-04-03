// hooks/useQueue.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import type { Ticket, QueueData } from '../types';

interface UseQueueResult {
  waiting:  Ticket[];
  called:   Ticket[];
  total:    number;
  loading:  boolean;
  refresh:  () => Promise<void>;
}

export function useQueue(serviceId: number): UseQueueResult {
  const [waiting,  setWaiting]  = useState<Ticket[]>([]);
  const [called,   setCalled]   = useState<Ticket[]>([]);
  const [loading,  setLoading]  = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get<{ success: boolean; data: QueueData }>(`/queues/${serviceId}`);
      setWaiting(data.data.waiting);
      setCalled(data.data.called);
    } catch {/* silencieux */ }
  }, [serviceId]);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
    // Polling toutes les 8 secondes (Socket.IO non disponible nativement sans lib)
    intervalRef.current = setInterval(refresh, 8000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refresh]);

  return { waiting, called, total: waiting.length, loading, refresh };
}
