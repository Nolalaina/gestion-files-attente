// types/index.ts — Interfaces TypeScript partagées

export type UserRole = 'usager' | 'agent' | 'admin';

export interface User {
  id:    number;
  name:  string;
  email: string;
  role:  UserRole;
  phone?: string;
}

export interface Service {
  id:            number;
  name:          string;
  description?:  string;
  prefix:        string;
  max_counters:  number;
  avg_duration:  number;
  waiting_count: number;
  open_at:       string;
  close_at:      string;
  active:        number;
}

export type TicketStatus = 'waiting' | 'called' | 'serving' | 'done' | 'absent' | 'cancelled';

export interface Ticket {
  id:             number;
  number:         string;
  service_id:     number;
  service_name?:  string;
  user_name:      string;
  phone?:         string;
  email?:         string;
  status:         TicketStatus;
  counter?:       number;
  priority:       number;
  estimated_wait?: number;
  created_at:     string;
  called_at?:     string;
  done_at?:       string;
}

export interface QueueData {
  waiting: Ticket[];
  called:  Ticket[];
  total:   number;
}

export interface ApiResponse<T> {
  success: boolean;
  data:    T;
  total?:  number;
}

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  VerifyAccount: { email?: string };
  Main:  undefined;
};

export type MainTabParamList = {
  // Usage
  Accueil:  undefined;
  Ticket:   undefined;
  File:     undefined;
  MonCompte: undefined;

  // Agent
  Guichet:  undefined;
  Stats:    undefined;

  // Admin
  AdminDash:  undefined;
  Agents:     undefined;
  Banque:     undefined;
};
