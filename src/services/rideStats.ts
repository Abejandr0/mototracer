import type { Coordinate, Ride } from '../providers/AppProvider';
import { distanceMeters } from './rideTelemetry';

export type RouteSegment = { distanceKm: number; start: number; end: number; avgSpeed: number; maxSpeed: number; maxLeanLeft: number; maxLeanRight: number; maxG: number; points: number };
export function segmentLengthKm(totalKm: number) { return totalKm < 5 ? 1 : totalKm < 25 ? 2 : 5; }
export function summarizeSegments(points: Coordinate[], lengthKm: number): RouteSegment[] {
  if (points.length < 2) return [];
  const segments: RouteSegment[] = [];
  let current = { distanceKm: 0, start: points[0].timestamp, end: points[0].timestamp, maxSpeed: 0, maxLeanLeft: 0, maxLeanRight: 0, maxG: 0, points: 0 };
  for (let index = 1; index < points.length; index++) {
    const previous = points[index - 1], point = points[index];
    if (point.breakBefore) {
      if (current.distanceKm >= .1) {
        const durationHours = Math.max(1, current.end - current.start) / 3_600_000;
        segments.push({ ...current, avgSpeed: current.distanceKm / durationHours });
      }
      current = { distanceKm: 0, start: point.timestamp, end: point.timestamp, maxSpeed: 0, maxLeanLeft: 0, maxLeanRight: 0, maxG: 0, points: 0 };
      continue;
    }
    const stepKm = distanceMeters(previous, point) / 1000;
    if (stepKm > .5) continue;
    current.distanceKm += stepKm;
    current.end = point.timestamp;
    current.maxSpeed = Math.max(current.maxSpeed, point.speed);
    current.maxLeanLeft = Math.min(current.maxLeanLeft, point.lean);
    current.maxLeanRight = Math.max(current.maxLeanRight, point.lean);
    current.maxG = Math.max(current.maxG, point.gForce ?? 0);
    current.points++;
    if (current.distanceKm >= lengthKm) {
      const durationHours = Math.max(1, current.end - current.start) / 3_600_000;
      segments.push({ ...current, avgSpeed: current.distanceKm / durationHours });
      current = { distanceKm: 0, start: point.timestamp, end: point.timestamp, maxSpeed: 0, maxLeanLeft: 0, maxLeanRight: 0, maxG: 0, points: 0 };
    }
  }
  if (current.distanceKm >= .1) {
    const durationHours = Math.max(1, current.end - current.start) / 3_600_000;
    segments.push({ ...current, avgSpeed: current.distanceKm / durationHours });
  }
  return segments;
}

export function summarizeRide(ride: Ride) {
  let ascent = 0, descent = 0, movingSeconds = 0, stops = 0, maxG = 0, wasMoving = false;
  for (let index = 1; index < ride.coordinates.length; index++) {
    const previous = ride.coordinates[index - 1], point = ride.coordinates[index];
    if (point.breakBefore) { wasMoving = false; continue; }
    maxG = Math.max(maxG, point.gForce ?? 0);
    if (previous.altitude != null && point.altitude != null) {
      const delta = point.altitude - previous.altitude;
      if (Math.abs(delta) >= 2 && Math.abs(delta) < 50) { if (delta > 0) ascent += delta; else descent -= delta; }
    }
    const moving = point.speed >= 3;
    const elapsed = Math.max(0, Math.min(30, (point.timestamp - previous.timestamp) / 1000));
    if (moving) movingSeconds += elapsed;
    if (wasMoving && !moving && elapsed >= 2) stops++;
    wasMoving = moving;
  }
  const speeds = ride.coordinates.map((point) => point.speed).filter(Number.isFinite).sort((a, b) => a - b);
  return { ascent, descent, movingSeconds, stops, maxG, speedP95: speeds[Math.floor((speeds.length - 1) * .95)] ?? 0 };
}
