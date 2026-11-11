// MotoTracer — Design System Color Tokens
// Matches Figma spec exactly

const dark = {
  // Backgrounds
  background: '#0D0F12',
  card: '#181B20',
  cardElevated: '#22262E',
  surface: '#252A32',

  // Brand / Accent
  activeTelemetry: '#00E5FF',  // cyan — live data, gauges
  primaryAction: '#FF5722',    // deep-orange — FAB, CTAs
  gpsOptimal: '#00E676',       // green — GPS lock, good metrics
  emergency: '#FF1744',        // red — crash / SOS

  // Text
  textPrimary: '#F5F7FA',
  textSecondary: '#9DA5B4',
  textTertiary: '#7C8496',
  textAccent: '#00E5FF',

  // Borders / Dividers
  border: '#2F3540',
  borderSubtle: '#2F3540',

  // Status
  warning: '#FFB300',
  success: '#00E676',
  danger: '#FF1744',

  // Gauge / Chart
  gaugeTrack: '#252A32',
  gaugeFill: '#00E5FF',
  speedNeedle: '#FF5722',

  // Overlay
  overlay: 'rgba(13,15,18,0.85)',
  overlayLight: 'rgba(30,34,40,0.75)',
};

const light: typeof dark = {
  background: '#F4F6F8', card: '#FFFFFF', cardElevated: '#E9EEF2', surface: '#DDE5EB',
  activeTelemetry: '#007C91', primaryAction: '#D94714', gpsOptimal: '#087C4F', emergency: '#C5163A',
  textPrimary: '#14202B', textSecondary: '#485866', textTertiary: '#5E6D79', textAccent: '#007C91',
  border: '#C8D2DA', borderSubtle: '#D5DEE5', warning: '#9E6700', success: '#087C4F', danger: '#C5163A',
  gaugeTrack: '#DDE5EB', gaugeFill: '#007C91', speedNeedle: '#D94714',
  overlay: 'rgba(244,246,248,0.88)', overlayLight: 'rgba(255,255,255,0.75)',
};

let current = dark;
export function setColorPalette(mode: 'dark' | 'light', highContrast = false) {
  current = mode === 'light' ? light : dark;
  if (highContrast) current = { ...current, textSecondary: mode === 'light' ? '#263746' : '#DDE5EC', textTertiary: mode === 'light' ? '#344553' : '#B9C4CE', border: mode === 'light' ? '#778B9B' : '#718394' };
}
export const Colors: typeof dark = new Proxy(dark, { get: (_target, property: keyof typeof dark) => current[property] });

export type ColorKey = keyof typeof Colors;
