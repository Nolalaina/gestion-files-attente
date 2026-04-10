import { createContext, useContext, useState, useCallback } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(() => {
    try { return JSON.parse(localStorage.getItem("queue_user")); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem("queue_token"));

  const register = useCallback(async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    return data;
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem("queue_user",  JSON.stringify(data.user));
    localStorage.setItem("queue_token", data.token);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    setUser(null); setToken(null);
    localStorage.removeItem("queue_user");
    localStorage.removeItem("queue_token");
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** @returns {{ user: import("../types").User|null, token: string|null, login: Function, logout: Function }} */
export const useAuth = () => useContext(AuthContext);
