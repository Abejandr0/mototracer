import { usePreferences } from '../providers/PreferencesProvider';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme';
import { useAppData } from '../providers/AppProvider';
import { serviceTypes } from '../data/services';
import { screenStyles as s } from '../components/Screen';

const input = () => ({ color: Colors.textPrimary, backgroundColor: Colors.card, borderColor: Colors.border, borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15 } as const);
export default function ServiceFormScreen() {
  usePreferences();
  const { vehicle, addService } = useAppData();
  const [selected, setSelected] = useState(serviceTypes[0].title); const [custom, setCustom] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10)); const [odometer, setOdometer] = useState(String(vehicle.odometer)); const [note, setNote] = useState('');
  const [cost, setCost] = useState(''); const [workshop, setWorkshop] = useState(''); const [interval, setIntervalValue] = useState(String(vehicle.serviceInterval));
  const [expanded, setExpanded] = useState(false);
  const save = () => {
    const km = Number(odometer); const title = selected === 'Otro servicio' ? custom.trim() : selected;
    if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(km) || km < 0 || km > vehicle.odometer || (cost && (!Number.isFinite(Number(cost)) || Number(cost) < 0))) { Alert.alert('Revisa los datos', 'Completa fecha y odómetro. El kilometraje del servicio no puede superar el actual; actualiza antes el tablero.'); return; }
    addService({ title, date, odometer: km, note: note.trim(), vehicleId: vehicle.id, cost: cost ? Number(cost) : undefined, workshop: workshop.trim() || undefined, intervalKm: Number(interval) > 0 ? Number(interval) : undefined }); router.back();
  };
  return <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 21, paddingBottom: 90, gap: 13 }}><Pressable onPress={() => router.back()}><Text style={{ color: Colors.activeTelemetry }}>‹ Volver</Text></Pressable><Text style={{ color: Colors.textPrimary, fontSize: 29, fontWeight: '900' }}>Registrar servicio</Text><Text style={s.muted}>{vehicle.make} {vehicle.model} · {vehicle.odometer.toLocaleString('es-CO')} km actuales</Text>
    <Text style={{ color: Colors.textPrimary, fontWeight: '800' }}>Servicio realizado</Text><Pressable onPress={() => setExpanded(!expanded)} style={input()}><Text style={{ color: Colors.textPrimary }}>{selected}  ▾</Text></Pressable>
    {expanded ? <View style={{ backgroundColor: Colors.card, borderRadius: 12, borderColor: Colors.border, borderWidth: 1 }}>{serviceTypes.map((item) => <Pressable key={item.title} onPress={() => { setSelected(item.title); setIntervalValue(String(item.title === 'Cambio de aceite' ? vehicle.serviceInterval : item.interval)); setExpanded(false); }} style={{ padding: 11, borderBottomColor: Colors.border, borderBottomWidth: 1 }}><Text style={{ color: selected === item.title ? Colors.activeTelemetry : Colors.textPrimary }}>{item.title}</Text></Pressable>)}</View> : null}
    {selected === 'Otro servicio' ? <TextInput placeholder="¿Qué servicio se hizo?" placeholderTextColor={Colors.textTertiary} value={custom} onChangeText={setCustom} style={input()} /> : null}
    <Text style={{ color: Colors.textPrimary, fontWeight: '800' }}>Fecha · AAAA-MM-DD</Text><TextInput value={date} onChangeText={setDate} style={input()} />
    <Text style={{ color: Colors.textPrimary, fontWeight: '800' }}>Odómetro al realizarlo · km</Text><TextInput value={odometer} onChangeText={setOdometer} keyboardType="decimal-pad" style={input()} />
    <Text style={{ color: Colors.textPrimary, fontWeight: '800' }}>Repetir revisión después de · km</Text><TextInput value={interval} onChangeText={setIntervalValue} keyboardType="number-pad" style={input()} />
    <Text style={{ color: Colors.textPrimary, fontWeight: '800' }}>Costo · COP (opcional)</Text><TextInput value={cost} onChangeText={setCost} keyboardType="decimal-pad" style={input()} />
    <Text style={{ color: Colors.textPrimary, fontWeight: '800' }}>Taller o mecánico · opcional</Text><TextInput value={workshop} onChangeText={setWorkshop} style={input()} />
    <Text style={{ color: Colors.textPrimary, fontWeight: '800' }}>Notas o repuestos · opcional</Text><TextInput value={note} onChangeText={setNote} multiline placeholder="Ej. Aceite 10W-40, filtro nuevo" placeholderTextColor={Colors.textTertiary} style={[input(), { minHeight: 90, textAlignVertical: 'top' }]} />
    <Pressable onPress={save} style={s.action}><Text style={s.actionText}>GUARDAR SERVICIO</Text></Pressable>
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
