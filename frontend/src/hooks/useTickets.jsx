import { useState, useCallback } from "react";
import api from "../services/api";

export function useTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const run = useCallback(async (fn) => {
    setLoading(true); setError(null);
    try { return await fn(); }
    catch (err) {
      const msg = err.response?.data?.error || "Une erreur est survenue";
      setError(msg); throw err;
    } finally { setLoading(false); }
  }, []);

  const fetchAll = useCallback((params) =>
    run(async () => {
      const { data } = await api.get("/tickets", { params });
      setTickets(data.data); return data.data;
    }), [run]);

  const create = useCallback((payload) =>
    run(async () => {
      const { data } = await api.post("/tickets", payload);
      return data.data;
    }), [run]);

  const callTicket = useCallback((id, counter = 1) =>
    run(async () => {
      const { data } = await api.patch(`/tickets/${id}/call`, { counter });
      setTickets(p => p.map(t => t.id === id ? data.data : t));
      return data.data;
    }), [run]);

  const completeTicket = useCallback((id) =>
    run(async () => {
      const { data } = await api.patch(`/tickets/${id}/complete`);
      setTickets(p => p.map(t => t.id === id ? data.data : t));
      return data.data;
    }), [run]);

  const absentTicket = useCallback((id) =>
    run(async () => {
      const { data } = await api.patch(`/tickets/${id}/absent`);
      setTickets(p => p.map(t => t.id === id ? data.data : t));
      return data.data;
    }), [run]);

  const cancelTicket = useCallback((id) =>
    run(async () => {
      await api.delete(`/tickets/${id}`);
      setTickets(p => p.filter(t => t.id !== id));
    }), [run]);

  return { tickets, loading, error, setTickets, fetchAll, create, callTicket, completeTicket, absentTicket, cancelTicket };
}
