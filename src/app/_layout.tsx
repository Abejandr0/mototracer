import { Stack, router, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '../theme';
import { AppProvider, useAppData } from '../providers/AppProvider';
import { AuthProvider, useAuth } from '../providers/AuthProvider';
import { PreferencesProvider, usePreferences } from '../providers/PreferencesProvider';
import '../services/backgroundLocationTask';

function AppStack() {
  const { resolvedTheme, reduceMotion } = usePreferences();
  const { session, loading } = useAuth();
  const { ready, profileComplete } = useAppData();
  const pathname = usePathname();
  useEffect(() => { void SystemUI.setBackgroundColorAsync(Colors.background).catch(() => undefined); }, [resolvedTheme]);
  useEffect(() => {
    if (loading || !ready) return;
    if (!session) { if (!['/welcome', '/auth', '/legal', '/email-pending', '/auth-callback', '/'].includes(pathname)) router.replace('/welcome'); return; }
    if (!profileComplete) { if (pathname !== '/profile-setup' && pathname !== '/legal') router.replace('/profile-setup'); return; }
    if (['/', '/welcome', '/auth', '/profile-setup'].includes(pathname)) router.replace('/(tabs)');
  }, [session, loading, ready, profileComplete, pathname]);
  return <><StatusBar style={resolvedTheme === 'light' ? 'dark' : 'light'} />
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background }, animation: reduceMotion ? 'none' : 'fade' }}>
      <Stack.Screen name="index" /><Stack.Screen name="welcome" /><Stack.Screen name="auth" /><Stack.Screen name="email-pending" /><Stack.Screen name="auth-callback" /><Stack.Screen name="legal" /><Stack.Screen name="profile-setup" /><Stack.Screen name="vehicle-form" /><Stack.Screen name="vehicle-suggestion" /><Stack.Screen name="service-form" /><Stack.Screen name="odometer" /><Stack.Screen name="share-ride" /><Stack.Screen name="shared-route" /><Stack.Screen name="edit-profile" /><Stack.Screen name="contact-form" /><Stack.Screen name="settings" />
      <Stack.Screen name="(tabs)" /><Stack.Screen name="ride" options={{ gestureEnabled: false }} />
      <Stack.Screen name="analytics" /><Stack.Screen name="calibration" />
      <Stack.Screen name="sos" options={{ gestureEnabled: false }} />
    </Stack></>;
}
export default function RootLayout() {
  return <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.background }}>
    <SafeAreaProvider><PreferencesProvider><AuthProvider><AppProvider><AppStack /></AppProvider></AuthProvider></PreferencesProvider></SafeAreaProvider>
  </GestureHandlerRootView>;
}
