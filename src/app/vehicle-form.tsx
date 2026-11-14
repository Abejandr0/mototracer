import { Text, TextInput } from '../components/LocalizedText';
import { usePreferences } from '../providers/PreferencesProvider';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme';
import { useAppData } from '../providers/AppProvider';
import { motorcycleBrands, motorcycleCatalog } from '../data/motorcycles';
import { screenStyles as s } from '../components/Screen';
import { deleteUserImages, resolveUserImage, uploadUserImage } from '../services/media';

const input = () => ({ color: Colors.textPrimary, backgroundColor: Colors.card, borderColor: Colors.border, borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15 } as const);
export default function VehicleFormScreen() {
  usePreferences();
  const { id, setup } = useLocalSearchParams<{ id?: string; setup?: string }>();
  const app = useAppData(); const existing = app.vehicles.find((item) => item.id === id);
  const [make, setMake] = useState(existing?.make ?? ''); const [model, setModel] = useState(existing?.model ?? '');
  const [brandQuery, setBrandQuery] = useState(''); const [modelQuery, setModelQuery] = useState('');
  const [year, setYear] = useState(existing?.year ?? String(new Date().getFullYear()));
  const [odometer, setOdometer] = useState(String(existing?.odometer ?? 0)); const [interval, setIntervalValue] = useState(String(existing?.serviceInterval ?? 3000));
  const [error, setError] = useState(''); const [newPhoto, setNewPhoto] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const [existingPhoto, setExistingPhoto] = useState<string | null>(null);
  useEffect(() => { let active = true; if (existing?.photoUri) void resolveUserImage(existing.photoUri).then((uri) => { if (active) setExistingPhoto(uri); }).catch(() => undefined); return () => { active = false; }; }, [existing?.photoUri]);
  const brands = useMemo(() => motorcycleBrands.filter((name) => name.toLowerCase().includes(brandQuery.toLowerCase())).slice(0, brandQuery ? 30 : 10), [brandQuery]);
  const models = (motorcycleCatalog[make] ?? []).filter((name) => name.toLowerCase().includes(modelQuery.toLowerCase()));
  const pickPhoto = async () => { const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [16, 9], quality: .85 }); if (!result.canceled && result.assets[0]?.uri) setNewPhoto(result.assets[0].uri); };
  const back = () => {
    if (setup) { router.replace('/(tabs)'); return; }
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/garage');
  };
  const save = async () => {
    const km = Number(odometer), serviceInterval = Number(interval);
    if (!make.trim() || !model.trim() || !/^\d{4}$/.test(year) || !Number.isFinite(km) || km < 0 || !Number.isFinite(serviceInterval) || serviceInterval <= 0) { setError('Revisa marca, modelo, año, odómetro e intervalo.'); return; }
    if (!existing && app.vehicles.length >= 5) { setError('Puedes guardar como máximo cinco motos.'); return; }
    setBusy(true); setError('');
    try {
      const photoUri = newPhoto ? await uploadUserImage(newPhoto, 'vehicles') : existing?.photoUri;
      const vehicle = { make: make.trim(), model: model.trim(), year, odometer: km, serviceInterval, photoUri, odometerPhotoUri: existing?.odometerPhotoUri };
      if (existing) app.updateVehicle({ ...existing, ...vehicle }); else app.addVehicle(vehicle);
      if (newPhoto && existing?.photoUri) void deleteUserImages([existing.photoUri]).catch(() => undefined);
      router.replace('/(tabs)/garage');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo guardar la motocicleta.'); }
    finally { setBusy(false); }
  };
  const photo = newPhoto ?? existingPhoto;
  const deleteExisting = () => existing && Alert.alert('Eliminar motocicleta', 'Se eliminarán sus servicios, fotos y lecturas de odómetro. Las rodadas guardadas permanecerán.', [{ text: 'Cancelar' }, { text: 'Eliminar', style: 'destructive', onPress: () => { void (async () => { try { await deleteUserImages([existing.photoUri, ...app.odometerEntries.filter((entry) => entry.vehicleId === existing.id).map((entry) => entry.photoUri)]); app.deleteVehicle(existing.id); router.replace('/(tabs)/garage'); } catch (cause) { Alert.alert('No se pudo eliminar', cause instanceof Error ? cause.message : 'Intenta de nuevo.'); } })(); } }]);
  return <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: 100, gap: 13 }}>
    <Pressable accessibilityRole="button" onPress={back} style={{ alignSelf: 'flex-start', paddingVertical: 8, paddingRight: 14 }}><Text style={{ color: Colors.activeTelemetry, fontWeight: '800' }}>‹ {setup ? 'Exit setup' : existing ? 'Garage' : 'Back'}</Text></Pressable>
    {setup ? <Text style={{ color: Colors.activeTelemetry, fontWeight: '900', letterSpacing: 2 }}>TU GARAJE · 2 DE 2</Text> : null}
    {existing ? <>
      <Text style={{ color: Colors.textPrimary, fontSize: 30, fontWeight: '900' }}>Vehicle details</Text><Text style={s.muted}>Update this motorcycle’s identity, odometer and maintenance interval.</Text>
      <View style={{ borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card }}>
        {photo ? <Image source={{ uri: photo }} resizeMode="cover" style={{ width: '100%', height: 190, backgroundColor: Colors.surface }} /> : <View style={{ height: 150, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.cardElevated }}><Text style={{ fontSize: 46 }}>🏍️</Text><Text style={s.muted}>Add a photo of your bike</Text></View>}
        <Pressable onPress={() => void pickPhoto()} style={{ padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Text style={{ color: Colors.activeTelemetry, fontWeight: '900' }}>▧  {photo ? 'CHANGE VEHICLE PHOTO' : 'ADD VEHICLE PHOTO'}</Text></Pressable>
      </View>
      <View style={{ gap: 10, padding: 16, borderRadius: 17, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border }}>
        <Text style={{ color: Colors.activeTelemetry, fontSize: 11, fontWeight: '900', letterSpacing: 1.3 }}>IDENTITY</Text>
        <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>Make</Text><TextInput accessibilityLabel="Make" value={make} onChangeText={setMake} style={input()} />
        <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>Model</Text><TextInput accessibilityLabel="Model" value={model} onChangeText={setModel} style={input()} />
        <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>Year</Text><TextInput accessibilityLabel="Year" value={year} onChangeText={setYear} keyboardType="number-pad" maxLength={4} style={input()} />
      </View>
      <View style={{ gap: 10, padding: 16, borderRadius: 17, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border }}>
        <Text style={{ color: Colors.activeTelemetry, fontSize: 11, fontWeight: '900', letterSpacing: 1.3 }}>ODOMETER & MAINTENANCE</Text>
        <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>Total odometer · km</Text><TextInput accessibilityLabel="Total odometer in kilometers" value={odometer} onChangeText={setOdometer} keyboardType="decimal-pad" style={input()} />
        <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>Oil service interval · km</Text><TextInput accessibilityLabel="Oil service interval in kilometers" value={interval} onChangeText={setIntervalValue} keyboardType="number-pad" style={input()} />
        <Text style={s.muted}>You can upload an odometer photo from Garage to confirm a new reading.</Text>
      </View>
    </> : <>
      <Text style={{ color: Colors.textPrimary, fontSize: 29, fontWeight: '900' }}>Add your motorcycle</Text><Text style={s.muted}>Busca una marca y modelo o escríbelos si no aparecen en el catálogo.</Text>
      <Pressable onPress={() => void pickPhoto()} style={s.secondary}><Text style={s.secondaryText}>{newPhoto ? 'CAMBIAR FOTO DE MI MOTO' : 'SUBIR FOTO DE MI MOTO'}</Text></Pressable>
      {photo ? <Image source={{ uri: photo }} resizeMode="cover" style={{ width: '100%', height: 150, borderRadius: 12, backgroundColor: Colors.surface }} /> : <Text style={s.muted}>Tu foto aparecerá en Inicio y en el garaje. No mostraremos una moto distinta como sustituto.</Text>}
      <Text style={{ color: Colors.textPrimary, fontWeight: '800' }}>Marca</Text><TextInput placeholder="Buscar marca" placeholderTextColor={Colors.textTertiary} value={brandQuery} onChangeText={setBrandQuery} style={input()} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{brands.map((brand) => <Pressable key={brand} onPress={() => { setMake(brand); setModel(''); setBrandQuery(brand); }} style={{ borderColor: make === brand ? Colors.activeTelemetry : Colors.border, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 18, backgroundColor: make === brand ? Colors.cardElevated : Colors.card }}><Text style={{ color: make === brand ? Colors.activeTelemetry : Colors.textSecondary }}>{brand}</Text></Pressable>)}</View>
      <TextInput placeholder="Otra marca" placeholderTextColor={Colors.textTertiary} value={make} onChangeText={(value) => { setMake(value); setModel(''); }} style={input()} />
      <Text style={{ color: Colors.textPrimary, fontWeight: '800', marginTop: 10 }}>Modelo</Text><TextInput placeholder="Buscar modelo" placeholderTextColor={Colors.textTertiary} value={modelQuery} onChangeText={setModelQuery} style={input()} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{models.map((entry) => <Pressable key={entry} onPress={() => setModel(entry)} style={{ borderColor: model === entry ? Colors.activeTelemetry : Colors.border, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 18, backgroundColor: model === entry ? Colors.cardElevated : Colors.card }}><Text style={{ color: model === entry ? Colors.activeTelemetry : Colors.textSecondary }}>{entry}</Text></Pressable>)}</View>
      <TextInput placeholder="Otro modelo" placeholderTextColor={Colors.textTertiary} value={model} onChangeText={setModel} style={input()} />
      <Text style={{ color: Colors.textPrimary, fontWeight: '800', marginTop: 10 }}>Año</Text><TextInput value={year} onChangeText={setYear} keyboardType="number-pad" maxLength={4} style={input()} />
      <Text style={{ color: Colors.textPrimary, fontWeight: '800' }}>Odómetro total · km</Text><TextInput value={odometer} onChangeText={setOdometer} keyboardType="decimal-pad" style={input()} />
      <Text style={{ color: Colors.textPrimary, fontWeight: '800' }}>Intervalo de cambio de aceite · km</Text><TextInput value={interval} onChangeText={setIntervalValue} keyboardType="number-pad" style={input()} />
      <Pressable onPress={() => router.push('/vehicle-suggestion')}><Text style={{ color: Colors.activeTelemetry, paddingVertical: 5 }}>¿Falta una marca, modelo u otro tipo de vehículo? Sugiérelo ›</Text></Pressable>
    </>}
    {error ? <Text style={{ color: Colors.emergency }}>{error}</Text> : null}
    <Pressable disabled={busy} onPress={() => void save()} style={[s.action, { opacity: busy ? .5 : 1 }]}><Text style={s.actionText}>{busy ? 'SAVING…' : existing ? 'SAVE VEHICLE CHANGES' : 'ADD TO GARAGE'}</Text></Pressable>
    {setup ? <Pressable accessibilityRole="button" onPress={() => router.replace('/(tabs)')} style={[s.secondary, { minHeight: 48 }]}><Text style={s.secondaryText}>SKIP FOR NOW</Text></Pressable> : null}
    {existing ? <Pressable onPress={deleteExisting} style={[s.secondary, { borderColor: Colors.emergency }]}><Text style={{ color: Colors.emergency, fontWeight: '800' }}>DELETE MOTORCYCLE</Text></Pressable> : null}
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
