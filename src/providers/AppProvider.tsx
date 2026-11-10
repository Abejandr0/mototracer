import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Network from 'expo-network';
import { useAuth } from './AuthProvider';
import { supabase } from '../services/supabase';

export type Coordinate = { latitude: number; longitude: number; timestamp: number; speed: number; lean: number; gForce?: number; altitude?: number | null };
export type Ride = {
  id: string; title: string; startTime: string; endTime?: string; distanceKm: number;
  durationSec: number; maxSpeed: number; avgSpeed: number; maxLeanLeft: number;
  maxLeanRight: number; coordinates: Coordinate[]; speedSamples: number[]; speedSum: number; speedCount: number;
  pausedAt?: number; pausedDurationMs: number; vehicleId?: string; comparisonRideId?: string; remoteId?: string; isPublic?: boolean;
};
export type Vehicle = { id: string; make: string; model: string; year: string; odometer: number; serviceInterval: number; photoUri?: string };
export type ServiceRecord = { id: string; title: string; date: string; odometer: number; note: string; vehicleId?: string };
export type EmergencyContact = { id: string; name: string; phone: string };
export type CrashSensitivity = 'low' | 'standard' | 'high';
export type Calibration = { leanOffset: number; gx: number; gy: number; gz: number; calibratedAt: string | null };
type AppData = { rides: Ride[]; vehicles: Vehicle[]; vehicle: Vehicle; services: ServiceRecord[]; contacts: EmergencyContact[]; ride: Ride | null; paused: boolean; crashSensitivity: CrashSensitivity; crashDetectionEnabled: boolean; calibration: Calibration; riderName: string; profilePhotoUri: string | null };
type AppContextValue = AppData & {
  ready: boolean; startRide: (comparisonRideId?: string) => void; pauseRide: () => void; finishRide: () => Ride | null;
  updateLocation: (point: Coordinate) => void; addService: (record: Omit<ServiceRecord, 'id'>) => void;
  renameRide: (id: string, title: string) => void;
  updateVehicle: (vehicle: Vehicle) => void; addVehicle: (vehicle: Omit<Vehicle, 'id'>) => void; selectVehicle: (id: string) => void;
  addContact: (contact: Omit<EmergencyContact, 'id'>) => void;
  updateRideLean: (lean: number) => void;
  updateCalibration: (calibration: Calibration) => void; updateCrashSettings: (enabled: boolean, sensitivity: CrashSensitivity) => void; updateRiderName: (name: string) => void;
  linkRemoteRide: (localId: string, remoteId: string, isPublic: boolean) => void;
  updateProfilePhoto: (uri: string | null) => void;
};

const STORAGE_KEY = 'mototracer.app.v1';
const defaultVehicle: Vehicle = { id: 'primary', make: 'Suzuki', model: 'Gixxer 150', year: '2024', odometer: 17700, serviceInterval: 3000 };
const defaultData: AppData = {
  rides: [], ride: null, paused: false, vehicles: [defaultVehicle], crashSensitivity: 'standard', crashDetectionEnabled: true,
  calibration: { leanOffset: 0, gx: 0, gy: 0, gz: 0, calibratedAt: null }, riderName: 'Abejandro', profilePhotoUri: null,
  vehicle: defaultVehicle,
  services: [
    { id: 'oil', title: 'Cambio de aceite', date: '2026-10-02', odometer: 16150, note: 'Datos de ejemplo · intervalo 3.000 km', vehicleId: 'primary' },
    { id: 'chain', title: 'Tensión y lubricación de cadena', date: '2026-09-12', odometer: 17100, note: 'Datos de ejemplo · intervalo 1.500 km', vehicleId: 'primary' },
  ], contacts: [],
};
const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: React.PropsWithChildren) {
  const { session } = useAuth();
  const [data, setData] = useState(defaultData);
  const [ready, setReady] = useState(false);
  const [cloudReadyFor, setCloudReadyFor] = useState<string | null>(null);
  const cloudLoadingFor = useRef<string | null>(null);
  const [syncTick, setSyncTick] = useState(0);
  const [online, setOnline] = useState(false);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') setSyncTick((tick) => tick + 1); });
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    let alive = true;
    Network.getNetworkStateAsync().then((state) => { if (alive) setOnline(Boolean(state.isInternetReachable ?? state.isConnected)); }).catch(() => undefined);
    const subscription = Network.addNetworkStateListener((state) => setOnline(Boolean(state.isInternetReachable ?? state.isConnected)));
    return () => { alive = false; subscription.remove(); };
  }, []);
  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw || !mounted) return;
      try {
        const stored = JSON.parse(raw) as Partial<AppData>;
      setData({ ...defaultData, ...stored, ride: null, paused: false,
        calibration: { ...defaultData.calibration, ...(stored.calibration ?? {}) },
        vehicles: stored.vehicles?.length ? stored.vehicles : defaultData.vehicles,
        vehicle: stored.vehicle ?? defaultData.vehicle,
      });
      } catch { /* Ignore a corrupt cache and keep usable defaults. */ }
    }).finally(() => mounted && setReady(true));
    return () => { mounted = false; };
  }, []);

  const persisted = useMemo(() => JSON.stringify({ rides: data.rides, vehicles: data.vehicles, vehicle: data.vehicle, services: data.services, contacts: data.contacts, crashSensitivity: data.crashSensitivity, crashDetectionEnabled: data.crashDetectionEnabled, calibration: data.calibration, riderName: data.riderName, profilePhotoUri: data.profilePhotoUri }), [data.rides, data.vehicles, data.vehicle, data.services, data.contacts, data.crashSensitivity, data.crashDetectionEnabled, data.calibration, data.riderName, data.profilePhotoUri]);
  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE_KEY, persisted).catch(() => undefined);
  }, [persisted, ready]);

  useEffect(() => {
    const userId = session?.user.id;
    if (!ready || !userId || !supabase || !online) { cloudLoadingFor.current = null; return; }
    if (cloudReadyFor === userId || cloudLoadingFor.current === userId) return;
    cloudLoadingFor.current = userId;
    let active = true;
    (async () => {
      const { data: backup, error } = await supabase!.from('rider_backups').select('data').eq('owner_id', userId).maybeSingle();
      if (error || !active) { cloudLoadingFor.current = null; return; }
      if (backup?.data) {
        const stored = backup.data as Partial<AppData>;
        setData({ ...defaultData, ...stored, ride: null, paused: false,
          calibration: { ...defaultData.calibration, ...(stored.calibration ?? {}) },
          vehicles: stored.vehicles?.length ? stored.vehicles : defaultData.vehicles,
          vehicle: stored.vehicle ?? defaultData.vehicle,
        });
      } else {
        const localData = JSON.parse(persisted) as Partial<AppData>;
        const { error: saveError } = await supabase!.from('rider_backups').upsert({ owner_id: userId, data: localData, updated_at: new Date().toISOString() });
        if (saveError) return;
      }
      if (active) setCloudReadyFor(userId);
    })().catch(() => { cloudLoadingFor.current = null; });
    return () => { active = false; };
  }, [ready, session?.user.id, cloudReadyFor, persisted, syncTick, online]);

  useEffect(() => {
    const userId = session?.user.id;
    if (!userId || cloudReadyFor !== userId || !supabase || !online) return;
    supabase.from('rider_backups').upsert({ owner_id: userId, data: JSON.parse(persisted), updated_at: new Date().toISOString() }).then(() => undefined);
  }, [persisted, session?.user.id, cloudReadyFor, syncTick, online]);

  const startRide = useCallback((comparisonRideId?: string) => {
    setData((current) => ({ ...current, paused: false, ride: {
      id: `ride-${Date.now()}`, title: `Rodada ${new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}`,
      startTime: new Date().toISOString(), distanceKm: 0, durationSec: 0, maxSpeed: 0, avgSpeed: 0,
      maxLeanLeft: 0, maxLeanRight: 0, coordinates: [], speedSamples: [], speedSum: 0, speedCount: 0, pausedDurationMs: 0,
      vehicleId: current.vehicle.id, comparisonRideId,
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
        if (addedKm > 0.15) return current; // Reject isolated GPS jumps without drawing a false map segment.
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
  const updateCalibration = useCallback((calibration: Calibration) => setData((current) => ({ ...current, calibration })), []);
  const updateCrashSettings = useCallback((crashDetectionEnabled: boolean, crashSensitivity: CrashSensitivity) => setData((current) => ({ ...current, crashDetectionEnabled, crashSensitivity })), []);
  const updateRiderName = useCallback((riderName: string) => setData((current) => ({ ...current, riderName })), []);
  const linkRemoteRide = useCallback((localId: string, remoteId: string, isPublic: boolean) => setData((current) => ({ ...current, rides: current.rides.map((ride) => ride.id === localId ? { ...ride, remoteId, isPublic } : ride) })), []);
  const updateProfilePhoto = useCallback((profilePhotoUri: string | null) => setData((current) => ({ ...current, profilePhotoUri })), []);
  const value = useMemo(() => ({ ...data, ready, startRide, pauseRide, finishRide, updateLocation, updateRideLean, addService, renameRide, updateVehicle, addVehicle, selectVehicle, addContact, updateCalibration, updateCrashSettings, updateRiderName, linkRemoteRide, updateProfilePhoto }), [data, ready, startRide, pauseRide, finishRide, updateLocation, updateRideLean, addService, renameRide, updateVehicle, addVehicle, selectVehicle, addContact, updateCalibration, updateCrashSettings, updateRiderName, linkRemoteRide, updateProfilePhoto]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppData must be used inside AppProvider');
  return context;
}
