// screens/TicketScreen.tsx — Premium Interface
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { Colors, Shadow, Radius } from '../types/theme';
import type { Service, Ticket, ApiResponse } from '../types';

interface FormData {
  user_name:  string;
  phone:      string;
  email:      string;
  service_id: number | null;
}

export default function TicketScreen() {
  const { addToast } = useNotification();
  const [form,     setForm]     = useState<FormData>({ user_name:'', phone:'', email:'', service_id:null });
  const [errors,   setErrors]   = useState<Partial<Record<keyof FormData, string>>>({});
  const [services, setServices] = useState<Service[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [ticket,   setTicket]   = useState<Ticket | null>(null);

  useEffect(() => {
    api.get<ApiResponse<Service[]>>('/services')
      .then(({ data }) => setServices(data.data))
      .catch(() => addToast('Erreur lors du chargement des services', 'error'));
  }, [addToast]);

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.user_name.trim())  e.user_name  = 'Nom requis';
    if (!form.service_id)        e.service_id = 'Veuillez choisir un service';
    if (form.phone && !/^\+?[\d\s\-]{7,}$/.test(form.phone)) e.phone = 'Numéro invalide';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await api.post<ApiResponse<Ticket>>('/tickets', form);
      setTicket(data.data);
      addToast('🎫 Ticket créé avec succès !', 'success');
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Impossible de créer le ticket', 'error');
    } finally { setLoading(false); }
  };

  const reset = () => {
    setTicket(null);
    setForm({ user_name:'', phone:'', email:'', service_id:null });
    setErrors({});
  };

  const svcName = services.find((s: Service) => s.id === (ticket?.service_id || form.service_id))?.name ?? '';

  // ── Ticket confirmé ───────────────────────────────────────
  if (ticket) return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.confirmedContainer}>
        <View style={s.ticketCardConfirm}>
          <Text style={s.ticketBadge}>VOTRE TICKET</Text>
          <Text style={s.confirmedNum}>{ticket.number}</Text>
          <Text style={s.confirmedSvc}>{svcName}</Text>
          <View style={s.divider} />
          <Text style={s.confirmedName}>Bonjour, {ticket.user_name}</Text>
          <Text style={s.confirmedMsg}>Conservez ce numéro. Nous vous avertirons dès que votre tour approchera.</Text>
          
          {(ticket.estimated_wait ?? 0) > 0 && (
            <View style={s.waitBox}>
              <Text style={s.waitLabel}>ATTENTE ESTIMÉE</Text>
              <Text style={s.waitValue}>~{ticket.estimated_wait} min</Text>
            </View>
          )}

          <TouchableOpacity style={s.newBtnConfirm} onPress={reset}>
            <Text style={s.newBtnTextConfirm}>Prendre un autre ticket</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );

  // ── Formulaire ────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <KeyboardAvoidingView behavior={Platform.OS==='ios' ? 'padding' : undefined} style={{ flex:1 }}>
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
          
          <View style={s.header}>
            <Text style={s.badge}>RÉSERVATION</Text>
            <Text style={s.title}>Nouveau Ticket</Text>
            <Text style={s.subtitle}>Remplissez les détails pour réserver votre place.</Text>
          </View>

          <View style={s.formCard}>
            {/* Nom */}
            <View style={s.field}>
              <Text style={s.label}>Nom Complet <Text style={s.req}>*</Text></Text>
              <TextInput style={[s.input, errors.user_name && s.inputErr]}
                value={form.user_name}
                onChangeText={(v: string) => { setForm((f: FormData) => ({...f, user_name:v})); setErrors((e: any) => ({...e, user_name:undefined})); }}
                placeholder="Ex: Jean Rakoto" placeholderTextColor="#94a3b8" />
              {errors.user_name && <Text style={s.err}>{errors.user_name}</Text>}
            </View>

            {/* Téléphone */}
            <View style={s.field}>
              <Text style={s.label}>Téléphone <Text style={s.opt}>(recommandé)</Text></Text>
              <TextInput style={s.input} value={form.phone}
                onChangeText={(v: string) => setForm((f: FormData) => ({...f, phone:v}))}
                placeholder="034 00 000 00" placeholderTextColor="#94a3b8" keyboardType="phone-pad" />
            </View>

            {/* Service */}
            <Text style={s.label}>Choisir un Service <Text style={s.req}>*</Text></Text>
            <View style={s.serviceList}>
              {services.map((svc: Service) => {
                const selected = form.service_id === svc.id;
                return (
                  <TouchableOpacity key={svc.id}
                    style={[s.svcCard, selected && s.svcSelected]}
                    onPress={() => { setForm((f: FormData) => ({...f, service_id:svc.id})); setErrors((e: any) => ({...e, service_id:undefined})); }}
                    activeOpacity={0.8}>
                    <View style={[s.svcCircle, selected && s.svcCircleSelected]}>
                      <Text style={[s.svcLetter, selected && s.svcLetterSelected]}>{svc.prefix}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.svcName, selected && s.svcNameSelected]}>{svc.name}</Text>
                      <Text style={[s.svcWait, selected && s.svcWaitSelected]}>{svc.waiting_count} personnes en attente</Text>
                    </View>
                    <View style={[s.radio, selected && s.radioSelected]} />
                  </TouchableOpacity>
                );
              })}
            </View>
            {errors.service_id && <Text style={s.err}>{errors.service_id}</Text>}

            <TouchableOpacity style={[s.submitBtn, loading && s.btnDisabled]}
              onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.submitBtnText}>Confirmer la réservation</Text>}
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  container: { padding: 24 },
  header: { marginBottom: 32 },
  badge: { fontSize: 10, fontWeight: '900', color: '#4f46e5', letterSpacing: 1.5, marginBottom: 8 },
  title: { fontSize: 32, fontWeight: '900', color: '#0f172a', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#64748b', fontWeight: '500' },
  
  formCard: { 
    backgroundColor: '#fff', borderRadius: 32, padding: 24, ...Shadow.md,
    borderWidth: 1, borderColor: '#f1f5f9'
  },
  field: { marginBottom: 20 },
  label: { fontSize: 11, fontWeight: '800', color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  req: { color: '#ef4444' },
  opt: { fontWeight: '400', textTransform: 'none' },
  input: { 
    backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, fontSize: 16, 
    color: '#0f172a', borderWidth: 1, borderColor: '#f1f5f9' 
  },
  inputErr: { borderColor: '#ef4444' },
  err: { color: '#ef4444', fontSize: 11, fontWeight: '700', marginTop: 4, marginLeft: 4 },
  
  serviceList: { gap: 12, marginBottom: 24 },
  svcCard: { 
    flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, 
    borderWidth: 2, borderColor: '#f1f5f9', gap: 16 
  },
  svcSelected: { borderColor: '#4f46e5', backgroundColor: 'rgba(79, 70, 229, 0.05)' },
  svcCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  svcCircleSelected: { backgroundColor: '#4f46e5' },
  svcLetter: { fontSize: 18, fontWeight: '900', color: '#64748b' },
  svcLetterSelected: { color: '#fff' },
  svcName: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  svcNameSelected: { color: '#4f46e5' },
  svcWait: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  svcWaitSelected: { color: '#6366f1' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#cbd5e1' },
  radioSelected: { borderColor: '#4f46e5', borderWidth: 6, backgroundColor: '#fff' },
  
  submitBtn: { backgroundColor: '#4f46e5', borderRadius: 16, padding: 20, alignItems: 'center', ...Shadow.sm },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  btnDisabled: { opacity: 0.6 },
  
  // Confirmed State
  confirmedContainer: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  ticketCardConfirm: { 
    width: '100%', backgroundColor: '#fff', borderRadius: 40, padding: 32, alignItems: 'center', 
    ...Shadow.lg, borderWidth: 1, borderColor: '#f1f5f9' 
  },
  ticketBadge: { backgroundColor: '#f1f5f9', paddingVertical: 6, paddingHorizontal: 16, borderRadius: 99, fontSize: 10, fontWeight: '900', color: '#64748b', marginBottom: 24 },
  confirmedNum: { fontSize: 80, fontWeight: '900', color: '#4f46e5', letterSpacing: -2 },
  confirmedSvc: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginTop: 8 },
  divider: { width: '100%', height: 2, backgroundColor: '#f1f5f9', marginVertical: 32, borderStyle: 'dashed' },
  confirmedName: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 12 },
  confirmedMsg: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  waitBox: { backgroundColor: '#f8fafc', padding: 20, borderRadius: 24, width: '100%', alignItems: 'center', marginBottom: 32 },
  waitLabel: { fontSize: 10, fontWeight: '900', color: '#94a3b8', marginBottom: 4 },
  waitValue: { fontSize: 24, fontWeight: '900', color: '#4f46e5' },
  newBtnConfirm: { width: '100%', padding: 20, alignItems: 'center' },
  newBtnTextConfirm: { color: '#4f46e5', fontWeight: '800', fontSize: 15 },
});
