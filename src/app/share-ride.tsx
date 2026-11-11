import React, { useRef } from 'react';
import { Alert, Pressable, Share, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import Svg, { Polyline } from 'react-native-svg';
import { Colors } from '../theme';
import { Header, Page, screenStyles as s } from '../components/Screen';
import { useAppData } from '../providers/AppProvider';

export default function ShareRideScreen() {
  const { rideId } = useLocalSearchParams<{ rideId?: string }>();
  const { rides, riderName } = useAppData();
  const ride = rides.find((entry) => entry.id === rideId); const card = useRef<React.ElementRef<typeof View>>(null);
  if (!ride) return <Page><Header title="Compartir rodada" /><Text style={s.muted}>No encontramos esta ruta.</Text></Page>;
  const lats = ride.coordinates.map((point) => point.latitude), lons = ride.coordinates.map((point) => point.longitude);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats), minLon = Math.min(...lons), maxLon = Math.max(...lons);
  const points = ride.coordinates.map((point) => `${20 + (point.longitude - minLon) / Math.max(maxLon - minLon, .00001) * 320},${20 + (1 - (point.latitude - minLat) / Math.max(maxLat - minLat, .00001)) * 190}`).join(' ');
  const shareText = () => Share.share({ message: `${ride.title}\n${ride.distanceKm.toFixed(1)} km · ${Math.round(ride.avgSpeed)} km/h promedio · ${Math.round(ride.maxSpeed)} km/h máximo · ${Math.round(ride.durationSec / 60)} min · ${Math.max(Math.abs(ride.maxLeanLeft), ride.maxLeanRight).toFixed(0)}° de inclinación\nRegistrado con MotoTracer${ride.remoteId && ride.isPublic ? `\nAbrir la ruta en la app: mototracer://shared-route?id=${ride.remoteId}` : ''}` });
  const exportImage = async () => { try { if (!card.current) return; const uri = await captureRef(card.current, { format: 'png', quality: 1, result: 'tmpfile' }); if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Exportar imagen de la rodada' }); else Alert.alert('No disponible', 'No se pudo abrir la hoja para compartir.'); } catch (error) { Alert.alert('No se pudo generar la imagen', error instanceof Error ? error.message : 'Intenta de nuevo.'); } };
  return <Page><Header title="Compartir rodada" subtitle="Vista previa de lo que verán tus amigos" /><Pressable onPress={() => router.back()}><Text style={{ color: Colors.activeTelemetry }}>‹ Volver</Text></Pressable>
    <View ref={card} collapsable={false} style={{ backgroundColor: '#111C22', borderRadius: 22, padding: 24, gap: 20, borderWidth: 1, borderColor: '#295E68' }}><View style={s.row}><Text style={{ color: Colors.activeTelemetry, fontSize: 11, fontWeight: '900', letterSpacing: 2 }}>MOTOTRACER</Text><Text style={{ color: Colors.textSecondary, fontSize: 12 }}>{new Date(ride.startTime).toLocaleDateString('es-CO')}</Text></View><View><Text style={{ color: Colors.textPrimary, fontSize: 28, fontWeight: '900' }}>{ride.title}</Text><Text style={{ color: Colors.textSecondary, marginTop: 5 }}>Rodada de {riderName}</Text></View>
      <View style={{ height: 230, backgroundColor: '#15262C', borderRadius: 15, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}><Svg width="100%" height="100%" viewBox="0 0 360 230"><Polyline points={points} stroke={Colors.activeTelemetry} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" /></Svg></View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 18 }}>{[{ label: 'DISTANCIA', value: `${ride.distanceKm.toFixed(1)} km` }, { label: 'TIEMPO', value: `${Math.round(ride.durationSec / 60)} min` }, { label: 'PROMEDIO', value: `${Math.round(ride.avgSpeed)} km/h` }, { label: 'MÁXIMA', value: `${Math.round(ride.maxSpeed)} km/h` }, { label: 'INCLINACIÓN', value: `${Math.max(Math.abs(ride.maxLeanLeft), ride.maxLeanRight).toFixed(0)}°` }].map((metric) => <View key={metric.label} style={{ width: '44%' }}><Text style={{ color: Colors.textTertiary, fontSize: 10, fontWeight: '800' }}>{metric.label}</Text><Text style={{ color: Colors.textPrimary, fontSize: 22, fontWeight: '900' }}>{metric.value}</Text></View>)}</View><Text style={{ color: Colors.textTertiary, fontSize: 10, textAlign: 'center' }}>Datos GPS y sensores del teléfono · MotoTracer</Text></View>
    <Pressable onPress={() => void shareText()} style={s.secondary}><Text style={s.secondaryText}>{ride.remoteId && ride.isPublic ? 'COMPARTIR ENLACE Y DATOS' : 'COMPARTIR DATOS'}</Text></Pressable>{ride.remoteId && ride.isPublic ? <Text style={s.muted}>El enlace abre la ruta en MotoTracer para personas con la app y una cuenta.</Text> : <Text style={s.muted}>Publica la ruta en la comunidad para incluir un enlace interactivo. También puedes compartir la imagen sin publicarla.</Text>}<Pressable onPress={() => void exportImage()} style={s.action}><Text style={s.actionText}>EXPORTAR IMAGEN PNG</Text></Pressable>
  </Page>;
}
