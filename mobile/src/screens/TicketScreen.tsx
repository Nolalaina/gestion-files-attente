// screens/TicketScreen.tsx — Aurora Design v5
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar
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
  const [step,     setStep]     = useState(1);
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

  const selected = services.find(s => s.id === form.service_id);

  const validateStep1 = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.user_name.trim())  e.user_name  = 'Nom requis';
    if (form.phone && !/^\+?[\d\s\-]{7,}$/.test(form.phone)) e.phone = 'Numéro invalide';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2) {
      if (!form.service_id) { setErrors({ service_id: 'Choisissez un service' }); return; }
      setStep(3);
    }
  };

  const back = () => setStep(s => Math.max(1, s - 1));

  const handleSubmit = async () => {
    if (!form.service_id) { setErrors({ service_id: 'Veuillez choisir un service' }); return; }
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
    setStep(1);
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
          <Text style={s.confirmedName}>Bonjour, {ticket.user_name} 👋</Text>
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

  // ── Formulaire multi-step ────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />
      <KeyboardAvoidingView behavior={Platform.OS==='ios' ? 'padding' : undefined} style={{ flex:1 }}>
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
          
          <View style={s.header}>
            <Text style={s.badge}>RÉSERVATION</Text>
            <Text style={s.title}>Nouveau Ticket</Text>
            <Text style={s.subtitle}>Remplissez les détails pour réserver votre place.</Text>
          </View>

          {/* Progress Bar */}
          <View style={s.progressRow}>
            {['Vos infos', 'Service', 'Confirmation'].map((label, i) => (
              <View key={label} style={s.progressItem}>
                <View style={[s.progressBar, { backgroundColor: step > i+1 ? Colors.success : step === i+1 ? Colors.primary : Colors.border }]} />
                <Text style={[s.progressLabel, step === i+1 && { color: Colors.primary }]}>{label}</Text>
              </View>
            ))}
          </View>

          <View style={s.formCard}>
            {/* ── Step 1: Infos ── */}
            {step === 1 && (
              <View>
                <View style={s.field}>
                  <Text style={s.label}>Nom Complet <Text style={s.req}>*</Text></Text>
                  <TextInput style={[s.input, errors.user_name && s.inputErr]}
                    value={form.user_name}
                    onChangeText={(v: string) => { setForm(f => ({...f, user_name:v})); setErrors(e => ({...e, user_name:undefined})); }}
                    placeholder="Ex: Jean Rakoto" placeholderTextColor={Colors.subtle} />
                  {errors.user_name && <Text style={s.err}>{errors.user_name}</Text>}
                </View>

                <View style={s.field}>
                  <Text style={s.label}>Téléphone <Text style={s.opt}>(recommandé)</Text></Text>
                  <TextInput style={s.input} value={form.phone}
                    onChangeText={(v: string) => setForm(f => ({...f, phone:v}))}
                    placeholder="034 00 000 00" placeholderTextColor={Colors.subtle} keyboardType="phone-pad" />
                  {errors.phone && <Text style={s.err}>{errors.phone}</Text>}
                </View>

                <View style={s.field}>
                  <Text style={s.label}>Email <Text style={s.opt}>(optionnel)</Text></Text>
                  <TextInput style={s.input} value={form.email}
                    onChangeText={(v: string) => setForm(f => ({...f, email:v}))}
                    placeholder="jean@exemple.mg" placeholderTextColor={Colors.subtle} keyboardType="email-address" autoCapitalize="none" />
                </View>

                <TouchableOpacity style={s.submitBtn} onPress={next} activeOpacity={0.85}>
                  <Text style={s.submitBtnText}>Suivant →</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── Step 2: Service ── */}
            {step === 2 && (
              <View>
                <Text style={[s.label, { marginBottom: 12 }]}>Choisir un Service <Text style={s.req}>*</Text></Text>
                <View style={s.serviceList}>
                  {services.map((svc: Service) => {
                    const sel = form.service_id === svc.id;
                    return (
                      <TouchableOpacity key={svc.id}
                        style={[s.svcCard, sel && s.svcSelected]}
                        onPress={() => { setForm(f => ({...f, service_id:svc.id})); setErrors(e => ({...e, service_id:undefined})); }}
                        activeOpacity={0.8}>
                        <View style={[s.svcCircle, sel && s.svcCircleSelected]}>
                          <Text style={[s.svcLetter, sel && s.svcLetterSelected]}>{svc.prefix}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[s.svcName, sel && s.svcNameSelected]}>{svc.name}</Text>
                          <Text style={[s.svcWait, sel && s.svcWaitSelected]}>
                            {svc.waiting_count} en attente · ~{svc.avg_duration}min
                          </Text>
                        </View>
                        <View style={[s.radio, sel && s.radioSelected]} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {errors.service_id && <Text style={s.err}>{errors.service_id}</Text>}

                <View style={s.btnRow}>
                  <TouchableOpacity style={s.backBtn} onPress={back}>
                    <Text style={s.backBtnText}>← Retour</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.submitBtn, { flex: 2 }]} onPress={next} activeOpacity={0.85}>
                    <Text style={s.submitBtnText}>Continuer →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ── Step 3: Confirmation ── */}
            {step === 3 && (
              <View>
                <View style={s.recap}>
                  <Text style={s.recapTitle}>RÉCAPITULATIF</Text>
                  {[
                    { label: 'Nom', value: form.user_name },
                    form.phone ? { label: 'Téléphone', value: form.phone } : null,
                    form.email ? { label: 'Email', value: form.email } : null,
                    { label: 'Service', value: selected?.name || '' },
                    { label: 'Attente estimée', value: `~${(selected?.waiting_count || 0) * (selected?.avg_duration || 0)} min` },
                  ].filter(Boolean).map((r: any) => (
                    <View key={r.label} style={s.recapRow}>
                      <Text style={s.recapLabel}>{r.label}</Text>
                      <Text style={s.recapValue}>{r.value}</Text>
                    </View>
                  ))}
                </View>

                <View style={s.btnRow}>
                  <TouchableOpacity style={s.backBtn} onPress={back} disabled={loading}>
                    <Text style={s.backBtnText}>← Retour</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.submitBtn, { flex: 2 }, loading && s.btnDisabled]} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
                    {loading
                      ? <ActivityIndicator color="#fff" />
                      : <Text style={s.submitBtnText}>Confirmer ✓</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { padding: 24 },
  header: { marginBottom: 24 },
  badge: { fontSize: 10, fontWeight: '900', color: Colors.primary, letterSpacing: 1.5, marginBottom: 8 },
  title: { fontSize: 32, fontWeight: '900', color: Colors.navy, marginBottom: 8 },
  subtitle: { fontSize: 16, color: Colors.muted, fontWeight: '500' },

  progressRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  progressItem: { flex: 1 },
  progressBar: { height: 4, borderRadius: 99, marginBottom: 6 },
  progressLabel: { fontSize: 10, fontWeight: '700', color: Colors.subtle, textAlign: 'center' },
  
  formCard: { 
    backgroundColor: '#fff', borderRadius: Radius.xl, padding: 24, ...Shadow.md,
    borderWidth: 1, borderColor: Colors.border
  },
  field: { marginBottom: 20 },
  label: { fontSize: 11, fontWeight: '800', color: Colors.subtle, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  req: { color: Colors.danger },
  opt: { fontWeight: '400', textTransform: 'none' },
  input: { 
    backgroundColor: Colors.surface2, borderRadius: Radius.md, padding: 16, fontSize: 16, 
    color: Colors.navy, borderWidth: 1, borderColor: Colors.border 
  },
  inputErr: { borderColor: Colors.danger },
  err: { color: Colors.danger, fontSize: 11, fontWeight: '700', marginTop: 4, marginLeft: 4 },
  
  serviceList: { gap: 12, marginBottom: 20 },
  svcCard: { 
    flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: Radius.lg, 
    borderWidth: 2, borderColor: Colors.border, gap: 16 
  },
  svcSelected: { borderColor: Colors.primary, backgroundColor: 'rgba(124, 58, 237, 0.04)' },
  svcCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surface2, justifyContent: 'center', alignItems: 'center' },
  svcCircleSelected: { backgroundColor: Colors.primary },
  svcLetter: { fontSize: 18, fontWeight: '900', color: Colors.muted },
  svcLetterSelected: { color: '#fff' },
  svcName: { fontSize: 15, fontWeight: '700', color: Colors.navy },
  svcNameSelected: { color: Colors.primary },
  svcWait: { fontSize: 12, color: Colors.subtle, marginTop: 2 },
  svcWaitSelected: { color: Colors.primaryMid },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.border },
  radioSelected: { borderColor: Colors.primary, borderWidth: 6, backgroundColor: '#fff' },
  
  submitBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, padding: 20, alignItems: 'center', ...Shadow.sm },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  btnDisabled: { opacity: 0.6 },
  btnRow: { flexDirection: 'row', gap: 12 },
  backBtn: { flex: 1, backgroundColor: Colors.surface2, borderRadius: Radius.md, padding: 20, alignItems: 'center' },
  backBtnText: { color: Colors.muted, fontWeight: '800', fontSize: 15 },

  recap: { backgroundColor: Colors.surface2, borderRadius: Radius.lg, padding: 20, marginBottom: 24 },
  recapTitle: { fontSize: 10, fontWeight: '900', color: Colors.subtle, letterSpacing: 1, marginBottom: 12 },
  recapRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  recapLabel: { color: Colors.subtle, fontSize: 13 },
  recapValue: { fontWeight: '700', fontSize: 13, color: Colors.text },
  
  confirmedContainer: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  ticketCardConfirm: { 
    width: '100%', backgroundColor: '#fff', borderRadius: 40, padding: 32, alignItems: 'center', 
    ...Shadow.lg, borderWidth: 1, borderColor: Colors.border 
  },
  ticketBadge: { backgroundColor: Colors.surface2, paddingVertical: 6, paddingHorizontal: 16, borderRadius: 99, fontSize: 10, fontWeight: '900', color: Colors.muted, marginBottom: 24, overflow: 'hidden' },
  confirmedNum: { fontSize: 80, fontWeight: '900', color: Colors.primary, letterSpacing: -2 },
  confirmedSvc: { fontSize: 18, fontWeight: '800', color: Colors.navy, marginTop: 8 },
  divider: { width: '100%', height: 2, backgroundColor: Colors.border, marginVertical: 32 },
  confirmedName: { fontSize: 20, fontWeight: '800', color: Colors.navy, marginBottom: 12 },
  confirmedMsg: { fontSize: 14, color: Colors.muted, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  waitBox: { backgroundColor: Colors.surface2, padding: 20, borderRadius: Radius.lg, width: '100%', alignItems: 'center', marginBottom: 32 },
  waitLabel: { fontSize: 10, fontWeight: '900', color: Colors.subtle, marginBottom: 4 },
  waitValue: { fontSize: 24, fontWeight: '900', color: Colors.primary },
  newBtnConfirm: { width: '100%', padding: 20, alignItems: 'center' },
  newBtnTextConfirm: { color: Colors.primary, fontWeight: '800', fontSize: 15 },
});
