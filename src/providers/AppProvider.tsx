import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type Coordinate = { latitude: number; longitude: number; timestamp: number; speed: number; lean: number };
export type Ride = {
  id: string; title: string; startTime: string; endTime?: string; distanceKm: number;
  durationSec: number; maxSpeed: number; avgSpeed: number; maxLeanLeft: number;
  maxLeanRight: number; coordinates: Coordinate[]; speedSamples: number[]; speedSum: number; speedCount: number;
  pausedAt?: number; pausedDurationMs: number;
};
export type Vehicle = { id: string; make: string; model: string; year: string; odometer: number; serviceInterval: number };
export type ServiceRecord = { id: string; title: string; date: string; odometer: number; note: string };
export type EmergencyContact = { id: string; name: string; phone: string };
type AppData = { rides: Ride[]; vehicles: Vehicle[]; vehicle: Vehicle; services: ServiceRecord[]; contacts: EmergencyContact[]; ride: Ride | null; paused: boolean };
type AppContextValue = AppData & {
  ready: boolean; startRide: () => void; pauseRide: () => void; finishRide: () => Ride | null;
  updateLocation: (point: Coordinate) => void; addService: (record: Omit<ServiceRecord, 'id'>) => void;
  renameRide: (id: string, title: string) => void;
  updateVehicle: (vehicle: Vehicle) => void; addVehicle: (vehicle: Omit<Vehicle, 'id'>) => void; selectVehicle: (id: string) => void;
  addContact: (contact: Omit<EmergencyContact, 'id'>) => void;
  updateRideLean: (lean: number) => void;
};

const STORAGE_KEY = 'mototracer.app.v1';
const defaultVehicle: Vehicle = { id: 'primary', make: 'Suzuki', model: 'Gixxer 150', year: '2024', odometer: 17700, serviceInterval: 3000 };
const defaultData: AppData = {
  rides: [], ride: null, paused: false, vehicles: [defaultVehicle],
  vehicle: defaultVehicle,
  services: [
    { id: 'oil', title: 'Cambio de aceite', date: '2026-10-02', odometer: 16150, note: 'Datos de ejemplo · intervalo 3.000 km' },
    { id: 'chain', title: 'Tensión y lubricación de cadena', date: '2026-09-12', odometer: 17100, note: 'Datos de ejemplo · intervalo 1.500 km' },
  ], contacts: [],
};
const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: React.PropsWithChildren) {
  const [data, setData] = useState(defaultData);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw || !mounted) return;
      try {
        const stored = JSON.parse(raw) as Partial<AppData>;
        setData({ ...defaultData, ...stored, ride: null, paused: false });
      } catch { /* Ignore a corrupt cache and keep usable defaults. */ }
    }).finally(() => mounted && setReady(true));
    return () => { mounted = false; };
  }, []);

  const persisted = useMemo(() => JSON.stringify({ rides: data.rides, vehicles: data.vehicles, vehicle: data.vehicle, services: data.services, contacts: data.contacts }), [data.rides, data.vehicles, data.vehicle, data.services, data.contacts]);
  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE_KEY, persisted).catch(() => undefined);
  }, [persisted, ready]);

  const startRide = useCallback(() => {
    setData((current) => ({ ...current, paused: false, ride: {
      id: `ride-${Date.now()}`, title: `Rodada ${new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}`,
      startTime: new Date().toISOString(), distanceKm: 0, durationSec: 0, maxSpeed: 0, avgSpeed: 0,
      maxLeanLeft: 0, maxLeanRight: 0, coordinates: [], speedSamples: [], speedSum: 0, speedCount: 0, pausedDurationMs: 0,
    } }));
  }, []);
  const pauseRide = useCallback(() => setData((current) => {
    if (!current.ride) return current;
    const now = Date.now();
    const ride = current.paused ? { ...current.ride, pausedAt: undefined, pausedDurationMs: current.ride.pausedDurationMs + Math.max(0, now - (current.ride.pausedAt ?? now)) }
      : { ...current.ride, pausedAt: now };
    return { ...current, ride, paused: !current.paused };
  }), []);
  const updateLocation = useCallback((point: Coordinate) => {
    setData((current) => {
      if (!current.ride || current.paused) return current;
      const points = current.ride.coordinates;
      const previous = points[points.length - 1];
      let addedKm = 0;
      if (previous) {
        const toRad = (n: number) => n * Math.PI / 180;
        const dLat = toRad(point.latitude - previous.latitude);
        const dLon = toRad(point.longitude - previous.longitude);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(previous.latitude)) * Math.cos(toRad(point.latitude)) * Math.sin(dLon / 2) ** 2;
        addedKm = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        if (addedKm > 0.15) addedKm = 0; // Reject isolated GPS jumps.
      }
      const nextPoints = [...points, point].slice(-1800);
      const speeds = [...current.ride.speedSamples, point.speed].slice(-600);
      const speedSum = current.ride.speedSum + point.speed;
      const speedCount = current.ride.speedCount + 1;
      const ride = { ...current.ride, coordinates: nextPoints, speedSamples: speeds,
        distanceKm: current.ride.distanceKm + addedKm,
        maxSpeed: Math.max(current.ride.maxSpeed, point.speed),
        speedSum, speedCount, avgSpeed: speedCount ? speedSum / speedCount : 0,
        maxLeanLeft: Math.min(current.ride.maxLeanLeft, point.lean), maxLeanRight: Math.max(current.ride.maxLeanRight, point.lean),
        durationSec: Math.floor((point.timestamp - new Date(current.ride.startTime).getTime() - current.ride.pausedDurationMs) / 1000),
      };
      return { ...current, ride };
    });
  }, []);
  const updateRideLean = useCallback((lean: number) => {
    setData((current) => current.ride ? ({ ...current, ride: { ...current.ride,
      maxLeanLeft: Math.min(current.ride.maxLeanLeft, lean), maxLeanRight: Math.max(current.ride.maxLeanRight, lean) } }) : current);
  }, []);
  const finishRide = useCallback(() => {
    const ride = data.ride;
    if (!ride) return null;
    const now = Date.now();
    const pausedMs = ride.pausedDurationMs + (data.paused && ride.pausedAt ? now - ride.pausedAt : 0);
    const ended = { ...ride, endTime: new Date(now).toISOString(), durationSec: Math.max(0, Math.floor((now - new Date(ride.startTime).getTime() - pausedMs) / 1000)) };
    setData((current) => ({ ...current, ride: null, paused: false, rides: [ended, ...current.rides].slice(0, 20) }));
    return ended;
  }, [data.ride, data.paused]);
  const addService = useCallback((record: Omit<ServiceRecord, 'id'>) => setData((current) => ({ ...current, services: [{ ...record, id: `service-${Date.now()}` }, ...current.services] })), []);
  const renameRide = useCallback((id: string, title: string) => setData((current) => ({ ...current, rides: current.rides.map((ride) => ride.id === id ? { ...ride, title } : ride) })), []);
  const updateVehicle = useCallback((vehicle: Vehicle) => setData((current) => ({ ...current, vehicle, vehicles: current.vehicles.map((item) => item.id === vehicle.id ? vehicle : item) })), []);
  const addVehicle = useCallback((vehicle: Omit<Vehicle, 'id'>) => setData((current) => { const next = { ...vehicle, id: `vehicle-${Date.now()}` }; return { ...current, vehicle: next, vehicles: [...current.vehicles, next] }; }), []);
  const selectVehicle = useCallback((id: string) => setData((current) => ({ ...current, vehicle: current.vehicles.find((item) => item.id === id) ?? current.vehicle })), []);
  const addContact = useCallback((contact: Omit<EmergencyContact, 'id'>) => setData((current) => ({ ...current, contacts: [...current.contacts, { ...contact, id: `contact-${Date.now()}` }] })), []);
  const value = useMemo(() => ({ ...data, ready, startRide, pauseRide, finishRide, updateLocation, updateRideLean, addService, renameRide, updateVehicle, addVehicle, selectVehicle, addContact }), [data, ready, startRide, pauseRide, finishRide, updateLocation, updateRideLean, addService, renameRide, updateVehicle, addVehicle, selectVehicle, addContact]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppData must be used inside AppProvider');
  return context;
}
