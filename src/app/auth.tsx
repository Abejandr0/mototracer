import { Text, TextInput } from '../components/LocalizedText';
import { usePreferences } from '../providers/PreferencesProvider';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme';
import { useAuth } from '../providers/AuthProvider';
import { screenStyles as s } from '../components/Screen';

const input = () => ({ color: Colors.textPrimary, backgroundColor: Colors.card, borderColor: Colors.border, borderWidth: 1, borderRadius: 12, padding: 15, fontSize: 15 } as const);
export default function AuthScreen() {
  usePreferences();
  const auth = useAuth();
  const [register, setRegister] = useState(false);
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [accepted, setAccepted] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const submit = async () => {
    if (!accepted) { setError('Acepta los términos y la política de privacidad.'); return; }
    if (!email.includes('@') || password.length < 8 || (register && !name.trim())) { setError('Completa los datos. La contraseña debe tener al menos 8 caracteres.'); return; }
    setBusy(true); setError('');
    try {
      if (register) { const confirmationRequired = await auth.signUp(email, password, name); if (confirmationRequired) router.replace({ pathname: '/email-pending', params: { email: email.trim() } }); else router.replace('/'); }
      else { await auth.signIn(email, password); await auth.acceptLegal(); router.replace('/'); }
    } catch (cause) { const message = cause instanceof Error ? cause.message : 'No se pudo acceder a la cuenta.'; setError(/not authorized|rate limit|email provider/i.test(message) ? 'El servicio de correo todavía no está habilitado para este destinatario. Inténtalo cuando se configure el envío de correos.' : message); }
    finally { setBusy(false); }
  };
  return <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center', gap: 15 }}>
    <Text style={{ color: Colors.textTertiary, textAlign: 'center', fontSize: 11, fontWeight: '900', letterSpacing: 2 }}>MOTOTRACER</Text>
    <Text style={{ color: Colors.textPrimary, fontSize: 31, fontWeight: '900', marginTop: 24 }}>{register ? 'Crea tu cuenta' : 'Bienvenido de nuevo'}</Text><Text style={s.muted}>{register ? 'Tu garaje y tus rutas podrán acompañarte en otro dispositivo.' : 'Inicia sesión para entrar a tu garaje y tus rodadas.'}</Text>
    {register ? <TextInput placeholder="Nombre" placeholderTextColor={Colors.textTertiary} value={name} onChangeText={setName} style={input()} /> : null}
    <TextInput placeholder="Correo electrónico" placeholderTextColor={Colors.textTertiary} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={input()} />
    <TextInput placeholder="Contraseña · mínimo 8 caracteres" placeholderTextColor={Colors.textTertiary} value={password} onChangeText={setPassword} secureTextEntry style={input()} />
    <Pressable onPress={() => setAccepted(!accepted)} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8 }}><Text style={{ color: accepted ? Colors.gpsOptimal : Colors.textSecondary, fontSize: 22 }}>{accepted ? '☑' : '☐'}</Text><Text style={{ color: Colors.textSecondary, fontSize: 13, lineHeight: 20, flex: 1 }}>Acepto el tratamiento de mis datos para usar MotoTracer y he leído los términos y la política de privacidad.</Text></Pressable>
    <View style={{ flexDirection: 'row', gap: 16 }}><Pressable onPress={() => router.push('/legal?type=privacy')}><Text style={{ color: Colors.activeTelemetry, fontSize: 13 }}>Política de privacidad</Text></Pressable><Pressable onPress={() => router.push('/legal?type=terms')}><Text style={{ color: Colors.activeTelemetry, fontSize: 13 }}>Términos de uso</Text></Pressable></View>
    {error ? <Text style={{ color: Colors.emergency }}>{error}</Text> : null}
    {!auth.configured ? <Text style={{ color: Colors.warning }}>Configura EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY para entrar.</Text> : null}
    <Pressable disabled={busy || !auth.configured} onPress={() => void submit()} style={[s.action, { opacity: busy || !auth.configured ? .5 : 1 }]}><Text style={s.actionText}>{busy ? 'ESPERA…' : register ? 'CREAR CUENTA' : 'INICIAR SESIÓN'}</Text></Pressable>
    <Pressable onPress={() => { setRegister(!register); setError(''); }}><Text style={{ color: Colors.activeTelemetry, textAlign: 'center', padding: 9 }}>{register ? 'Ya tengo una cuenta' : 'Crear cuenta nueva'}</Text></Pressable>
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
