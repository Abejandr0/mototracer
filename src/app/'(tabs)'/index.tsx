import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Colors } from '../../theme';
import { Card, Header, Label, Page, screenStyles as s } from '../../components/Screen';
import { useAppData } from '../../providers/AppProvider';
import { RouteMap } from '../../components/RouteMap';

export default function HomeScreen() {
  const app = useAppData();
  const bike = app.vehicle;
  const lastRide = app.rides[0];
  const oil = app.services.find((item) => /aceite|oil/i.test(item.title));
  const chain = app.services.find((item) => /cadena|chain/i.test(item.title));
  const oilRemaining = oil ? Math.max(0, oil.odometer + bike.serviceInterval - bike.odometer) : null;
  const chainAge = chain ? Math.max(0, bike.odometer - chain.odometer) : null;
  return <Page>
    <Header title="A rodar, Abe" subtitle="Tu moto y tus rutas, en un solo lugar." right={<Pressable onPress={() => router.push('/profile')}><Text style={{ color: Colors.activeTelemetry, fontWeight: '800' }}>ABE</Text></Pressable>} />
    <Card style={{ padding: 16, overflow: 'hidden' }}>
      <View style={s.row}><View><Label>MOTOCICLETA ACTIVA</Label><Text style={{ color: Colors.textPrimary, fontSize: 17, fontWeight: '800', marginTop: 5 }}>{bike.make} {bike.model}</Text></View><Link href="/garage" asChild><Pressable style={{ backgroundColor: Colors.cardElevated, borderRadius: 24, padding: 10 }}><Text style={{ color: Colors.textSecondary }}>⌄</Text></Pressable></Link></View>
      <Image source={require('../../../assets/suzuki-gixxer.png')} resizeMode="contain" style={{ width: '100%', height: 122, backgroundColor: '#13191C', borderRadius: 10 }} />
      <View style={{ borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 9 }}><Label>ODÓMETRO TOTAL</Label><Text style={{ color: Colors.textPrimary, fontSize: 30, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{bike.odometer.toLocaleString('es-CO')} <Text style={{ color: Colors.textSecondary, fontSize: 13, fontWeight: '500' }}>KM</Text></Text></View>
    </Card>
    <Pressable onPress={() => router.push('/ride')} style={s.action}><Text style={s.actionText}>▶   INICIAR RODADA</Text></Pressable>
    <View style={[s.row, { marginTop: 2 }]}><Label>ESTADO DE LA MOTO</Label><Link href="/garage" asChild><Pressable><Text style={{ color: Colors.activeTelemetry, fontWeight: '700' }}>Ver garaje  ›</Text></Pressable></Link></View>
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {[{ label: 'Aceite', value: oilRemaining === null ? 'Sin registro' : `Próximo en ${oilRemaining.toLocaleString('es-CO')} km`, color: oilRemaining !== null && oilRemaining < 500 ? Colors.warning : Colors.gpsOptimal }, { label: 'Cadena', value: chainAge === null ? 'Sin registro' : `Revisada hace ${chainAge.toLocaleString('es-CO')} km`, color: chainAge !== null && chainAge > 1300 ? Colors.warning : Colors.gpsOptimal }].map((item) => <Card key={item.label} style={{ flex: 1 }}><Label>{item.label}</Label><Text style={{ color: item.color, fontWeight: '800', fontSize: 12 }}>{item.value}</Text></Card>)}
    </View>
    <Card><View style={s.row}><View style={{ flex: 1, gap: 6 }}><Label>Seguridad</Label><Text style={{ color: Colors.textPrimary, fontSize: 16, fontWeight: '800' }}>Calibra el giroscopio</Text><Text style={s.muted}>Ajusta la referencia antes de salir.</Text></View><Link href="/calibration" asChild><Pressable style={s.secondary}><Text style={s.secondaryText}>Abrir</Text></Pressable></Link></View></Card>
    <View style={[s.row, { marginTop: 2 }]}><Label>ACTIVIDAD</Label><Link href="/routes" asChild><Pressable><Text style={{ color: Colors.activeTelemetry, fontWeight: '700' }}>Ver historial  ›</Text></Pressable></Link></View>
    {lastRide ? <Card><View style={s.row}><View><Text style={{ color: Colors.textPrimary, fontSize: 16, fontWeight: '800' }}>{lastRide.title}</Text><Text style={s.muted}>{new Date(lastRide.startTime).toLocaleDateString('es-CO')}</Text></View><Text style={{ color: Colors.activeTelemetry, fontWeight: '800' }}>{lastRide.distanceKm.toFixed(1)} km</Text></View><RouteMap coordinates={lastRide.coordinates} height={85} /></Card> : <Card><Text style={s.muted}>Tu primera ruta aparecerá aquí cuando termines de rodar.</Text></Card>}
  </Page>;
}
