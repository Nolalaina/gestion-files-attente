// screens/TicketScreen.tsx — Aurora Design v6 Premium Clean Fix
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
      .then(({ data }) => setServices(data.data.filter(s => s.active)))
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

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <KeyboardAvoidingView behavior={Platform.OS==='ios' ? 'padding' : undefined} style={{ flex:1 }}>
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
          
          <View style={s.header}>
            <Text style={s.badge}>RÉSERVATION PREMIUM</Text>
            <Text style={s.title}>Nouveau Ticket</Text>
            <Text style={s.subtitle}>Remplissez les détails pour réserver votre place.</Text>
          </View>

          <View style={s.progressRow}>
            {['Infos', 'Service', 'Fin'].map((label, i) => (
              <View key={label} style={s.progressItem}>
                <View style={[s.progressBar, { backgroundColor: step > i+1 ? Colors.success : step === i+1 ? Colors.accent : Colors.surface2 }]} />
                <Text style={[s.progressLabel, step === i+1 && { color: Colors.accent }]}>{label}</Text>
              </View>
            ))}
          </View>

          <View style={s.formCard}>
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

                <TouchableOpacity style={s.submitBtn} onPress={next} activeOpacity={0.85}>
                  <Text style={s.submitBtnText}>CONTINUER →</Text>
                </TouchableOpacity>
              </View>
            )}

            {step === 2 && (
              <View>
                <Text style={[s.label, { marginBottom: 16 }]}>Choisir un Service <Text style={s.req}>*</Text></Text>
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
                            ~{Math.max(svc.avg_duration, (svc.waiting_count || 0) * svc.avg_duration)} min d'attente
                          </Text>
                        </View>
                        <View style={[s.radio, sel && s.radioSelected]} />
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={s.btnRow}>
                  <TouchableOpacity style={s.backBtn} onPress={back}>
                    <Text style={s.backBtnText}>RETOUR</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.submitBtn, { flex: 2 }]} onPress={next} activeOpacity={0.85}>
                    <Text style={s.submitBtnText}>SUIVANT →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {step === 3 && (
              <View>
                <View style={s.recap}>
                  <Text style={s.recapTitle}>RÉCAPITULATIF</Text>
                  {[
                    { label: 'Client', value: form.user_name },
                    { label: 'Service', value: selected?.name || '' },
                    { label: 'Attente', value: `~${(selected?.waiting_count || 0) * (selected?.avg_duration || 0)} min` },
                  ].map((r: any) => (
                    <View key={r.label} style={s.recapRow}>
                      <Text style={s.recapLabel}>{r.label}</Text>
                      <Text style={s.recapValue}>{r.value}</Text>
                    </View>
                  ))}
                </View>

                <View style={s.btnRow}>
                  <TouchableOpacity style={s.backBtn} onPress={back} disabled={loading}>
                    <Text style={s.backBtnText}>RETOUR</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.submitBtn, { flex: 2 }, loading && s.btnDisabled]} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
                    {loading
                      ? <ActivityIndicator color="#fff" />
                      : <Text style={s.submitBtnText}>CONFIRMER ✓</Text>}
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
  badge: { fontSize: 10, fontWeight: '900', color: Colors.accent, letterSpacing: 1.5, marginBottom: 8 },
  title: { fontSize: 32, fontWeight: '900', color: Colors.text, marginBottom: 8 },
  subtitle: { fontSize: 16, color: Colors.muted, fontWeight: '500' },

  progressRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  progressItem: { flex: 1 },
  progressBar: { height: 4, borderRadius: 99, marginBottom: 6 },
  progressLabel: { fontSize: 10, fontWeight: '700', color: Colors.subtle, textAlign: 'center' },
  
  formCard: { 
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: 24, ...Shadow.md,
    borderWidth: 1, borderColor: Colors.border
  },
  field: { marginBottom: 20 },
  label: { fontSize: 11, fontWeight: '800', color: Colors.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  req: { color: Colors.danger },
  opt: { color: Colors.subtle, fontWeight: '400', textTransform: 'none' },
  input: { 
    backgroundColor: Colors.surface2, borderRadius: Radius.md, padding: 16, fontSize: 16, 
    color: '#fff', borderWidth: 1, borderColor: Colors.border 
  },
  inputErr: { borderColor: Colors.danger },
  err: { color: Colors.danger, fontSize: 11, fontWeight: '700', marginTop: 4, marginLeft: 4 },
  
  serviceList: { gap: 12, marginBottom: 20 },
  svcCard: { 
    flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: Radius.lg, 
    borderWidth: 1, borderColor: Colors.border, gap: 16, backgroundColor: Colors.surface2 
  },
  svcSelected: { borderColor: Colors.accent, backgroundColor: 'rgba(245, 158, 11, 0.05)' },
  svcCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' },
  svcCircleSelected: { backgroundColor: Colors.accent },
  svcLetter: { fontSize: 18, fontWeight: '900', color: Colors.muted },
  svcLetterSelected: { color: Colors.navy },
  svcName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  svcNameSelected: { color: Colors.accent },
  svcWait: { fontSize: 12, color: Colors.muted, marginTop: 2 },
  svcWaitSelected: { color: Colors.accentLt },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.border },
  radioSelected: { borderColor: Colors.accent, borderWidth: 6, backgroundColor: Colors.text },
  
  submitBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, padding: 20, alignItems: 'center', ...Shadow.glow },
  submitBtnText: { color: '#fff', fontWeight: '900', fontSize: 15, letterSpacing: 1 },
  btnDisabled: { opacity: 0.6 },
  btnRow: { flexDirection: 'row', gap: 12 },
  backBtn: { flex: 1, backgroundColor: Colors.surface2, borderRadius: Radius.md, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  backBtnText: { color: Colors.muted, fontWeight: '800', fontSize: 13 },

  recap: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: Radius.lg, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: Colors.border },
  recapTitle: { fontSize: 10, fontWeight: '900', color: Colors.accent, letterSpacing: 1, marginBottom: 12 },
  recapRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  recapLabel: { color: Colors.muted, fontSize: 13 },
  recapValue: { fontWeight: '700', fontSize: 14, color: Colors.text },
  
  confirmedContainer: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },
  ticketCardConfirm: { 
    width: '100%', backgroundColor: Colors.surface, borderRadius: 40, padding: 32, alignItems: 'center', 
    ...Shadow.lg, borderWidth: 1, borderColor: Colors.border 
  },
  ticketBadge: { backgroundColor: 'rgba(245, 158, 11, 0.1)', paddingVertical: 6, paddingHorizontal: 16, borderRadius: 99, fontSize: 10, fontWeight: '900', color: Colors.accent, marginBottom: 24, overflow: 'hidden' },
  confirmedNum: { fontSize: 80, fontWeight: '900', color: Colors.primary, letterSpacing: -2, textShadowColor: 'rgba(16, 185, 129, 0.3)', textShadowOffset: {width: 0, height: 0}, textShadowRadius: 20 },
  confirmedSvc: { fontSize: 18, fontWeight: '800', color: Colors.text, marginTop: 8 },
  divider: { width: '100%', height: 1, backgroundColor: Colors.border, marginVertical: 32 },
  confirmedName: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 12 },
  confirmedMsg: { fontSize: 14, color: Colors.muted, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  waitBox: { backgroundColor: Colors.surface2, padding: 20, borderRadius: Radius.lg, width: '100%', alignItems: 'center', marginBottom: 32, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.1)' },
  waitLabel: { fontSize: 10, fontWeight: '900', color: Colors.muted, marginBottom: 4 },
  waitValue: { fontSize: 24, fontWeight: '900', color: Colors.primary },
  newBtnConfirm: { width: '100%', padding: 20, alignItems: 'center', backgroundColor: Colors.surface2, borderRadius: Radius.md },
  newBtnTextConfirm: { color: Colors.primary, fontWeight: '800', fontSize: 15 },
});
