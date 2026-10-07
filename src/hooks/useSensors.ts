import { useState, useEffect, useRef, useCallback } from 'react';
import { Accelerometer, Gyroscope } from 'expo-sensors';
import type { ThreeAxisMeasurement } from 'expo-sensors';

export interface SensorData {
  // Accelerometer (g-force units)
  ax: number;
  ay: number;
  az: number;
  // Gyroscope (rad/s)
  gx: number;
  gy: number;
  gz: number;
  // Derived
  leanAngle: number;         // degrees, negative=left, positive=right
  accelerationMagnitude: number; // total g-force magnitude
  isCrashDetected: boolean;
}

const CRASH_THRESHOLD = 3.5;   // g-force above this = potential crash
const UPDATE_INTERVAL = 100;   // ms

function computeLeanAngle(ax: number, ay: number, az: number): number {
  // Roll angle from accelerometer
  // atan2(ax, sqrt(ay^2 + az^2)) gives roll in radians
  const roll = Math.atan2(ax, Math.sqrt(ay * ay + az * az));
  return (roll * 180) / Math.PI;
}

export function useSensors(active: boolean = true) {
  const [data, setData] = useState<SensorData>({
    ax: 0, ay: 0, az: 1,
    gx: 0, gy: 0, gz: 0,
    leanAngle: 0,
    accelerationMagnitude: 1,
    isCrashDetected: false,
  });

  const accelRef = useRef<ThreeAxisMeasurement>({ x: 0, y: 0, z: 1 });
  const gyroRef = useRef<ThreeAxisMeasurement>({ x: 0, y: 0, z: 0 });
  const accelSubRef = useRef<ReturnType<typeof Accelerometer.addListener> | null>(null);
  const gyroSubRef = useRef<ReturnType<typeof Gyroscope.addListener> | null>(null);

  const update = useCallback(() => {
    const { x: ax, y: ay, z: az } = accelRef.current;
    const { x: gx, y: gy, z: gz } = gyroRef.current;
    const magnitude = Math.sqrt(ax * ax + ay * ay + az * az);
    const lean = computeLeanAngle(ax, ay, az);

    setData({
      ax, ay, az, gx, gy, gz,
      leanAngle: lean,
      accelerationMagnitude: magnitude,
      isCrashDetected: magnitude > CRASH_THRESHOLD,
    });
  }, []);

  useEffect(() => {
    if (!active) return;

    Accelerometer.setUpdateInterval(UPDATE_INTERVAL);
    Gyroscope.setUpdateInterval(UPDATE_INTERVAL);

    accelSubRef.current = Accelerometer.addListener((measurement) => {
      accelRef.current = measurement;
      update();
    });

    gyroSubRef.current = Gyroscope.addListener((measurement) => {
      gyroRef.current = measurement;
    });

    return () => {
      accelSubRef.current?.remove();
      gyroSubRef.current?.remove();
    };
  }, [active, update]);

  return data;
}
