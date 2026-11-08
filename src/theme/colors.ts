// MotoTracer — Design System Color Tokens
// Matches Figma spec exactly

export const Colors = {
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
} as const;

export type ColorKey = keyof typeof Colors;
