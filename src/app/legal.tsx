import { Text } from '../components/LocalizedText';
import { usePreferences } from '../providers/PreferencesProvider';
import React from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Card, Header, Page } from '../components/Screen';
import { Colors } from '../theme';
import { LEGAL_VERSION, privacySections, termsSections } from '../content/legal';

export default function LegalScreen() {
  usePreferences();
  const { type } = useLocalSearchParams<{ type?: string }>();
  const privacy = type !== 'terms';
  return <Page><Header title={privacy ? 'Privacidad' : 'Términos de uso'} subtitle={`Versión ${LEGAL_VERSION}`} />
    <Pressable onPress={() => router.back()}><Text style={{ color: Colors.activeTelemetry, fontWeight: '700' }}>‹ Volver</Text></Pressable>
    {(privacy ? privacySections : termsSections).map((section) => <Card key={section.title}><Text style={{ color: Colors.textPrimary, fontSize: 17, fontWeight: '800' }}>{section.title}</Text><Text style={{ color: Colors.textSecondary, fontSize: 14, lineHeight: 22 }}>{section.body}</Text></Card>)}
    <View style={{ height: 20 }} />
  </Page>;
}
