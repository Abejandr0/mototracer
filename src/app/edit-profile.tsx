import { Text, TextInput } from '../components/LocalizedText';
import { usePreferences } from '../providers/PreferencesProvider';
import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme';
import { useAuth } from '../providers/AuthProvider';
import { useAppData } from '../providers/AppProvider';
import { deleteUserImages, uploadUserImage } from '../services/media';
import { supabase } from '../services/supabase';
import { screenStyles as s } from '../components/Screen';

const field = () => ({ color: Colors.textPrimary, backgroundColor: Colors.card, borderColor: Colors.border, borderWidth: 1, borderRadius: 12, padding: 14 } as const);
export default function EditProfileScreen() {
  usePreferences();
  const app = useAppData(); const auth = useAuth();
  const [name, setName] = useState(app.riderName); const [city, setCity] = useState(app.riderCity); const [bio, setBio] = useState(app.riderBio); const [photo, setPhoto] = useState(app.profilePhotoUri);
  const [busy, setBusy] = useState(false);
  const pick = async () => { const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: .8 }); if (!result.canceled && result.assets[0]?.uri) setPhoto(result.assets[0].uri); };
  const save = async () => { if (!name.trim() || !auth.session || !supabase) return; setBusy(true); try { const avatar = photo && photo !== app.profilePhotoUri ? await uploadUserImage(photo, 'profiles') : photo; const { error } = await supabase.from('profiles').update({ full_name: name.trim(), home_region: city.trim(), avatar_url: avatar }).eq('id', auth.session.user.id); if (error) throw error; app.completeProfile(name.trim(), city.trim(), bio.trim()); app.updateProfilePhoto(avatar ?? null); if (avatar !== app.profilePhotoUri && app.profilePhotoUri) void deleteUserImages([app.profilePhotoUri]).catch(() => undefined); router.back(); } catch (error) { Alert.alert('No se pudo guardar', error instanceof Error ? error.message : 'Intenta de nuevo.'); } finally { setBusy(false); } };
  return <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 22, gap: 14 }}><Pressable onPress={() => router.back()}><Text style={{ color: Colors.activeTelemetry }}>‹ Volver</Text></Pressable><Text style={{ color: Colors.textPrimary, fontSize: 29, fontWeight: '900' }}>Editar perfil</Text><Pressable onPress={() => void pick()} style={{ alignSelf: 'center', width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>{photo ? <Image source={{ uri: photo }} style={{ width: 100, height: 100 }} /> : <Text style={{ color: Colors.activeTelemetry, fontSize: 34 }}>＋</Text>}</Pressable><Text style={{ color: Colors.activeTelemetry, textAlign: 'center' }}>Cambiar foto</Text><Text style={{ color: Colors.textPrimary, fontWeight: '800' }}>Nombre visible</Text><TextInput value={name} onChangeText={setName} style={field()} /><Text style={{ color: Colors.textPrimary, fontWeight: '800' }}>Ciudad</Text><TextInput value={city} onChangeText={setCity} style={field()} /><Text style={{ color: Colors.textPrimary, fontWeight: '800' }}>Sobre ti</Text><TextInput value={bio} onChangeText={setBio} multiline style={[field(), { minHeight: 100, textAlignVertical: 'top' }]} /><Pressable onPress={() => void save()} disabled={busy} style={[s.action, { opacity: busy ? .5 : 1 }]}><Text style={s.actionText}>GUARDAR PERFIL</Text></Pressable></ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
