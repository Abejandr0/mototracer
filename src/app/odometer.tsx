import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme';
import { useAppData } from '../providers/AppProvider';
import { resolveUserImage, uploadUserImage } from '../services/media';
import { screenStyles as s } from '../components/Screen';

export default function OdometerScreen() {
  const { vehicle, odometerEntries, addOdometerEntry } = useAppData();
  const [photo, setPhoto] = useState<string | null>(null); const [km, setKm] = useState(String(vehicle.odometer)); const [busy, setBusy] = useState(false);
  const [historyPhotos, setHistoryPhotos] = useState<Record<string, string>>({});
  const history = useMemo(() => odometerEntries.filter((entry) => entry.vehicleId === vehicle.id), [odometerEntries, vehicle.id]);
  useEffect(() => { let active = true; Promise.all(history.map(async (entry) => { try { return [entry.id, await resolveUserImage(entry.photoUri)] as const; } catch { return [entry.id, ''] as const; } })).then((entries) => { if (active) setHistoryPhotos(Object.fromEntries(entries)); }); return () => { active = false; }; }, [history]);
  const pick = async (camera: boolean) => {
    const permission = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert('Permiso requerido', 'Permite el acceso a la cámara o a tus fotos para documentar el tablero.'); return; }
    const result = camera ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: .8 }) : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: .8 });
    if (!result.canceled && result.assets[0]?.uri) setPhoto(result.assets[0].uri);
  };
  const save = async () => {
    const value = Number(km);
    if (!photo || !Number.isFinite(value) || value < vehicle.odometer) { Alert.alert('Revisa el odómetro', 'Añade una foto y un kilometraje igual o mayor al actual.'); return; }
    setBusy(true);
    try { const uri = await uploadUserImage(photo, 'odometers'); addOdometerEntry({ vehicleId: vehicle.id, odometer: value, photoUri: uri }); router.back(); }
    catch (error) { Alert.alert('No se pudo guardar la foto', error instanceof Error ? error.message : 'Intenta de nuevo.'); }
    finally { setBusy(false); }
  };
  return <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 21, gap: 13, paddingBottom: 80 }}><Pressable onPress={() => router.back()}><Text style={{ color: Colors.activeTelemetry }}>‹ Volver</Text></Pressable><Text style={{ color: Colors.textPrimary, fontWeight: '900', fontSize: 29 }}>Actualizar odómetro</Text><Text style={s.muted}>{vehicle.make} {vehicle.model} · {vehicle.odometer.toLocaleString('es-CO')} km actuales</Text><Text style={s.muted}>Toma o sube una foto legible del tablero. Escribe el número que muestra; la app todavía no lo lee automáticamente.</Text>
    <View style={{ flexDirection: 'row', gap: 9 }}><Pressable onPress={() => void pick(true)} style={[s.secondary, { flex: 1 }]}><Text style={s.secondaryText}>Tomar foto</Text></Pressable><Pressable onPress={() => void pick(false)} style={[s.secondary, { flex: 1 }]}><Text style={s.secondaryText}>Subir foto</Text></Pressable></View>
    {photo ? <Image source={{ uri: photo }} resizeMode="contain" style={{ width: '100%', height: 190, backgroundColor: Colors.card, borderRadius: 12 }} /> : null}
    <Text style={{ color: Colors.textPrimary, fontWeight: '800' }}>Kilómetros que muestra el tablero</Text><TextInput value={km} onChangeText={setKm} keyboardType="decimal-pad" style={{ color: Colors.textPrimary, backgroundColor: Colors.card, borderColor: Colors.border, borderWidth: 1, borderRadius: 12, padding: 15, fontSize: 19 }} />
    <Text style={s.muted}>Al guardar, el estado de servicios se recalcula con el nuevo kilometraje. La foto queda privada en tu cuenta.</Text><Pressable disabled={busy} onPress={() => void save()} style={[s.action, { opacity: busy ? .5 : 1 }]}><Text style={s.actionText}>{busy ? 'SUBIENDO FOTO…' : 'GUARDAR KILOMETRAJE'}</Text></Pressable>
    {history.length ? <Text style={{ color: Colors.textPrimary, fontSize: 18, fontWeight: '800', marginTop: 15 }}>Historial de lecturas</Text> : null}
    {history.map((entry) => <View key={entry.id} style={{ backgroundColor: Colors.card, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>{historyPhotos[entry.id] ? <Image source={{ uri: historyPhotos[entry.id] }} style={{ width: 78, height: 60, borderRadius: 7 }} /> : <View style={{ width: 78, height: 60, backgroundColor: Colors.surface }} />}<View><Text style={{ color: Colors.textPrimary, fontWeight: '800' }}>{entry.odometer.toLocaleString('es-CO')} km</Text><Text style={s.muted}>{new Date(entry.recordedAt).toLocaleDateString('es-CO')}</Text></View></View>)}
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
