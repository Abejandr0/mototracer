import { usePreferences } from '../providers/PreferencesProvider';
import React, { useEffect, useRef, useState } from 'react';
import { Accelerometer, Gyroscope } from 'expo-sensors';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../theme';
import { Card, Header, Label, Page, screenStyles as s } from '../components/Screen';
import { useAppData } from '../providers/AppProvider';

export default function CalibrationScreen() {
  usePreferences();
  type Reading = { x: number; y: number; z: number };
  const [reading, setReading] = useState<Reading>({ x: 0, y: 0, z: 0 });
  const { calibration, updateCalibration } = useAppData();
  const gyroReadings = useRef<Reading[]>([]);
  const leanReadings = useRef<number[]>([]);
  useEffect(() => {
    Accelerometer.setUpdateInterval(100); Gyroscope.setUpdateInterval(100);
    const accel = Accelerometer.addListener(({ x, y, z }) => { leanReadings.current.push(Math.atan2(x, Math.sqrt(y * y + z * z)) * 180 / Math.PI); if (leanReadings.current.length > 100) leanReadings.current.shift(); });
    const gyro = Gyroscope.addListener((value) => { setReading(value); gyroReadings.current.push(value); if (gyroReadings.current.length > 100) gyroReadings.current.shift(); });
    return () => { accel.remove(); gyro.remove(); };
  }, []);
  const calibrate = () => {
    if (!gyroReadings.current.length || !leanReadings.current.length) return;
    const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
    const axes = ['x', 'y', 'z'] as const;
    const gyroOffset = Object.fromEntries(axes.map((axis) => [axis, mean(gyroReadings.current.map((item) => item[axis]))])) as Reading;
    updateCalibration({ gx: gyroOffset.x, gy: gyroOffset.y, gz: gyroOffset.z, leanOffset: mean(leanReadings.current), calibratedAt: new Date().toISOString() });
  };
  const offset: Reading = { x: calibration.gx, y: calibration.gy, z: calibration.gz };
  const rows = [{ key: 'X', v: reading.x - offset.x }, { key: 'Y', v: reading.y - offset.y }, { key: 'Z', v: reading.z - offset.z }];
  return <Page>
    <Header title="Calibración" subtitle="Ajusta la referencia de inclinación." />
    <Card style={{ alignItems: 'center', paddingVertical: 30 }}><View style={{ width: 160, height: 160, borderRadius: 90, borderWidth: 1, borderColor: Colors.activeTelemetry, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0D2228' }}><View style={{ width: 8, height: 8, borderRadius: 5, backgroundColor: Colors.activeTelemetry }} /><Text style={{ color: Colors.activeTelemetry, position: 'absolute', top: 16, fontSize: 11 }}>NIVEL</Text><Text style={{ color: Colors.textSecondary, position: 'absolute', bottom: 14, fontSize: 10 }}>MOTO ESTACIONADA</Text></View><Text style={{ color: Colors.textPrimary, fontSize: 18, fontWeight: '800', marginTop: 20 }}>Deja el teléfono inmóvil</Text><Text style={[s.muted, { textAlign: 'center' }]}>Colócalo en su soporte de conducción, con la moto vertical y en una superficie plana.</Text></Card>
    <Card><Label>GIROSCOPIO · RAD/S</Label>{rows.map((row) => <View key={row.key} style={[s.row, { paddingVertical: 5 }]}><Text style={{ color: Colors.textSecondary, fontWeight: '700' }}>Eje {row.key}</Text><Text style={{ color: Colors.activeTelemetry, fontWeight: '800' }}>{row.v.toFixed(3)}</Text></View>)}</Card>
    <Pressable onPress={calibrate} style={s.action}><Text style={s.actionText}>CALIBRAR SENSOR</Text></Pressable>
    <Text style={{ color: Colors.textTertiary, textAlign: 'center', fontSize: 11 }}>{calibration.calibratedAt ? `Última calibración: ${new Date(calibration.calibratedAt).toLocaleString('es-CO')}` : 'Aún no calibrado'}</Text>
    <Text style={{ color: Colors.textTertiary, fontSize: 11, textAlign: 'center' }}>La lectura depende de la orientación y el montaje del teléfono. Repite la calibración después de moverlo.</Text>
    <Pressable onPress={() => router.back()} style={s.secondary}><Text style={s.secondaryText}>Volver</Text></Pressable>
  </Page>;
}
