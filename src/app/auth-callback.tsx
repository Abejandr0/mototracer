import { Text } from '../components/LocalizedText';
import { usePreferences } from '../providers/PreferencesProvider';
import React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../theme';
import { useAuth } from '../providers/AuthProvider';

export default function AuthCallbackScreen() {
  usePreferences();
  const { callbackError, session } = useAuth();
  return <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: 26, gap: 16 }}><Text style={{ color: Colors.textPrimary, fontSize: 25, fontWeight: '900', textAlign: 'center' }}>{callbackError ? 'No se pudo confirmar' : session ? 'Correo confirmado' : 'Confirmando tu correo…'}</Text>{callbackError ? <Text style={{ color: Colors.warning, textAlign: 'center' }}>{callbackError}</Text> : !session ? <ActivityIndicator color={Colors.activeTelemetry} /> : null}<Pressable onPress={() => router.replace(session ? '/' : '/auth')}><Text style={{ color: Colors.activeTelemetry }}>Continuar</Text></Pressable></View>;
}
