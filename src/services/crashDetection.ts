export type CrashSensitivity = 'low' | 'standard' | 'high';
const thresholds: Record<CrashSensitivity, number> = { low: 4.8, standard: 3.8, high: 3.0 };

export function detectImpact(magnitude: number, sensitivity: CrashSensitivity, previousHighSamples: number) {
  const threshold = thresholds[sensitivity];
  const highSamples = magnitude >= threshold ? previousHighSamples + 1 : 0;
  const detected = magnitude >= Math.max(6, threshold + 1.5) || highSamples >= 2;
  return { highSamples, detected };
}
