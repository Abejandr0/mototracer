import React from 'react';
import { ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing } from '../theme';
import { usePreferences } from '../providers/PreferencesProvider';

export function Page({ children, scroll = true }: React.PropsWithChildren<{ scroll?: boolean }>) {
  usePreferences();
  const body = <View style={styles.content}>{children}</View>;
  return <SafeAreaView style={[styles.safe, { backgroundColor: Colors.background }]} edges={['top']}>
    {scroll ? <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>{body}</ScrollView> : body}
  </SafeAreaView>;
}
export function Header({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  const { t, largeText } = usePreferences();
  return <View><Text style={[styles.brand, { color: Colors.textTertiary }]}>MOTOTRACER</Text><View style={styles.header}><View style={{ flex: 1 }}><Text style={[styles.title, { color: Colors.textPrimary, fontSize: largeText ? 35 : 31 }]}>{t(title)}</Text>{subtitle ? <Text style={[styles.sub, { color: Colors.textSecondary, fontSize: largeText ? 16 : 13 }]}>{t(subtitle)}</Text> : null}</View>{right}</View></View>;
}
export function Card({ children, style }: React.PropsWithChildren<{ style?: ViewStyle }>) { usePreferences(); return <View style={[styles.card, { backgroundColor: Colors.card, borderColor: Colors.border }, style]}>{children}</View>; }
export function Label({ children }: React.PropsWithChildren) { const { t, largeText } = usePreferences(); return <Text style={[styles.label, { color: Colors.textTertiary, fontSize: largeText ? 12 : 10 }]}>{typeof children === 'string' ? t(children) : children}</Text>; }
const makeScreenStyles = () => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  action: { backgroundColor: Colors.primaryAction, paddingVertical: 15, paddingHorizontal: 18, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  actionText: { color: '#fff', fontWeight: '800', fontSize: 14, letterSpacing: .4 },
  secondary: { backgroundColor: Colors.cardElevated, paddingVertical: 13, paddingHorizontal: 16, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: Colors.textPrimary, fontWeight: '700', fontSize: 14 },
  metric: { color: Colors.textPrimary, fontSize: 24, fontWeight: '800' },
  muted: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19 },
});
export const screenStyles: ReturnType<typeof makeScreenStyles> = new Proxy({} as ReturnType<typeof makeScreenStyles>, { get: (_target, property) => makeScreenStyles()[property as keyof ReturnType<typeof makeScreenStyles>] });
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: Colors.background }, scroll: { paddingBottom: 28 }, content: { paddingHorizontal: Spacing.base, paddingTop: 12, gap: 14 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }, brand: { color: Colors.textTertiary, fontSize: 9, fontWeight: '800', letterSpacing: 2.3, textAlign: 'center', marginBottom: 13 }, title: { color: Colors.textPrimary, fontSize: 31, fontWeight: '900', marginTop: 3 }, sub: { color: Colors.textSecondary, fontSize: 13, marginTop: 4 }, card: { backgroundColor: Colors.card, borderColor: Colors.border, borderWidth: 1, borderRadius: Radius.lg, padding: 16, gap: 10 }, label: { color: Colors.textTertiary, fontSize: 10, fontWeight: '800', letterSpacing: 1.3, textTransform: 'uppercase' } });
