import { Stack, router, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '../theme';
import { AppProvider, useAppData } from '../providers/AppProvider';
import { AuthProvider, useAuth } from '../providers/AuthProvider';
import '../services/backgroundLocationTask';

function AppStack() {
  const { session, loading } = useAuth();
  const { ready, profileComplete, vehicles } = useAppData();
  const pathname = usePathname();
  useEffect(() => {
    if (loading || !ready) return;
    if (!session) { if (!['/welcome', '/auth', '/legal', '/'].includes(pathname)) router.replace('/welcome'); return; }
    if (!profileComplete) { if (pathname !== '/profile-setup' && pathname !== '/legal') router.replace('/profile-setup'); return; }
    if (!vehicles.length) { if (!['/vehicle-form', '/vehicle-suggestion', '/legal'].includes(pathname)) router.replace('/vehicle-form?setup=1'); return; }
    if (['/', '/welcome', '/auth', '/profile-setup'].includes(pathname)) router.replace('/(tabs)');
  }, [session, loading, ready, profileComplete, vehicles.length, pathname]);
  return <><StatusBar style="light" />
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background }, animation: 'fade' }}>
      <Stack.Screen name="index" /><Stack.Screen name="welcome" /><Stack.Screen name="auth" /><Stack.Screen name="legal" /><Stack.Screen name="profile-setup" /><Stack.Screen name="vehicle-form" /><Stack.Screen name="vehicle-suggestion" /><Stack.Screen name="service-form" /><Stack.Screen name="odometer" /><Stack.Screen name="share-ride" /><Stack.Screen name="shared-route" /><Stack.Screen name="edit-profile" /><Stack.Screen name="contact-form" />
      <Stack.Screen name="(tabs)" /><Stack.Screen name="ride" options={{ gestureEnabled: false }} />
      <Stack.Screen name="analytics" /><Stack.Screen name="calibration" />
      <Stack.Screen name="sos" options={{ gestureEnabled: false }} />
    </Stack></>;
}
export default function RootLayout() {
  return <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.background }}>
    <SafeAreaProvider><AuthProvider><AppProvider><AppStack /></AppProvider></AuthProvider></SafeAreaProvider>
  </GestureHandlerRootView>;
}
