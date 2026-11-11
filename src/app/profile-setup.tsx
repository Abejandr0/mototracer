import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme';
import { useAuth } from '../providers/AuthProvider';
import { useAppData } from '../providers/AppProvider';
import { screenStyles as s } from '../components/Screen';
import { supabase } from '../services/supabase';
import { uploadUserImage } from '../services/media';

const field = { color: Colors.textPrimary, backgroundColor: Colors.card, borderColor: Colors.border, borderWidth: 1, borderRadius: 12, padding: 15, fontSize: 15 } as const;
export default function ProfileSetupScreen() {
  const auth = useAuth(); const app = useAppData();
  const [name, setName] = useState(app.riderName || String(auth.session?.user.user_metadata?.full_name ?? ''));
  const [city, setCity] = useState(app.riderCity); const [bio, setBio] = useState(app.riderBio);
  const [error, setError] = useState(''); const [photo, setPhoto] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const pickPhoto = async () => { const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: .8 }); if (!result.canceled && result.assets[0]?.uri) setPhoto(result.assets[0].uri); };
  const save = async () => {
    if (!name.trim() || !auth.session) { setError('Añade tu nombre.'); return; }
    setBusy(true); setError('');
    try {
      const avatar = photo ? await uploadUserImage(photo, 'profiles') : null;
      if (supabase) { const { error: remoteError } = await supabase.from('profiles').upsert({ id: auth.session.user.id, full_name: name.trim(), home_region: city.trim(), avatar_url: avatar }); if (remoteError) throw remoteError; }
      app.completeProfile(name.trim(), city.trim(), bio.trim()); if (avatar) app.updateProfilePhoto(avatar);
      router.replace('/vehicle-form?setup=1');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo guardar el perfil.'); }
    finally { setBusy(false); }
  };
  return <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center', gap: 15 }}>
    <Text style={{ color: Colors.activeTelemetry, fontWeight: '900', letterSpacing: 2 }}>TU PERFIL · 1 DE 2</Text><Text style={{ color: Colors.textPrimary, fontWeight: '900', fontSize: 31 }}>¿Quién va al manubrio?</Text><Text style={s.muted}>Estos datos aparecerán junto a las rutas que decidas publicar. Puedes cambiarlos después.</Text>
    <Pressable onPress={() => void pickPhoto()} style={{ alignSelf: 'center', width: 92, height: 92, borderRadius: 46, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.card, overflow: 'hidden' }}>{photo ? <Image source={{ uri: photo }} style={{ width: 92, height: 92 }} /> : <Text style={{ color: Colors.activeTelemetry, fontSize: 33 }}>＋</Text>}</Pressable><Text style={{ color: Colors.activeTelemetry, textAlign: 'center' }}>Foto de perfil · opcional</Text>
    <TextInput placeholder="Nombre visible" placeholderTextColor={Colors.textTertiary} value={name} onChangeText={setName} style={field} />
    <TextInput placeholder="Ciudad" placeholderTextColor={Colors.textTertiary} value={city} onChangeText={setCity} style={field} />
    <TextInput placeholder="Sobre ti · opcional" placeholderTextColor={Colors.textTertiary} value={bio} onChangeText={setBio} multiline style={[field, { minHeight: 95, textAlignVertical: 'top' }]} />
    {error ? <Text style={{ color: Colors.emergency }}>{error}</Text> : null}
    <Pressable disabled={busy} onPress={() => void save()} style={[s.action, { opacity: busy ? .5 : 1 }]}><Text style={s.actionText}>{busy ? 'GUARDANDO…' : 'CONTINUAR AL GARAJE'}</Text></Pressable>
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
