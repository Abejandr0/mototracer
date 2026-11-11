import React from 'react';
import { Alert, Image, Pressable, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Colors } from '../../theme';
import { Card, Header, Label, Page, screenStyles as s } from '../../components/Screen';
import { useAppData } from '../../providers/AppProvider';
import { deleteUserImages, uploadUserImage } from '../../services/media';
import { serviceTypes } from '../../data/services';

export default function GarageScreen() {
  const { vehicle, vehicles, updateVehicle, selectVehicle, services: allServices } = useAppData();
  const services = allServices.filter((record) => record.vehicleId === vehicle.id).sort((a, b) => b.date.localeCompare(a.date));
  const pickVehiclePhoto = async (item: typeof vehicle) => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [16, 9], quality: .8 });
    if (result.canceled || !result.assets[0]?.uri) return;
    try { const photoUri = await uploadUserImage(result.assets[0].uri, 'vehicles'); updateVehicle({ ...item, photoUri }); if (item.photoUri) void deleteUserImages([item.photoUri]).catch(() => undefined); }
    catch (error) { Alert.alert('No se pudo subir la foto', error instanceof Error ? error.message : 'Intenta de nuevo.'); }
  };
  const tracked = serviceTypes.filter((item) => item.interval > 0).map((item) => {
    const last = services.filter((service) => service.title === item.title).sort((a, b) => b.odometer - a.odometer)[0];
    const interval = last?.intervalKm ?? (item.title === 'Cambio de aceite' ? vehicle.serviceInterval : item.interval);
    return { ...item, remaining: last ? last.odometer + interval - vehicle.odometer : null, interval };
  });
  return <Page><Header title="Mi garaje" subtitle={`${vehicles.length} de 5 motocicletas · ${vehicle.make} ${vehicle.model}`} right={vehicles.length < 5 ? <Pressable onPress={() => router.push('/vehicle-form')}><Text style={{ color: Colors.primaryAction, fontWeight: '800' }}>＋ Añadir</Text></Pressable> : null} />
    {vehicles.map((item) => <Card key={item.id} style={{ padding: 12, borderColor: item.id === vehicle.id ? Colors.activeTelemetry : Colors.border }}><View style={[s.row, { gap: 12 }]}><Pressable onPress={() => void pickVehiclePhoto(item)}><Image source={item.photoUri ? { uri: item.photoUri } : require('../../../assets/garage-bike.png')} resizeMode="cover" style={{ width: 105, height: 82, borderRadius: 9, backgroundColor: Colors.surface }} /></Pressable><View style={{ flex: 1, gap: 5 }}><Text style={{ color: Colors.textPrimary, fontSize: 17, fontWeight: '900' }}>{item.make} {item.model}</Text><Text style={s.muted}>{item.year} · {item.odometer.toLocaleString('es-CO')} km</Text><Text style={{ color: item.id === vehicle.id ? Colors.gpsOptimal : Colors.textTertiary, fontSize: 11, fontWeight: '800' }}>{item.id === vehicle.id ? '● ACTIVA' : '○ EN GARAJE'}</Text></View></View><View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>{item.id !== vehicle.id ? <Pressable onPress={() => selectVehicle(item.id)} style={[s.secondary, { flex: 1 }]}><Text style={s.secondaryText}>Elegir</Text></Pressable> : null}<Pressable onPress={() => router.push({ pathname: '/vehicle-form', params: { id: item.id } })} style={[s.secondary, { flex: 1 }]}><Text style={s.secondaryText}>Editar / eliminar</Text></Pressable><Pressable onPress={() => void pickVehiclePhoto(item)} style={[s.secondary, { flex: 1 }]}><Text style={s.secondaryText}>Foto</Text></Pressable></View></Card>)}
    <Card style={{ borderColor: Colors.activeTelemetry }}><View style={s.row}><View><Label>ODÓMETRO ACTUAL</Label><Text style={{ color: Colors.activeTelemetry, fontSize: 30, fontWeight: '900' }}>{vehicle.odometer.toLocaleString('es-CO')} <Text style={{ fontSize: 16 }}>km</Text></Text></View><Text style={{ color: Colors.textTertiary, fontSize: 30 }}>◷</Text></View><Text style={s.muted}>Actualiza con una foto del tablero y conserva el historial de lecturas.</Text><Pressable onPress={() => router.push('/odometer')} style={s.action}><Text style={s.actionText}>FOTO Y NUEVO KILOMETRAJE</Text></Pressable></Card>
    <View style={s.row}><Label>ESTADO DE SERVICIOS</Label><Pressable onPress={() => router.push('/service-form')}><Text style={{ color: Colors.primaryAction, fontWeight: '800' }}>＋ Servicio</Text></Pressable></View>
    <Card>{tracked.map((item) => <View key={item.title} style={{ paddingVertical: 8, borderBottomColor: Colors.border, borderBottomWidth: 1, gap: 5 }}><View style={s.row}><Text style={{ color: Colors.textPrimary, fontWeight: '700', flex: 1 }}>{item.title}</Text><Text style={{ color: item.remaining === null ? Colors.textTertiary : item.remaining <= 0 ? Colors.emergency : item.remaining < item.interval * .2 ? Colors.warning : Colors.gpsOptimal, fontWeight: '800', fontSize: 12 }}>{item.remaining === null ? 'Sin registro' : item.remaining <= 0 ? 'Revisar ahora' : `${item.remaining.toLocaleString('es-CO')} km`}</Text></View>{item.remaining !== null ? <View style={{ height: 5, backgroundColor: Colors.surface, borderRadius: 5 }}><View style={{ width: `${Math.min(100, Math.max(0, (1 - item.remaining / item.interval) * 100))}%`, height: 5, backgroundColor: item.remaining <= 0 ? Colors.emergency : Colors.activeTelemetry, borderRadius: 5 }} /></View> : null}</View>)}</Card>
    <Label>HISTORIAL DE SERVICIO</Label>{services.length ? services.map((item) => <Card key={item.id}><Text style={{ color: Colors.textPrimary, fontWeight: '800' }}>{item.title}</Text><Text style={s.muted}>{item.date} · {item.odometer.toLocaleString('es-CO')} km{item.cost ? ` · $${item.cost.toLocaleString('es-CO')}` : ''}</Text>{item.workshop ? <Text style={s.muted}>Taller: {item.workshop}</Text> : null}{item.note ? <Text style={s.muted}>{item.note}</Text> : null}</Card>) : <Card><Text style={s.muted}>Registra el primer servicio de esta moto para calcular los próximos mantenimientos.</Text></Card>}
  </Page>;
}
