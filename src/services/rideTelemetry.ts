export type GpsFix = { latitude: number; longitude: number; timestamp: number; accuracy?: number | null };

export function distanceMeters(a: GpsFix, b: GpsFix) {
  const radians = (value: number) => value * Math.PI / 180;
  const dLat = radians(b.latitude - a.latitude);
  const dLon = radians(b.longitude - a.longitude);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export function speedFromFixes(current: GpsFix, anchor: GpsFix | null, nativeMetersPerSecond: number | null) {
  const native = nativeMetersPerSecond != null && Number.isFinite(nativeMetersPerSecond) && nativeMetersPerSecond > .5 && nativeMetersPerSecond < 70
    ? nativeMetersPerSecond * 3.6 : 0;
  if (!anchor) return native;
  const elapsed = (current.timestamp - anchor.timestamp) / 1000;
  if (elapsed < 1.5 || elapsed > 30 || (current.accuracy ?? 0) > 60) return native;
  const distance = distanceMeters(anchor, current);
  const noiseFloor = Math.max(5, Math.min(20, (current.accuracy ?? 8) * .75));
  const derived = distance >= noiseFloor ? distance / elapsed * 3.6 : 0;
  return derived <= 220 ? Math.max(native, derived) : native;
}
