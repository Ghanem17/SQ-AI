// Picking the customer's own video or photo, and uploading it straight to
// fal storage through a one-time link from our server.

import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import { postJson } from '@/lib/ai';

// `estimated` marks a video whose length could not be read; it is priced at
// DEFAULT_VIDEO_SECONDS and the quote says so.
export type PickedMedia = { uri: string; kind: 'video' | 'image'; mimeType: string; seconds: number; fileName: string; estimated?: boolean };

export const DEFAULT_VIDEO_SECONDS = 30;

// The web picker often returns no duration; the browser can read it from the
// file's metadata.
function webDuration(uri: string): Promise<number> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') return resolve(0);
    const video = document.createElement('video');
    const done = (s: number) => {
      video.removeAttribute('src');
      video.load();
      resolve(Number.isFinite(s) && s > 0 ? s : 0);
    };
    const timer = setTimeout(() => done(0), 8000);
    video.preload = 'metadata';
    video.muted = true;
    video.onloadedmetadata = () => {
      clearTimeout(timer);
      done(video.duration);
    };
    video.onerror = () => {
      clearTimeout(timer);
      done(0);
    };
    video.src = uri;
  });
}

const MAX_VIDEO_SECONDS = 180;

export async function pickMedia(kind: 'video' | 'image'): Promise<PickedMedia | { error: 'permission' | 'tooLong' } | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return { error: 'permission' };
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: kind === 'video' ? ['videos'] : ['images'],
    allowsEditing: false,
    quality: 0.9,
    videoMaxDuration: MAX_VIDEO_SECONDS,
  });
  if (res.canceled || !res.assets?.[0]) return null;
  const a = res.assets[0];
  // Phones report the duration in milliseconds. The web picker reports it
  // in seconds (or not at all), so the browser reads it from the file.
  let seconds = Platform.OS === 'web' ? 0 : (a.duration ?? 0) / 1000;
  if (kind === 'video' && Platform.OS === 'web') seconds = (await webDuration(a.uri)) || (a.duration ?? 0);
  if (kind === 'video' && seconds > MAX_VIDEO_SECONDS) return { error: 'tooLong' };
  // Never price a video at zero seconds.
  const estimated = kind === 'video' && seconds === 0;
  if (estimated) seconds = DEFAULT_VIDEO_SECONDS;
  const mimeType = a.mimeType ?? (kind === 'video' ? 'video/mp4' : 'image/jpeg');
  const fileName = a.fileName ?? `${kind}-${Date.now()}.${mimeType.split('/')[1] ?? 'bin'}`;
  return { uri: a.uri, kind, mimeType, seconds, fileName, estimated };
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
