import { usePreferences } from '../providers/PreferencesProvider';
import React, { useState } from 'react';
import { Alert, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors } from '../theme';
import { Card, Header, Label, Page, screenStyles as s } from '../components/Screen';
import { useAppData } from '../providers/AppProvider';
import { RouteMap } from '../components/RouteMap';
import { segmentLengthKm, summarizeRide, summarizeSegments } from '../services/rideStats';

type ChartMetric = 'speed' | 'lean' | 'gforce' | 'braking';

export default function AnalyticsScreen() {
  usePreferences();
  const { rideId } = useLocalSearchParams<{ rideId?: string }>();
  const { rides, renameRide, startRide } = useAppData();
  const [editing, setEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [chartMetric, setChartMetric] = useState<ChartMetric>('speed');
  const ride = rides.find((item) => item.id === rideId) ?? rides[0];
  if (!ride) return <Page><Header title="Estadísticas" subtitle="Termina una rodada para ver tus datos." /><Card><Text style={s.muted}>Todavía no hay una ruta guardada.</Text><Pressable onPress={() => router.replace('/ride')} style={s.action}><Text style={s.actionText}>INICIAR RODADA</Text></Pressable></Card></Page>;
  const coordinateSeries = ride.coordinates.map((point, index) => {
    if (chartMetric === 'lean') return Math.abs(point.lean);
    if (chartMetric === 'gforce') return point.gForce ?? 0;
    if (chartMetric === 'braking') return index ? Math.max(0, ride.coordinates[index - 1].speed - point.speed) : 0;
    return point.speed;
  });
  const values = coordinateSeries.length ? coordinateSeries : ride.speedSamples;
  const sampleStep = Math.max(1, Math.floor(values.length / 36));
  const chart = values.filter((_, i) => i % sampleStep === 0).slice(0, 36);
  const max = Math.max(...chart, 1);
  const chartName: Record<ChartMetric, string> = { speed: 'Velocidad', lean: 'Inclinación', gforce: 'Aceleración G', braking: 'Frenado' };
  const chartUnit: Record<ChartMetric, string> = { speed: 'km/h', lean: '°', gforce: 'G', braking: 'km/h por muestra' };
  const totals = summarizeRide(ride);
  const segmentKm = segmentLengthKm(ride.distanceKm);
  const segments = summarizeSegments(ride.coordinates, segmentKm);
  const comparison = ride.comparisonSnapshot ?? (ride.comparisonRideId ? rides.find((item) => item.id === ride.comparisonRideId) : undefined);
  const repeat = () => { startRide(ride.id); router.replace('/ride'); };
  const share = () => router.push({ pathname: '/share-ride', params: { rideId: ride.id } });
  const exportGpx = async () => {
    if (ride.coordinates.length < 2) { Alert.alert('Ruta incompleta', 'Se necesitan dos puntos GPS como mínimo para exportar.'); return; }
    try {
      const escape = (value: string) => value.replace(/[<>&'\"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[char]!));
      const points = ride.coordinates.map((point) => `<trkpt lat="${point.latitude}" lon="${point.longitude}">${point.altitude == null ? '' : `<ele>${point.altitude}</ele>`}<time>${new Date(point.timestamp).toISOString()}</time></trkpt>`).join('');
      const gpx = `<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="MotoTracer" xmlns="http://www.topografix.com/GPX/1/1"><trk><name>${escape(ride.title)}</name><trkseg>${points}</trkseg></trk></gpx>`;
      const file = new File(Paths.cache, `mototracer-${ride.id}.gpx`);
      await file.create({ overwrite: true, intermediates: true });
      await file.write(gpx);
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: 'application/gpx+xml', dialogTitle: 'Exportar ruta GPX' });
      else Alert.alert('Compartir no disponible', 'No se pudo abrir la hoja para compartir el archivo.');
    } catch (error) { Alert.alert('No se pudo exportar la ruta', error instanceof Error ? error.message : 'Intenta de nuevo.'); }
  };
  return <Page>
    <Header title="Estadísticas" subtitle={new Date(ride.startTime).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })} />
    <Card style={{ backgroundColor: '#111A20' }}><View style={[s.row, { alignItems: 'flex-start' }]}><View><Label>RESUMEN DE RUTA</Label><Text style={{ color: Colors.textPrimary, fontSize: 19, fontWeight: '800', marginTop: 5 }}>{ride.title}</Text></View><Pressable onPress={() => { setTitleDraft(ride.title); setEditing(true); }}><Text style={{ color: Colors.activeTelemetry, fontWeight: '700', fontSize: 12 }}>Editar</Text></Pressable></View>
      <RouteMap coordinates={ride.coordinates} height={140} />
      <View style={[s.row, { paddingTop: 4 }]}><View><Label>DISTANCIA</Label><Text style={{ color: Colors.activeTelemetry, fontSize: 23, fontWeight: '900' }}>{ride.distanceKm.toFixed(2)} km</Text></View><View><Label>DURACIÓN</Label><Text style={{ color: Colors.textPrimary, fontSize: 20, fontWeight: '800' }}>{Math.floor(ride.durationSec / 60)}:{String(ride.durationSec % 60).padStart(2, '0')}</Text></View></View>
    </Card>
    {comparison ? <Card style={{ borderColor: 'rgba(0,229,255,.35)' }}><Label>COMPARACIÓN · {comparison.title}</Label><Text style={{ color: Colors.textPrimary, fontSize: 16, fontWeight: '800', marginBottom: 8 }}>Tu rodada frente a la referencia</Text>{[{ label: 'Tiempo', current: ride.durationSec, reference: comparison.durationSec, suffix: 's', lowerWins: true }, { label: 'Velocidad promedio', current: ride.avgSpeed, reference: comparison.avgSpeed, suffix: ' km/h', lowerWins: false }, { label: 'Velocidad máxima', current: ride.maxSpeed, reference: comparison.maxSpeed, suffix: ' km/h', lowerWins: false }, { label: 'Inclinación máxima', current: Math.max(Math.abs(ride.maxLeanLeft), ride.maxLeanRight), reference: Math.max(Math.abs(comparison.maxLeanLeft), comparison.maxLeanRight), suffix: '°', lowerWins: false }].map((item) => { const delta = item.current - item.reference; return <View key={item.label} style={[s.row, { borderTopWidth: 1, borderTopColor: Colors.border, paddingVertical: 7 }]}><Text style={s.muted}>{item.label}</Text><View style={{ alignItems: 'flex-end' }}><Text style={{ color: Colors.textPrimary, fontWeight: '800' }}>{item.current.toFixed(item.suffix === 's' ? 0 : 1)}{item.suffix}</Text><Text style={{ color: (item.lowerWins ? delta < 0 : delta > 0) ? Colors.gpsOptimal : delta === 0 ? Colors.textTertiary : Colors.warning, fontSize: 11 }}>{delta > 0 ? '+' : ''}{delta.toFixed(1)}{item.suffix} vs. referencia</Text></View></View>; })}</Card> : null}
    <Label>TELEMETRÍA DE RUTA</Label>
    <View style={[s.row, { gap: 5 }]}>{([{ id: 'speed', label: 'Velocidad' }, { id: 'lean', label: 'Inclinación' }, { id: 'gforce', label: 'G' }, { id: 'braking', label: 'Frenado' }] as { id: ChartMetric; label: string }[]).map((item) => <Pressable key={item.id} onPress={() => setChartMetric(item.id)} style={[s.secondary, { flex: 1, paddingHorizontal: 4, backgroundColor: chartMetric === item.id ? 'rgba(0,229,255,.12)' : undefined }]}><Text style={[s.secondaryText, { fontSize: 10, color: chartMetric === item.id ? Colors.activeTelemetry : Colors.textSecondary }]}>{item.label}</Text></Pressable>)}</View>
    <Card><View style={{ height: 76, flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>{chart.map((v, i) => <View key={i} style={{ flex: 1, height: `${Math.max(4, v / max * 100)}%`, backgroundColor: v > (chartMetric === 'speed' ? ride.avgSpeed : max * 0.65) ? Colors.primaryAction : Colors.activeTelemetry, borderTopLeftRadius: 2, borderTopRightRadius: 2, opacity: .85 }} />)}</View><View style={s.row}><Text style={s.muted}>0 {chartUnit[chartMetric]}</Text><Text style={s.muted}>Máx. {Math.max(...chart, 0).toFixed(chartMetric === 'speed' ? 0 : 1)} {chartUnit[chartMetric]}</Text></View><Text style={{ color: Colors.textTertiary, fontSize: 10, marginTop: 5 }}>{chartName[chartMetric]} · {chart.length} muestras simplificadas</Text></Card>
    <Label>TRAMOS DE {segmentKm} KM</Label>
    <Card>{segments.length ? segments.map((segment, index) => <View key={index} style={{ borderBottomWidth: index === segments.length - 1 ? 0 : 1, borderBottomColor: Colors.border, paddingVertical: 11, gap: 5 }}><View style={s.row}><Text style={{ color: Colors.textPrimary, fontWeight: '900' }}>Tramo {String(index + 1).padStart(2, '0')}</Text><Text style={{ color: Colors.activeTelemetry, fontWeight: '900' }}>{segment.distanceKm.toFixed(2)} km</Text></View><Text style={s.muted}>{Math.max(0, Math.round((segment.end - segment.start) / 1000))} s · {segment.points} puntos GPS</Text><Text style={{ color: Colors.textPrimary, fontWeight: '700' }}>{segment.avgSpeed.toFixed(1)} km/h promedio · {segment.maxSpeed.toFixed(1)} km/h máxima</Text><Text style={s.muted}>Inclinación: izq. {Math.abs(segment.maxLeanLeft).toFixed(0)}° · der. {segment.maxLeanRight.toFixed(0)}° · pico {segment.maxG.toFixed(1)} G</Text></View>) : <Text style={s.muted}>Se necesitan al menos 100 m registrados por GPS para calcular tramos.</Text>}</Card>
    <View style={[s.row, { flexWrap: 'wrap', gap: 9 }]}>{[{ label: 'VELOCIDAD MEDIA', value: `${Math.round(ride.avgSpeed)} km/h` }, { label: 'VELOCIDAD MÁXIMA', value: `${Math.round(ride.maxSpeed)} km/h` }, { label: 'VELOCIDAD P95', value: `${Math.round(totals.speedP95)} km/h` }, { label: 'TIEMPO EN MOVIMIENTO', value: `${Math.round(totals.movingSeconds / 60)} min` }, { label: 'INCLINACIÓN IZQ.', value: `${Math.abs(ride.maxLeanLeft).toFixed(0)}°` }, { label: 'INCLINACIÓN DER.', value: `${ride.maxLeanRight.toFixed(0)}°` }, { label: 'ASCENSO ESTIMADO', value: `${Math.round(totals.ascent)} m` }, { label: 'DESCENSO ESTIMADO', value: `${Math.round(totals.descent)} m` }, { label: 'PICO DE FUERZA', value: `${totals.maxG.toFixed(1)} G` }, { label: 'PUNTOS GPS', value: `${ride.coordinates.length}` }].map((item) => <Card key={item.label} style={{ width: '48%' }}><Label>{item.label}</Label><Text style={{ color: Colors.textPrimary, fontSize: 19, fontWeight: '800' }}>{item.value}</Text></Card>)}</View>
    <View style={[s.row, { gap: 8 }]}><Pressable onPress={share} style={[s.secondary, { flex: 1 }]}><Text style={s.secondaryText}>Compartir</Text></Pressable><Pressable onPress={() => void exportGpx()} style={[s.secondary, { flex: 1 }]}><Text style={s.secondaryText}>Exportar GPX</Text></Pressable></View>
    <Pressable onPress={repeat} style={s.action}><Text style={s.actionText}>REPETIR Y COMPARAR</Text></Pressable>
    <Pressable onPress={() => router.replace('/(tabs)/routes')}><Text style={{ color: Colors.textSecondary, textAlign: 'center', padding: 8 }}>Volver a rutas</Text></Pressable>
    <Modal transparent visible={editing} animationType="slide" onRequestClose={() => setEditing(false)}><View style={{ flex: 1, backgroundColor: '#0009', justifyContent: 'flex-end' }}><View style={{ backgroundColor: Colors.card, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 22, gap: 12 }}><Text style={{ color: Colors.textPrimary, fontSize: 20, fontWeight: '800' }}>Nombre de la ruta</Text><TextInput value={titleDraft} onChangeText={setTitleDraft} placeholder="Ej. Vuelta al embalse" placeholderTextColor={Colors.textTertiary} style={{ color: Colors.textPrimary, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingVertical: 10 }} /><Pressable onPress={() => { if (titleDraft.trim()) renameRide(ride.id, titleDraft.trim()); setEditing(false); }} style={s.action}><Text style={s.actionText}>GUARDAR TÍTULO</Text></Pressable><Pressable onPress={() => setEditing(false)}><Text style={{ color: Colors.textSecondary, textAlign: 'center', padding: 8 }}>Cancelar</Text></Pressable></View></View></Modal>
  </Page>;
}
