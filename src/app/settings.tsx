import React from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../theme';
import { Card, Header, Label, Page, screenStyles as s } from '../components/Screen';
import { usePreferences, ThemeChoice } from '../providers/PreferencesProvider';

export default function SettingsScreen() {
  const preferences = usePreferences();
  const row = (title: string, description: string, value: boolean, onChange: (value: boolean) => void) => <View style={[s.row, { gap: 16, paddingVertical: 7 }]} key={title}><View style={{ flex: 1 }}><Text style={{ color: Colors.textPrimary, fontSize: 15, fontWeight: '800' }}>{title}</Text><Text style={s.muted}>{description}</Text></View><Switch value={value} onValueChange={onChange} trackColor={{ true: Colors.activeTelemetry }} /></View>;
  return <Page><Pressable onPress={() => router.back()}><Text style={{ color: Colors.activeTelemetry }}>‹ Volver</Text></Pressable><Header title="Ajustes de la app" subtitle="Personaliza la vista y la lectura de MotoTracer." />
    <Label>APARIENCIA</Label><Card><Text style={{ color: Colors.textPrimary, fontWeight: '800' }}>Modo de color</Text><View style={{ flexDirection: 'row', gap: 8 }}>{([{ id: 'system', label: 'Sistema' }, { id: 'dark', label: 'Oscuro' }, { id: 'light', label: 'Claro' }] as { id: ThemeChoice; label: string }[]).map((choice) => <Pressable key={choice.id} onPress={() => preferences.update({ theme: choice.id })} style={[s.secondary, { flex: 1, paddingHorizontal: 5, borderColor: preferences.theme === choice.id ? Colors.activeTelemetry : Colors.border }]}><Text style={{ color: preferences.theme === choice.id ? Colors.activeTelemetry : Colors.textPrimary, fontWeight: '800' }}>{choice.label}</Text></Pressable>)}</View></Card>
    <Label>IDIOMA</Label><Card><Text style={s.muted}>El idioma principal de la app es español. Puedes cambiar la navegación y las pantallas principales a inglés.</Text><View style={{ flexDirection: 'row', gap: 8 }}><Pressable onPress={() => preferences.update({ language: 'es' })} style={[s.secondary, { flex: 1, borderColor: preferences.language === 'es' ? Colors.activeTelemetry : Colors.border }]}><Text style={s.secondaryText}>Español</Text></Pressable><Pressable onPress={() => preferences.update({ language: 'en' })} style={[s.secondary, { flex: 1, borderColor: preferences.language === 'en' ? Colors.activeTelemetry : Colors.border }]}><Text style={s.secondaryText}>English · beta</Text></Pressable></View></Card>
    <Label>ACCESIBILIDAD</Label><Card>{row('Texto más grande', 'Amplía títulos, indicadores y acciones principales.', preferences.largeText, (value) => preferences.update({ largeText: value }))}{row('Alto contraste', 'Refuerza textos secundarios y bordes.', preferences.highContrast, (value) => preferences.update({ highContrast: value }))}{row('Reducir movimiento', 'Desactiva las animaciones del menú y del aviso SOS.', preferences.reduceMotion, (value) => preferences.update({ reduceMotion: value }))}<Text style={s.muted}>MotoTracer también respeta el tamaño de texto configurado en el teléfono.</Text></Card>
  </Page>;
}
