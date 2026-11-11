import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../providers/AuthProvider';
import { useAppData } from '../providers/AppProvider';
export default function Index() { const { session, loading } = useAuth(); const { ready, profileComplete, vehicles } = useAppData(); if (loading || !ready) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator /></View>; if (!session) return <Redirect href="/welcome" />; if (!profileComplete) return <Redirect href="/profile-setup" />; if (!vehicles.length) return <Redirect href="/vehicle-form?setup=1" />; return <Redirect href="/(tabs)" />; }
