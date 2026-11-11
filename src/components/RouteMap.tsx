import React, { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Colors } from '../theme';
import { Coordinate } from '../providers/AppProvider';

export function RouteMap({ coordinates, height = 112, follow = false }: { coordinates: Coordinate[]; height?: number; follow?: boolean }) {
  const map = useRef<MapView>(null);
  const first = coordinates[0]; const last = coordinates.at(-1);
  const lines = coordinates.reduce<Coordinate[][]>((groups, point) => {
    if (point.breakBefore || !groups.length) groups.push([]);
    groups[groups.length - 1].push(point);
    return groups;
  }, []);
  useEffect(() => {
    if (!map.current || coordinates.length < 2) return;
    if (follow && last) map.current.animateCamera({ center: { latitude: last.latitude, longitude: last.longitude }, zoom: 15 }, { duration: 400 });
    else map.current.fitToCoordinates(coordinates.map((point) => ({ latitude: point.latitude, longitude: point.longitude })), { edgePadding: { top: 24, right: 24, bottom: 24, left: 24 }, animated: false });
  }, [coordinates, follow, last]);
  return <View pointerEvents="none" style={{ height, borderRadius: 12, overflow: 'hidden', backgroundColor: '#142126' }}>
    {first ? <MapView ref={map} style={{ flex: 1 }} mapType="standard" initialRegion={{ latitude: first.latitude, longitude: first.longitude, latitudeDelta: .03, longitudeDelta: .03 }} scrollEnabled={false} zoomEnabled={false} pitchEnabled={false} rotateEnabled={false} toolbarEnabled={false} showsUserLocation={follow}>
      {lines.map((line, index) => line.length > 1 ? <Polyline key={index} coordinates={line.map((point) => ({ latitude: point.latitude, longitude: point.longitude }))} strokeColor={Colors.activeTelemetry} strokeWidth={4} /> : null)}
      <Marker coordinate={{ latitude: first.latitude, longitude: first.longitude }} pinColor={Colors.gpsOptimal} title="Inicio" />
      {last && coordinates.length > 1 ? <Marker coordinate={{ latitude: last.latitude, longitude: last.longitude }} pinColor={Colors.primaryAction} title={follow ? 'Posición actual' : 'Final'} /> : null}
    </MapView> : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: Colors.textTertiary, fontSize: 11, textAlign: 'center' }}>El mapa aparecerá al recibir el primer punto GPS.</Text></View>}
  </View>;
}
