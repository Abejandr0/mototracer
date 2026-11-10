import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

export const RIDE_LOCATION_TASK = 'MOTOTRACER_RIDE_LOCATION';
const QUEUE_KEY = 'mototracer.background-location-queue.v1';

TaskManager.defineTask<{ locations: Location.LocationObject[] }>(RIDE_LOCATION_TASK, async ({ data, error }) => {
  if (error || !data?.locations?.length) return;
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  const queue = raw ? JSON.parse(raw) as { latitude: number; longitude: number; timestamp: number; speed: number; lean: number }[] : [];
  const next = data.locations.map((location) => ({
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    timestamp: location.timestamp,
    speed: Math.max(0, location.coords.speed ?? 0) * 3.6,
    lean: 0,
  }));
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([...queue, ...next].slice(-5000)));
});

export async function takeBackgroundLocationQueue() {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return [];
  await AsyncStorage.removeItem(QUEUE_KEY);
  return JSON.parse(raw) as { latitude: number; longitude: number; timestamp: number; speed: number; lean: number }[];
}
