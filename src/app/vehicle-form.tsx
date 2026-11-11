import React, { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme';
import { useAppData } from '../providers/AppProvider';
import { motorcycleBrands, motorcycleCatalog } from '../data/motorcycles';
import { screenStyles as s } from '../components/Screen';
import { deleteUserImages } from '../services/media';

const input = { color: Colors.textPrimary, backgroundColor: Colors.card, borderColor: Colors.border, borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15 } as const;
export default function VehicleFormScreen() {
  const { id, setup } = useLocalSearchParams<{ id?: string; setup?: string }>();
  const app = useAppData(); const existing = app.vehicles.find((item) => item.id === id);
  const [make, setMake] = useState(existing?.make ?? ''); const [model, setModel] = useState(existing?.model ?? '');
  const [brandQuery, setBrandQuery] = useState(''); const [modelQuery, setModelQuery] = useState('');
  const [year, setYear] = useState(existing?.year ?? String(new Date().getFullYear()));
  const [odometer, setOdometer] = useState(String(existing?.odometer ?? 0)); const [interval, setIntervalValue] = useState(String(existing?.serviceInterval ?? 3000));
  const [error, setError] = useState('');
  const brands = useMemo(() => motorcycleBrands.filter((name) => name.toLowerCase().includes(brandQuery.toLowerCase())).slice(0, brandQuery ? 30 : 10), [brandQuery]);
  const models = (motorcycleCatalog[make] ?? []).filter((name) => name.toLowerCase().includes(modelQuery.toLowerCase()));
  const save = () => {
    const km = Number(odometer), serviceInterval = Number(interval);
    if (!make.trim() || !model.trim() || !/^\d{4}$/.test(year) || !Number.isFinite(km) || km < 0 || !Number.isFinite(serviceInterval) || serviceInterval <= 0) { setError('Revisa marca, modelo, año, odómetro e intervalo.'); return; }
    if (!existing && app.vehicles.length >= 5) { setError('Puedes guardar como máximo cinco motos.'); return; }
    const vehicle = { make: make.trim(), model: model.trim(), year, odometer: km, serviceInterval, photoUri: existing?.photoUri, odometerPhotoUri: existing?.odometerPhotoUri };
    if (existing) app.updateVehicle({ ...existing, ...vehicle }); else app.addVehicle(vehicle);
    router.replace('/(tabs)/garage');
  };
  return <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: 100, gap: 13 }}>
    <Pressable onPress={() => router.back()}><Text style={{ color: Colors.activeTelemetry }}>‹ Volver</Text></Pressable>
    {setup ? <Text style={{ color: Colors.activeTelemetry, fontWeight: '900', letterSpacing: 2 }}>TU GARAJE · 2 DE 2</Text> : null}<Text style={{ color: Colors.textPrimary, fontSize: 29, fontWeight: '900' }}>{existing ? 'Editar motocicleta' : 'Añade tu motocicleta'}</Text><Text style={s.muted}>Busca una marca y modelo o escríbelos si no aparecen en el catálogo.</Text>
    <Text style={{ color: Colors.textPrimary, fontWeight: '800' }}>Marca</Text><TextInput placeholder="Buscar marca" placeholderTextColor={Colors.textTertiary} value={brandQuery} onChangeText={setBrandQuery} style={input} />
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{brands.map((brand) => <Pressable key={brand} onPress={() => { setMake(brand); setModel(''); setBrandQuery(brand); }} style={{ borderColor: make === brand ? Colors.activeTelemetry : Colors.border, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 18, backgroundColor: make === brand ? '#10343A' : Colors.card }}><Text style={{ color: make === brand ? Colors.activeTelemetry : Colors.textSecondary }}>{brand}</Text></Pressable>)}</View>
    <TextInput placeholder="Otra marca" placeholderTextColor={Colors.textTertiary} value={make} onChangeText={(value) => { setMake(value); setModel(''); }} style={input} />
    <Text style={{ color: Colors.textPrimary, fontWeight: '800', marginTop: 10 }}>Modelo</Text><TextInput placeholder="Buscar modelo" placeholderTextColor={Colors.textTertiary} value={modelQuery} onChangeText={setModelQuery} style={input} />
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{models.map((entry) => <Pressable key={entry} onPress={() => setModel(entry)} style={{ borderColor: model === entry ? Colors.activeTelemetry : Colors.border, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 18, backgroundColor: model === entry ? '#10343A' : Colors.card }}><Text style={{ color: model === entry ? Colors.activeTelemetry : Colors.textSecondary }}>{entry}</Text></Pressable>)}</View>
    <TextInput placeholder="Otro modelo" placeholderTextColor={Colors.textTertiary} value={model} onChangeText={setModel} style={input} />
    <Text style={{ color: Colors.textPrimary, fontWeight: '800', marginTop: 10 }}>Año</Text><TextInput value={year} onChangeText={setYear} keyboardType="number-pad" maxLength={4} style={input} />
    <Text style={{ color: Colors.textPrimary, fontWeight: '800' }}>Odómetro total · km</Text><TextInput value={odometer} onChangeText={setOdometer} keyboardType="decimal-pad" style={input} />
    <Text style={{ color: Colors.textPrimary, fontWeight: '800' }}>Intervalo de cambio de aceite · km</Text><TextInput value={interval} onChangeText={setIntervalValue} keyboardType="number-pad" style={input} />
    <Pressable onPress={() => router.push('/vehicle-suggestion')}><Text style={{ color: Colors.activeTelemetry, paddingVertical: 5 }}>¿Falta una marca, modelo u otro tipo de vehículo? Sugiérelo ›</Text></Pressable>
    {error ? <Text style={{ color: Colors.emergency }}>{error}</Text> : null}
    <Pressable onPress={save} style={s.action}><Text style={s.actionText}>{existing ? 'GUARDAR CAMBIOS' : 'AÑADIR AL GARAJE'}</Text></Pressable>
    {existing ? <Pressable onPress={() => Alert.alert('Eliminar motocicleta', 'Se eliminarán sus servicios, fotos y lecturas de odómetro. Las rodadas guardadas permanecerán.', [{ text: 'Cancelar' }, { text: 'Eliminar', style: 'destructive', onPress: () => { void (async () => { try { await deleteUserImages([existing.photoUri, ...app.odometerEntries.filter((entry) => entry.vehicleId === existing.id).map((entry) => entry.photoUri)]); app.deleteVehicle(existing.id); router.replace('/(tabs)/garage'); } catch (cause) { Alert.alert('No se pudo eliminar', cause instanceof Error ? cause.message : 'Intenta de nuevo.'); } })(); } }])} style={[s.secondary, { borderColor: Colors.emergency }]}><Text style={{ color: Colors.emergency, fontWeight: '800' }}>ELIMINAR MOTOCICLETA</Text></Pressable> : null}
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
