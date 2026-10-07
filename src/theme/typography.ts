// MotoTracer — Typography & Spacing Design System

import { StyleSheet, TextStyle } from 'react-native';
import { Colors } from './colors';

// Spacing scale (4-base)
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

// Border radii
export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  full: 999,
} as const;

// Font sizes
export const FontSize = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  display: 48,
  hero: 72,
} as const;

// Font weights (RN compatible)
export const FontWeight = {
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semibold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
  extrabold: '800' as TextStyle['fontWeight'],
  black: '900' as TextStyle['fontWeight'],
};

// Shared text styles
export const Typography = StyleSheet.create({
  heroNumber: {
    fontSize: FontSize.hero,
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
    letterSpacing: -2,
  },
  displayNumber: {
    fontSize: FontSize.display,
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  h1: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  h2: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  h3: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  labelSmall: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  body: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.regular,
    color: Colors.textSecondary,
  },
  caption: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
    color: Colors.textTertiary,
  },
  accent: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.activeTelemetry,
  },
});
