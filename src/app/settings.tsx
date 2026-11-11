import { Text } from '../components/LocalizedText';
import React from 'react';
import { Pressable, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../theme';
import { Card, Header, Label, Page, screenStyles as s } from '../components/Screen';
import { usePreferences, ThemeChoice } from '../providers/PreferencesProvider';

export default function SettingsScreen() {
  const preferences = usePreferences();
  const row = (title: string, description: string, value: boolean, onChange: (value: boolean) => void) => <View style={[s.row, { gap: 16, paddingVertical: 7 }]} key={title}><View style={{ flex: 1 }}><Text style={{ color: Colors.textPrimary, fontSize: 15, fontWeight: '800' }}>{title}</Text><Text style={s.muted}>{description}</Text></View><Switch accessibilityRole="switch" accessibilityLabel={title} accessibilityHint={description} value={value} onValueChange={onChange} trackColor={{ true: Colors.activeTelemetry }} /></View>;
  return <Page><Pressable onPress={() => router.back()}><Text style={{ color: Colors.activeTelemetry }}>‹ Back</Text></Pressable><Header title="App settings" subtitle="Personaliza la vista y la lectura de MotoTracer." />
    <Label>APPEARANCE</Label><Card><Text style={{ color: Colors.textPrimary, fontWeight: '800' }}>Color theme</Text><View style={{ flexDirection: 'row', gap: 8 }}>{([{ id: 'system', label: 'System' }, { id: 'dark', label: 'Dark' }, { id: 'light', label: 'Light' }] as { id: ThemeChoice; label: string }[]).map((choice) => <Pressable accessibilityRole="button" accessibilityState={{ selected: preferences.theme === choice.id }} key={choice.id} onPress={() => preferences.update({ theme: choice.id })} style={[s.secondary, { flex: 1, paddingHorizontal: 5, borderColor: preferences.theme === choice.id ? Colors.activeTelemetry : Colors.border }]}><Text style={{ color: preferences.theme === choice.id ? Colors.activeTelemetry : Colors.textPrimary, fontWeight: '800' }}>{choice.label}</Text></Pressable>)}</View></Card>
    <Label>LANGUAGE</Label><Card><Text style={s.muted}>Choose the app language. English is the default; other translations are in progress.</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{([{ id: 'en', label: 'English' }, { id: 'es', label: 'Español' }, { id: 'pt', label: 'Português · partial' }, { id: 'fr', label: 'Français · partial' }] as const).map((choice) => <Pressable accessibilityRole="button" accessibilityState={{ selected: preferences.language === choice.id }} key={choice.id} onPress={() => preferences.update({ language: choice.id })} style={[s.secondary, { flex: 1, minWidth: '45%', borderColor: preferences.language === choice.id ? Colors.activeTelemetry : Colors.border }]}><Text style={s.secondaryText}>{choice.label}</Text></Pressable>)}</View></Card>
    <Label>ACCESSIBILITY</Label><Card>{row('Larger text', 'Amplía el texto en todas las pantallas.', preferences.largeText, (value) => preferences.update({ largeText: value }))}{row('High contrast', 'Aumenta el contraste de textos y controles.', preferences.highContrast, (value) => preferences.update({ highContrast: value }))}{row('Reduce motion', 'Reduce animaciones de navegación y avisos.', preferences.reduceMotion, (value) => preferences.update({ reduceMotion: value }))}<Text style={s.muted}>Respeta también el tamaño de texto del sistema.</Text></Card>
  </Page>;
}
