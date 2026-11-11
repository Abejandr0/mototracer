import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme';
import { useAppData } from '../providers/AppProvider';
import { screenStyles as s } from '../components/Screen';

const field = { color: Colors.textPrimary, backgroundColor: Colors.card, borderColor: Colors.border, borderWidth: 1, borderRadius: 12, padding: 15 } as const;
export default function ContactFormScreen() {
  const { addContact, contacts } = useAppData(); const [name, setName] = useState(''); const [phone, setPhone] = useState('');
  return <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 22, gap: 14 }}><Pressable onPress={() => router.back()}><Text style={{ color: Colors.activeTelemetry }}>‹ Volver</Text></Pressable><Text style={{ color: Colors.textPrimary, fontSize: 29, fontWeight: '900' }}>Contacto SOS</Text><Text style={s.muted}>Usa el teléfono con indicativo de país, por ejemplo +57… Avisa a esta persona que la añadiste como contacto de emergencia.</Text><TextInput placeholder="Nombre" placeholderTextColor={Colors.textTertiary} value={name} onChangeText={setName} style={field} /><TextInput placeholder="Teléfono · +57…" placeholderTextColor={Colors.textTertiary} value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={field} /><Pressable onPress={() => { if (contacts.length >= 5) { Alert.alert('Límite de contactos', 'Puedes guardar hasta cinco contactos SOS.'); return; } const normalized = phone.replace(/[\s()-]/g, ''); if (!name.trim() || !/^\+[1-9]\d{7,14}$/.test(normalized)) { Alert.alert('Revisa los datos', 'Añade un nombre y un número internacional con + e indicativo de país.'); return; } addContact({ name: name.trim(), phone: normalized }); router.back(); }} style={s.action}><Text style={s.actionText}>GUARDAR CONTACTO</Text></Pressable></ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
