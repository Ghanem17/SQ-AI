// Picking the customer's own video or photos, from the gallery or from their
// files at original quality, and uploading them straight to fal storage
// through a one-time link from our server.

import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { createVideoPlayer } from 'expo-video';
import { Platform } from 'react-native';

import { MAX_UPLOAD_BYTES, MAX_VIDEO_SECONDS, formatNumber } from '@sq/shared';
import { postJson } from '@/lib/ai';

// `estimated` marks a video whose length could not be read; it is priced at
// DEFAULT_VIDEO_SECONDS and the quote says so. `bytes` is the file size when
// known.
export type PickedMedia = {
  uri: string;
  kind: 'video' | 'image';
  mimeType: string;
  seconds: number;
  fileName: string;
  bytes?: number;
  estimated?: boolean;
};

export type PickSource = 'gallery' | 'files';
export type PickError = 'permission' | 'tooLong' | 'tooBig' | 'type';
export type PickResult = PickedMedia[] | { error: PickError } | null;

export const DEFAULT_VIDEO_SECONDS = 30;

// The types fal's tools read, as the server's upload route allows them.
const types: Record<string, string> = {
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  mov: 'video/quicktime',
  qt: 'video/quicktime',
  webm: 'video/webm',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
};
const allowed = new Set(Object.values(types));

// The file's type from what the picker reported, else from its extension.
function mimeOf(name: string, reported: string | null | undefined): string {
  const given = reported?.toLowerCase().replace('image/jpg', 'image/jpeg');
  if (given && allowed.has(given)) return given;
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return types[ext] ?? given ?? '';
}

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

// On a phone a file picked from Files carries no duration, so a muted player
// loads only the video's metadata and is released straight away.
function nativeDuration(uri: string): Promise<number> {
  return new Promise((resolve) => {
    let player: ReturnType<typeof createVideoPlayer>;
    try {
      player = createVideoPlayer(uri);
    } catch {
      resolve(0);
      return;
    }
    let settled = false;
    const finish = (s: number) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      loaded.remove();
      status.remove();
      try {
        player.release();
      } catch {
        // Already released.
      }
      resolve(Number.isFinite(s) && s > 0 ? s : 0);
    };
    const timer = setTimeout(() => finish(player.duration), 8000);
    const loaded = player.addListener('sourceLoad', (e) => finish(e.duration));
    const status = player.addListener('statusChange', (e) => {
      if (e.status === 'readyToPlay') finish(player.duration);
      if (e.status === 'error') finish(0);
    });
    player.muted = true;
  });
}

async function readSeconds(uri: string, reported: number): Promise<number> {
  if (reported > 0) return reported;
  return Platform.OS === 'web' ? webDuration(uri) : nativeDuration(uri);
}

// The file size, when the picker did not report it.
async function sizeOf(uri: string, reported?: number | null): Promise<number> {
  if (reported && reported > 0) return reported;
  if (Platform.OS === 'web') return 0;
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists ? info.size : 0;
  } catch {
    return 0;
  }
}

type Raw = { uri: string; name: string | null | undefined; mimeType: string | null | undefined; bytes: number | null | undefined; seconds: number };

// Checks each picked file against the limits and reads what the pricing
// needs: type, size and, for a video, its length.
async function accept(raw: Raw[], kind: 'video' | 'image'): Promise<PickResult> {
  const out: PickedMedia[] = [];
  for (const [i, r] of raw.entries()) {
    const fallbackName = `${kind}-${Date.now()}-${i}`;
    const mimeType = mimeOf(r.name ?? '', r.mimeType) || (kind === 'video' ? 'video/mp4' : 'image/jpeg');
    if (!allowed.has(mimeType) || !mimeType.startsWith(kind)) return { error: 'type' };
    const bytes = await sizeOf(r.uri, r.bytes);
    if (bytes > MAX_UPLOAD_BYTES) return { error: 'tooBig' };
    let seconds = 0;
    let estimated = false;
    if (kind === 'video') {
      seconds = await readSeconds(r.uri, r.seconds);
      if (seconds > MAX_VIDEO_SECONDS) return { error: 'tooLong' };
      // Never price a video at zero seconds.
      estimated = seconds === 0;
      if (estimated) seconds = DEFAULT_VIDEO_SECONDS;
    }
    const fileName = r.name || `${fallbackName}.${mimeType.split('/')[1] ?? 'bin'}`;
    out.push({ uri: r.uri, kind, mimeType, seconds, fileName, bytes: bytes || undefined, estimated: estimated || undefined });
  }
  return out;
}

// From the gallery, without recompressing: photos at full quality, and on
// iOS videos in their current form instead of a converted copy (Android's
// picker always returns the original file).
async function fromGallery(kind: 'video' | 'image', max: number): Promise<PickResult> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return { error: 'permission' };
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: kind === 'video' ? ['videos'] : ['images'],
    allowsEditing: false,
    quality: 1,
    allowsMultipleSelection: kind === 'image' && max > 1,
    selectionLimit: kind === 'image' ? Math.max(1, max) : 1,
    orderedSelection: true,
    videoMaxDuration: MAX_VIDEO_SECONDS,
    preferredAssetRepresentationMode:
      kind === 'video' ? ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Current : ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Automatic,
  });
  if (res.canceled || !res.assets?.length) return null;
  return accept(
    res.assets.slice(0, Math.max(1, max)).map((a) => ({
      uri: a.uri,
      name: a.fileName,
      mimeType: a.mimeType,
      bytes: a.fileSize ?? a.file?.size,
      // Phones report the duration in milliseconds; the web picker reports
      // seconds or nothing, so the browser reads it from the file instead.
      seconds: Platform.OS === 'web' ? 0 : (a.duration ?? 0) / 1000,
    })),
    kind,
  );
}

// From Files (or Drive, or the downloads folder): the file exactly as it is.
async function fromFiles(kind: 'video' | 'image', max: number): Promise<PickResult> {
  const res = await DocumentPicker.getDocumentAsync({
    type: kind === 'video' ? ['video/*'] : ['image/*'],
    multiple: kind === 'image' && max > 1,
    // Other modules need a local copy to read and upload the file.
    copyToCacheDirectory: true,
    base64: false,
  });
  if (res.canceled || !res.assets?.length) return null;
  return accept(
    res.assets.slice(0, Math.max(1, max)).map((a) => ({ uri: a.uri, name: a.name, mimeType: a.mimeType, bytes: a.size ?? a.file?.size, seconds: 0 })),
    kind,
  );
}

// Picks one video, or up to `max` photos in the order chosen.
export function pickMedia(source: PickSource, kind: 'video' | 'image', max = 1): Promise<PickResult> {
  return source === 'files' ? fromFiles(kind, max) : fromGallery(kind, max);
}

// Why a pick was turned down, in the interface language.
export function pickErrorText(error: PickError, L: (ar: string, en: string) => string): string {
  const mb = formatNumber(MAX_UPLOAD_BYTES / 1_000_000);
  switch (error) {
    case 'permission':
      return L('نحتاج إلى إذن الوصول إلى الصور لتختار الملف.', 'We need access to your photos to pick the file.');
    case 'tooLong':
      return L('الفيديو أطول من 3 دقائق. قصّه أو اختر فيديو أقصر.', 'The video is longer than 3 minutes. Trim it or choose a shorter one.');
    case 'tooBig':
      return L(`حجم الملف أكبر من ${mb} ميغابايت. اختر ملفًا أصغر أو قصّ الفيديو.`, `The file is larger than ${mb} MB. Choose a smaller file or trim the video.`);
    case 'type':
      return L(
        'نوع الملف غير مدعوم. اختر فيديو MP4 أو MOV أو WebM، أو صورة JPG أو PNG أو WebP أو HEIC.',
        'This file type is not supported. Choose an MP4, MOV or WebM video, or a JPG, PNG, WebP or HEIC photo.',
      );
  }
}

// Files above this size go up in 10 MB parts, as fal's own client does.
const MULTIPART_OVER = 90 * 1024 * 1024;
const PART = 10 * 1024 * 1024;

type Link = { uploadUrl: string; fileUrl: string };

// A part's address is the upload link with the part number in its path.
function partLink(uploadUrl: string, part: number | 'complete'): string {
  const q = uploadUrl.indexOf('?');
  const base = q < 0 ? uploadUrl : uploadUrl.slice(0, q);
  const search = q < 0 ? '' : uploadUrl.slice(q);
  return `${base}/${part}${search}`;
}

async function retry<T>(task: () => Promise<T>, tries = 3): Promise<T> {
  for (let i = 1; ; i += 1) {
    try {
      return await task();
    } catch (e) {
      if (i >= tries) throw e;
    }
  }
}

function etagOf(body: string, headers: Record<string, string>): string {
  try {
    const parsed = JSON.parse(body) as { etag?: unknown };
    if (typeof parsed.etag === 'string') return parsed.etag;
  } catch {
    // Fall back to the header.
  }
  const header = Object.entries(headers).find(([k]) => k.toLowerCase() === 'etag')?.[1];
  if (!header) throw new Error('upload: no part tag');
  return header;
}

async function complete(link: Link, parts: { partNumber: number; etag: string }[]) {
  const res = await fetch(partLink(link.uploadUrl, 'complete'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ parts }) });
  if (!res.ok) throw new Error(`upload complete ${res.status}`);
}

// On a phone each part is cut from the file into a temporary file that the
// system uploads, so the whole video never sits in memory.
async function nativeParts(media: PickedMedia, bytes: number, link: Link, onProgress?: (f: number) => void) {
  const count = Math.ceil(bytes / PART);
  const parts: { partNumber: number; etag: string }[] = [];
  for (let i = 0; i < count; i += 1) {
    const position = i * PART;
    const tmp = `${FileSystem.cacheDirectory}sq-part-${Date.now()}-${i}.bin`;
    const chunk = await FileSystem.readAsStringAsync(media.uri, { encoding: FileSystem.EncodingType.Base64, position, length: Math.min(PART, bytes - position) });
    await FileSystem.writeAsStringAsync(tmp, chunk, { encoding: FileSystem.EncodingType.Base64 });
    try {
      const res = await retry(async () => {
        const r = await FileSystem.uploadAsync(partLink(link.uploadUrl, i + 1), tmp, { httpMethod: 'PUT', uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT });
        if (r.status < 200 || r.status >= 300) throw new Error(`upload part ${r.status}`);
        return r;
      });
      parts.push({ partNumber: i + 1, etag: etagOf(res.body, res.headers) });
    } finally {
      await FileSystem.deleteAsync(tmp, { idempotent: true }).catch(() => undefined);
    }
    onProgress?.((i + 1) / count);
  }
  await complete(link, parts);
}

async function webParts(blob: Blob, link: Link, onProgress?: (f: number) => void) {
  const count = Math.ceil(blob.size / PART);
  const parts: { partNumber: number; etag: string }[] = [];
  for (let i = 0; i < count; i += 1) {
    const body = blob.slice(i * PART, Math.min(blob.size, (i + 1) * PART));
    const etag = await retry(async () => {
      const r = await fetch(partLink(link.uploadUrl, i + 1), { method: 'PUT', body });
      if (!r.ok) throw new Error(`upload part ${r.status}`);
      const headers: Record<string, string> = {};
      r.headers.forEach((v, k) => {
        headers[k] = v;
      });
      return etagOf(await r.text(), headers);
    });
    parts.push({ partNumber: i + 1, etag });
    onProgress?.((i + 1) / count);
  }
  await complete(link, parts);
}

const link = (media: PickedMedia, multipart: boolean) => postJson<Link>('/api/upload', { fileName: media.fileName, contentType: media.mimeType, multipart });

// Uploads a file and returns its public fal URL. `onProgress` gets the share
// sent so far, from 0 to 1.
export async function uploadMedia(media: PickedMedia, onProgress?: (fraction: number) => void): Promise<string> {
  if (Platform.OS === 'web') {
    const blob = await (await fetch(media.uri)).blob();
    if (blob.size > MAX_UPLOAD_BYTES) throw new Error('upload: too large');
    const l = await link(media, blob.size > MULTIPART_OVER);
    if (blob.size > MULTIPART_OVER) {
      await webParts(blob, l, onProgress);
      return l.fileUrl;
    }
    const put = await fetch(l.uploadUrl, { method: 'PUT', body: blob, headers: { 'Content-Type': media.mimeType } });
    if (!put.ok) throw new Error(`upload ${put.status}`);
    onProgress?.(1);
    return l.fileUrl;
  }
  const bytes = await sizeOf(media.uri, media.bytes);
  if (bytes > MAX_UPLOAD_BYTES) throw new Error('upload: too large');
  const l = await link(media, bytes > MULTIPART_OVER);
  if (bytes > MULTIPART_OVER) {
    await nativeParts(media, bytes, l, onProgress);
    return l.fileUrl;
  }
  // The system streams the file from disk and reports how much it has sent.
  const task = FileSystem.createUploadTask(
    l.uploadUrl,
    media.uri,
    { httpMethod: 'PUT', uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT, headers: { 'Content-Type': media.mimeType } },
    (p) => {
      if (p.totalBytesExpectedToSend > 0) onProgress?.(p.totalBytesSent / p.totalBytesExpectedToSend);
    },
  );
  const put = await task.uploadAsync();
  if (!put || put.status < 200 || put.status >= 300) throw new Error(`upload ${put?.status ?? 'cancelled'}`);
  return l.fileUrl;
}
