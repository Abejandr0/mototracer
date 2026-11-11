import React from 'react';
import { Pressable, Switch, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text } from '../components/LocalizedText';
import { Card, Header, Label, Page, screenStyles as s } from '../components/Screen';
import { usePreferences, ThemeChoice } from '../providers/PreferencesProvider';
import { Colors } from '../theme';

const themes: { id: ThemeChoice; label: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'] }[] = [
  { id: 'system', label: 'System', icon: 'theme-light-dark' },
  { id: 'dark', label: 'Dark', icon: 'moon-waning-crescent' },
  { id: 'light', label: 'Light', icon: 'white-balance-sunny' },
];
const languages = [
  { id: 'en', label: 'English', flag: '🇺🇸' },
  { id: 'es', label: 'Español', flag: '🇪🇸' },
  { id: 'pt', label: 'Português · partial', flag: '🇧🇷' },
  { id: 'fr', label: 'Français · partial', flag: '🇫🇷' },
] as const;

export default function SettingsScreen() {
  const preferences = usePreferences();
  const back = () => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile');
  const row = (title: string, description: string, value: boolean, onChange: (value: boolean) => void) => <View style={[s.row, { gap: 16, paddingVertical: 7 }]} key={title}>
    <View style={{ flex: 1 }}><Text style={{ color: Colors.textPrimary, fontSize: 15, fontWeight: '800' }}>{title}</Text><Text style={s.muted}>{description}</Text></View>
    <Switch accessibilityRole="switch" accessibilityLabel={title} accessibilityHint={description} value={value} onValueChange={onChange} trackColor={{ true: Colors.activeTelemetry }} />
  </View>;

  return <Page>
    <Pressable accessibilityRole="button" onPress={back} style={{ alignSelf: 'flex-start', paddingVertical: 5 }}><Text style={{ color: Colors.activeTelemetry, fontWeight: '700' }}>‹ Back</Text></Pressable>
    <Header title="App settings" subtitle="Personaliza la vista y la lectura de MotoTracer." />
    <Label>APPEARANCE</Label>
    <Card>
      <View style={[s.row, { gap: 10 }]}><View style={{ width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.cardElevated }}><MaterialCommunityIcons name="palette-outline" size={20} color={Colors.activeTelemetry} /></View><View style={{ flex: 1 }}><Text style={{ color: Colors.textPrimary, fontWeight: '800' }}>Color theme</Text><Text style={s.muted}>The selected appearance is applied throughout the app.</Text></View></View>
      <View style={{ flexDirection: 'row', gap: 8 }}>{themes.map((choice) => { const selected = preferences.theme === choice.id; return <Pressable accessibilityRole="radio" accessibilityState={{ selected }} key={choice.id} onPress={() => preferences.update({ theme: choice.id })} style={{ flex: 1, minHeight: 86, paddingVertical: 10, paddingHorizontal: 7, gap: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? Colors.cardElevated : Colors.card, borderColor: selected ? Colors.activeTelemetry : Colors.border, borderWidth: selected ? 2 : 1, borderRadius: 14 }}><MaterialCommunityIcons name={choice.icon} size={22} color={selected ? Colors.activeTelemetry : Colors.textSecondary} /><Text style={{ color: selected ? Colors.activeTelemetry : Colors.textPrimary, fontWeight: selected ? '900' : '700', fontSize: 12 }}>{choice.label}</Text>{selected ? <MaterialCommunityIcons name="check-circle" size={16} color={Colors.activeTelemetry} /> : null}</Pressable>; })}</View>
    </Card>
    <Label>LANGUAGE</Label>
    <Card>
      <View style={[s.row, { gap: 10 }]}><View style={{ width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.cardElevated }}><MaterialCommunityIcons name="translate" size={20} color={Colors.activeTelemetry} /></View><Text style={[s.muted, { flex: 1 }]}>Choose the app language. English is the default; other translations are in progress.</Text></View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>{languages.map((choice) => { const selected = preferences.language === choice.id; return <Pressable accessibilityRole="radio" accessibilityState={{ selected }} key={choice.id} onPress={() => preferences.update({ language: choice.id })} style={{ width: '48%', minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 11, borderRadius: 13, borderWidth: selected ? 2 : 1, borderColor: selected ? Colors.activeTelemetry : Colors.border, backgroundColor: selected ? Colors.cardElevated : Colors.card }}><Text style={{ fontSize: 22 }}>{choice.flag}</Text><View style={{ flex: 1 }}><Text style={{ color: selected ? Colors.activeTelemetry : Colors.textPrimary, fontSize: 13, fontWeight: selected ? '900' : '700' }}>{choice.label}</Text></View>{selected ? <MaterialCommunityIcons name="check-circle" size={17} color={Colors.activeTelemetry} /> : null}</Pressable>; })}</View>
    </Card>
    <Label>ACCESSIBILITY</Label>
    <Card>{row('Larger text', 'Amplía el texto en todas las pantallas.', preferences.largeText, (value) => preferences.update({ largeText: value }))}{row('High contrast', 'Aumenta el contraste de textos y controles.', preferences.highContrast, (value) => preferences.update({ highContrast: value }))}{row('Reduce motion', 'Reduce animaciones de navegación y avisos.', preferences.reduceMotion, (value) => preferences.update({ reduceMotion: value }))}<Text style={s.muted}>Respeta también el tamaño de texto del sistema.</Text></Card>
  </Page>;
}
