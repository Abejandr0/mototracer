import React, { useEffect, useRef, useState } from 'react';
import { Accelerometer, Gyroscope } from 'expo-sensors';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '../components/LocalizedText';
import { usePreferences } from '../providers/PreferencesProvider';
import { Colors } from '../theme';
import { Card, Header, Label, Page, screenStyles as s } from '../components/Screen';
import { useAppData } from '../providers/AppProvider';

type Reading = { x: number; y: number; z: number };
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function CalibrationScreen() {
  usePreferences();
  const [reading, setReading] = useState<Reading>({ x: 0, y: 0, z: 0 });
  const [tilt, setTilt] = useState<Reading>({ x: 0, y: 0, z: 1 });
  const [sampleCount, setSampleCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const { calibration, updateCalibration } = useAppData();
  const gyroReadings = useRef<Reading[]>([]);
  const leanReadings = useRef<number[]>([]);

  useEffect(() => {
    Accelerometer.setUpdateInterval(100);
    Gyroscope.setUpdateInterval(100);
    const accel = Accelerometer.addListener((value) => {
      setTilt(value);
      leanReadings.current.push(Math.atan2(value.x, Math.sqrt(value.y * value.y + value.z * value.z)) * 180 / Math.PI);
      if (leanReadings.current.length > 100) leanReadings.current.shift();
      setSampleCount(Math.min(100, leanReadings.current.length));
    });
    const gyro = Gyroscope.addListener((value) => {
      setReading(value);
      gyroReadings.current.push(value);
      if (gyroReadings.current.length > 100) gyroReadings.current.shift();
    });
    return () => { accel.remove(); gyro.remove(); };
  }, []);

  const calibrate = () => {
    if (gyroReadings.current.length < 20 || leanReadings.current.length < 20) return;
    const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
    const axes = ['x', 'y', 'z'] as const;
    const gyroOffset = Object.fromEntries(axes.map((axis) => [axis, mean(gyroReadings.current.map((item) => item[axis]))])) as Reading;
    updateCalibration({ gx: gyroOffset.x, gy: gyroOffset.y, gz: gyroOffset.z, leanOffset: mean(leanReadings.current), calibratedAt: new Date().toISOString() });
    setSaved(true);
  };
  const back = () => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile');
  const samplePercent = sampleCount;
  const rows = [{ key: 'X', v: reading.x - calibration.gx }, { key: 'Y', v: reading.y - calibration.gy }, { key: 'Z', v: reading.z - calibration.gz }];
  const bubbleX = clamp(tilt.x * 42, -36, 36);
  const bubbleY = clamp(-tilt.y * 42, -36, 36);

  return <Page>
    <Pressable accessibilityRole="button" onPress={back} style={{ alignSelf: 'flex-start', paddingVertical: 4 }}><Text style={{ color: Colors.activeTelemetry, fontWeight: '700' }}>‹ Back</Text></Pressable>
    <Header title="Gyroscope calibration" subtitle="Set a reliable reference before your ride." />
    <Card style={{ gap: 15 }}>
      <View style={[s.row, { gap: 12 }]}><View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: Colors.cardElevated, justifyContent: 'center', alignItems: 'center' }}><MaterialCommunityIcons name="phone-rotate-landscape" size={23} color={Colors.activeTelemetry} /></View><View style={{ flex: 1 }}><Text style={{ color: Colors.textPrimary, fontWeight: '900', fontSize: 16 }}>Keep the phone still</Text><Text style={s.muted}>Park first. Secure the phone in the riding mount and keep the motorcycle upright on level ground.</Text></View></View>
      <View accessibilityLabel={`Live level sensor, ${Math.round(Math.atan2(tilt.x, Math.sqrt(tilt.y * tilt.y + tilt.z * tilt.z)) * 180 / Math.PI)} degrees`} style={{ height: 210, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 190, height: 190, borderRadius: 100, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.cardElevated, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 130, height: 130, borderRadius: 70, borderWidth: 1, borderColor: Colors.textTertiary, alignItems: 'center', justifyContent: 'center' }} />
          <View style={{ position: 'absolute', width: 72, height: 72, borderRadius: 40, borderWidth: 1, borderColor: Colors.activeTelemetry, opacity: .5 }} />
          <View style={{ position: 'absolute', width: 16, height: 16, borderRadius: 9, backgroundColor: Colors.activeTelemetry, borderWidth: 3, borderColor: Colors.card, transform: [{ translateX: bubbleX }, { translateY: bubbleY }] }} />
          <Text style={{ position: 'absolute', top: 15, color: Colors.textTertiary, fontSize: 10, fontWeight: '900', letterSpacing: 1 }}>LEVEL</Text>
          <Text style={{ position: 'absolute', bottom: 15, color: Colors.textSecondary, fontSize: 10, fontWeight: '800' }}>{Math.round(Math.atan2(tilt.x, Math.sqrt(tilt.y * tilt.y + tilt.z * tilt.z)) * 180 / Math.PI)}°</Text>
        </View>
      </View>
      <View style={[s.row, { gap: 10 }]}><Text style={{ color: Colors.textSecondary, fontSize: 12, fontWeight: '700' }}>Sensor samples</Text><Text style={{ color: samplePercent >= 100 ? Colors.gpsOptimal : Colors.activeTelemetry, fontSize: 12, fontWeight: '900' }}>{sampleCount} / 100</Text></View>
      <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: samplePercent }} style={{ height: 7, borderRadius: 8, backgroundColor: Colors.surface, overflow: 'hidden' }}><View style={{ height: 7, width: `${samplePercent}%`, borderRadius: 8, backgroundColor: Colors.activeTelemetry }} /></View>
      <Text style={{ color: Colors.textTertiary, fontSize: 11 }}>{sampleCount < 20 ? 'Collecting sensor readings. Keep the phone in position for a few seconds.' : saved ? 'Calibration saved. You can repeat it after changing the phone mount.' : 'Readings are ready. Keep the bike steady while calibrating.'}</Text>
    </Card>
    <Card>
      <View style={[s.row, { marginBottom: 4 }]}><Label>LIVE GYROSCOPE · RAD/S</Label><View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.gpsOptimal }} /><Text style={{ color: Colors.gpsOptimal, fontSize: 10, fontWeight: '900' }}>LIVE</Text></View></View>
      {rows.map((row) => <View key={row.key} style={[s.row, { paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: Colors.border }]}><Text style={{ color: Colors.textSecondary, fontWeight: '700' }}>Axis {row.key}</Text><Text style={{ color: Colors.activeTelemetry, fontWeight: '800' }}>{row.v.toFixed(3)}</Text></View>)}
      <Text style={s.muted}>Calibration subtracts the current sensor bias before using the lean reading.</Text>
    </Card>
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: sampleCount < 20 }} disabled={sampleCount < 20} onPress={calibrate} style={[s.action, { opacity: sampleCount < 20 ? .45 : 1 }]}><Text style={s.actionText}>{saved ? 'CALIBRATION SAVED · CALIBRATE AGAIN' : 'SAVE CALIBRATION'}</Text></Pressable>
    <Text style={{ color: Colors.textTertiary, textAlign: 'center', fontSize: 11 }}>{calibration.calibratedAt ? `Last calibrated: ${new Date(calibration.calibratedAt).toLocaleString()}` : 'No calibration saved yet'}</Text>
  </Page>;
}
