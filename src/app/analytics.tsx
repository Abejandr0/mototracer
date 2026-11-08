import React, { useState } from 'react';
import { Modal, Pressable, Share, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors } from '../theme';
import { Card, Header, Label, Page, screenStyles as s } from '../components/Screen';
import { Ride, useAppData } from '../providers/AppProvider';
import { RouteMap } from '../components/RouteMap';

function segmentSummary(ride: Ride) {
  const chunks: { distance: number; speeds: number[]; maxLean: number; start: number; end: number }[] = [];
  let current = { distance: 0, speeds: [] as number[], maxLean: 0, start: ride.coordinates[0]?.timestamp ?? 0, end: 0 };
  let previous = ride.coordinates[0];
  for (const point of ride.coordinates.slice(1)) {
    if (previous) {
      const rad = (value: number) => value * Math.PI / 180;
      const dLat = rad(point.latitude - previous.latitude), dLon = rad(point.longitude - previous.longitude);
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(previous.latitude)) * Math.cos(rad(point.latitude)) * Math.sin(dLon / 2) ** 2;
      current.distance += 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
    current.speeds.push(point.speed); current.maxLean = Math.max(current.maxLean, Math.abs(point.lean)); current.end = point.timestamp;
    if (current.distance >= 5) { chunks.push(current); current = { distance: 0, speeds: [], maxLean: 0, start: point.timestamp, end: point.timestamp }; }
    previous = point;
  }
  if (current.speeds.length && current.distance >= 0.5) chunks.push(current);
  return chunks;
}

export default function AnalyticsScreen() {
  const { rideId } = useLocalSearchParams<{ rideId?: string }>();
  const { rides, renameRide } = useAppData();
  const [editing, setEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const ride = rides.find((item) => item.id === rideId) ?? rides[0];
  if (!ride) return <Page><Header title="Estadísticas" subtitle="Termina una rodada para ver tus datos." /><Card><Text style={s.muted}>Todavía no hay una ruta guardada.</Text><Pressable onPress={() => router.replace('/ride')} style={s.action}><Text style={s.actionText}>INICIAR RODADA</Text></Pressable></Card></Page>;
  const max = Math.max(...ride.speedSamples, 1);
  const chart = ride.speedSamples.filter((_, i) => i % Math.max(1, Math.floor(ride.speedSamples.length / 36)) === 0).slice(0, 36);
  const segments = segmentSummary(ride);
  const share = () => Share.share({ message: `${ride.title}\n${ride.distanceKm.toFixed(1)} km · ${Math.round(ride.avgSpeed)} km/h promedio · ${Math.round(ride.maxSpeed)} km/h máximo · ${ride.durationSec} s` });
  return <Page>
    <Header title="Estadísticas" subtitle={new Date(ride.startTime).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })} />
    <Card style={{ backgroundColor: '#111A20' }}><View style={[s.row, { alignItems: 'flex-start' }]}><View><Label>RESUMEN DE RUTA</Label><Text style={{ color: Colors.textPrimary, fontSize: 19, fontWeight: '800', marginTop: 5 }}>{ride.title}</Text></View><Pressable onPress={() => { setTitleDraft(ride.title); setEditing(true); }}><Text style={{ color: Colors.activeTelemetry, fontWeight: '700', fontSize: 12 }}>Editar</Text></Pressable></View>
      <RouteMap coordinates={ride.coordinates} height={140} />
      <View style={[s.row, { paddingTop: 4 }]}><View><Label>DISTANCIA</Label><Text style={{ color: Colors.activeTelemetry, fontSize: 23, fontWeight: '900' }}>{ride.distanceKm.toFixed(2)} km</Text></View><View><Label>DURACIÓN</Label><Text style={{ color: Colors.textPrimary, fontSize: 20, fontWeight: '800' }}>{Math.floor(ride.durationSec / 60)}:{String(ride.durationSec % 60).padStart(2, '0')}</Text></View></View>
    </Card>
    <Label>PERFIL DE VELOCIDAD</Label>
    <Card><View style={{ height: 76, flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>{chart.map((v, i) => <View key={i} style={{ flex: 1, height: `${Math.max(4, v / max * 100)}%`, backgroundColor: v > ride.avgSpeed ? Colors.primaryAction : Colors.activeTelemetry, borderTopLeftRadius: 2, borderTopRightRadius: 2, opacity: .85 }} />)}</View><View style={s.row}><Text style={s.muted}>0 km/h</Text><Text style={s.muted}>Máx. {Math.round(ride.maxSpeed)} km/h</Text></View></Card>
    <Label>SEGMENTOS DE 5 KM</Label>
    <Card>{segments.length ? segments.map((segment, index) => <View key={index} style={[s.row, { borderBottomWidth: index === segments.length - 1 ? 0 : 1, borderBottomColor: Colors.border, paddingVertical: 8 }]}><View><Text style={{ color: Colors.textPrimary, fontWeight: '800' }}>Tramo {String(index + 1).padStart(2, '0')}</Text><Text style={s.muted}>{segment.distance.toFixed(1)} km · {Math.max(0, Math.round((segment.end - segment.start) / 1000))} s</Text></View><View style={{ alignItems: 'flex-end' }}><Text style={{ color: Colors.activeTelemetry, fontWeight: '800' }}>{Math.round(segment.speeds.reduce((sum, value) => sum + value, 0) / segment.speeds.length)} km/h prom.</Text><Text style={s.muted}>Pico {Math.round(Math.max(...segment.speeds))} · {segment.maxLean.toFixed(0)}°</Text></View></View>) : <Text style={s.muted}>Se necesitan al menos 500 m registrados por GPS para calcular tramos.</Text>}</Card>
    <View style={[s.row, { flexWrap: 'wrap', gap: 9 }]}>{[{ label: 'VELOCIDAD MEDIA', value: `${Math.round(ride.avgSpeed)} km/h` }, { label: 'VELOCIDAD MÁXIMA', value: `${Math.round(ride.maxSpeed)} km/h` }, { label: 'INCLINACIÓN IZQ.', value: `${Math.abs(ride.maxLeanLeft).toFixed(0)}°` }, { label: 'INCLINACIÓN DER.', value: `${ride.maxLeanRight.toFixed(0)}°` }].map((item) => <Card key={item.label} style={{ width: '48%' }}><Label>{item.label}</Label><Text style={{ color: Colors.textPrimary, fontSize: 19, fontWeight: '800' }}>{item.value}</Text></Card>)}</View>
    <View style={[s.row, { gap: 8 }]}><Pressable onPress={share} style={[s.secondary, { flex: 1 }]}><Text style={s.secondaryText}>Compartir</Text></Pressable><Pressable onPress={() => router.replace('/ride')} style={[s.action, { flex: 1 }]}><Text style={s.actionText}>REPETIR RUTA</Text></Pressable></View>
    <Pressable onPress={() => router.replace('/(tabs)/routes')}><Text style={{ color: Colors.textSecondary, textAlign: 'center', padding: 8 }}>Volver a rutas</Text></Pressable>
    <Modal transparent visible={editing} animationType="slide" onRequestClose={() => setEditing(false)}><View style={{ flex: 1, backgroundColor: '#0009', justifyContent: 'flex-end' }}><View style={{ backgroundColor: Colors.card, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 22, gap: 12 }}><Text style={{ color: Colors.textPrimary, fontSize: 20, fontWeight: '800' }}>Nombre de la ruta</Text><TextInput value={titleDraft} onChangeText={setTitleDraft} placeholder="Ej. Vuelta al embalse" placeholderTextColor={Colors.textTertiary} style={{ color: Colors.textPrimary, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingVertical: 10 }} /><Pressable onPress={() => { if (titleDraft.trim()) renameRide(ride.id, titleDraft.trim()); setEditing(false); }} style={s.action}><Text style={s.actionText}>GUARDAR TÍTULO</Text></Pressable><Pressable onPress={() => setEditing(false)}><Text style={{ color: Colors.textSecondary, textAlign: 'center', padding: 8 }}>Cancelar</Text></Pressable></View></View></Modal>
  </Page>;
}
