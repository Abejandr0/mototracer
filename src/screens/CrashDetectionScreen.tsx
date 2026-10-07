import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  StatusBar,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Spacing, Radius } from '../theme';

const { width } = Dimensions.get('window');
const COUNTDOWN_SECONDS = 30;
const SLIDER_WIDTH = width - Spacing.base * 4;
const SLIDER_KNOB = 56;

interface CrashDetectionProps {
  onCancel: () => void;
  onSOS: () => void;
  location?: { lat: number; lng: number } | null;
}

export const CrashDetectionScreen: React.FC<CrashDetectionProps> = ({
  onCancel,
  onSOS,
  location,
}) => {
  const [remaining, setRemaining] = useState(COUNTDOWN_SECONDS);
  const [cancelled, setCancelled] = useState(false);
  const [triggered, setTriggered] = useState(false);
  const sliderX = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;
  const sliderPos = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pulse the outer ring
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (cancelled) return;
    Vibration.vibrate([500, 200, 500]);

    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setTriggered(true);
          onSOS();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      Vibration.cancel();
    };
  }, [cancelled]);

  // Arc progress (SVG)
  const SIZE = 220;
  const STROKE = 14;
  const R = (SIZE - STROKE * 2) / 2;
  const CIRC = 2 * Math.PI * R;
  const progress = remaining / COUNTDOWN_SECONDS;
  const dashOffset = CIRC * (1 - progress);

  // Slider pan responder
  const maxSlide = SLIDER_WIDTH - SLIDER_KNOB;
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, g) => {
      const newX = Math.max(0, Math.min(maxSlide, g.dx));
      sliderPos.current = newX;
      sliderX.setValue(newX);
    },
    onPanResponderRelease: () => {
      if (sliderPos.current >= maxSlide * 0.85) {
        // Full slide — cancel!
        setCancelled(true);
        if (timerRef.current) clearInterval(timerRef.current);
        Vibration.cancel();
        onCancel();
      } else {
        // Spring back
        Animated.spring(sliderX, {
          toValue: 0,
          useNativeDriver: false,
          tension: 80,
          friction: 12,
        }).start();
        sliderPos.current = 0;
      }
    },
  });

  const fillColor = remaining > 15
    ? Colors.emergency
    : remaining > 8
    ? Colors.warning
    : Colors.emergency;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Alert header */}
      <View style={styles.alertBanner}>
        <Text style={styles.alertBannerText}>
          ⚠ CRASH DETECTED — HEAVY IMPACT G-FORCE
        </Text>
      </View>

      {/* Countdown ring */}
      <View style={styles.countdownWrapper}>
        <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />

        <Svg width={SIZE} height={SIZE}>
          {/* Track */}
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            stroke={Colors.surface}
            strokeWidth={STROKE}
            fill="none"
          />
          {/* Progress arc */}
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            stroke={fillColor}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={CIRC}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </Svg>

        <View style={styles.countdownCenter}>
          <Text style={styles.countdownNumber}>{remaining}</Text>
          <Text style={styles.countdownLabel}>seconds</Text>
          <Text style={styles.countdownSubLabel}>until SOS</Text>
        </View>
      </View>

      {/* Coordinates */}
      {location && (
        <Text style={styles.coordsText}>
          📍 {location.lat.toFixed(4)}° N  {location.lng.toFixed(4)}° W
        </Text>
      )}
      {!location && (
        <Text style={styles.coordsText}>📍 Acquiring location…</Text>
      )}

      <Text style={styles.subtitle}>
        Sending SOS with GPS coordinates automatically.{'\n'}
        Slide to cancel if you are okay.
      </Text>

      {/* Cancel slider */}
      <View style={styles.sliderContainer} {...panResponder.panHandlers}>
        <View style={styles.sliderTrack}>
          <Text style={styles.sliderHint}>← Slide to cancel</Text>
          <Animated.View
            style={[
              styles.sliderKnob,
              { transform: [{ translateX: sliderX }] },
            ]}
          >
            <Text style={styles.sliderKnobIcon}>✕</Text>
          </Animated.View>
        </View>
      </View>

      {/* SOS label */}
      <View style={styles.sosBottomChip}>
        <Text style={styles.sosBottomText}>🚨 EMERGENCY SOS ACTIVE</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },

  alertBanner: {
    width: '100%',
    backgroundColor: Colors.emergency,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    alignItems: 'center',
  },
  alertBannerText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
  },

  countdownWrapper: {
    marginTop: Spacing.xxl,
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,23,68,0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255,23,68,0.3)',
  },
  countdownCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  countdownNumber: {
    fontSize: 72,
    fontWeight: '900',
    color: Colors.emergency,
    letterSpacing: -4,
    lineHeight: 76,
  },
  countdownLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 4,
  },
  countdownSubLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontWeight: '500',
  },

  coordsText: {
    marginTop: Spacing.base,
    fontSize: 13,
    color: Colors.activeTelemetry,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },

  subtitle: {
    marginTop: Spacing.sm,
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.xxl,
  },

  sliderContainer: {
    marginTop: Spacing.xxl,
    paddingHorizontal: Spacing.base * 2,
    width: '100%',
  },
  sliderTrack: {
    width: SLIDER_WIDTH,
    height: 60,
    backgroundColor: Colors.card,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.emergency,
    justifyContent: 'center',
    paddingLeft: SLIDER_KNOB + 8,
    overflow: 'hidden',
  },
  sliderHint: {
    fontSize: 13,
    color: Colors.textTertiary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  sliderKnob: {
    position: 'absolute',
    left: 4,
    width: SLIDER_KNOB,
    height: 52,
    borderRadius: Radius.full,
    backgroundColor: Colors.emergency,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.emergency,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  sliderKnobIcon: {
    fontSize: 20,
    color: Colors.textPrimary,
    fontWeight: '700',
  },

  sosBottomChip: {
    marginTop: Spacing.xl,
    backgroundColor: 'rgba(255,23,68,0.15)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.emergency,
  },
  sosBottomText: {
    color: Colors.emergency,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
