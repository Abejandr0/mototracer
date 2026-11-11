import { Text } from '../../components/LocalizedText';
import { usePreferences } from '../../providers/PreferencesProvider';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../theme';
import { Card, Header, Label, Page, screenStyles as s } from '../../components/Screen';
import { Ride, useAppData } from '../../providers/AppProvider';
import { RouteMap } from '../../components/RouteMap';
import { useAuth } from '../../providers/AuthProvider';
import { supabase } from '../../services/supabase';
import { demoRoutes } from '../../data/demoRoutes';

type PublicRide = { id: string; owner_id: string; title: string; started_at: string; distance_km: number; duration_seconds: number; max_speed_kmh: number; average_speed_kmh: number; max_lean_left: number; max_lean_right: number; full_name: string; coordinates: { latitude: number; longitude: number; timestamp: number; speed: number; lean: number }[]; pointCount: number; likes: number; liked: boolean };

function trimPrivacyZones(points: Ride['coordinates'], privacy: boolean) {
  if (!privacy || points.length < 3) return points;
  const distance = (a: Ride['coordinates'][number], b: Ride['coordinates'][number]) => {
    const rad = (value: number) => value * Math.PI / 180;
    const dLat = rad(b.latitude - a.latitude), dLon = rad(b.longitude - a.longitude);
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  };
  let from = 0, to = points.length - 1, meters = 0;
  for (let index = 1; index < points.length; index++) { meters += distance(points[index - 1], points[index]) * 1000; if (meters >= 200) { from = index; break; } }
  meters = 0;
  for (let index = points.length - 2; index >= 0; index--) { meters += distance(points[index], points[index + 1]) * 1000; if (meters >= 200) { to = index; break; } }
  return from < to ? points.slice(from, to + 1) : [];
}

export default function RoutesScreen() {
  const { t } = usePreferences();
  const { rides, startRide } = useAppData();
  const { session, configured } = useAuth();
  const [feed, setFeed] = useState<PublicRide[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [busyRide, setBusyRide] = useState<string | null>(null);
  const [privacyZones, setPrivacyZones] = useState(true);
  const refreshFeed = useCallback(async () => {
    if (!supabase || !session) { setFeed([]); return; }
    setFeedLoading(true);
    const { data, error } = await supabase.from('rides').select('id,owner_id,title,started_at,distance_km,duration_seconds,max_speed_kmh,average_speed_kmh,max_lean_left,max_lean_right,ride_likes(user_id),ride_points(sequence,latitude,longitude,recorded_at,speed_kmh,lean_degrees,g_force,altitude_m)').eq('is_public', true).order('created_at', { ascending: false }).limit(30);
    if (error) { setFeedLoading(false); return; }
    const owners = [...new Set((data ?? []).map((ride) => ride.owner_id))];
    const { data: profiles } = owners.length ? await supabase.from('profiles').select('id,full_name').in('id', owners) : { data: [] };
    const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name]));
    setFeed((data ?? []).map((ride) => {
      const likes = Array.isArray(ride.ride_likes) ? ride.ride_likes : [];
      const points = Array.isArray(ride.ride_points) ? [...ride.ride_points].sort((a, b) => a.sequence - b.sequence) : [];
      return { id: ride.id, owner_id: ride.owner_id, title: ride.title, started_at: ride.started_at, distance_km: Number(ride.distance_km), duration_seconds: ride.duration_seconds, max_speed_kmh: Number(ride.max_speed_kmh), average_speed_kmh: Number(ride.average_speed_kmh), max_lean_left: Number(ride.max_lean_left), max_lean_right: Number(ride.max_lean_right), full_name: profileMap.get(ride.owner_id) || 'Biker', coordinates: points.map((point) => ({ latitude: point.latitude, longitude: point.longitude, timestamp: Date.parse(point.recorded_at), speed: point.speed_kmh, lean: point.lean_degrees, gForce: point.g_force ?? undefined, altitude: point.altitude_m })), pointCount: points.length, likes: likes.length, liked: likes.some((like) => like.user_id === session.user.id) };
    }));
    setFeedLoading(false);
  }, [session]);
  useEffect(() => { const timer = setTimeout(() => { void refreshFeed(); }, 0); return () => clearTimeout(timer); }, [refreshFeed]);
  const publish = async (ride: Ride) => {
    if (!supabase || !session) { Alert.alert('Sin conexión con tu cuenta', 'Vuelve a iniciar sesión e inténtalo de nuevo.'); return; }
    setBusyRide(ride.id);
    let insertedId: string | undefined;
    try {
      let remoteId = ride.remoteId;
      if (!remoteId) {
        const { data, error } = await supabase.from('rides').insert({ owner_id: session.user.id, title: ride.title, started_at: ride.startTime, ended_at: ride.endTime ?? null, distance_km: ride.distanceKm, duration_seconds: ride.durationSec, max_speed_kmh: ride.maxSpeed, average_speed_kmh: ride.avgSpeed, max_lean_left: ride.maxLeanLeft, max_lean_right: ride.maxLeanRight, is_public: true }).select('id').single();
        if (error) throw error;
        remoteId = data.id;
        insertedId = remoteId;
        const sharedCoordinates = trimPrivacyZones(ride.coordinates, privacyZones);
        for (let start = 0; start < sharedCoordinates.length; start += 500) {
          const points = sharedCoordinates.slice(start, start + 500).map((point, index) => ({ ride_id: remoteId!, owner_id: session.user.id, sequence: start + index, latitude: point.latitude, longitude: point.longitude, recorded_at: new Date(point.timestamp).toISOString(), speed_kmh: point.speed, lean_degrees: point.lean, g_force: point.gForce ?? null, altitude_m: point.altitude ?? null }));
          if (points.length) { const { error: pointsError } = await supabase.from('ride_points').insert(points); if (pointsError) throw pointsError; }
        }
      } else {
        const nextVisibility = !ride.isPublic;
        const { error } = await supabase.from('rides').update({ is_public: nextVisibility }).eq('id', remoteId).eq('owner_id', session.user.id);
        if (error) throw error;
        app.linkRemoteRide(ride.id, remoteId, nextVisibility);
        await refreshFeed();
        Alert.alert(nextVisibility ? 'Ruta publicada' : 'Ruta retirada', nextVisibility ? 'Ya aparece en el feed de la comunidad.' : 'Ya no aparece en el feed público.');
        return;
      }
      if (remoteId) app.linkRemoteRide(ride.id, remoteId, true);
      await refreshFeed();
      Alert.alert('Ruta publicada', 'Ya aparece en el feed de la comunidad.');
    } catch (error) {
      if (insertedId) await supabase.from('rides').delete().eq('id', insertedId).eq('owner_id', session.user.id);
      Alert.alert('No se pudo publicar', error instanceof Error ? error.message : 'Intenta de nuevo.');
    }
    finally { setBusyRide(null); }
  };
  const toggleLike = async (ride: PublicRide) => {
    if (!supabase || !session) return;
    const { error } = ride.liked
      ? await supabase.from('ride_likes').delete().eq('ride_id', ride.id).eq('user_id', session.user.id)
      : await supabase.from('ride_likes').insert({ ride_id: ride.id, user_id: session.user.id });
    if (error) Alert.alert('No se pudo actualizar el me gusta', error.message);
    else setFeed((items) => items.map((item) => item.id === ride.id ? { ...item, liked: !ride.liked, likes: item.likes + (ride.liked ? -1 : 1) } : item));
  };
  const app = useAppData();
  return <Page>
    <Header title="Rutas" subtitle="Tus rodadas y las que compartes." />
    <Pressable onPress={() => router.push('/ride')} style={s.action}><Text style={s.actionText}>＋   {t('GRABAR UNA RUTA')}</Text></Pressable>
    <Card style={{ borderColor: 'rgba(0,229,255,.3)' }}><Label>COMUNIDAD</Label><Text style={{ color: Colors.textPrimary, fontSize: 18, fontWeight: '800' }}>{t('Rutas de otros bikers')}</Text><Text style={s.muted}>{!configured ? 'Configura Supabase para activar el feed y la sincronización.' : feedLoading ? 'Cargando rutas compartidas…' : `${feed.length} rutas compartidas`}</Text><Pressable onPress={() => setPrivacyZones((value) => !value)} style={[s.row, { justifyContent: 'flex-start', gap: 8, marginTop: 8 }]}><Text style={{ color: privacyZones ? Colors.gpsOptimal : Colors.textSecondary, fontWeight: '900' }}>{privacyZones ? '✓' : '○'}</Text><Text style={s.muted}>Ocultar los primeros y últimos 200 m al publicar</Text></Pressable></Card>
    {demoRoutes.map(({ ride, name, initials, city }) => <Card key={ride.id} style={{ borderColor: '#315057' }}><View style={[s.row, { justifyContent: 'flex-start', gap: 10 }]}><View style={{ width: 39, height: 39, borderRadius: 20, backgroundColor: '#183D43', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: Colors.activeTelemetry, fontWeight: '900' }}>{initials}</Text></View><View style={{ flex: 1 }}><Text style={{ color: Colors.textPrimary, fontWeight: '800' }}>{name}</Text><Text style={s.muted}>{city} · ruta de demostración</Text></View><Text style={{ color: Colors.warning, fontSize: 10, fontWeight: '900' }}>DEMO</Text></View><Text style={{ color: Colors.textPrimary, fontSize: 19, fontWeight: '900' }}>{ride.title}</Text><RouteMap coordinates={ride.coordinates} height={135} /><Text style={{ color: Colors.textTertiary, fontSize: 10 }}>Trazado ilustrativo · © OpenStreetMap contributors</Text><View style={[s.row, { flexWrap: 'wrap', gap: 8 }]}><Text style={{ color: Colors.activeTelemetry, fontWeight: '800' }}>{ride.distanceKm.toFixed(1)} km</Text><Text style={s.muted}>{Math.round(ride.avgSpeed)} km/h prom.</Text><Text style={s.muted}>{Math.round(ride.maxSpeed)} km/h máx.</Text><Text style={s.muted}>{Math.round(ride.maxLeanRight)}°</Text><Text style={s.muted}>{Math.round(ride.durationSec / 60)} min</Text></View><Pressable onPress={() => Alert.alert('Repetir ruta de ejemplo', 'Esta ruta simulada se usará como referencia para comparar tus resultados.', [{ text: 'Cancelar' }, { text: 'Empezar', onPress: () => { startRide(undefined, ride); router.push('/ride'); } }])} style={s.secondary}><Text style={s.secondaryText}>Correr y comparar esta ruta</Text></Pressable></Card>)}
    {feed.map((ride) => <Card key={ride.id}><View style={s.row}><View style={{ flex: 1 }}><Text style={{ color: Colors.textPrimary, fontSize: 16, fontWeight: '800' }}>{ride.title}</Text><Text style={s.muted}>{ride.full_name} · {new Date(ride.started_at).toLocaleDateString('es-CO')}</Text></View><Pressable onPress={() => void toggleLike(ride)}><Text style={{ color: ride.liked ? Colors.emergency : Colors.textSecondary, fontSize: 18 }}>♥ {ride.likes}</Text></Pressable></View><RouteMap coordinates={ride.coordinates} height={115} /><View style={[s.row, { justifyContent: 'flex-start', flexWrap: 'wrap', gap: 12 }]}><Text style={{ color: Colors.activeTelemetry, fontWeight: '800' }}>{ride.distance_km.toFixed(1)} km</Text><Text style={s.muted}>{Math.round(ride.average_speed_kmh)} km/h prom.</Text><Text style={s.muted}>{Math.round(ride.max_speed_kmh)} km/h máx.</Text><Text style={s.muted}>{Math.max(Math.abs(ride.max_lean_left), ride.max_lean_right).toFixed(0)}°</Text><Text style={s.muted}>{Math.round(ride.duration_seconds / 60)} min</Text></View><Pressable onPress={() => { const reference: Ride = { id: ride.id, title: ride.title, startTime: ride.started_at, distanceKm: ride.distance_km, durationSec: ride.duration_seconds, avgSpeed: ride.average_speed_kmh, maxSpeed: ride.max_speed_kmh, maxLeanLeft: ride.max_lean_left, maxLeanRight: ride.max_lean_right, coordinates: ride.coordinates, speedSamples: ride.coordinates.map((point) => point.speed), speedSum: 0, speedCount: 0, pausedDurationMs: 0 }; startRide(undefined, reference); router.push('/ride'); }} style={s.secondary}><Text style={s.secondaryText}>Correr y comparar esta ruta</Text></Pressable></Card>)}
    <Label>MI HISTORIAL  ·  {rides.length}</Label>
    {rides.length === 0 ? <Card><Text style={{ color: Colors.textPrimary, fontSize: 16, fontWeight: '700' }}>Todavía no hay rutas</Text><Text style={s.muted}>Al finalizar una rodada se guardará aquí con sus estadísticas GPS.</Text></Card> : rides.map((ride) => <Card key={ride.id}>
      <View style={s.row}><View style={{ flex: 1 }}><Text style={{ color: Colors.textPrimary, fontSize: 17, fontWeight: '800' }}>{ride.title}</Text><Text style={s.muted}>{new Date(ride.startTime).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}</Text></View></View>
      <View style={[s.row, { justifyContent: 'flex-start', gap: 20, paddingVertical: 5 }]}><View><Label>Distancia</Label><Text style={{ color: Colors.activeTelemetry, fontWeight: '900', fontSize: 21 }}>{ride.distanceKm.toFixed(1)} km</Text></View><View><Label>Promedio</Label><Text style={{ color: Colors.textPrimary, fontWeight: '800', fontSize: 17 }}>{Math.round(ride.avgSpeed)} km/h</Text></View><View><Label>Inclinación</Label><Text style={{ color: Colors.textPrimary, fontWeight: '800', fontSize: 17 }}>{Math.max(Math.abs(ride.maxLeanLeft), ride.maxLeanRight).toFixed(0)}°</Text></View></View>
      <RouteMap coordinates={ride.coordinates} height={96} />
      <Text style={{ color: Colors.textTertiary, fontSize: 10 }}>TRAZADO GPS  ·  {ride.coordinates.length} puntos</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}><Pressable style={[s.secondary, { flex: 1 }]} onPress={() => router.push({ pathname: '/share-ride', params: { rideId: ride.id } })}><Text style={s.secondaryText}>Compartir</Text></Pressable><Pressable disabled={busyRide === ride.id} style={[s.secondary, { flex: 1 }]} onPress={() => void publish(ride)}><Text style={s.secondaryText}>{busyRide === ride.id ? 'Actualizando…' : ride.remoteId ? ride.isPublic ? 'Retirar del feed' : 'Publicar ruta' : 'Publicar ruta'}</Text></Pressable><Pressable style={[s.secondary, { flex: 1 }]} onPress={() => Alert.alert('Repetir ruta', 'Se guardará esta ruta como referencia para comparar métricas.', [{ text: 'Ahora no', style: 'cancel' }, { text: 'Iniciar', onPress: () => { startRide(ride.id); router.push('/ride'); } }])}><Text style={s.secondaryText}>Correr ruta</Text></Pressable></View>
      <Pressable onPress={() => router.push({ pathname: '/analytics', params: { rideId: ride.id } })}><Text style={{ color: Colors.activeTelemetry, fontWeight: '700', textAlign: 'center', paddingVertical: 4 }}>Ver estadísticas completas  ›</Text></Pressable>
    </Card>)}
  </Page>;
}
