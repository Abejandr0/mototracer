import { Text, TextInput } from '../components/LocalizedText';
import { usePreferences } from '../providers/PreferencesProvider';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme';
import { useAppData } from '../providers/AppProvider';
import { screenStyles as s } from '../components/Screen';

const field = () => ({ color: Colors.textPrimary, backgroundColor: Colors.card, borderColor: Colors.border, borderWidth: 1, borderRadius: 12, padding: 15 } as const);
export default function ContactFormScreen() {
  usePreferences();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { addContact, updateContact, contacts } = useAppData();
  const existing = contacts.find((item) => item.id === id);
  const [name, setName] = useState(existing?.name ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '+57');
  const [relation, setRelation] = useState(existing?.relation ?? 'Familiar');
  const [error, setError] = useState('');
  const normalized = phone.replace(/[\s()-]/g, '');
  const validPhone = /^\+[1-9]\d{7,14}$/.test(normalized);
  const save = () => {
    if (!existing && contacts.length >= 5) { setError('Puedes guardar hasta cinco contactos SOS.'); return; }
    if (!name.trim() || !validPhone) { setError('Escribe el nombre y un teléfono completo con +, indicativo de país y número.'); return; }
    if (contacts.some((item) => item.id !== existing?.id && item.phone === normalized)) { setError('Este teléfono ya está en tus contactos SOS.'); return; }
    const contact = { name: name.trim(), phone: normalized, relation };
    if (existing) updateContact({ ...existing, ...contact }); else addContact(contact);
    router.back();
  };
  return <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 22, paddingBottom: 80, gap: 16 }}>
    <Pressable onPress={() => router.back()}><Text style={{ color: Colors.activeTelemetry }}>‹ Volver</Text></Pressable>
    <Text style={{ color: Colors.textPrimary, fontSize: 29, fontWeight: '900' }}>{existing ? 'Editar contacto SOS' : 'Añadir contacto SOS'}</Text>
    <Text style={s.muted}>Si detectamos un accidente y no cancelas la alerta, compartiremos tu ubicación con este contacto por SMS. Avísale antes de añadirlo.</Text>
    <Text style={{ color: Colors.textPrimary, fontWeight: '800' }}>Nombre</Text><TextInput placeholder="Nombre de la persona" placeholderTextColor={Colors.textTertiary} value={name} onChangeText={setName} autoCapitalize="words" style={field()} />
    <Text style={{ color: Colors.textPrimary, fontWeight: '800' }}>Relación</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{['Familiar', 'Pareja', 'Amigo/a', 'Otro'].map((item) => <Pressable key={item} onPress={() => setRelation(item)} style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 18, borderWidth: 1, borderColor: relation === item ? Colors.activeTelemetry : Colors.border, backgroundColor: Colors.card }}><Text style={{ color: relation === item ? Colors.activeTelemetry : Colors.textSecondary }}>{item}</Text></Pressable>)}</View>
    <Text style={{ color: Colors.textPrimary, fontWeight: '800' }}>Teléfono internacional</Text><Text style={s.muted}>Elige un indicativo o escribe el número completo. Ejemplo: +57 300 123 4567.</Text>
    <View style={{ flexDirection: 'row', gap: 8 }}>{['+57', '+1', '+52', '+34'].map((prefix) => <Pressable key={prefix} onPress={() => setPhone(prefix)} style={{ padding: 10, borderRadius: 10, backgroundColor: Colors.cardElevated }}><Text style={{ color: Colors.textPrimary }}>{prefix}</Text></Pressable>)}</View>
    <TextInput placeholder="+57 300 123 4567" placeholderTextColor={Colors.textTertiary} value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" style={field()} />
    <Text style={{ color: validPhone ? Colors.gpsOptimal : Colors.textTertiary, fontSize: 12 }}>{validPhone ? `Se enviará a ${normalized}` : 'Falta completar un número válido en formato internacional.'}</Text>
    {error ? <Text style={{ color: Colors.emergency }}>{error}</Text> : null}
    <Pressable onPress={save} style={s.action}><Text style={s.actionText}>{existing ? 'GUARDAR CONTACTO' : 'AÑADIR CONTACTO SOS'}</Text></Pressable>
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
