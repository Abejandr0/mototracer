import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../theme';
import { Card, Header, Label, Page, screenStyles as s } from '../components/Screen';
import { Coordinate, Ride, useAppData } from '../providers/AppProvider';
import { RouteMap } from '../components/RouteMap';
import { supabase } from '../services/supabase';

export default function SharedRouteScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>(); const { startRide } = useAppData();
  const [ride, setRide] = useState<Ride | null>(null); const [owner, setOwner] = useState('Biker'); const [loading, setLoading] = useState(true);
  useEffect(() => { let active = true; (async () => {
    if (!supabase || !id || !/^[0-9a-f-]{36}$/i.test(id)) { if (active) setLoading(false); return; }
    const { data, error } = await supabase.from('rides').select('id,owner_id,title,started_at,ended_at,distance_km,duration_seconds,max_speed_kmh,average_speed_kmh,max_lean_left,max_lean_right').eq('id', id).eq('is_public', true).maybeSingle();
    if (error || !data) { if (active) setLoading(false); return; }
    const points: Coordinate[] = [];
    for (let offset = 0; ; offset += 1000) {
      const { data: batch, error: pointError } = await supabase.from('ride_points').select('latitude,longitude,recorded_at,speed_kmh,lean_degrees').eq('ride_id', id).order('sequence').range(offset, offset + 999);
      if (pointError || !batch) break;
      points.push(...batch.map((point) => ({ latitude: point.latitude, longitude: point.longitude, timestamp: Date.parse(point.recorded_at), speed: point.speed_kmh, lean: point.lean_degrees })));
      if (batch.length < 1000) break;
    }
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', data.owner_id).maybeSingle();
    if (active) { setOwner(profile?.full_name || 'Biker'); setRide({ id: data.id, title: data.title, startTime: data.started_at, endTime: data.ended_at ?? undefined, distanceKm: Number(data.distance_km), durationSec: data.duration_seconds, maxSpeed: Number(data.max_speed_kmh), avgSpeed: Number(data.average_speed_kmh), maxLeanLeft: Number(data.max_lean_left), maxLeanRight: Number(data.max_lean_right), coordinates: points, speedSamples: points.map((point) => point.speed), speedSum: 0, speedCount: points.length, pausedDurationMs: 0 }); setLoading(false); }
  })().catch(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [id]);
  return <Page><Header title="Ruta compartida" subtitle="MotoTracer · comunidad" /><Pressable onPress={() => router.back()}><Text style={{ color: Colors.activeTelemetry }}>‹ Volver</Text></Pressable>
    {loading ? <ActivityIndicator color={Colors.activeTelemetry} /> : !ride ? <Card><Text style={s.muted}>Esta ruta no existe o dejó de ser pública.</Text></Card> : <><Card><Text style={{ color: Colors.textPrimary, fontWeight: '900', fontSize: 24 }}>{ride.title}</Text><Text style={s.muted}>Por {owner} · {new Date(ride.startTime).toLocaleDateString('es-CO')}</Text><RouteMap coordinates={ride.coordinates} height={270} /><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 15 }}>{[{ label: 'DISTANCIA', value: `${ride.distanceKm.toFixed(1)} km` }, { label: 'TIEMPO', value: `${Math.round(ride.durationSec / 60)} min` }, { label: 'PROMEDIO', value: `${Math.round(ride.avgSpeed)} km/h` }, { label: 'MÁXIMA', value: `${Math.round(ride.maxSpeed)} km/h` }, { label: 'INCLINACIÓN', value: `${Math.max(Math.abs(ride.maxLeanLeft), ride.maxLeanRight).toFixed(0)}°` }].map((metric) => <View key={metric.label} style={{ width: '43%' }}><Label>{metric.label}</Label><Text style={{ color: Colors.textPrimary, fontSize: 21, fontWeight: '900' }}>{metric.value}</Text></View>)}</View></Card><Pressable onPress={() => Alert.alert('Repetir ruta', 'Usaremos esta rodada como referencia para comparar tus resultados.', [{ text: 'Cancelar' }, { text: 'Empezar', onPress: () => { startRide(undefined, ride); router.push('/ride'); } }])} style={s.action}><Text style={s.actionText}>CORRER Y COMPARAR</Text></Pressable></>}
  </Page>;
}
