import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius } from '../theme';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  liveIndicator?: boolean;
  rightElement?: React.ReactNode;
}

export const AppHeader: React.FC<HeaderProps> = ({
  title = 'MotoTracer',
  subtitle,
  liveIndicator,
  rightElement,
}) => (
  <View style={styles.header}>
    <View style={styles.left}>
      <View style={styles.logoRow}>
        <View style={styles.logoIcon} />
        <Text style={styles.logoText}>{title}</Text>
      </View>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
    <View style={styles.right}>
      {liveIndicator && (
        <View style={styles.liveChip}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      )}
      {rightElement}
    </View>
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  left: { flex: 1 },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: Colors.primaryAction,
  },
  logoText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 2,
    fontWeight: '500',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.cardElevated,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.emergency,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.emergency,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.emergency,
    letterSpacing: 1,
  },
});

