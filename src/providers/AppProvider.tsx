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
  pausedAt?: number; pausedDurationMs: number; vehicleId?: string; comparisonRideId?: string; comparisonSnapshot?: Ride; remoteId?: string; isPublic?: boolean;
};
export type Vehicle = { id: string; make: string; model: string; year: string; odometer: number; serviceInterval: number; photoUri?: string; odometerPhotoUri?: string };
export type ServiceRecord = { id: string; title: string; date: string; odometer: number; note: string; vehicleId?: string; cost?: number; workshop?: string; intervalKm?: number };
export type OdometerEntry = { id: string; vehicleId: string; odometer: number; photoUri: string; recordedAt: string };
export type EmergencyContact = { id: string; name: string; phone: string };
export type CrashSensitivity = 'low' | 'standard' | 'high';
export type Calibration = { leanOffset: number; gx: number; gy: number; gz: number; calibratedAt: string | null };
type AppData = { rides: Ride[]; vehicles: Vehicle[]; vehicle: Vehicle; services: ServiceRecord[]; odometerEntries: OdometerEntry[]; contacts: EmergencyContact[]; ride: Ride | null; paused: boolean; crashSensitivity: CrashSensitivity; crashDetectionEnabled: boolean; calibration: Calibration; riderName: string; profilePhotoUri: string | null; profileComplete: boolean; riderBio: string; riderCity: string };
type AppContextValue = AppData & {
  ready: boolean; syncStatus: 'offline' | 'connecting' | 'connected' | 'error'; syncError: string | null; retrySync: () => void; legacyAvailable: boolean; importLegacyData: () => Promise<void>; startRide: (comparisonRideId?: string, comparisonSnapshot?: Ride) => void; pauseRide: () => void; finishRide: () => Ride | null;
  updateLocation: (point: Coordinate) => void; addService: (record: Omit<ServiceRecord, 'id'>) => void;
  renameRide: (id: string, title: string) => void;
  updateVehicle: (vehicle: Vehicle) => void; addVehicle: (vehicle: Omit<Vehicle, 'id'>) => void; deleteVehicle: (id: string) => void; selectVehicle: (id: string) => void;
  addOdometerEntry: (entry: Omit<OdometerEntry, 'id' | 'recordedAt'>) => void;
  addContact: (contact: Omit<EmergencyContact, 'id'>) => void;
  deleteContact: (id: string) => void;
  updateRideLean: (lean: number) => void;
  updateCalibration: (calibration: Calibration) => void; updateCrashSettings: (enabled: boolean, sensitivity: CrashSensitivity) => void; updateRiderName: (name: string) => void;
  linkRemoteRide: (localId: string, remoteId: string, isPublic: boolean) => void;
  updateProfilePhoto: (uri: string | null) => void;
  completeProfile: (name: string, city: string, bio: string) => void;
};

const STORAGE_KEY = 'mototracer.app.v2';
const ACTIVE_RIDE_KEY = 'mototracer.activeRide.v1';
const defaultVehicle: Vehicle = { id: 'empty', make: '', model: '', year: '', odometer: 0, serviceInterval: 3000 };
const defaultData: AppData = {
  rides: [], ride: null, paused: false, vehicles: [], crashSensitivity: 'standard', crashDetectionEnabled: true,
  calibration: { leanOffset: 0, gx: 0, gy: 0, gz: 0, calibratedAt: null }, riderName: '', profilePhotoUri: null, riderBio: '', riderCity: '', profileComplete: false,
  vehicle: defaultVehicle,
  services: [], odometerEntries: [], contacts: [],
};
const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: React.PropsWithChildren) {
  const { session, loading: authLoading } = useAuth();
  const [data, setData] = useState(defaultData);
  const [hydratedFor, setHydratedFor] = useState<string | null>(null);
  const accountKey = session?.user.id ?? 'guest';
  const ready = !authLoading && hydratedFor === accountKey;
  const [cloudReadyFor, setCloudReadyFor] = useState<string | null>(null);
  const cloudLoadingFor = useRef<string | null>(null);
  const [syncTick, setSyncTick] = useState(0);
  const [online, setOnline] = useState(false);
  const [syncIssue, setSyncIssue] = useState<{ userId: string; message: string } | null>(null);
  const syncError = syncIssue && syncIssue.userId === session?.user.id ? syncIssue.message : null;
  const syncStatus: AppContextValue['syncStatus'] = !session || !online ? 'offline' : syncError ? 'error' : cloudReadyFor === session.user.id ? 'connected' : 'connecting';
  const retrySync = useCallback(() => setSyncTick((tick) => tick + 1), []);
  const [legacyAvailable, setLegacyAvailable] = useState(false);
  useEffect(() => {
    const userId = session?.user.id;
    if (!userId) return;
    Promise.all([AsyncStorage.getItem('mototracer.app.v1'), AsyncStorage.getItem(`${STORAGE_KEY}.imported.${userId}`)]).then(([legacy, imported]) => setLegacyAvailable(Boolean(legacy && !imported))).catch(() => undefined);
  }, [session?.user.id]);
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
    if (authLoading) return;
    let mounted = true;
    cloudLoadingFor.current = null;
    const storageKey = `${STORAGE_KEY}.${accountKey}`;
    Promise.all([AsyncStorage.getItem(storageKey), AsyncStorage.getItem(`${ACTIVE_RIDE_KEY}.${accountKey}`)]).then(([raw, activeRaw]) => {
      if (!mounted) return;
      if (!raw) { const active = activeRaw ? JSON.parse(activeRaw) as { ride: Ride | null; paused: boolean } : null; setData({ ...defaultData, ride: active?.ride ?? null, paused: active?.paused ?? false }); return; }
      try {
        const stored = JSON.parse(raw) as Partial<AppData>;
        const active = activeRaw ? JSON.parse(activeRaw) as { ride: Ride | null; paused: boolean } : null;
      setData({ ...defaultData, ...stored, ride: active?.ride ?? null, paused: active?.paused ?? false,
        calibration: { ...defaultData.calibration, ...(stored.calibration ?? {}) },
        vehicles: stored.vehicles ?? defaultData.vehicles,
        vehicle: stored.vehicle ?? defaultData.vehicle,
      });
      } catch { setData(defaultData); }
    }).finally(() => mounted && setHydratedFor(accountKey));
    return () => { mounted = false; };
  }, [accountKey, authLoading]);

  const persisted = useMemo(() => JSON.stringify({ rides: data.rides, vehicles: data.vehicles, vehicle: data.vehicle, services: data.services, odometerEntries: data.odometerEntries, contacts: data.contacts, crashSensitivity: data.crashSensitivity, crashDetectionEnabled: data.crashDetectionEnabled, calibration: data.calibration, riderName: data.riderName, riderCity: data.riderCity, riderBio: data.riderBio, profileComplete: data.profileComplete, profilePhotoUri: data.profilePhotoUri }), [data.rides, data.vehicles, data.vehicle, data.services, data.odometerEntries, data.contacts, data.crashSensitivity, data.crashDetectionEnabled, data.calibration, data.riderName, data.riderCity, data.riderBio, data.profileComplete, data.profilePhotoUri]);
  const persistedRef = useRef(persisted);
  const revisionRef = useRef(0);
  useEffect(() => { persistedRef.current = persisted; revisionRef.current += 1; }, [persisted]);
  useEffect(() => {
    if (ready && session) AsyncStorage.setItem(`${STORAGE_KEY}.${session.user.id}`, persisted).catch(() => undefined);
  }, [persisted, ready, session]);
  const activeRideRef = useRef({ ride: data.ride, paused: data.paused });
  useEffect(() => { activeRideRef.current = { ride: data.ride, paused: data.paused }; }, [data.ride, data.paused]);
  useEffect(() => {
    if (!ready || !session) return;
    const key = `${ACTIVE_RIDE_KEY}.${session.user.id}`;
    const save = () => { const current = activeRideRef.current; if (current.ride) void AsyncStorage.setItem(key, JSON.stringify(current)); else void AsyncStorage.removeItem(key); };
    const timer = setInterval(save, 5000);
    return () => { clearInterval(timer); save(); };
  }, [ready, session]);

  useEffect(() => {
    const userId = session?.user.id;
    if (!ready || !userId || !supabase || !online) { cloudLoadingFor.current = null; return; }
    if (cloudReadyFor === userId || cloudLoadingFor.current === userId) return;
    cloudLoadingFor.current = userId;
    let active = true;
    const initialRevision = revisionRef.current;
    (async () => {
      const { data: backup, error } = await supabase!.from('rider_backups').select('data').eq('owner_id', userId).maybeSingle();
      if (error || !active) { if (error) setSyncIssue({ userId, message: error.message }); cloudLoadingFor.current = null; return; }
      if (backup?.data && revisionRef.current === initialRevision) {
        const stored = backup.data as Partial<AppData>;
        setData((current) => ({ ...defaultData, ...stored, ride: current.ride, paused: current.paused,
          calibration: { ...defaultData.calibration, ...(stored.calibration ?? {}) },
          vehicles: stored.vehicles ?? defaultData.vehicles,
          vehicle: stored.vehicle ?? defaultData.vehicle,
        }));
      } else if (!backup?.data) {
        const localData = JSON.parse(persistedRef.current) as Partial<AppData>;
        const { error: saveError } = await supabase!.from('rider_backups').upsert({ owner_id: userId, data: localData, updated_at: new Date().toISOString() });
        if (saveError) { setSyncIssue({ userId, message: saveError.message }); cloudLoadingFor.current = null; return; }
      }
      if (active) { setCloudReadyFor(userId); setSyncIssue(null); cloudLoadingFor.current = null; }
    })().catch(() => { cloudLoadingFor.current = null; });
    return () => { active = false; cloudLoadingFor.current = null; };
  }, [ready, session?.user.id, cloudReadyFor, syncTick, online]);

  useEffect(() => {
    const userId = session?.user.id;
    if (!userId || cloudReadyFor !== userId || !supabase || !online) return;
    const timer = setTimeout(() => { void supabase!.from('rider_backups').upsert({ owner_id: userId, data: JSON.parse(persisted), updated_at: new Date().toISOString() }).then(({ error }) => { setSyncIssue(error ? { userId, message: error.message } : null); }); }, 700);
    return () => clearTimeout(timer);
  }, [persisted, session?.user.id, cloudReadyFor, syncTick, online]);

  const startRide = useCallback((comparisonRideId?: string, comparisonSnapshot?: Ride) => {
    setData((current) => current.ride ? current : ({ ...current, paused: false, ride: {
      id: `ride-${Date.now()}`, title: `Rodada ${new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}`,
      startTime: new Date().toISOString(), distanceKm: 0, durationSec: 0, maxSpeed: 0, avgSpeed: 0,
      maxLeanLeft: 0, maxLeanRight: 0, coordinates: [], speedSamples: [], speedSum: 0, speedCount: 0, pausedDurationMs: 0,
      vehicleId: current.vehicle.id, comparisonRideId, comparisonSnapshot,
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
      const nextPoints = [...points, point];
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
    activeRideRef.current = { ride: null, paused: false };
    setData((current) => ({ ...current, ride: null, paused: false, rides: [ended, ...current.rides] }));
    if (session) void AsyncStorage.removeItem(`${ACTIVE_RIDE_KEY}.${session.user.id}`);
    return ended;
  }, [data.ride, data.paused, session]);
  const addService = useCallback((record: Omit<ServiceRecord, 'id'>) => setData((current) => ({ ...current, services: [{ ...record, id: `service-${Date.now()}` }, ...current.services] })), []);
  const renameRide = useCallback((id: string, title: string) => setData((current) => ({ ...current, rides: current.rides.map((ride) => ride.id === id ? { ...ride, title } : ride) })), []);
  const updateVehicle = useCallback((vehicle: Vehicle) => setData((current) => ({ ...current, vehicle: current.vehicle.id === vehicle.id ? vehicle : current.vehicle, vehicles: current.vehicles.map((item) => item.id === vehicle.id ? vehicle : item) })), []);
  const addVehicle = useCallback((vehicle: Omit<Vehicle, 'id'>) => setData((current) => { if (current.vehicles.length >= 5) return current; const next = { ...vehicle, id: `vehicle-${Date.now()}` }; return { ...current, vehicle: next, vehicles: [...current.vehicles, next] }; }), []);
  const deleteVehicle = useCallback((id: string) => setData((current) => { const vehicles = current.vehicles.filter((item) => item.id !== id); return { ...current, vehicles, vehicle: current.vehicle.id === id ? (vehicles[0] ?? defaultVehicle) : current.vehicle, services: current.services.filter((item) => item.vehicleId !== id), odometerEntries: current.odometerEntries.filter((item) => item.vehicleId !== id) }; }), []);
  const addOdometerEntry = useCallback((entry: Omit<OdometerEntry, 'id' | 'recordedAt'>) => setData((current) => ({ ...current, odometerEntries: [{ ...entry, id: `odometer-${Date.now()}`, recordedAt: new Date().toISOString() }, ...current.odometerEntries], vehicles: current.vehicles.map((item) => item.id === entry.vehicleId ? { ...item, odometer: entry.odometer, odometerPhotoUri: entry.photoUri } : item), vehicle: current.vehicle.id === entry.vehicleId ? { ...current.vehicle, odometer: entry.odometer, odometerPhotoUri: entry.photoUri } : current.vehicle })), []);
  const selectVehicle = useCallback((id: string) => setData((current) => ({ ...current, vehicle: current.vehicles.find((item) => item.id === id) ?? current.vehicle })), []);
  const addContact = useCallback((contact: Omit<EmergencyContact, 'id'>) => setData((current) => current.contacts.length >= 5 ? current : ({ ...current, contacts: [...current.contacts, { ...contact, id: `contact-${Date.now()}` }] })), []);
  const deleteContact = useCallback((id: string) => setData((current) => ({ ...current, contacts: current.contacts.filter((contact) => contact.id !== id) })), []);
  const updateCalibration = useCallback((calibration: Calibration) => setData((current) => ({ ...current, calibration })), []);
  const updateCrashSettings = useCallback((crashDetectionEnabled: boolean, crashSensitivity: CrashSensitivity) => setData((current) => ({ ...current, crashDetectionEnabled, crashSensitivity })), []);
  const updateRiderName = useCallback((riderName: string) => setData((current) => ({ ...current, riderName })), []);
  const linkRemoteRide = useCallback((localId: string, remoteId: string, isPublic: boolean) => setData((current) => ({ ...current, rides: current.rides.map((ride) => ride.id === localId ? { ...ride, remoteId, isPublic } : ride) })), []);
  const updateProfilePhoto = useCallback((profilePhotoUri: string | null) => setData((current) => ({ ...current, profilePhotoUri })), []);
  const completeProfile = useCallback((riderName: string, riderCity: string, riderBio: string) => setData((current) => ({ ...current, riderName, riderCity, riderBio, profileComplete: true })), []);
  const importLegacyData = useCallback(async () => {
    const userId = session?.user.id;
    if (!userId) throw new Error('Inicia sesión para recuperar datos.');
    const raw = await AsyncStorage.getItem('mototracer.app.v1');
    if (!raw) throw new Error('No se encontraron datos anteriores.');
    const legacy = JSON.parse(raw) as Partial<AppData>;
    setData((current) => {
      const vehicles = [...current.vehicles, ...(legacy.vehicles ?? []).filter((item) => !current.vehicles.some((existing) => existing.id === item.id))].slice(0, 5);
      const merge = <T extends { id: string }>(currentItems: T[], oldItems: T[] = []) => [...currentItems, ...oldItems.filter((item) => !currentItems.some((existing) => existing.id === item.id))];
      return { ...current, vehicles, vehicle: vehicles.find((item) => item.id === legacy.vehicle?.id) ?? current.vehicle, rides: merge(current.rides, legacy.rides), services: merge(current.services, legacy.services), contacts: merge(current.contacts, legacy.contacts) };
    });
    await AsyncStorage.setItem(`${STORAGE_KEY}.imported.${userId}`, '1');
    setLegacyAvailable(false);
  }, [session?.user.id]);
  const value = useMemo(() => ({ ...data, ready, syncStatus, syncError, retrySync, legacyAvailable, importLegacyData, startRide, pauseRide, finishRide, updateLocation, updateRideLean, addService, renameRide, updateVehicle, addVehicle, deleteVehicle, selectVehicle, addOdometerEntry, addContact, deleteContact, updateCalibration, updateCrashSettings, updateRiderName, linkRemoteRide, updateProfilePhoto, completeProfile }), [data, ready, syncStatus, syncError, retrySync, legacyAvailable, importLegacyData, startRide, pauseRide, finishRide, updateLocation, updateRideLean, addService, renameRide, updateVehicle, addVehicle, deleteVehicle, selectVehicle, addOdometerEntry, addContact, deleteContact, updateCalibration, updateCrashSettings, updateRiderName, linkRemoteRide, updateProfilePhoto, completeProfile]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppData must be used inside AppProvider');
  return context;
}
