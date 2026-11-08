import React, { useEffect, useRef, useState } from 'react';
import { Gyroscope } from 'expo-sensors';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../theme';
import { Card, Header, Label, Page, screenStyles as s } from '../components/Screen';

export default function CalibrationScreen() {
  type Reading = { x: number; y: number; z: number };
  const [reading, setReading] = useState<Reading>({ x: 0, y: 0, z: 0 });
  const [offset, setOffset] = useState<Reading>({ x: 0, y: 0, z: 0 });
  const readings = useRef<Reading[]>([]);
  useEffect(() => { Gyroscope.setUpdateInterval(100); const sub = Gyroscope.addListener((value) => { setReading(value); readings.current.push(value); if (readings.current.length > 100) readings.current.shift(); }); return () => sub.remove(); }, []);
  const calibrate = () => { if (!readings.current.length) return; const sum = readings.current.reduce((acc, r) => ({ x: acc.x + r.x, y: acc.y + r.y, z: acc.z + r.z }), { x: 0, y: 0, z: 0 }); setOffset({ x: sum.x / readings.current.length, y: sum.y / readings.current.length, z: sum.z / readings.current.length }); };
  const rows = [{ key: 'X', v: reading.x - offset.x }, { key: 'Y', v: reading.y - offset.y }, { key: 'Z', v: reading.z - offset.z }];
  return <Page>
    <Header title="Calibración" subtitle="Ajusta la referencia de inclinación." />
    <Card style={{ alignItems: 'center', paddingVertical: 30 }}><View style={{ width: 160, height: 160, borderRadius: 90, borderWidth: 1, borderColor: Colors.activeTelemetry, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0D2228' }}><View style={{ width: 8, height: 8, borderRadius: 5, backgroundColor: Colors.activeTelemetry }} /><Text style={{ color: Colors.activeTelemetry, position: 'absolute', top: 16, fontSize: 11 }}>NIVEL</Text><Text style={{ color: Colors.textSecondary, position: 'absolute', bottom: 14, fontSize: 10 }}>MOTO ESTACIONADA</Text></View><Text style={{ color: Colors.textPrimary, fontSize: 18, fontWeight: '800', marginTop: 20 }}>Deja el teléfono inmóvil</Text><Text style={[s.muted, { textAlign: 'center' }]}>Colócalo en su soporte de conducción, con la moto vertical y en una superficie plana.</Text></Card>
    <Card><Label>GIROSCOPIO · RAD/S</Label>{rows.map((row) => <View key={row.key} style={[s.row, { paddingVertical: 5 }]}><Text style={{ color: Colors.textSecondary, fontWeight: '700' }}>Eje {row.key}</Text><Text style={{ color: Colors.activeTelemetry, fontWeight: '800' }}>{row.v.toFixed(3)}</Text></View>)}</Card>
    <Pressable onPress={calibrate} style={s.action}><Text style={s.actionText}>CALIBRAR SENSOR</Text></Pressable>
    <Text style={{ color: Colors.textTertiary, fontSize: 11, textAlign: 'center' }}>La lectura depende de la orientación y el montaje del teléfono. Repite la calibración después de moverlo.</Text>
    <Pressable onPress={() => router.back()} style={s.secondary}><Text style={s.secondaryText}>Volver</Text></Pressable>
  </Page>;
}
