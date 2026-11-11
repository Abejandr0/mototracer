import type { Ride, Coordinate } from '../providers/AppProvider';
import paths from './demoRoutePaths.json';

type DemoRoute = { name: string; initials: string; city: string; ride: Ride };
function createDemo(id: string, title: string, name: string, initials: string, city: string, route: { distanceKm: number; path: number[][] }, avgSpeed: number, lean: number): DemoRoute {
  const now = Date.now() - Number(id) * 86400000;
  const durationSec = Math.round(route.distanceKm / avgSpeed * 3600);
  const coordinates: Coordinate[] = route.path.map(([latitude, longitude], index) => ({
    latitude, longitude, timestamp: now + index * durationSec * 1000 / Math.max(route.path.length - 1, 1),
    speed: Math.max(8, avgSpeed + Math.sin(index * .3) * 10 + Math.sin(index * .07) * 11 + (index % 31 === 0 ? 12 : 0)),
    lean: Math.sin(index * .38) * lean,
  }));
  return { name, initials, city, ride: {
    id: `demo-${id}`, title, startTime: new Date(now).toISOString(), endTime: new Date(now + durationSec * 1000).toISOString(),
    distanceKm: route.distanceKm, durationSec, avgSpeed, maxSpeed: Math.max(...coordinates.map((point) => point.speed)),
    maxLeanLeft: -lean, maxLeanRight: lean, coordinates, speedSamples: coordinates.map((point) => point.speed),
    speedSum: coordinates.reduce((sum, point) => sum + point.speed, 0), speedCount: coordinates.length, pausedDurationMs: 0,
  } };
}
export const demoRoutes: DemoRoute[] = [
  createDemo('1', 'Las Palmas al amanecer', 'Sofía M.', 'SM', 'Medellín', paths.palmas, 40.8, 31),
  createDemo('2', 'Curvas del KM 18', 'Andrés V.', 'AV', 'Cali', paths.km18, 39.6, 28),
  createDemo('3', 'Vuelta a La Calera', 'Valentina R.', 'VR', 'Bogotá', paths.calera, 38.1, 26),
];
