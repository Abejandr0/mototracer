import { Text } from '../components/LocalizedText';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import { useLocalSearchParams, router } from 'expo-router';
import { useAppData } from '../providers/AppProvider';
import { supabase } from '../services/supabase';
import { usePreferences } from '../providers/PreferencesProvider';

function twilioReason(codes: number[]) {
  if (codes.includes(21659)) return 'El número emisor no pertenece a la cuenta Twilio configurada.';
  if (codes.includes(21608)) return 'La cuenta de prueba solo permite enviar a destinatarios verificados.';
  if (codes.includes(21211)) return 'Uno de los contactos tiene un número inválido.';
  if (codes.includes(21610)) return 'Un destinatario bloqueó los SMS de este emisor.';
  return codes.length ? `Twilio rechazó el envío (código ${codes[0]}).` : 'No se pudo confirmar el envío con Twilio.';
}

export default function SOSScreen() {
  const { crash } = useLocalSearchParams<{ crash?: string }>();
  const { contacts, ride } = useAppData();
  const { reduceMotion } = usePreferences();
  const [remaining, setRemaining] = useState(crash === '1' ? 30 : 0);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [attempted, setAttempted] = useState(false); const [sent, setSent] = useState(false);
  const [status, setStatus] = useState(''); const sendingRef = useRef(false);
  const deadline = useRef(Date.now() + 30000);
  const [pulse] = useState(() => new Animated.Value(.35));
  useEffect(() => { if (reduceMotion) { pulse.setValue(1); return; } const animation = Animated.loop(Animated.sequence([Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }), Animated.timing(pulse, { toValue: .35, duration: 650, useNativeDriver: true })])); animation.start(); return () => animation.stop(); }, [pulse, reduceMotion]);
  useEffect(() => { Location.requestForegroundPermissionsAsync().then((permission) => permission.granted ? Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }).then(setLocation) : undefined).catch(() => undefined); }, []);
  useEffect(() => { if (crash !== '1' || attempted) return; const timer = setInterval(() => setRemaining(Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000))), 250); return () => clearInterval(timer); }, [crash, attempted]);
  const send = useCallback(async () => {
    if (sendingRef.current || sent) return;
    sendingRef.current = true;
    setAttempted(true);
    setStatus('Enviando alerta…');
    try {
      if (!contacts.length) { Alert.alert('Falta un contacto SOS', 'Añade un contacto de emergencia desde tu perfil.', [{ text: 'Perfil', onPress: () => router.replace('/(tabs)/profile') }]); setStatus('Sin contactos SOS'); return; }
      const lastPoint = ride?.coordinates.at(-1);
      const coords = location?.coords ?? lastPoint;
      if (supabase && coords) {
        const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 12000);
        try {
          const { data, error } = await supabase.functions.invoke<{ accepted: number; failed: number; total: number; twilioErrorCodes?: number[] }>('send-sos', { body: { latitude: coords.latitude, longitude: coords.longitude, contactIds: contacts.map((contact) => contact.id) }, signal: controller.signal });
          if (!error && data?.accepted) { setSent(true); setStatus(`Twilio aceptó ${data.accepted} de ${data.total} SMS${data.failed ? '; revisa los restantes' : ''}.`); return; }
          if (error) { try { const failure = await error.context?.json(); setStatus(`${twilioReason(failure?.twilioErrorCodes ?? [])} Abriendo Mensajes…`); } catch { setStatus('No se pudo conectar con Twilio. Abriendo Mensajes…'); } }
        } catch { /* Open the phone's SMS composer below when the backend cannot be reached. */ }
        finally { clearTimeout(timeout); }
      }
      const maps = coords ? `https://maps.google.com/?q=${coords.latitude},${coords.longitude}` : 'Ubicación GPS no disponible';
      const message = `SOS MotoTracer: necesito ayuda. Mi ubicación actual: ${maps}`;
      if (!await SMS.isAvailableAsync()) { Alert.alert('SMS no disponible', 'Este dispositivo no tiene una aplicación de mensajes compatible.'); return; }
      const result = await SMS.sendSMSAsync(contacts.map((contact) => contact.phone), message);
      setSent(result.result === 'sent');
      setStatus(result.result === 'sent' ? 'Mensajes aceptó el envío; confirma la entrega con tu operador.' : 'Confirma el envío en Mensajes.');
    } catch { setStatus('No se pudo enviar la alerta.'); Alert.alert('No se pudo abrir Mensajes', 'Comprueba que tu teléfono tenga una aplicación de SMS configurada.'); }
    finally { sendingRef.current = false; }
  }, [contacts, location, ride, sent]);
  useEffect(() => { if (crash === '1' && remaining === 0 && !attempted) { const timer = setTimeout(() => { void send(); }, 0); return () => clearTimeout(timer); } }, [crash, remaining, attempted, send]);
  return <SafeAreaView style={{ flex: 1, backgroundColor: '#3D0710' }}><ScrollView contentContainerStyle={{ flexGrow: 1, padding: 22, justifyContent: 'space-between', gap: 26 }}>
    <View><Text style={{ color: '#FFC3CC', fontSize: 10, letterSpacing: 2, textAlign: 'center', fontWeight: '900' }}>MOTOTRACER · EMERGENCIA</Text><Text style={{ color: '#fff', fontSize: 31, fontWeight: '900', marginTop: 20 }}>Alerta SOS</Text><Text style={{ color: '#FFD0D5', fontSize: 15, marginTop: 7 }}>{crash === '1' ? 'Detectamos un posible impacto fuerte.' : 'Prepara tu ubicación para tus contactos.'}</Text></View>
    <View style={{ alignItems: 'center', gap: 16 }}><Animated.View style={{ width: 220, height: 220, borderRadius: 110, borderWidth: 7, borderColor: '#FF4560', backgroundColor: '#9C102A', alignItems: 'center', justifyContent: 'center', opacity: pulse }}><Text style={{ color: '#fff', fontSize: 67, fontWeight: '900' }}>SOS</Text></Animated.View><Text style={{ color: '#fff', fontSize: 45, fontWeight: '900' }}>{crash === '1' && !attempted ? remaining : '●'}</Text><Text style={{ color: '#FFD0D5', fontSize: 15, textAlign: 'center' }}>{crash === '1' && !attempted ? 'segundos antes de enviar la alerta' : status || 'Listo para enviar'}</Text><Text style={{ color: '#FFB5C1', fontSize: 12, textAlign: 'center' }}>{location ? `${location.coords.latitude.toFixed(5)}, ${location.coords.longitude.toFixed(5)}` : 'Buscando ubicación…'} · {contacts.length} contactos</Text></View>
    <View style={{ gap: 12 }}><Pressable disabled={sent} onPress={() => void send()} style={{ padding: 17, borderRadius: 13, backgroundColor: '#FF1744', alignItems: 'center', opacity: sent ? .5 : 1 }}><Text style={{ color: '#fff', fontWeight: '900' }}>{sent ? 'ALERTA PROCESADA' : remaining > 0 ? 'ENVIAR SOS AHORA' : 'ENVIAR SOS'}</Text></Pressable><Pressable onPress={() => router.back()} style={{ padding: 16, borderRadius: 13, backgroundColor: '#6D1A29', alignItems: 'center' }}><Text style={{ color: '#fff', fontWeight: '800' }}>{crash === '1' ? 'ESTOY BIEN · CANCELAR' : 'VOLVER'}</Text></Pressable><Text style={{ color: '#FFC3CC', fontSize: 11, lineHeight: 17, textAlign: 'center' }}>Twilio envía automáticamente cuando está configurado y el GPS está disponible. Si falla, MotoTracer abre Mensajes para que confirmes el envío. La detección no sustituye a emergencias.</Text></View>
  </ScrollView></SafeAreaView>;
}
