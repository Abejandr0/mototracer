import { Text, TextInput } from '../components/LocalizedText';
import { usePreferences } from '../providers/PreferencesProvider';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme';
import { screenStyles as s } from '../components/Screen';
import { useAuth } from '../providers/AuthProvider';

export default function EmailPendingScreen() {
  usePreferences();
  const { email = '' } = useLocalSearchParams<{ email?: string }>();
  const auth = useAuth();
  const [code, setCode] = useState(''); const [busy, setBusy] = useState(false);
  const resend = async () => { setBusy(true); try { await auth.resendConfirmation(email); Alert.alert('Correo solicitado', 'Revisa tu bandeja de entrada y spam.'); } catch (error) { Alert.alert('No se pudo reenviar', error instanceof Error ? error.message : 'Intenta más tarde.'); } finally { setBusy(false); } };
  const verify = async () => { if (!/^\d{6,8}$/.test(code.trim())) { Alert.alert('Código incompleto', 'Escribe el código numérico del correo.'); return; } setBusy(true); try { await auth.verifyEmailCode(email, code); router.replace('/'); } catch (error) { Alert.alert('Código no válido', error instanceof Error ? error.message : 'Solicita uno nuevo.'); } finally { setBusy(false); } };
  return <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background, padding: 24, justifyContent: 'center' }}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}><View style={{ gap: 16 }}><Text style={{ color: Colors.activeTelemetry, fontSize: 12, fontWeight: '900' }}>CONFIRMA TU CUENTA</Text><Text style={{ color: Colors.textPrimary, fontSize: 29, fontWeight: '900' }}>Revisa tu correo</Text><Text style={s.muted}>Enviamos un enlace de confirmación a {email}. Ábrelo en este teléfono para volver a MotoTracer. Revisa también spam.</Text><Text style={s.muted}>Si el mensaje incluye un código, puedes escribirlo aquí.</Text><TextInput value={code} onChangeText={setCode} keyboardType="number-pad" placeholder="Código del correo" placeholderTextColor={Colors.textTertiary} style={{ color: Colors.textPrimary, backgroundColor: Colors.card, padding: 16, borderRadius: 12, fontSize: 18 }} /><Pressable disabled={busy} onPress={() => void verify()} style={s.action}><Text style={s.actionText}>CONFIRMAR CÓDIGO</Text></Pressable><Pressable disabled={busy} onPress={() => void resend()} style={s.secondary}><Text style={s.secondaryText}>REENVIAR CORREO</Text></Pressable><Pressable onPress={() => router.replace('/auth')}><Text style={{ color: Colors.activeTelemetry, textAlign: 'center' }}>Ya confirmé · iniciar sesión</Text></Pressable></View></KeyboardAvoidingView></SafeAreaView>;
}
