import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { Colors } from '../../theme';

export default function TabLayout() {
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: Colors.primaryAction,
    tabBarInactiveTintColor: Colors.textTertiary, tabBarStyle: { backgroundColor: Colors.card, borderTopColor: Colors.border, height: 66, paddingTop: 8, paddingBottom: 8 },
    tabBarLabelStyle: { fontSize: 10, fontWeight: '700' }, sceneStyle: { backgroundColor: Colors.background } }}>
    <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>⌂</Text> }} />
    <Tabs.Screen name="routes" options={{ title: 'Rutas', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>⌁</Text> }} />
    <Tabs.Screen name="garage" options={{ title: 'Garaje', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>⚙</Text> }} />
    <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>●</Text> }} />
  </Tabs>;
}
