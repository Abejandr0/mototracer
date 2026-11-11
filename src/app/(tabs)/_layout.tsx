import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../theme';
import { usePreferences } from '../../providers/PreferencesProvider';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
function TabIcon({ focused, color, name }: { focused: boolean; color: string; name: IconName }) {
  const { reduceMotion } = usePreferences();
  const [scale] = useState(() => new Animated.Value(focused ? 1.12 : 1));
  useEffect(() => { if (reduceMotion) scale.setValue(1); else Animated.spring(scale, { toValue: focused ? 1.1 : 1, useNativeDriver: true, friction: 7 }).start(); }, [focused, scale, reduceMotion]);
  return <Animated.View style={{ transform: [{ scale }], width: 45, height: 37, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? Colors.surface : 'transparent' }}><MaterialCommunityIcons name={name} size={27} color={color} /></Animated.View>;
}
export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { t, largeText } = usePreferences();
  const icon = (name: IconName) => function TabBarIcon({ focused, color }: { focused: boolean; color: unknown }) { return <TabIcon focused={focused} color={typeof color === 'string' ? color : Colors.textTertiary} name={name} />; };
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: Colors.primaryAction,
    tabBarInactiveTintColor: Colors.textTertiary, tabBarStyle: { backgroundColor: Colors.card, borderTopColor: Colors.border, height: 68 + insets.bottom, paddingTop: 9, paddingBottom: Math.max(insets.bottom, 7) },
    tabBarLabelStyle: { fontSize: largeText ? 13 : 11, fontWeight: '800', marginTop: 0 }, sceneStyle: { backgroundColor: Colors.background } }}>
    <Tabs.Screen name="index" options={{ title: t('Inicio'), tabBarIcon: icon('home-variant-outline') }} />
    <Tabs.Screen name="routes" options={{ title: t('Rutas'), tabBarIcon: icon('map-marker-path') }} />
    <Tabs.Screen name="garage" options={{ title: t('Garaje'), tabBarIcon: icon('motorbike') }} />
    <Tabs.Screen name="profile" options={{ title: t('Perfil'), tabBarIcon: icon('account-circle-outline') }} />
  </Tabs>;
}
