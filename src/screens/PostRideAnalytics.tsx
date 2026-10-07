import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '../theme';
import { AppHeader, StatCard } from '../components';
import type { RideSession } from '../hooks/useRideStore';

interface PostRideAnalyticsProps {
  session: RideSession;
  onStartNewRide: () => void;
  onGoHome: () => void;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('es-MX', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const PostRideAnalytics: React.FC<PostRideAnalyticsProps> = ({
  session,
  onStartNewRide,
  onGoHome,
}) => {
  const avgLean = session.leanSamples.length > 0
    ? session.leanSamples.reduce((a, b) => a + Math.abs(b), 0) / session.leanSamples.length
    : 0;

  const speedSamples = session.speedSamples;
  const top10pct = speedSamples
    .sort((a, b) => b - a)
    .slice(0, Math.max(1, Math.floor(speedSamples.length * 0.1)));
  const peakSpeed = top10pct.length > 0 ? top10pct[0] : 0;

  // Generate simplified chart points
  const chartData = speedSamples.filter((_, i) => i % 5 === 0).slice(0, 30);
  const chartMax = Math.max(...chartData, 1);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <AppHeader subtitle="Post-ride telemetry" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Route summary header */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Route Stats</Text>
            <Text style={styles.summaryDate}>{formatDate(session.startTime)}</Text>
          </View>

          <View style={styles.summaryGridTop}>
            <View style={styles.summaryBigStat}>
              <Text style={[styles.bigValue, { color: Colors.activeTelemetry }]}>
                {session.distance.toFixed(1)}
              </Text>
              <Text style={styles.bigUnit}>km</Text>
            </View>
            <View style={styles.summaryBigStat}>
              <Text style={[styles.bigValue, { color: Colors.gpsOptimal }]}>
                {formatDuration(session.duration)}
              </Text>
            </View>
          </View>

          {/* Speed mini chart */}
          <Text style={styles.chartTitle}>SPEED PROFILE</Text>
          <View style={styles.chartContainer}>
            {chartData.map((v, i) => (
              <View
                key={i}
                style={[
                  styles.chartBar,
                  {
                    height: Math.max(2, (v / chartMax) * 60),
                    backgroundColor:
                      v > peakSpeed * 0.8
                        ? Colors.primaryAction
                        : v > peakSpeed * 0.5
                        ? Colors.activeTelemetry
                        : Colors.gpsOptimal,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Telemetry metrics grid */}
        <Text style={styles.sectionTitle}>TELEMETRY METRICS</Text>
        <View style={styles.metricsGrid}>
          <StatCard
            label="Max Speed"
            value={`${Math.round(session.maxSpeed)}`}
            unit="km/h"
            accent
            style={styles.metricCard}
          />
          <StatCard
            label="Avg Speed"
            value={`${Math.round(session.avgSpeed)}`}
            unit="km/h"
            style={styles.metricCard}
          />
          <StatCard
            label="Max Lean Left"
            value={`${Math.abs(session.maxLeanLeft).toFixed(1)}°`}
            accent
            style={styles.metricCard}
          />
          <StatCard
            label="Max Lean Right"
            value={`${session.maxLeanRight.toFixed(1)}°`}
            accent
            style={styles.metricCard}
          />
          <StatCard
            label="Avg Lean"
            value={`${avgLean.toFixed(1)}°`}
            style={styles.metricCard}
          />
          <StatCard
            label="Duration"
            value={formatDuration(session.duration)}
            style={styles.metricCard}
          />
        </View>

        {/* Lean angle bars */}
        <Text style={styles.sectionTitle}>LEAN DISTRIBUTION</Text>
        <View style={styles.leanCard}>
          {[
            { label: '0–15°', value: 40, color: Colors.gpsOptimal },
            { label: '15–30°', value: 35, color: Colors.activeTelemetry },
            { label: '30–45°', value: 18, color: Colors.warning },
            { label: '45°+', value: 7, color: Colors.primaryAction },
          ].map((item) => (
            <View key={item.label} style={styles.leanRow}>
              <Text style={styles.leanLabel}>{item.label}</Text>
              <View style={styles.leanBarTrack}>
                <View
                  style={[
                    styles.leanBarFill,
                    { width: `${item.value}%`, backgroundColor: item.color },
                  ]}
                />
              </View>
              <Text style={[styles.leanPct, { color: item.color }]}>
                {item.value}%
              </Text>
            </View>
          ))}
        </View>

        {/* Action bar */}
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.btnShare}>
            <Text style={styles.btnShareText}>📤 Compartir GPS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnSave}>
            <Text style={styles.btnSaveText}>Show Cart</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />

        <TouchableOpacity style={styles.btnNewRide} onPress={onStartNewRide}>
          <Text style={styles.btnNewRideText}>START NEW RIDE</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnHome} onPress={onGoHome}>
          <Text style={styles.btnHomeText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.base },

  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.base,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.base,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  summaryDate: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  summaryGridTop: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginBottom: Spacing.base,
  },
  summaryBigStat: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  bigValue: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
  },
  bigUnit: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 6,
    fontWeight: '600',
  },

  chartTitle: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 1.2,
    marginBottom: Spacing.sm,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 64,
    gap: 2,
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    padding: Spacing.xs,
  },
  chartBar: {
    flex: 1,
    borderRadius: 2,
    minWidth: 3,
  },

  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    marginTop: Spacing.base,
  },

  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  metricCard: {
    width: '47%',
  },

  leanCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  leanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  leanLabel: { width: 50, fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  leanBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  leanBarFill: { height: '100%', borderRadius: Radius.full },
  leanPct: { width: 36, fontSize: 12, fontWeight: '700', textAlign: 'right' },

  actionBar: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  btnShare: {
    flex: 1,
    backgroundColor: Colors.activeTelemetry,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnShareText: {
    color: Colors.background,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  btnSave: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnSaveText: {
    color: Colors.textSecondary,
    fontWeight: '700',
    fontSize: 13,
  },

  btnNewRide: {
    backgroundColor: Colors.primaryAction,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: Spacing.sm,
    shadowColor: Colors.primaryAction,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  btnNewRideText: {
    color: Colors.textPrimary,
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 1,
  },
  btnHome: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnHomeText: {
    color: Colors.textTertiary,
    fontWeight: '600',
    fontSize: 14,
  },
});
