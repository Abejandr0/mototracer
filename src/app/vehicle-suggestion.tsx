import { Text, TextInput } from '../components/LocalizedText';
import { usePreferences } from '../providers/PreferencesProvider';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme';
import { screenStyles as s } from '../components/Screen';
import { useAuth } from '../providers/AuthProvider';
import { supabase } from '../services/supabase';

const field = () => ({ color: Colors.textPrimary, backgroundColor: Colors.card, borderColor: Colors.border, borderWidth: 1, borderRadius: 12, padding: 15 } as const);
export default function VehicleSuggestionScreen() {
  usePreferences();
  const { session } = useAuth(); const [type, setType] = useState('Motocicleta'); const [brand, setBrand] = useState(''); const [model, setModel] = useState(''); const [detail, setDetail] = useState(''); const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!brand.trim() || !model.trim() || !type.trim()) { Alert.alert('Faltan datos', 'Completa tipo, marca y modelo.'); return; }
    if (!supabase || !session) return;
    setBusy(true);
    const { error } = await supabase.from('vehicle_suggestions').insert({ owner_id: session.user.id, vehicle_type: type.trim(), make: brand.trim(), model: model.trim(), details: detail.trim() });
    setBusy(false);
    if (error) { Alert.alert('No se pudo enviar', error.message); return; }
    Alert.alert('Sugerencia enviada', 'Gracias. Mientras tanto, puedes escribir la marca y modelo manualmente.'); router.back();
  };
  return <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 22, gap: 14 }}><Pressable onPress={() => router.back()}><Text style={{ color: Colors.activeTelemetry }}>‹ Volver</Text></Pressable><Text style={{ color: Colors.textPrimary, fontSize: 27, fontWeight: '900' }}>Sugerir vehículo</Text><Text style={s.muted}>Ayúdanos a ampliar el catálogo. Si tu vehículo no es una moto, escribe su tipo.</Text>
    <TextInput placeholder="Tipo de vehículo" placeholderTextColor={Colors.textTertiary} value={type} onChangeText={setType} style={field()} /><TextInput placeholder="Marca" placeholderTextColor={Colors.textTertiary} value={brand} onChangeText={setBrand} style={field()} /><TextInput placeholder="Modelo" placeholderTextColor={Colors.textTertiary} value={model} onChangeText={setModel} style={field()} /><TextInput placeholder="Detalles o año · opcional" placeholderTextColor={Colors.textTertiary} value={detail} onChangeText={setDetail} multiline style={[field(), { minHeight: 90, textAlignVertical: 'top' }]} /><Pressable onPress={() => void save()} disabled={busy} style={[s.action, { opacity: busy ? .5 : 1 }]}><Text style={s.actionText}>ENVIAR SUGERENCIA</Text></Pressable>
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
