import { requireOptionalNativeModule } from 'expo';

export type NowPlaying = {
  title: string | null;
  artist: string | null;
  album: string | null;
  packageName: string;
  isPlaying: boolean;
  canPlayPause: boolean;
  canSkipNext: boolean;
  canSkipPrevious: boolean;
};
type MediaControlsNativeModule = {
  hasNotificationAccess(): boolean;
  openNotificationAccessSettings(): boolean;
  getNowPlaying(): NowPlaying | null;
  control(action: 'toggle' | 'next' | 'previous'): boolean;
};
const nativeModule = requireOptionalNativeModule<MediaControlsNativeModule>('MotoTracerMediaControls');

export const mediaControlsAvailable = Boolean(nativeModule);
export const hasNotificationAccess = () => nativeModule?.hasNotificationAccess() ?? false;
export const openNotificationAccessSettings = () => nativeModule?.openNotificationAccessSettings() ?? false;
export const getNowPlaying = () => nativeModule?.getNowPlaying() ?? null;
export const controlPlayback = (action: 'toggle' | 'next' | 'previous') => nativeModule?.control(action) ?? false;
