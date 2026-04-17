import { useState, useEffect, useRef, useCallback } from "react";
import { io }  from "socket.io-client";
import api     from "../services/api";

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

/**
 * Hook temps réel d'une file
 * @param {number|string} serviceId
 */
export function useQueue(serviceId) {
  const [waiting,  setWaiting]  = useState([]);
  const [called,   setCalled]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const socketRef = useRef(null);

  const refresh = useCallback(async () => {
    if (!serviceId) return;
    const { data } = await api.get(`/queues/${serviceId}`);
    setWaiting(data.data.waiting);
    setCalled(data.data.called);
  }, [serviceId]);

  useEffect(() => {
    if (!serviceId) return;
    refresh().finally(() => setLoading(false));

    const socket = io(SOCKET_URL, {
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5
    });
    
    socketRef.current = socket;
    socket.emit("join_queue", serviceId);

    // Refresh on reconnection to ensure we didn't miss anything during offline period
    socket.on("connect", () => {
      console.log(`Socket connected for service ${serviceId}`);
      refresh();
    });

    socket.on("ticket:created", t => { 
      if (t.service_id == serviceId) setWaiting(w => {
        // Prevent duplicates
        if (w.some(x => x.id === t.id)) return w;
        return [...w, t];
      }); 
    });

    socket.on("ticket:called",  t => {
      if (t.service_id != serviceId) return;
      setWaiting(w => w.filter(x => x.id !== t.id));
      setCalled(c => {
        if (c.some(x => x.id === t.id)) return c;
        return [...c, t];
      });
    });

    socket.on("ticket:done",    t => { 
      if (t.service_id == serviceId) {
        setCalled(c => c.filter(x => x.id !== t.id));
      }
    });

    socket.on("ticket:absent",  t => { 
      if (t.service_id == serviceId) {
        setCalled(c => c.filter(x => x.id !== t.id));
      }
    });

    return () => {
      socket.off("connect");
      socket.off("ticket:created");
      socket.off("ticket:called");
      socket.off("ticket:done");
      socket.off("ticket:absent");
      socket.disconnect();
    };
  }, [serviceId, refresh]);

  return { waiting, called, total: waiting.length, loading, refresh };
}
