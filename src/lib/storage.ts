import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

export interface UploadResult {
  url: string | null;
  error: string | null;
}

/**
 * Opens the device photo library via PHPicker (iOS) / Photo Picker (Android 13+),
 * lets the user pick and crop an image, then uploads to Supabase Storage.
 *
 * We intentionally do NOT request media library permissions — the modern pickers
 * are sandboxed and don't need them, which avoids the iOS "Limited Access" prompt
 * and the location-metadata snackbar.
 */
export async function pickAndUploadImage(
  bucket: string,
  path: string,
  options?: { aspect?: [number, number] },
): Promise<UploadResult> {
  let result: ImagePicker.ImagePickerResult;
  try {
    result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: options?.aspect ?? [1, 1],
      quality: 0.85,
      exif: false,
    });
  } catch (e: any) {
    return { url: null, error: `Picker failed: ${e?.message ?? e}` };
  }

  if (result.canceled || !result.assets?.length) {
    return { url: null, error: null }; // user cancelled — not an error
  }

  const asset = result.assets[0];
  const uri = asset.uri;
  const ext = (uri.split('.').pop() ?? 'jpg').toLowerCase().split('?')[0];
  const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';

  try {
    // Fetch the local file and convert to ArrayBuffer (more reliable on RN than blob)
    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, arrayBuffer, { contentType, upsert: true });

    if (uploadError) {
      // Surface the exact error message so RLS / auth issues are visible
      return { url: null, error: `Storage: ${uploadError.message}` };
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return { url: `${data.publicUrl}?t=${Date.now()}`, error: null };
  } catch (e: any) {
    return { url: null, error: `Upload failed: ${e?.message ?? e}` };
  }
}
