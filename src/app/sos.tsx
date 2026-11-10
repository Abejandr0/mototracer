import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors } from '../theme';
import { useAppData } from '../providers/AppProvider';
import { Card, Header, Page, screenStyles as s } from '../components/Screen';

export default function SOSScreen() {
  const { crash } = useLocalSearchParams<{ crash?: string }>();
  const { contacts } = useAppData();
  const [remaining, setRemaining] = useState(crash === '1' ? 30 : 0);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [sent, setSent] = useState(false);
  const [composerOpened, setComposerOpened] = useState(false);
  useEffect(() => { Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).then(setLocation).catch(() => undefined); }, []);
  useEffect(() => {
    if (remaining <= 0 || sent) return;
    const timer = setTimeout(() => setRemaining((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining, sent]);
  const send = useCallback(async () => {
    if (!contacts.length) { Alert.alert('Falta un contacto', 'Añade un contacto de emergencia desde tu perfil para usar el SOS.', [{ text: 'Volver', onPress: () => router.back() }, { text: 'Ir al perfil', onPress: () => router.replace('/(tabs)/profile') }]); return; }
    const coords = location?.coords;
    const maps = coords ? `https://maps.google.com/?q=${coords.latitude},${coords.longitude}` : 'Ubicación GPS no disponible';
    const message = `SOS MotoTracer: necesito ayuda. Mi ubicación actual: ${maps}`;
    try {
      if (!await SMS.isAvailableAsync()) { Alert.alert('SMS no disponible', 'Este dispositivo no tiene una aplicación de mensajes compatible.'); return; }
      const result = await SMS.sendSMSAsync(contacts.map((contact) => contact.phone), message);
      setComposerOpened(result.result !== 'cancelled');
      setSent(result.result === 'sent');
    } catch { Alert.alert('No se pudo abrir Mensajes', 'Verifica que tu teléfono tenga una aplicación de SMS configurada.'); }
  }, [contacts, location]);
  const cancel = () => router.back();
  useEffect(() => {
    if (crash === '1' && remaining === 0 && !sent) {
      const timer = setTimeout(() => { void send(); }, 0);
      return () => clearTimeout(timer);
    }
  }, [crash, remaining, sent, send]);
  return <Page>
    <Header title="Emergencia SOS" subtitle={crash === '1' ? 'Se detectó un impacto fuerte.' : 'Envía tu ubicación a tus contactos.'} />
    <Card style={{ alignItems: 'center', paddingVertical: 25, borderColor: Colors.emergency }}><View style={{ width: 176, height: 176, borderRadius: 90, borderWidth: 5, borderColor: Colors.emergency, alignItems: 'center', justifyContent: 'center', backgroundColor: '#24151A' }}><Text style={{ color: Colors.emergency, fontSize: 52, fontWeight: '900' }}>{crash === '1' && !composerOpened ? remaining : 'SOS'}</Text><Text style={{ color: Colors.textSecondary, fontWeight: '700', fontSize: 12 }}>{crash === '1' && !composerOpened ? 'SEGUNDOS' : sent ? 'ENVIADO' : composerOpened ? 'MENSAJE PREPARADO' : 'LISTO PARA ENVIAR'}</Text></View><Text style={{ color: Colors.textPrimary, fontSize: 18, fontWeight: '800', textAlign: 'center', marginTop: 20 }}>{sent ? 'SOS enviado' : composerOpened ? 'Confirma el envío en Mensajes' : 'Tu mensaje incluirá la ubicación actual'}</Text><Text style={[s.muted, { textAlign: 'center' }]}>{location ? `${location.coords.latitude.toFixed(5)}, ${location.coords.longitude.toFixed(5)}` : 'Buscando ubicación…'} · {contacts.length} contactos</Text></Card>
    <Pressable onPress={send} style={[s.action, { backgroundColor: Colors.emergency }]}><Text style={s.actionText}>{crash === '1' && remaining > 0 ? 'ENVIAR SOS AHORA' : sent ? 'ABRIR MENSAJES DE NUEVO' : 'ABRIR MENSAJES Y ENVIAR'}</Text></Pressable>
    {crash === '1' && !sent ? <Pressable onPress={cancel} style={s.secondary}><Text style={s.secondaryText}>Estoy bien · Cancelar alerta</Text></Pressable> : <Pressable onPress={cancel} style={s.secondary}><Text style={s.secondaryText}>Volver a la rodada</Text></Pressable>}
    <Text style={{ color: Colors.textTertiary, fontSize: 11, lineHeight: 16, textAlign: 'center' }}>MotoTracer abre la aplicación de mensajes; debes confirmar el envío. La detección de impactos puede fallar y no sustituye los servicios de emergencia.</Text>
  </Page>;
}
