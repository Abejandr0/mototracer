import { File } from 'expo-file-system';
import { supabase } from './supabase';

export async function uploadUserImage(uri: string, folder: 'profiles' | 'vehicles') {
  if (!supabase) throw new Error('Configura Supabase antes de subir imágenes.');
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Inicia sesión para sincronizar esta foto.');
  const file = new File(uri);
  const bytes = await file.bytes();
  if (bytes.byteLength > 5 * 1024 * 1024) throw new Error('La imagen debe pesar menos de 5 MB.');
  const extension = uri.toLowerCase().split('?')[0].split('.').pop();
  const contentType = extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg';
  const path = `${session.user.id}/${folder}/${Date.now()}.${extension === 'png' || extension === 'webp' ? extension : 'jpg'}`;
  const { error } = await supabase.storage.from('moto-media').upload(path, bytes.buffer as ArrayBuffer, { contentType, cacheControl: '3600', upsert: false });
  if (error) throw error;
  return supabase.storage.from('moto-media').getPublicUrl(path).data.publicUrl;
}
