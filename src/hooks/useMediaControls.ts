import { useCallback, useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { controlPlayback, getNowPlaying, hasNotificationAccess, mediaControlsAvailable, NowPlaying, openNotificationAccessSettings } from '../../modules/mototracer-media-controls/src';

export function useMediaControls() {
  const [access, setAccess] = useState(false);
  const [track, setTrack] = useState<NowPlaying | null>(null);
  const [loading, setLoading] = useState(false);
  const refresh = useCallback(() => {
    if (Platform.OS !== 'android' || !mediaControlsAvailable) return;
    const granted = hasNotificationAccess();
    setAccess(granted);
    setTrack(granted ? getNowPlaying() : null);
  }, []);
  useEffect(() => {
    const initial = setTimeout(refresh, 0);
    const timer = setInterval(() => { if (AppState.currentState === 'active') refresh(); }, 2500);
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') refresh(); });
    return () => { clearTimeout(initial); clearInterval(timer); subscription.remove(); };
  }, [refresh]);
  const connect = useCallback(() => {
    if (Platform.OS !== 'android' || !mediaControlsAvailable) return;
    openNotificationAccessSettings();
  }, []);
  const control = useCallback((action: 'toggle' | 'next' | 'previous') => {
    setLoading(true);
    const accepted = controlPlayback(action);
    setTimeout(() => { refresh(); setLoading(false); }, 350);
    return accepted;
  }, [refresh]);
  return { supported: Platform.OS === 'android' && mediaControlsAvailable, access, track, loading, refresh, connect, control };
}
