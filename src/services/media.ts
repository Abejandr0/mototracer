import { File } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from './supabase';

export async function uploadUserImage(uri: string, folder: 'profiles' | 'vehicles' | 'odometers') {
  if (!supabase) throw new Error('Configura Supabase antes de subir imágenes.');
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Inicia sesión para sincronizar esta foto.');
  const context = ImageManipulator.ImageManipulator.manipulate(uri);
  context.resize({ width: folder === 'profiles' ? 512 : 1600 });
  const rendered = await context.renderAsync();
  const converted = await rendered.saveAsync({ format: ImageManipulator.SaveFormat.JPEG, compress: .82 });
  const file = new File(converted.uri);
  const bytes = await file.bytes();
  if (bytes.byteLength > 5 * 1024 * 1024) throw new Error('La imagen debe pesar menos de 5 MB.');
  const path = `${session.user.id}/${folder}/${Date.now()}.jpg`;
  const bucket = folder === 'odometers' ? 'moto-private' : 'moto-media';
  const { error } = await supabase.storage.from(bucket).upload(path, bytes.buffer as ArrayBuffer, { contentType: 'image/jpeg', cacheControl: '3600', upsert: false });
  if (error) throw error;
  if (folder === 'odometers') return `moto-private:${path}`;
  return supabase.storage.from('moto-media').getPublicUrl(path).data.publicUrl;
}

export async function resolveUserImage(uri: string) {
  if (!uri.startsWith('moto-private:')) return uri;
  if (!supabase) throw new Error('Supabase no está configurado.');
  const { data, error } = await supabase.storage.from('moto-private').createSignedUrl(uri.slice('moto-private:'.length), 3600);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteUserImages(uris: (string | undefined)[]) {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Inicia sesión para eliminar fotos.');
  const groups: Record<'moto-media' | 'moto-private', string[]> = { 'moto-media': [], 'moto-private': [] };
  for (const uri of uris) {
    if (!uri) continue;
    const bucket = uri.startsWith('moto-private:') ? 'moto-private' : 'moto-media';
    const path = bucket === 'moto-private' ? uri.slice('moto-private:'.length) : uri.includes('/moto-media/') ? decodeURIComponent(uri.split('/moto-media/')[1].split('?')[0]) : '';
    if (path.startsWith(`${session.user.id}/`)) groups[bucket].push(path);
  }
  for (const bucket of ['moto-media', 'moto-private'] as const) {
    if (!groups[bucket].length) continue;
    const { error } = await supabase.storage.from(bucket).remove(groups[bucket]);
    if (error) throw error;
  }
}
