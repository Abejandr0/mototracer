import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '../theme';
import { Speedometer } from '../components/Speedometer';
import { LeanGauge } from '../components/LeanGauge';
import { useSensors } from '../hooks/useSensors';
import { AppHeader } from '../components/AppHeader';

const { width } = Dimensions.get('window');

interface InRideHUDProps {
  onStopRide: () => void;
  onPause: () => void;
  rideSession: {
    startTime: Date;
    maxSpeed: number;
    distance: number;
    maxLeanLeft: number;
    maxLeanRight: number;
  };
  onCrashDetected: () => void;
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const InRideHUD: React.FC<InRideHUDProps> = ({
  onStopRide,
  onPause,
  rideSession,
  onCrashDetected,
}) => {
  const sensors = useSensors(true);
  const [elapsed, setElapsed] = useState(0);
  // Simulate speed from accelerometer magnitude (for demo; real GPS used in prod)
  const [simSpeed, setSimSpeed] = useState(0);
  const crashFired = useRef(false);

  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Date.now() - rideSession.startTime.getTime());
    }, 1000);
    return () => clearInterval(interval);
  }, [rideSession.startTime]);

  // Simulate speed from accelerometer magnitude
  useEffect(() => {
    const magnitude = sensors.accelerationMagnitude;
    // Very basic simulation: magnitude deviation from 1g drives speed change
    const deviation = Math.abs(magnitude - 1) * 30;
    setSimSpeed((prev) => {
      const next = Math.max(0, Math.min(200, prev + (deviation - 2)));
      return Math.round(next * 10) / 10;
    });
  }, [sensors.accelerationMagnitude]);

  // Crash detection
  useEffect(() => {
    if (sensors.isCrashDetected && !crashFired.current) {
      crashFired.current = true;
      onCrashDetected();
    }
    if (!sensors.isCrashDetected) {
      crashFired.current = false;
    }
  }, [sensors.isCrashDetected]);

  // Glow animation for active HUD
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <AppHeader subtitle="In-ride HUD" liveIndicator />

      {/* Top row: duration + GPS */}
      <View style={styles.topRow}>
        <View style={styles.infoChip}>
          <Text style={styles.chipLabel}>DURATION</Text>
          <Text style={styles.chipValue}>{formatDuration(elapsed)}</Text>
        </View>
        <View style={styles.infoChip}>
          <Text style={styles.chipLabel}>DISTANCE</Text>
          <Text style={styles.chipValue}>
            {rideSession.distance.toFixed(1)} km
          </Text>
        </View>
        <View style={[styles.infoChip, { borderColor: Colors.gpsOptimal }]}>
          <Text style={styles.chipLabel}>GPS</Text>
          <Text style={[styles.chipValue, { color: Colors.gpsOptimal }]}>4/4</Text>
        </View>
      </View>

      {/* Main gauges */}
      <View style={styles.gaugesRow}>
        <View style={styles.speedContainer}>
          <Animated.View style={{ opacity: glowOpacity }}>
            <View style={styles.speedGlow} />
          </Animated.View>
          <Speedometer speed={simSpeed} size={width * 0.52} />
        </View>

        <View style={styles.sidePanel}>
          <LeanGauge angle={sensors.leanAngle} size={150} />
          <Text style={styles.leanLabel}>LEAN ANGLE</Text>
        </View>
      </View>

      {/* Real-time telemetry row */}
      <View style={styles.telemetryRow}>
        {[
          {
            label: 'MAX SPEED',
            value: `${rideSession.maxSpeed.toFixed(0)}`,
            unit: 'km/h',
            color: Colors.primaryAction,
          },
          {
            label: 'MAX LEAN L',
            value: `${Math.abs(rideSession.maxLeanLeft).toFixed(1)}°`,
            color: Colors.activeTelemetry,
          },
          {
            label: 'MAX LEAN R',
            value: `${rideSession.maxLeanRight.toFixed(1)}°`,
            color: Colors.activeTelemetry,
          },
          {
            label: 'G-FORCE',
            value: `${sensors.accelerationMagnitude.toFixed(2)}`,
            unit: 'G',
            color:
              sensors.accelerationMagnitude > 2
                ? Colors.emergency
                : Colors.textPrimary,
          },
        ].map((item) => (
          <View key={item.label} style={styles.telemetryChip}>
            <Text style={styles.telemetryLabel}>{item.label}</Text>
            <Text style={[styles.telemetryValue, { color: item.color }]}>
              {item.value}
            </Text>
            {item.unit && <Text style={styles.telemetryUnit}>{item.unit}</Text>}
          </View>
        ))}
      </View>

      {/* Action buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.btnStop} onPress={onStopRide}>
          <Text style={styles.btnStopText}>PARAR RODADA</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnPause} onPress={onPause}>
          <Text style={styles.btnPauseText}>Pause</Text>
        </TouchableOpacity>
      </View>

      {/* Emergency SOS */}
      <View style={styles.sosRow}>
        <View style={styles.sosBadge}>
          <View style={styles.sosDot} />
          <Text style={styles.sosText}>CRASH DETECTION ACTIVE</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },

  topRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },
  infoChip: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  chipLabel: {
    fontSize: 9,
    color: Colors.textTertiary,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  chipValue: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },

  gaugesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.base,
    gap: Spacing.sm,
  },
  speedContainer: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  speedGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.activeTelemetry,
    opacity: 0.06,
    zIndex: -1,
  },
  sidePanel: { alignItems: 'center', flex: 1 },
  leanLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 1.2,
    marginTop: 4,
  },

  telemetryRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.base,
    gap: Spacing.sm,
  },
  telemetryChip: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  telemetryLabel: {
    fontSize: 8,
    color: Colors.textTertiary,
    fontWeight: '600',
    letterSpacing: 0.6,
    marginBottom: 2,
    textAlign: 'center',
  },
  telemetryValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  telemetryUnit: {
    fontSize: 9,
    color: Colors.textTertiary,
    fontWeight: '500',
  },

  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  btnStop: {
    flex: 2,
    backgroundColor: Colors.primaryAction,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: Colors.primaryAction,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  btnStopText: {
    color: Colors.textPrimary,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.8,
  },
  btnPause: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnPauseText: {
    color: Colors.textSecondary,
    fontWeight: '700',
    fontSize: 14,
  },

  sosRow: {
    alignItems: 'center',
    marginTop: Spacing.base,
  },
  sosBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,23,68,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.emergency,
  },
  sosDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.emergency,
  },
  sosText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.emergency,
    letterSpacing: 0.8,
  },
});
