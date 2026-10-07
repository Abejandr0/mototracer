import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors } from '../theme/colors';

interface LeanGaugeProps {
  angle: number;   // degrees, negative = left, positive = right
  maxAngle?: number;
  size?: number;
}

export const LeanGauge: React.FC<LeanGaugeProps> = ({
  angle,
  maxAngle = 60,
  size = 160,
}) => {
  const animAngle = useRef(new Animated.Value(angle)).current;

  useEffect(() => {
    Animated.spring(animAngle, {
      toValue: angle,
      tension: 80,
      friction: 10,
      useNativeDriver: false,
    }).start();
  }, [angle]);

  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 8;
  const innerR = size / 2 - 20;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * outerR;

  // Arc for lean: 180° span centred at top
  const arcFraction = 180 / 360;
  const arcLength = circumference * arcFraction;
  const progress = Math.abs(angle) / maxAngle;
  const filled = arcLength * Math.min(progress, 1);

  // Needle line from center to edge
  const rad = ((-90 + angle) * Math.PI) / 180;
  const needleX = cx + outerR * Math.cos(rad);
  const needleY = cy + outerR * Math.sin(rad);

  // Color by severity
  const getColor = (a: number) => {
    const abs = Math.abs(a);
    if (abs < 20) return Colors.gpsOptimal;
    if (abs < 40) return Colors.activeTelemetry;
    return Colors.primaryAction;
  };
  const leanColor = getColor(angle);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="leanGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={Colors.gpsOptimal} />
            <Stop offset="0.5" stopColor={Colors.activeTelemetry} />
            <Stop offset="1" stopColor={Colors.primaryAction} />
          </LinearGradient>
        </Defs>
        {/* Background arc track — top half only */}
        <Circle
          cx={cx}
          cy={cy}
          r={outerR}
          stroke={Colors.gaugeTrack}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${arcLength} ${circumference - arcLength}`}
          strokeDashoffset={circumference * 0.25}
          strokeLinecap="round"
        />
        {/* Filled arc */}
        {filled > 0 && (
          <Circle
            cx={cx}
            cy={cy}
            r={outerR}
            stroke={leanColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${filled} ${circumference - filled}`}
            strokeDashoffset={angle >= 0 ? circumference * 0.25 : circumference * 0.25 + (arcLength - filled)}
            strokeLinecap="round"
          />
        )}
        {/* Center dot */}
        <Circle cx={cx} cy={cy} r={4} fill={Colors.textSecondary} />
        {/* Needle */}
        <Line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke={leanColor}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.angleValue, { color: leanColor }]}>
          {Math.abs(Math.round(angle))}°
        </Text>
        <Text style={styles.angleLabel}>
          {angle < -1 ? 'LEFT' : angle > 1 ? 'RIGHT' : 'CENTER'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  angleValue: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },
  angleLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 1.5,
    marginTop: 2,
  },
});
