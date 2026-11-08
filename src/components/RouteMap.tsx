import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Line, Polyline } from 'react-native-svg';
import { Colors } from '../theme';
import { Coordinate } from '../providers/AppProvider';

export function RouteMap({ coordinates, height = 112 }: { coordinates: Coordinate[]; height?: number }) {
  let points = '';
  if (coordinates.length > 1) {
    const lats = coordinates.map((point) => point.latitude);
    const lons = coordinates.map((point) => point.longitude);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLon = Math.min(...lons), maxLon = Math.max(...lons);
    const dx = Math.max(maxLon - minLon, 0.00001), dy = Math.max(maxLat - minLat, 0.00001);
    const stride = Math.max(1, Math.floor(coordinates.length / 160));
    points = coordinates.filter((_, index) => index % stride === 0).map((point) => `${12 + (point.longitude - minLon) / dx * 276},${12 + (1 - (point.latitude - minLat) / dy) * 96}`).join(' ');
    const last = coordinates[coordinates.length - 1];
    points += ` ${12 + (last.longitude - minLon) / dx * 276},${12 + (1 - (last.latitude - minLat) / dy) * 96}`;
  }
  return <View style={{ height, borderRadius: 10, overflow: 'hidden', backgroundColor: '#13191C', justifyContent: 'center' }}>
    <Svg width="100%" height="100%" viewBox="0 0 300 120" preserveAspectRatio="none">
      <Line x1="0" y1="32" x2="300" y2="32" stroke="#202B30" strokeWidth="1" />
      <Line x1="0" y1="82" x2="300" y2="82" stroke="#202B30" strokeWidth="1" />
      <Line x1="62" y1="0" x2="62" y2="120" stroke="#202B30" strokeWidth="1" />
      <Line x1="228" y1="0" x2="228" y2="120" stroke="#202B30" strokeWidth="1" />
      {points ? <Polyline points={points} fill="none" stroke={Colors.activeTelemetry} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" /> : null}
    </Svg>
    {coordinates.length < 2 ? <Text style={{ color: Colors.textTertiary, fontSize: 10, alignSelf: 'center', position: 'absolute' }}>El trazado GPS aparecerá al registrar una ruta.</Text> : null}
  </View>;
}
