import test from 'node:test';
import assert from 'node:assert/strict';
import { distanceMeters, speedFromFixes } from '../src/services/rideTelemetry.ts';
import { detectImpact } from '../src/services/crashDetection.ts';
import { extractOdometer } from '../src/services/odometerOcr.ts';

test('GPS speed falls back to traveled distance when native speed is zero', () => {
  const start = { latitude: 6.2, longitude: -75.57, timestamp: 0, accuracy: 5 };
  const next = { latitude: 6.2004, longitude: -75.57, timestamp: 4000, accuracy: 5 };
  assert.ok(distanceMeters(start, next) > 40);
  assert.ok(speedFromFixes(next, start, 0) > 35);
});

test('impact triggers on a strong spike or two sustained high samples', () => {
  assert.equal(detectImpact(6.2, 'standard', 0).detected, true);
  const first = detectImpact(4, 'standard', 0);
  assert.equal(first.detected, false);
  assert.equal(detectImpact(4.1, 'standard', first.highSamples).detected, true);
  assert.equal(detectImpact(1, 'standard', 1).detected, false);
});

test('odometer reading prioritizes total mileage and respects current value', () => {
  assert.equal(extractOdometer('TRIP 1234\nODO 18,450 km\nSPEED 80', 15000), 18450);
  assert.equal(extractOdometer('ODO 8,500 km', 9000), null);
});
