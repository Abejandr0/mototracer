import { usePreferences } from '../providers/PreferencesProvider';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, AppState, Platform, Text, View, useWindowDimensions } from 'react-native';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { Colors } from '../theme';
import { useAppData } from '../providers/AppProvider';
import { useSensors } from '../hooks/useSensors';
import { Speedometer, LeanGauge } from '../components';
import { Card, Header, Label, Page, screenStyles as s } from '../components/Screen';
import { RouteMap } from '../components/RouteMap';
import { RIDE_LOCATION_TASK, takeBackgroundLocationQueue } from '../services/backgroundLocationTask';
import { distanceMeters, GpsFix, speedFromFixes } from '../services/rideTelemetry';
import { HoldAction } from '../components/HoldAction';
import { segmentLengthKm, summarizeSegments } from '../services/rideStats';

function formatTime(seconds: number) { const h = Math.floor(seconds / 3600); const m = Math.floor(seconds % 3600 / 60); const sec = seconds % 60; return h ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`; }
export default function RideScreen() {
  usePreferences();
  const app = useAppData();
  const { ride, paused, startRide, updateLocation, updateRideLean, finishRide } = app;
  const rideId = ride?.id;
  const { width } = useWindowDimensions();
  const sensor = useSensors(Boolean(ride) && !paused, app.calibration, app.crashSensitivity, app.crashDetectionEnabled);
  const [gps, setGps] = useState<'buscando' | 'listo' | 'sin permiso'>('buscando');
  const [backgroundLocation, setBackgroundLocation] = useState(false);
  const [seconds, setSeconds] = useState(ride?.durationSec ?? 0);
  const lastCrashAt = useRef(0);
  const finishing = useRef(false);
  const leanRef = useRef(0);
  const gForceRef = useRef(1);
  const lastLocationTimestamp = useRef(0);
  const speedAnchor = useRef<GpsFix | null>(null);
  const smoothedSpeed = useRef(0);
  useEffect(() => { if (paused) { speedAnchor.current = null; smoothedSpeed.current = 0; } }, [paused]);
  useEffect(() => { leanRef.current = sensor.leanAngle; }, [sensor.leanAngle]);
  useEffect(() => { gForceRef.current = sensor.accelerationMagnitude; }, [sensor.accelerationMagnitude]);
  useEffect(() => { if (!ride && !finishing.current) startRide(); }, [ride, startRide]);
  useEffect(() => {
    if (!rideId || paused) return;
    let subscription: Location.LocationSubscription | undefined;
    let mounted = true;
    (async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!mounted) return;
      if (permission.status !== 'granted') { setGps('sin permiso'); return; }
      setGps('buscando');
      const background = await Location.getBackgroundPermissionsAsync();
      if (background.status === 'granted') setBackgroundLocation(true);
      else Alert.alert('Registrar con pantalla bloqueada', 'MotoTracer puede continuar guardando la ruta si bloqueas el teléfono. Permite la ubicación en segundo plano para usar esa función.', [
        { text: 'Ahora no', style: 'cancel' },
        { text: 'Permitir', onPress: () => { void Location.requestBackgroundPermissionsAsync().then((result) => setBackgroundLocation(result.status === 'granted')).catch(() => setBackgroundLocation(false)); } },
      ]);
      subscription = await Location.watchPositionAsync({ accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1000, distanceInterval: 4 }, (location) => {
        if (location.timestamp <= lastLocationTimestamp.current) return;
        if (location.coords.accuracy != null && location.coords.accuracy > 80) return;
        const fix: GpsFix = { latitude: location.coords.latitude, longitude: location.coords.longitude, timestamp: location.timestamp, accuracy: location.coords.accuracy };
        const rawSpeed = speedFromFixes(fix, speedAnchor.current, location.coords.speed);
        if (!speedAnchor.current || (fix.timestamp - speedAnchor.current.timestamp >= 4000 && distanceMeters(speedAnchor.current, fix) >= 5)) speedAnchor.current = fix;
        smoothedSpeed.current = rawSpeed < 1 ? 0 : smoothedSpeed.current ? smoothedSpeed.current * .45 + rawSpeed * .55 : rawSpeed;
        lastLocationTimestamp.current = location.timestamp;
        setGps('listo');
        updateLocation({ latitude: fix.latitude, longitude: fix.longitude, timestamp: fix.timestamp, speed: Math.round(smoothedSpeed.current * 10) / 10, lean: leanRef.current, gForce: gForceRef.current, altitude: location.coords.altitude });
      });
    })().catch(() => mounted && setGps('sin permiso'));
    return () => { mounted = false; subscription?.remove(); };
  }, [rideId, paused, updateLocation]);
  useEffect(() => {
    if (!rideId || paused || !backgroundLocation) return;
    const handleAppState = async (state: string) => {
      if (state === 'background') {
        try {
          const started = await Location.hasStartedLocationUpdatesAsync(RIDE_LOCATION_TASK);
          if (!started) await Location.startLocationUpdatesAsync(RIDE_LOCATION_TASK, {
            accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1000, distanceInterval: 4,
            ...(Platform.OS === 'android' ? { foregroundService: { notificationTitle: 'MotoTracer está grabando', notificationBody: 'La ruta continúa registrándose mientras la pantalla está bloqueada.', notificationColor: '#FF5722' } } : {}),
          });
        } catch { /* A foreground GPS recording continues if the OS declines the background task. */ }
      } else if (state === 'active') {
        try {
          if (await Location.hasStartedLocationUpdatesAsync(RIDE_LOCATION_TASK)) await Location.stopLocationUpdatesAsync(RIDE_LOCATION_TASK);
          const queued = await takeBackgroundLocationQueue();
          for (const point of queued) if (point.timestamp > lastLocationTimestamp.current) { lastLocationTimestamp.current = point.timestamp; updateLocation(point); }
        } catch { /* Keep the foreground location watcher available. */ }
      }
    };
    const subscription = AppState.addEventListener('change', (state) => { void handleAppState(state); });
    if (AppState.currentState && AppState.currentState !== 'active') void handleAppState(AppState.currentState);
    return () => subscription.remove();
  }, [rideId, paused, backgroundLocation, updateLocation]);
  useEffect(() => {
    const baseDuration = ride?.durationSec ?? 0;
    const startedAt = Date.now();
    const id = setInterval(() => { setSeconds(baseDuration + (paused ? 0 : Math.floor((Date.now() - startedAt) / 1000))); }, 500);
    return () => clearInterval(id);
  }, [ride?.id, ride?.durationSec, paused]);
  useEffect(() => { updateRideLean(sensor.leanAngle); }, [sensor.leanAngle, updateRideLean]);
  useEffect(() => { if (ride && sensor.isCrashDetected && Date.now() - lastCrashAt.current > 60000) { lastCrashAt.current = Date.now(); router.push('/sos?crash=1'); } }, [ride, sensor.isCrashDetected]);
  const speed = ride?.coordinates.at(-1)?.speed ?? 0;
  const lean = sensor.leanAngle;
  const liveSegments = ride ? summarizeSegments(ride.coordinates, segmentLengthKm(ride.distanceKm)) : [];
  const currentSegment = liveSegments.at(-1);
  const stop = () => { finishing.current = true; finishRide(); router.replace('/analytics'); };
  if (!ride) return <Page><Text style={s.muted}>Preparando rodada…</Text></Page>;
  return <Page scroll={false}>
    <Header title="En ruta" subtitle={paused ? 'Rodada en pausa' : 'Lecturas en vivo'} right={<View style={{ borderWidth: 1, borderColor: gps === 'listo' ? Colors.gpsOptimal : Colors.warning, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 }}><Text style={{ color: gps === 'listo' ? Colors.gpsOptimal : Colors.warning, fontWeight: '800', fontSize: 10 }}>GPS {gps.toUpperCase()}</Text></View>} />
    <View style={[s.row, { gap: 8 }]}>{[{ l: 'TIEMPO', v: formatTime(seconds) }, { l: 'DISTANCIA', v: `${ride.distanceKm.toFixed(2)} km` }, { l: 'MÁXIMO', v: `${Math.round(ride.maxSpeed)} km/h` }].map((x) => <Card key={x.l} style={{ flex: 1, alignItems: 'center', paddingHorizontal: 7 }}><Label>{x.l}</Label><Text style={{ color: Colors.textPrimary, fontWeight: '800', fontSize: 15 }}>{x.v}</Text></Card>)}</View>
    <RouteMap coordinates={ride.coordinates} height={Math.min(150, width * .38)} follow />
    <View style={{ flex: 1, minHeight: 220, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
      <Speedometer speed={speed} size={Math.min(width * .53, 230)} />
      <View style={{ alignItems: 'center', gap: 0 }}><LeanGauge angle={lean} size={Math.min(width * .4, 168)} /><Text style={{ color: Colors.textTertiary, fontSize: 9, fontWeight: '800', letterSpacing: 1 }}>ÁNGULO DE INCLINACIÓN</Text></View>
    </View>
    <View style={[s.row, { gap: 8 }]}>{[{ label: 'VELOCIDAD PROM.', value: `${Math.round(ride.avgSpeed)} km/h` }, { label: 'INCLINACIÓN MÁX.', value: `${Math.max(Math.abs(ride.maxLeanLeft), ride.maxLeanRight).toFixed(0)}°` }, { label: 'ACELERACIÓN', value: `${sensor.accelerationMagnitude.toFixed(2)} G` }].map((x) => <Card key={x.label} style={{ flex: 1, alignItems: 'center', paddingHorizontal: 4 }}><Text style={{ color: Colors.textTertiary, fontSize: 8, fontWeight: '700', textAlign: 'center' }}>{x.label}</Text><Text style={{ color: Colors.activeTelemetry, fontSize: 15, fontWeight: '800' }}>{x.value}</Text></Card>)}</View>
    {currentSegment ? <Text style={{ color: Colors.textSecondary, fontSize: 11, textAlign: 'center' }}>Tramo {liveSegments.length}: {currentSegment.distanceKm.toFixed(1)} km · {Math.round(currentSegment.avgSpeed)} km/h prom. · {Math.round(currentSegment.maxSpeed)} km/h pico · {Math.max(Math.abs(currentSegment.maxLeanLeft), currentSegment.maxLeanRight).toFixed(0)}°</Text> : null}
    {gps === 'sin permiso' ? <Text style={{ color: Colors.warning, fontSize: 12, textAlign: 'center' }}>Ubicación desactivada: no se guardarán velocidad ni trazado GPS.</Text> : null}
    <Text style={{ color: Colors.textTertiary, fontSize: 10, textAlign: 'center' }}>Mantén presionado 2 segundos para pausar, pedir SOS o terminar.</Text>
    <View style={[s.row, { gap: 8 }]}><HoldAction label={paused ? 'CONTINUAR' : 'PAUSAR'} onComplete={app.pauseRide} color={Colors.activeTelemetry} /><HoldAction label="SOS" onComplete={() => router.push('/sos')} color={Colors.emergency} /><HoldAction label="TERMINAR" onComplete={stop} /></View>
  </Page>;
}
