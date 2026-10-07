import React, { useState, useCallback } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { Colors } from './src/theme';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { InRideHUD } from './src/screens/InRideHUD';
import { PostRideAnalytics } from './src/screens/PostRideAnalytics';
import { CrashDetectionScreen } from './src/screens/CrashDetectionScreen';
import { useRideStore } from './src/hooks/useRideStore';
import { useSensors } from './src/hooks/useSensors';

type Screen = 'dashboard' | 'inRide' | 'postRide' | 'crash';

export default function App() {
  const [screen, setScreen] = useState<Screen>('dashboard');
  const rideStore = useRideStore();
  const sensors = useSensors(screen === 'inRide');

  const handleStartRide = useCallback(() => {
    rideStore.startRide();
    setScreen('inRide');
  }, [rideStore]);

  const handleStopRide = useCallback(() => {
    const session = rideStore.stopRide();
    setScreen('postRide');
  }, [rideStore]);

  const handleCrashDetected = useCallback(() => {
    setScreen('crash');
  }, []);

  const handleCancelCrash = useCallback(() => {
    // If we were riding, go back to HUD; otherwise go to dashboard
    setScreen(rideStore.isRiding ? 'inRide' : 'dashboard');
  }, [rideStore.isRiding]);

  const handleSOSTriggered = useCallback(() => {
    // SOS sent — in a real app, call emergency services API here
    console.warn('[MotoTracer] SOS TRIGGERED — sending emergency alert');
  }, []);

  // Update ride metrics while riding
  React.useEffect(() => {
    if (screen === 'inRide' && rideStore.isRiding) {
      // Approximate speed from accel magnitude for demo
      const magnitude = sensors.accelerationMagnitude;
      const approxSpeed = Math.max(0, (magnitude - 1) * 40);
      rideStore.updateMetrics(approxSpeed, sensors.leanAngle);
    }
  }, [sensors, screen, rideStore.isRiding]);

  const completedSession = rideStore.history[0] ?? null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={Colors.background} />

        {screen === 'dashboard' && (
          <DashboardScreen
            navigation={null as any}
            onStartRide={handleStartRide}
          />
        )}

        {screen === 'inRide' && rideStore.session && (
          <InRideHUD
            onStopRide={handleStopRide}
            onPause={() => {}}
            rideSession={rideStore.session}
            onCrashDetected={handleCrashDetected}
          />
        )}

        {screen === 'postRide' && completedSession && (
          <PostRideAnalytics
            session={completedSession}
            onStartNewRide={handleStartRide}
            onGoHome={() => setScreen('dashboard')}
          />
        )}

        {screen === 'crash' && (
          <CrashDetectionScreen
            onCancel={handleCancelCrash}
            onSOS={handleSOSTriggered}
            location={null}
          />
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
