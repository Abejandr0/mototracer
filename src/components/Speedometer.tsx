import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors } from '../theme/colors';

interface SpeedometerProps {
  speed: number;       // km/h
  maxSpeed?: number;
  size?: number;
}

export const Speedometer: React.FC<SpeedometerProps> = ({
  speed,
  maxSpeed = 200,
  size = 180,
}) => {
  const strokeWidth = 12;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  // Arc spans 240 degrees (from 150° to 30° = 240° sweep)
  const arcFraction = 240 / 360;
  const arcLength = circumference * arcFraction;
  const progress = Math.min(speed / maxSpeed, 1);
  const filled = arcLength * progress;
  const empty = arcLength - filled;

  // Rotate so arc starts at bottom-left (150°) going clockwise
  const rotateAngle = 150;

  const cx = size / 2;
  const cy = size / 2;

  // Speed color: green → cyan → orange based on value
  const getSpeedColor = (s: number) => {
    if (s < maxSpeed * 0.4) return Colors.gpsOptimal;
    if (s < maxSpeed * 0.75) return Colors.activeTelemetry;
    return Colors.primaryAction;
  };

  const speedColor = getSpeedColor(speed);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="speedGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={Colors.gpsOptimal} stopOpacity="1" />
            <Stop offset="0.5" stopColor={Colors.activeTelemetry} stopOpacity="1" />
            <Stop offset="1" stopColor={Colors.primaryAction} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        {/* Track */}
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={Colors.gaugeTrack}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${arcLength} ${circumference - arcLength}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform={`rotate(${rotateAngle} ${cx} ${cy})`}
        />
        {/* Fill */}
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke="url(#speedGrad)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${filled} ${circumference - filled}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform={`rotate(${rotateAngle} ${cx} ${cy})`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.speedValue, { color: speedColor }]}>
          {Math.round(speed)}
        </Text>
        <Text style={styles.speedUnit}>KM/H</Text>
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
  speedValue: {
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: -2,
    lineHeight: 56,
  },
  speedUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 2,
    marginTop: 2,
  },
});
