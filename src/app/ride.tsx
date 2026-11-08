import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, Text, View, useWindowDimensions } from 'react-native';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { Colors } from '../theme';
import { useAppData } from '../providers/AppProvider';
import { useSensors } from '../hooks/useSensors';
import { Speedometer, LeanGauge } from '../components';
import { Card, Header, Label, Page, screenStyles as s } from '../components/Screen';

function formatTime(seconds: number) { const h = Math.floor(seconds / 3600); const m = Math.floor(seconds % 3600 / 60); const sec = seconds % 60; return h ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`; }
export default function RideScreen() {
  const app = useAppData();
  const { ride, paused, startRide, updateLocation, updateRideLean, finishRide } = app;
  const rideId = ride?.id;
  const { width } = useWindowDimensions();
  const sensor = useSensors(!app.paused);
  const [gps, setGps] = useState<'buscando' | 'listo' | 'sin permiso'>('buscando');
  const [seconds, setSeconds] = useState(0);
  const fired = useRef(false);
  const leanRef = useRef(0);
  useEffect(() => { leanRef.current = sensor.leanAngle; }, [sensor.leanAngle]);
  useEffect(() => { if (!ride) startRide(); }, [ride, startRide]);
  useEffect(() => {
    if (!rideId || paused) return;
    let subscription: Location.LocationSubscription | undefined;
    let mounted = true;
    (async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!mounted) return;
      if (permission.status !== 'granted') { setGps('sin permiso'); return; }
      setGps('listo');
      subscription = await Location.watchPositionAsync({ accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1000, distanceInterval: 4 }, (location) => {
        const speed = location.coords.speed == null || location.coords.speed < 0 ? 0 : location.coords.speed * 3.6;
        updateLocation({ latitude: location.coords.latitude, longitude: location.coords.longitude, timestamp: location.timestamp, speed, lean: leanRef.current });
      });
    })().catch(() => mounted && setGps('sin permiso'));
    return () => { mounted = false; subscription?.remove(); };
  }, [rideId, paused, updateLocation]);
  useEffect(() => { const startedAt = ride?.startTime; const id = setInterval(() => { if (startedAt) setSeconds(Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)); }, 1000); return () => clearInterval(id); }, [ride?.id, ride?.startTime]);
  useEffect(() => { updateRideLean(sensor.leanAngle); }, [sensor.leanAngle, updateRideLean]);
  useEffect(() => { if (sensor.isCrashDetected && !fired.current) { fired.current = true; router.replace('/sos?crash=1'); } if (!sensor.isCrashDetected) fired.current = false; }, [sensor.isCrashDetected]);
  const speed = ride?.coordinates.at(-1)?.speed ?? 0;
  const lean = sensor.leanAngle;
  const stop = () => Alert.alert('Finalizar rodada', 'Se guardarán las estadísticas capturadas por GPS.', [{ text: 'Seguir', style: 'cancel' }, { text: 'Finalizar', style: 'destructive', onPress: () => { finishRide(); router.replace('/analytics'); } }]);
  if (!ride) return <Page><Text style={s.muted}>Preparando rodada…</Text></Page>;
  return <Page scroll={false}>
    <Header title="En ruta" subtitle={paused ? 'Rodada en pausa' : 'Lecturas en vivo'} right={<View style={{ borderWidth: 1, borderColor: gps === 'listo' ? Colors.gpsOptimal : Colors.warning, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 }}><Text style={{ color: gps === 'listo' ? Colors.gpsOptimal : Colors.warning, fontWeight: '800', fontSize: 10 }}>GPS {gps.toUpperCase()}</Text></View>} />
    <View style={[s.row, { gap: 8 }]}>{[{ l: 'TIEMPO', v: formatTime(seconds) }, { l: 'DISTANCIA', v: `${ride.distanceKm.toFixed(2)} km` }, { l: 'MÁXIMO', v: `${Math.round(ride.maxSpeed)} km/h` }].map((x) => <Card key={x.l} style={{ flex: 1, alignItems: 'center', paddingHorizontal: 7 }}><Label>{x.l}</Label><Text style={{ color: Colors.textPrimary, fontWeight: '800', fontSize: 15 }}>{x.v}</Text></Card>)}</View>
    <View style={{ flex: 1, minHeight: 220, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
      <Speedometer speed={speed} size={Math.min(width * .53, 230)} />
      <View style={{ alignItems: 'center', gap: 0 }}><LeanGauge angle={lean} size={Math.min(width * .4, 168)} /><Text style={{ color: Colors.textTertiary, fontSize: 9, fontWeight: '800', letterSpacing: 1 }}>ÁNGULO DE INCLINACIÓN</Text></View>
    </View>
    <View style={[s.row, { gap: 8 }]}>{[{ label: 'VELOCIDAD PROM.', value: `${Math.round(ride.avgSpeed)} km/h` }, { label: 'INCLINACIÓN MÁX.', value: `${Math.max(Math.abs(ride.maxLeanLeft), ride.maxLeanRight).toFixed(0)}°` }, { label: 'ACELERACIÓN', value: `${sensor.accelerationMagnitude.toFixed(2)} G` }].map((x) => <Card key={x.label} style={{ flex: 1, alignItems: 'center', paddingHorizontal: 4 }}><Text style={{ color: Colors.textTertiary, fontSize: 8, fontWeight: '700', textAlign: 'center' }}>{x.label}</Text><Text style={{ color: Colors.activeTelemetry, fontSize: 15, fontWeight: '800' }}>{x.value}</Text></Card>)}</View>
    {gps === 'sin permiso' ? <Text style={{ color: Colors.warning, fontSize: 12, textAlign: 'center' }}>Ubicación desactivada: no se guardarán velocidad ni trazado GPS.</Text> : null}
    <View style={[s.row, { gap: 10 }]}><Pressable onPress={app.pauseRide} style={[s.secondary, { flex: 1 }]}><Text style={s.secondaryText}>{paused ? 'Continuar' : 'Pausar'}</Text></Pressable><Pressable onPress={() => router.push('/sos')} style={[s.secondary, { borderColor: Colors.emergency, flex: 1 }]}><Text style={{ color: Colors.emergency, fontWeight: '800' }}>SOS</Text></Pressable><Pressable onPress={stop} style={[s.action, { flex: 1 }]}><Text style={s.actionText}>Terminar</Text></Pressable></View>
  </Page>;
}
