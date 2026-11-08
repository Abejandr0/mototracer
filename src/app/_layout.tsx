import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '../theme';
import { AppProvider } from '../providers/AppProvider';

export default function RootLayout() {
  return <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.background }}>
    <SafeAreaProvider><AppProvider><StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background }, animation: 'fade' }}>
        <Stack.Screen name="(tabs)" /><Stack.Screen name="ride" options={{ gestureEnabled: false }} />
        <Stack.Screen name="analytics" /><Stack.Screen name="calibration" />
        <Stack.Screen name="sos" options={{ gestureEnabled: false }} />
      </Stack>
    </AppProvider></SafeAreaProvider>
  </GestureHandlerRootView>;
}
