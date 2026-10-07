import { useState, useEffect, useRef, useCallback } from 'react';

export interface RideSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  maxSpeed: number;
  avgSpeed: number;
  maxLeanLeft: number;
  maxLeanRight: number;
  distance: number;
  duration: number;      // seconds
  speedSamples: number[];
  leanSamples: number[];
}

export interface RideStore {
  isRiding: boolean;
  session: RideSession | null;
  history: RideSession[];
  startRide: () => void;
  stopRide: () => RideSession | null;
  updateMetrics: (speed: number, lean: number) => void;
}

function generateId() {
  return `ride-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function useRideStore(): RideStore {
  const [isRiding, setIsRiding] = useState(false);
  const [session, setSession] = useState<RideSession | null>(null);
  const [history, setHistory] = useState<RideSession[]>([]);
  const sessionRef = useRef<RideSession | null>(null);

  const startRide = useCallback(() => {
    const newSession: RideSession = {
      id: generateId(),
      startTime: new Date(),
      maxSpeed: 0,
      avgSpeed: 0,
      maxLeanLeft: 0,
      maxLeanRight: 0,
      distance: 0,
      duration: 0,
      speedSamples: [],
      leanSamples: [],
    };
    sessionRef.current = newSession;
    setSession(newSession);
    setIsRiding(true);
  }, []);

  const stopRide = useCallback((): RideSession | null => {
    if (!sessionRef.current) return null;

    const endedSession: RideSession = {
      ...sessionRef.current,
      endTime: new Date(),
      duration: Math.round(
        (Date.now() - sessionRef.current.startTime.getTime()) / 1000
      ),
    };

    // Compute final avg speed
    const samples = endedSession.speedSamples;
    endedSession.avgSpeed =
      samples.length > 0
        ? Math.round(samples.reduce((a, b) => a + b, 0) / samples.length)
        : 0;

    sessionRef.current = null;
    setSession(null);
    setIsRiding(false);
    setHistory((prev) => [endedSession, ...prev]);
    return endedSession;
  }, []);

  const updateMetrics = useCallback((speed: number, lean: number) => {
    if (!sessionRef.current) return;

    const s = sessionRef.current;
    s.speedSamples.push(speed);
    s.leanSamples.push(lean);
    s.maxSpeed = Math.max(s.maxSpeed, speed);
    s.maxLeanLeft = Math.min(s.maxLeanLeft, lean);   // negative = left
    s.maxLeanRight = Math.max(s.maxLeanRight, lean);  // positive = right

    // Approximate distance: speed(km/h) * interval(100ms) → km
    s.distance += (speed / 3600) * 0.1;

    setSession({ ...s });
  }, []);

  return { isRiding, session, history, startRide, stopRide, updateMetrics };
}
