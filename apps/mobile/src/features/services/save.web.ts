// In the browser there is no gallery to save to, so the file downloads.

export type SaveType = 'audio' | 'image' | 'video';
export type SaveOutcome = 'gallery' | 'music' | 'shared' | 'downloaded';

export const ALBUM = 'SQ AI';

export class SaveDenied extends Error {}

const ext: Record<SaveType, string> = { audio: 'mp3', image: 'png', video: 'mp4' };

export async function saveToDevice(type: SaveType, url: string): Promise<SaveOutcome> {
  try {
    const blob = await (await fetch(url)).blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = `sq-${Date.now()}.${ext[type]}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(href), 4000);
  } catch {
    window.open(url, '_blank');
  }
  return 'downloaded';
}
