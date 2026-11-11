import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { Animated, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
function TabIcon({ focused, color, name }: { focused: boolean; color: string; name: IconName }) {
  const [scale] = useState(() => new Animated.Value(focused ? 1.12 : 1));
  useEffect(() => { Animated.spring(scale, { toValue: focused ? 1.12 : 1, useNativeDriver: true, friction: 7 }).start(); }, [focused, scale]);
  return <Animated.View style={{ transform: [{ scale }], alignItems: 'center', gap: 3 }}><MaterialCommunityIcons name={name} size={27} color={color} /><View style={{ width: focused ? 16 : 4, height: 3, borderRadius: 3, backgroundColor: focused ? Colors.primaryAction : 'transparent' }} /></Animated.View>;
}
export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const icon = (name: IconName) => function TabBarIcon({ focused, color }: { focused: boolean; color: unknown }) { return <TabIcon focused={focused} color={typeof color === 'string' ? color : Colors.textTertiary} name={name} />; };
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: Colors.primaryAction,
    tabBarInactiveTintColor: Colors.textTertiary, tabBarStyle: { backgroundColor: Colors.card, borderTopColor: Colors.border, height: 68 + insets.bottom, paddingTop: 9, paddingBottom: Math.max(insets.bottom, 7) },
    tabBarLabelStyle: { fontSize: 12, fontWeight: '800', marginTop: 2 }, sceneStyle: { backgroundColor: Colors.background } }}>
    <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: icon('home-variant-outline') }} />
    <Tabs.Screen name="routes" options={{ title: 'Rutas', tabBarIcon: icon('map-marker-path') }} />
    <Tabs.Screen name="garage" options={{ title: 'Garaje', tabBarIcon: icon('motorbike') }} />
    <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: icon('account-circle-outline') }} />
  </Tabs>;
}
