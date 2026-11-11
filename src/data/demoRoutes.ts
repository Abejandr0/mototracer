import type { Ride, Coordinate } from '../providers/AppProvider';

type DemoRoute = { name: string; initials: string; city: string; ride: Ride };
function createDemo(id: string, title: string, name: string, initials: string, city: string, path: [number, number][], distanceKm: number, durationSec: number, avgSpeed: number, maxSpeed: number, lean: number): DemoRoute {
  const now = Date.now() - Number(id) * 86400000;
  const coordinates: Coordinate[] = path.map(([latitude, longitude], index) => ({ latitude, longitude, timestamp: now + index * durationSec * 1000 / Math.max(path.length - 1, 1), speed: avgSpeed + Math.sin(index) * 8, lean: Math.sin(index * 1.5) * lean }));
  return { name, initials, city, ride: { id: `demo-${id}`, title, startTime: new Date(now).toISOString(), endTime: new Date(now + durationSec * 1000).toISOString(), distanceKm, durationSec, avgSpeed, maxSpeed, maxLeanLeft: -lean, maxLeanRight: lean - 3, coordinates, speedSamples: coordinates.map((point) => point.speed), speedSum: avgSpeed * coordinates.length, speedCount: coordinates.length, pausedDurationMs: 0 } };
}
export const demoRoutes: DemoRoute[] = [
  createDemo('1', 'Las Palmas al amanecer', 'Sofía M.', 'SM', 'Medellín', [[6.2097,-75.5674],[6.206,-75.559],[6.202,-75.548],[6.197,-75.54],[6.192,-75.531],[6.187,-75.522],[6.181,-75.515],[6.174,-75.508]], 19.4, 1710, 40.8, 73, 31),
  createDemo('2', 'Curvas del KM 18', 'Andrés V.', 'AV', 'Cali', [[3.444,-76.59],[3.452,-76.598],[3.462,-76.605],[3.474,-76.609],[3.486,-76.616],[3.499,-76.623],[3.511,-76.631],[3.522,-76.641]], 24.2, 2200, 39.6, 67, 28),
  createDemo('3', 'Vuelta a La Calera', 'Valentina R.', 'VR', 'Bogotá', [[4.665,-74.039],[4.67,-74.03],[4.677,-74.021],[4.687,-74.012],[4.694,-74.002],[4.699,-73.994],[4.704,-73.986],[4.71,-73.98]], 16.8, 1590, 38.1, 64, 26),
];
