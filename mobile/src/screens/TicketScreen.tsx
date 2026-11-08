// screens/TicketScreen.tsx — Aurora Midnight
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Colors, Radius, Spacing, Type } from '../types/theme';
import type { Service, Ticket, ApiResponse } from '../types';

interface FormData {
  user_name: string;
  phone: string;
  email: string;
  service_id: number | null;
}

const STEPS = ['Informations', 'Service', 'Confirmation'];

export default function TicketScreen() {
  const { user } = useAuth();
  const { addToast } = useNotification();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    user_name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    service_id: null,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    api
      .get<ApiResponse<Service[]>>('/services')
      .then(({ data }) => setServices(data.data.filter((service) => service.active)))
      .catch(() => addToast('Chargement des services impossible.', 'error'));
  }, [addToast]);

  const selected = services.find((service) => service.id === form.service_id);

  const validateStep1 = (): boolean => {
    const nextErrors: Partial<Record<keyof FormData, string>> = {};
    if (!form.user_name.trim()) nextErrors.user_name = 'Le nom est requis.';
    if (form.phone && !/^\+?[\d\s-]{7,}$/.test(form.phone))
      nextErrors.phone = 'Numéro invalide.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const next = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2) {
      if (!form.service_id) {
        setErrors({ service_id: 'Choisissez un service.' });
        return;
      }
      setStep(3);
    }
  };

  const back = () => setStep((value) => Math.max(1, value - 1));

  const handleSubmit = async () => {
    if (!form.service_id) {
      setErrors({ service_id: 'Choisissez un service.' });
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post<ApiResponse<Ticket>>('/tickets', form);
      setTicket(data.data);
      addToast('Ticket créé avec succès.', 'success');
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Création du ticket impossible.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setTicket(null);
    setForm({
      user_name: user?.name || '',
      phone: user?.phone || '',
      email: user?.email || '',
      service_id: null,
    });
    setStep(1);
    setErrors({});
  };

  const serviceName =
    services.find((service) => service.id === (ticket?.service_id || form.service_id))?.name || '';

  if (ticket) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
        <ScrollView contentContainerStyle={s.confirmedContainer}>
          <View style={s.confirmedCard}>
            <Text style={s.confirmedLabel}>Votre ticket</Text>
            <Text style={s.confirmedNumber}>{ticket.number}</Text>
            <Text style={s.confirmedService}>{serviceName}</Text>

            <View style={s.divider} />

            <Text style={s.confirmedName}>Bonjour, {ticket.user_name}.</Text>
            <Text style={s.confirmedMessage}>
              Conservez ce numéro. Nous vous préviendrons dès que votre tour approchera.
            </Text>

            <View style={s.qrWrapper}>
              <Image
                source={{
                  uri: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${ticket.number}&bgcolor=ffffff&color=052e22`,
                }}
                style={s.qrCode}
                accessibilityLabel={`Code QR du ticket ${ticket.number}`}
              />
            </View>

            {(ticket.estimated_wait ?? 0) > 0 && (
              <View style={s.waitBox}>
                <Text style={s.waitLabel}>Attente estimée</Text>
                <Text style={s.waitValue}>environ {ticket.estimated_wait} min</Text>
              </View>
            )}

            <TouchableOpacity
              style={s.secondaryBtn}
              onPress={reset}
              accessibilityRole="button"
              accessibilityLabel="Prendre un autre ticket"
            >
              <Text style={s.secondaryBtnText}>Prendre un autre ticket</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={s.flex}
      >
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
          <View style={s.header}>
            <View style={s.mark} />
            <Text style={s.title}>Nouveau ticket</Text>
            <Text style={s.subtitle}>
              Renseignez vos informations, puis choisissez un service.
            </Text>
          </View>

          <View style={s.progressRow}>
            {STEPS.map((label, index) => {
              const position = index + 1;
              const done = step > position;
              const active = step === position;
              return (
                <View key={label} style={s.progressItem}>
                  <View
                    style={[
                      s.progressBar,
                      done && s.progressBarDone,
                      active && s.progressBarActive,
                    ]}
                  />
                  <Text style={[s.progressLabel, active && s.progressLabelActive]}>{label}</Text>
                </View>
              );
            })}
          </View>

          <View style={s.card}>
            {step === 1 && (
              <View>
                <View style={s.field}>
                  <Text style={s.label}>Nom complet</Text>
                  <TextInput
                    style={[s.input, errors.user_name ? s.inputError : null]}
                    value={form.user_name}
                    onChangeText={(value: string) => {
                      setForm((current) => ({ ...current, user_name: value }));
                      setErrors((current) => ({ ...current, user_name: undefined }));
                    }}
                    placeholder="Jean Rakoto"
                    placeholderTextColor={Colors.subtle}
                    accessibilityLabel="Nom complet"
                  />
                  {errors.user_name && <Text style={s.error}>{errors.user_name}</Text>}
                </View>

                <View style={s.field}>
                  <Text style={s.label}>Téléphone (recommandé)</Text>
                  <TextInput
                    style={s.input}
                    value={form.phone}
                    onChangeText={(value: string) =>
                      setForm((current) => ({ ...current, phone: value }))
                    }
                    placeholder="034 00 000 00"
                    placeholderTextColor={Colors.subtle}
                    keyboardType="phone-pad"
                    accessibilityLabel="Téléphone"
                  />
                  {errors.phone && <Text style={s.error}>{errors.phone}</Text>}
                </View>

                <TouchableOpacity
                  style={s.primaryBtn}
                  onPress={next}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                >
                  <Text style={s.primaryBtnText}>Continuer</Text>
                </TouchableOpacity>
              </View>
            )}

            {step === 2 && (
              <View>
                <Text style={s.blockLabel}>Choisir un service</Text>
                <View style={s.serviceList}>
                  {services.map((service) => {
                    const isSelected = form.service_id === service.id;
                    return (
                      <TouchableOpacity
                        key={service.id}
                        style={[s.serviceCard, isSelected && s.serviceCardSelected]}
                        onPress={() => {
                          setForm((current) => ({ ...current, service_id: service.id }));
                          setErrors((current) => ({ ...current, service_id: undefined }));
                        }}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityLabel={service.name}
                      >
                        <View
                          style={[s.serviceMark, isSelected && s.serviceMarkSelected]}
                        >
                          <Text
                            style={[s.serviceMarkText, isSelected && s.serviceMarkTextSelected]}
                          >
                            {service.prefix}
                          </Text>
                        </View>
                        <View style={s.serviceInfo}>
                          <Text style={s.serviceName}>{service.name}</Text>
                          <Text style={s.serviceWait}>
                            environ{' '}
                            {Math.max(
                              service.avg_duration,
                              (service.waiting_count || 0) * service.avg_duration
                            )}{' '}
                            min d’attente
                          </Text>
                        </View>
                        <View style={[s.radio, isSelected && s.radioSelected]} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {errors.service_id && <Text style={s.error}>{errors.service_id}</Text>}

                <View style={s.buttonRow}>
                  <TouchableOpacity
                    style={s.ghostBtn}
                    onPress={back}
                    accessibilityRole="button"
                  >
                    <Text style={s.ghostBtnText}>Retour</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.primaryBtn, s.primaryBtnGrow]}
                    onPress={next}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                  >
                    <Text style={s.primaryBtnText}>Continuer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {step === 3 && (
              <View>
                <View style={s.recap}>
                  <Text style={s.recapTitle}>Récapitulatif</Text>
                  {[
                    { label: 'Client', value: form.user_name },
                    { label: 'Service', value: selected?.name || '' },
                    {
                      label: 'Attente',
                      value: `environ ${
                        (selected?.waiting_count || 0) * (selected?.avg_duration || 0)
                      } min`,
                    },
                  ].map((row) => (
                    <View key={row.label} style={s.recapRow}>
                      <Text style={s.recapLabel}>{row.label}</Text>
                      <Text style={s.recapValue}>{row.value}</Text>
                    </View>
                  ))}
                </View>

                <View style={s.buttonRow}>
                  <TouchableOpacity
                    style={s.ghostBtn}
                    onPress={back}
                    disabled={loading}
                    accessibilityRole="button"
                  >
                    <Text style={s.ghostBtnText}>Retour</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.primaryBtn, s.primaryBtnGrow, loading && s.btnDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                  >
                    {loading ? (
                      <ActivityIndicator color={Colors.onPrimary} />
                    ) : (
                      <Text style={s.primaryBtnText}>Confirmer</Text>
                    )}
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
  flex: { flex: 1 },
  container: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },

  header: { marginBottom: Spacing.xl },
  mark: {
    width: 28,
    height: 3,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
    marginBottom: Spacing.md,
  },
  title: { fontSize: Type.xxl, fontWeight: '600', color: Colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: Type.sm, color: Colors.muted, marginTop: Spacing.xs, lineHeight: 20 },

  progressRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  progressItem: { flex: 1 },
  progressBar: {
    height: 3,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface2,
    marginBottom: Spacing.sm,
  },
  progressBarDone: { backgroundColor: Colors.primaryDk },
  progressBarActive: { backgroundColor: Colors.primary },
  progressLabel: { fontSize: Type.xs, fontWeight: '500', color: Colors.subtle },
  progressLabelActive: { color: Colors.text },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  field: { marginBottom: Spacing.lg },
  label: { fontSize: Type.sm, fontWeight: '500', color: Colors.muted, marginBottom: Spacing.sm },
  blockLabel: {
    fontSize: Type.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  input: {
    backgroundColor: Colors.surface2,
    borderRadius: Radius.sm,
    padding: Spacing.lg,
    fontSize: Type.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputError: { borderColor: Colors.danger },
  error: { color: Colors.danger, fontSize: Type.xs, marginTop: Spacing.xs },

  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    padding: Spacing.lg,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  primaryBtnGrow: { flex: 2 },
  primaryBtnText: { color: Colors.onPrimary, fontWeight: '600', fontSize: Type.md },
  btnDisabled: { opacity: 0.6 },
  buttonRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
  ghostBtn: {
    flex: 1,
    backgroundColor: Colors.surface2,
    borderRadius: Radius.sm,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 52,
  },
  ghostBtnText: { color: Colors.muted, fontWeight: '600', fontSize: Type.sm },

  serviceList: { gap: Spacing.md, marginBottom: Spacing.md },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.lg,
    backgroundColor: Colors.surface2,
  },
  serviceCardSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLt },
  serviceMark: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceMarkSelected: { backgroundColor: Colors.primary },
  serviceMarkText: { fontSize: Type.md, fontWeight: '600', color: Colors.muted },
  serviceMarkTextSelected: { color: Colors.onPrimary },
  serviceInfo: { flex: 1 },
  serviceName: { fontSize: Type.md, fontWeight: '600', color: Colors.text },
  serviceWait: { fontSize: Type.xs, color: Colors.muted, marginTop: 2 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: Radius.pill,
    borderWidth: 2,
    borderColor: Colors.borderStrong,
  },
  radioSelected: { borderColor: Colors.primary, borderWidth: 6, backgroundColor: Colors.bg },

  recap: {
    backgroundColor: Colors.surface2,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recapTitle: {
    fontSize: Type.sm,
    fontWeight: '600',
    color: Colors.muted,
    marginBottom: Spacing.sm,
  },
  recapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  recapLabel: { color: Colors.muted, fontSize: Type.sm },
  recapValue: { fontWeight: '600', fontSize: Type.sm, color: Colors.text },

  confirmedContainer: {
    flexGrow: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
    backgroundColor: Colors.bg,
  },
  confirmedCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderTopWidth: 3,
    borderTopColor: Colors.primary,
  },
  confirmedLabel: { fontSize: Type.sm, fontWeight: '500', color: Colors.muted },
  confirmedNumber: {
    fontSize: 76,
    fontWeight: '600',
    color: Colors.primary,
    letterSpacing: -3,
    marginVertical: Spacing.sm,
  },
  confirmedService: { fontSize: Type.lg, fontWeight: '600', color: Colors.text },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xl,
  },
  confirmedName: { fontSize: Type.lg, fontWeight: '600', color: Colors.text, marginBottom: Spacing.sm },
  confirmedMessage: {
    fontSize: Type.sm,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: Spacing.xl,
  },
  qrWrapper: {
    backgroundColor: '#ffffff',
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  qrCode: { width: 180, height: 180 },
  waitBox: {
    backgroundColor: Colors.surface2,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  waitLabel: { fontSize: Type.xs, color: Colors.muted, marginBottom: 2 },
  waitValue: { fontSize: Type.xl, fontWeight: '600', color: Colors.primary },
  secondaryBtn: {
    width: '100%',
    padding: Spacing.lg,
    alignItems: 'center',
    backgroundColor: Colors.surface2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryBtnText: { color: Colors.primary, fontWeight: '600', fontSize: Type.sm },
});
