import React, { useState } from 'react';
import { Alert, Pressable, Share, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../theme';
import { Card, Header, Label, Page, screenStyles as s } from '../../components/Screen';
import { Ride, useAppData } from '../../providers/AppProvider';
import { RouteMap } from '../../components/RouteMap';

function routeCopy(ride: Ride) {
  return `${ride.title}\n${ride.distanceKm.toFixed(1)} km · ${Math.round(ride.avgSpeed)} km/h promedio · ${Math.round(ride.maxSpeed)} km/h máximo\n${ride.durationSec} s · MotoTracer`;
}
export default function RoutesScreen() {
  const { rides, startRide } = useAppData();
  const [liked, setLiked] = useState<string[]>([]);
  return <Page>
    <Header title="Rutas" subtitle="Tus rodadas y las que compartes." />
    <Pressable onPress={() => router.push('/ride')} style={s.action}><Text style={s.actionText}>＋   GRABAR UNA RUTA</Text></Pressable>
    <Card style={{ borderColor: 'rgba(0,229,255,.3)' }}><Label>COMUNIDAD</Label><Text style={{ color: Colors.textPrimary, fontSize: 18, fontWeight: '800' }}>Comparte tus rodadas</Text><Text style={s.muted}>Comparte distancia, tiempos y estadísticas con otras apps. El feed entre usuarios se habilita al conectar el backend.</Text></Card>
    <Label>MI HISTORIAL  ·  {rides.length}</Label>
    {rides.length === 0 ? <Card><Text style={{ color: Colors.textPrimary, fontSize: 16, fontWeight: '700' }}>Todavía no hay rutas</Text><Text style={s.muted}>Al finalizar una rodada se guardará aquí con sus estadísticas GPS.</Text></Card> : rides.map((ride) => <Card key={ride.id}>
      <View style={s.row}><View style={{ flex: 1 }}><Text style={{ color: Colors.textPrimary, fontSize: 17, fontWeight: '800' }}>{ride.title}</Text><Text style={s.muted}>{new Date(ride.startTime).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}</Text></View><Pressable onPress={() => setLiked((v) => v.includes(ride.id) ? v.filter((id) => id !== ride.id) : [...v, ride.id])}><Text style={{ color: liked.includes(ride.id) ? Colors.emergency : Colors.textSecondary, fontSize: 18 }}>♥</Text></Pressable></View>
      <View style={[s.row, { justifyContent: 'flex-start', gap: 20, paddingVertical: 5 }]}><View><Label>Distancia</Label><Text style={{ color: Colors.activeTelemetry, fontWeight: '900', fontSize: 21 }}>{ride.distanceKm.toFixed(1)} km</Text></View><View><Label>Promedio</Label><Text style={{ color: Colors.textPrimary, fontWeight: '800', fontSize: 17 }}>{Math.round(ride.avgSpeed)} km/h</Text></View><View><Label>Inclinación</Label><Text style={{ color: Colors.textPrimary, fontWeight: '800', fontSize: 17 }}>{Math.max(Math.abs(ride.maxLeanLeft), ride.maxLeanRight).toFixed(0)}°</Text></View></View>
      <RouteMap coordinates={ride.coordinates} height={96} />
      <Text style={{ color: Colors.textTertiary, fontSize: 10 }}>TRAZADO GPS  ·  {ride.coordinates.length} puntos</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}><Pressable style={[s.secondary, { flex: 1 }]} onPress={() => Share.share({ message: routeCopy(ride) })}><Text style={s.secondaryText}>Compartir</Text></Pressable><Pressable style={[s.secondary, { flex: 1 }]} onPress={() => Alert.alert('Repetir ruta', 'Inicia una nueva rodada para comparar tus resultados después.', [{ text: 'Ahora no', style: 'cancel' }, { text: 'Iniciar', onPress: () => { startRide(); router.push('/ride'); } }])}><Text style={s.secondaryText}>Repetir ruta</Text></Pressable></View>
      <Pressable onPress={() => router.push({ pathname: '/analytics', params: { rideId: ride.id } })}><Text style={{ color: Colors.activeTelemetry, fontWeight: '700', textAlign: 'center', paddingVertical: 4 }}>Ver estadísticas completas  ›</Text></Pressable>
    </Card>)}
  </Page>;
}
