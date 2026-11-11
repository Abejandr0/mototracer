import { usePreferences } from '../providers/PreferencesProvider';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme';
import { screenStyles as s } from '../components/Screen';

const slides = [
  { icon: '◉', eyebrow: '01 / 03  ·  EXPLORA', title: 'Cada curva cuenta', body: 'Graba la distancia, velocidad, tiempo e inclinación de tus rodadas con el GPS y los sensores de tu teléfono.' },
  { icon: '⌁', eyebrow: '02 / 03  ·  CUIDA', title: 'Tu moto, al día', body: 'Organiza hasta cinco motocicletas, sigue el odómetro y registra servicios para planear el siguiente mantenimiento.' },
  { icon: '✦', eyebrow: '03 / 03  ·  COMPARTE', title: 'Rueda en comunidad', body: 'Descubre rutas de otros bikers, publica tus recorridos y repite una ruta para comparar tus resultados.' },
];
export default function WelcomeScreen() {
  usePreferences();
  const [index, setIndex] = useState(0);
  const slide = slides[index];
  return <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background, padding: 26, justifyContent: 'space-between' }}>
    <View><Text style={{ color: Colors.textTertiary, fontSize: 11, letterSpacing: 2, fontWeight: '900', textAlign: 'center' }}>MOTOTRACER</Text><Text style={{ color: Colors.activeTelemetry, marginTop: 42, fontWeight: '800' }}>{slide.eyebrow}</Text></View>
    <View style={{ alignItems: 'center', gap: 22 }}><View style={{ width: 176, height: 176, borderRadius: 88, borderWidth: 2, borderColor: Colors.activeTelemetry, backgroundColor: '#112B31', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: Colors.activeTelemetry, fontSize: 94 }}>{slide.icon}</Text></View><Text style={{ color: Colors.textPrimary, fontWeight: '900', fontSize: 35, textAlign: 'center' }}>{slide.title}</Text><Text style={{ color: Colors.textSecondary, fontSize: 16, lineHeight: 25, textAlign: 'center' }}>{slide.body}</Text></View>
    <View style={{ gap: 18 }}><View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>{slides.map((_, dot) => <View key={dot} style={{ width: dot === index ? 25 : 8, height: 8, borderRadius: 5, backgroundColor: dot === index ? Colors.activeTelemetry : Colors.border }} />)}</View><Pressable onPress={() => index < slides.length - 1 ? setIndex(index + 1) : router.replace('/auth')} style={s.action}><Text style={s.actionText}>{index < slides.length - 1 ? 'SIGUIENTE' : 'COMENZAR'}</Text></Pressable><Pressable onPress={() => router.replace('/auth')}><Text style={{ color: Colors.textSecondary, textAlign: 'center', padding: 6 }}>Ya tengo cuenta</Text></Pressable></View>
  </SafeAreaView>;
}
