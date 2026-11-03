// Picking the customer's own video or photo, and uploading it straight to
// fal storage through a one-time link from our server.

import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import { postJson } from '@/lib/ai';

export type PickedMedia = { uri: string; kind: 'video' | 'image'; mimeType: string; seconds: number; fileName: string };

const MAX_VIDEO_SECONDS = 180;

export async function pickMedia(kind: 'video' | 'image'): Promise<PickedMedia | { error: string } | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return { error: 'نحتاج إذن الاستوديو لتختار الملف.' };
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: kind === 'video' ? ['videos'] : ['images'],
    allowsEditing: false,
    quality: 0.9,
    videoMaxDuration: MAX_VIDEO_SECONDS,
  });
  if (res.canceled || !res.assets?.[0]) return null;
  const a = res.assets[0];
  const seconds = a.duration ? a.duration / 1000 : 0;
  if (kind === 'video' && seconds > MAX_VIDEO_SECONDS) return { error: 'الفيديو أطول من 3 دقائق. قصّه أو اختر فيديو أقصر.' };
  const mimeType = a.mimeType ?? (kind === 'video' ? 'video/mp4' : 'image/jpeg');
  const fileName = a.fileName ?? `${kind}-${Date.now()}.${mimeType.split('/')[1] ?? 'bin'}`;
  return { uri: a.uri, kind, mimeType, seconds, fileName };
}

// Returns the public fal URL of the uploaded file.
export async function uploadMedia(media: PickedMedia): Promise<string> {
  const { uploadUrl, fileUrl } = await postJson<{ uploadUrl: string; fileUrl: string }>('/api/upload', {
    fileName: media.fileName,
    contentType: media.mimeType,
  });
  if (Platform.OS === 'web') {
    const blob = await (await fetch(media.uri)).blob();
    const put = await fetch(uploadUrl, { method: 'PUT', body: blob, headers: { 'Content-Type': media.mimeType } });
    if (!put.ok) throw new Error(`upload ${put.status}`);
    return fileUrl;
  }
  const put = await FileSystem.uploadAsync(uploadUrl, media.uri, {
    httpMethod: 'PUT',
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: { 'Content-Type': media.mimeType },
  });
  if (put.status < 200 || put.status >= 300) throw new Error(`upload ${put.status}`);
  return fileUrl;
}
