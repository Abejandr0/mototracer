import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '../theme';
import { AppHeader, StatCard } from '../components';

type Props = {
  navigation: any;
  onStartRide: () => void;
};

const pulseAnim = new Animated.Value(1);

export const DashboardScreen: React.FC<Props> = ({ navigation, onStartRide }) => {
  const fabPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fabPulse, {
          toValue: 1.06,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(fabPulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <AppHeader subtitle="Ready to ride?" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Moto Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroOverlay} />
          <View style={styles.heroBadge}>
            <View style={styles.heroBadgeDot} />
            <Text style={styles.heroBadgeText}>GPS OPTIMAL</Text>
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.heroBikeModel}>Honda XR150L</Text>
            <Text style={styles.heroSubtitle}>Your garage • Active</Text>
          </View>
          {/* Decorative lines */}
          <View style={styles.heroStats}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>18,450</Text>
              <Text style={styles.heroStatLabel}>km total</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>62.5</Text>
              <Text style={styles.heroStatLabel}>km last</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={[styles.heroStatValue, { color: Colors.gpsOptimal }]}>
                4/4
              </Text>
              <Text style={styles.heroStatLabel}>GPS sats</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats Grid */}
        <Text style={styles.sectionTitle}>QUICK STATS</Text>
        <View style={styles.statsGrid}>
          <StatCard
            label="Engine Oil"
            value="87%"
            accent
            style={styles.statCardHalf}
          />
          <StatCard
            label="Chain Oil"
            value="OK"
            valueColor={Colors.gpsOptimal}
            style={styles.statCardHalf}
          />
          <StatCard
            label="Brake Fluid"
            value="Normal"
            style={styles.statCardHalf}
          />
          <StatCard
            label="Last Ride"
            value="3d ago"
            style={styles.statCardHalf}
          />
        </View>

        {/* Maintenance */}
        <Text style={styles.sectionTitle}>MAINTENANCE STATUS</Text>
        <View style={styles.maintenanceCard}>
          {[
            { label: 'Engine Oil', value: 87, color: Colors.gpsOptimal },
            { label: 'Chain Oil', value: 60, color: Colors.activeTelemetry },
            { label: 'Brake Fluid', value: 90, color: Colors.gpsOptimal },
          ].map((item) => (
            <View key={item.label} style={styles.maintenanceRow}>
              <Text style={styles.maintenanceLabel}>{item.label}</Text>
              <View style={styles.maintenanceBarTrack}>
                <View
                  style={[
                    styles.maintenanceBarFill,
                    { width: `${item.value}%`, backgroundColor: item.color },
                  ]}
                />
              </View>
              <Text style={[styles.maintenancePct, { color: item.color }]}>
                {item.value}%
              </Text>
            </View>
          ))}
        </View>

        {/* Safety & Sensors Toggles */}
        <Text style={styles.sectionTitle}>SAFETY & SENSORS</Text>
        <View style={styles.safetyCard}>
          {[
            { label: 'Emergency SOS Active', enabled: true },
            { label: 'Crash Detection Enabled', enabled: true },
            { label: 'Sensor Calibration', enabled: false },
          ].map((item) => (
            <View key={item.label} style={styles.safetyRow}>
              <Text style={styles.safetyLabel}>{item.label}</Text>
              <View
                style={[
                  styles.toggleTrack,
                  { backgroundColor: item.enabled ? Colors.activeTelemetry : Colors.border },
                ]}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    { marginLeft: item.enabled ? 'auto' : 0 },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <View style={styles.fabContainer}>
        <Animated.View style={{ transform: [{ scale: fabPulse }] }}>
          <TouchableOpacity
            style={styles.fab}
            onPress={onStartRide}
            activeOpacity={0.85}
          >
            <Text style={styles.fabText}>🏍  INICIAR RODADA</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.base },

  // Hero
  heroCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    minHeight: 160,
  },
  heroOverlay: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '45%',
    backgroundColor: Colors.cardElevated,
    borderTopRightRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,230,118,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.gpsOptimal,
    marginBottom: Spacing.sm,
  },
  heroBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.gpsOptimal,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.gpsOptimal,
    letterSpacing: 1,
  },
  heroInfo: { marginBottom: Spacing.base },
  heroBikeModel: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  heroSubtitle: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroStatItem: { flex: 1 },
  heroStatValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  heroStatLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.sm,
  },

  // Section title
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    marginTop: Spacing.base,
  },

  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  statCardHalf: {
    flex: 1,
    minWidth: '45%',
  },

  // Maintenance
  maintenanceCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  maintenanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  maintenanceLabel: {
    width: 90,
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  maintenanceBarTrack: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  maintenanceBarFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  maintenancePct: {
    width: 36,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },

  // Safety
  safetyCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  safetyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  safetyLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
    fontWeight: '500',
  },
  toggleTrack: {
    width: 40,
    height: 22,
    borderRadius: Radius.full,
    padding: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.textPrimary,
  },

  // FAB
  fabContainer: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.base,
    right: Spacing.base,
    alignItems: 'center',
  },
  fab: {
    backgroundColor: Colors.primaryAction,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.base,
    shadowColor: Colors.primaryAction,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
    minWidth: 280,
    alignItems: 'center',
  },
  fabText: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
