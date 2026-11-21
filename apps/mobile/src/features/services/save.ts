// Saves a finished result straight to the phone: photos and videos into the
// gallery, in an album named "SQ AI"; voice-overs into the phone's music
// files on Android. iOS keeps no audio in its photo library, so a voice-over
// there goes to the share sheet, where "Save to Files" keeps it.

import * as FileSystem from 'expo-file-system/legacy';
import { Album, Asset, requestPermissionsAsync } from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export type SaveType = 'audio' | 'image' | 'video';
// Where the file ended up, so the screen can say so.
export type SaveOutcome = 'gallery' | 'music' | 'shared' | 'downloaded';

export const ALBUM = 'SQ AI';

export class SaveDenied extends Error {}

const ext: Record<SaveType, string> = { audio: 'mp3', image: 'png', video: 'mp4' };
const mime: Record<SaveType, string> = { audio: 'audio/mpeg', image: 'image/png', video: 'video/mp4' };

export async function saveToDevice(type: SaveType, url: string): Promise<SaveOutcome> {
  const { uri } = await FileSystem.downloadAsync(url, `${FileSystem.cacheDirectory}sq-${Date.now()}.${ext[type]}`);
  try {
    if (type === 'audio' && Platform.OS !== 'android') {
      await Sharing.shareAsync(uri, { mimeType: mime.audio, UTI: 'public.mp3' });
      return 'shared';
    }
    // Adding to the library needs write access only; Android 13 and later
    // need no permission for that at all.
    const perm = await requestPermissionsAsync(true);
    if (!perm.granted) throw new SaveDenied('permission');
    if (Platform.OS === 'android') {
      // Creating the album saves the file into Pictures/SQ AI (or Music/SQ AI
      // for audio); an existing album of that name is simply added to.
      try {
        await Album.create(ALBUM, [uri], false);
      } catch {
        await Asset.create(uri);
      }
      return type === 'audio' ? 'music' : 'gallery';
    }
    const asset = await Asset.create(uri);
    // Albums need full photo access on iOS; without it the file is still in
    // the library, just not in the album.
    try {
      const album = await Album.get(ALBUM);
      if (album) await album.add(asset);
      else await Album.create(ALBUM, [asset]);
    } catch {
      // Saved to the library without the album.
    }
    return 'gallery';
  } finally {
    FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => undefined);
  }
}
