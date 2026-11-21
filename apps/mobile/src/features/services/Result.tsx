// Shows a finished order large: the image, video, voice-over or text, with
// one primary action that hands it to Instagram, WhatsApp and the rest
// («انشر أو شارك») and a secondary one that saves it straight to the
// phone's gallery («احفظ»).

import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'expo-image';
import * as Sharing from 'expo-sharing';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useState } from 'react';
import { Linking, Platform, Share, StyleSheet, View } from 'react-native';

import { radius } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Card, Note, Segmented } from '@/components/ui';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/theme';
import { Waveform } from './ResultTile';
import { ALBUM, SaveDenied, saveToDevice, type SaveOutcome } from './save';
import type { JobResult, ServiceJob } from './store';

type FileType = 'audio' | 'image' | 'video';
const ext: Record<FileType, string> = { audio: 'mp3', image: 'png', video: 'mp4' };
const mime: Record<FileType, string> = { audio: 'audio/mpeg', image: 'image/png', video: 'video/mp4' };

// Downloads the file next to the app's own files so the system share sheet
// can hand it on.
async function localCopy(type: FileType, url: string, dir: string | null): Promise<string> {
  const local = `${dir}sq-${Date.now()}.${ext[type]}`;
  const { uri } = await FileSystem.downloadAsync(url, local);
  return uri;
}

async function shareFile(type: FileType, url: string) {
  if (Platform.OS === 'web') {
    await Linking.openURL(url);
    return;
  }
  const uri = await localCopy(type, url, FileSystem.cacheDirectory);
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: mime[type] });
  else await Linking.openURL(url);
}

function VideoResult({ url }: { url: string }) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = true;
  });
  return (
    <View style={styles.videoStage}>
      <VideoView player={player} style={styles.video} nativeControls contentFit="contain" />
    </View>
  );
}

function AudioResult({ url, seed }: { url: string; seed: string }) {
  const { c } = useTheme();
  const { L } = useI18n();
  const player = useAudioPlayer({ uri: url });
  const status = useAudioPlayerStatus(player);
  const bars = 32;
  const played = status.duration > 0 ? Math.round((status.currentTime / status.duration) * bars) : 0;
  const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const toggle = async () => {
    if (status.playing) {
      player.pause();
      return;
    }
    await setAudioModeAsync({ playsInSilentMode: true }).catch(() => undefined);
    if (status.didJustFinish || (status.duration > 0 && status.currentTime >= status.duration)) player.seekTo(0);
    player.play();
  };
  return (
    <View style={[styles.audio, { backgroundColor: c.hero }]}>
      <Waveform seed={seed} count={bars} height={64} color={c.heroAccent} dim="rgba(255,255,255,0.22)" played={played} />
      <View style={styles.audioRow}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={status.playing ? L('إيقاف مؤقت', 'Pause') : L('استمع إلى الصوت', 'Play the audio')}
          onPress={toggle}
          style={[styles.playBtn, { backgroundColor: c.heroAccent }]}>
          {status.playing ? (
            <View style={styles.pause}>
              <View style={[styles.pauseBar, { backgroundColor: c.hero }]} />
              <View style={[styles.pauseBar, { backgroundColor: c.hero }]} />
            </View>
          ) : (
            <View style={styles.playNudge}>
              <Icon name="play" color={c.hero} size={22} />
            </View>
          )}
        </PressableScale>
        <AppText weight="medium" size={13} lineHeight={18} color={c.heroMuted} style={styles.ltr}>
          {status.duration > 0 ? `${clock(status.currentTime)} / ${clock(status.duration)}` : '—'}
        </AppText>
      </View>
    </View>
  );
}

// The image's shape on screen follows the ad's size when it has one.
function imageRatio(job: ServiceJob): number {
  if (job.params.kind !== 'adImage') return 1;
  return job.params.aspect === '4:5' ? 4 / 5 : job.params.aspect === '9:16' ? 9 / 16 : 1;
}

// What the customer is told after saving.
function savedText(outcome: SaveOutcome, L: (a: string, e: string) => string): string {
  switch (outcome) {
    case 'gallery':
      return L(`حُفظ في المعرض، في ألبوم «${ALBUM}».`, `Saved to your gallery, in the “${ALBUM}” album.`);
    case 'music':
      return L(`حُفظ في ملفات الموسيقى على جهازك، في مجلد «${ALBUM}».`, `Saved to your phone's music files, in the “${ALBUM}” folder.`);
    case 'shared':
      return L('لا يحفظ معرض الصور على iPhone الملفات الصوتية، لذا اخترنا قائمة المشاركة. اختر منها «حفظ في الملفات».', 'The iPhone photo library does not keep audio, so the share sheet opened. Choose “Save to Files” there.');
    case 'downloaded':
      return L('نُزّل الملف على جهازك.', 'The file was downloaded to your device.');
  }
}

export function ResultView({ job, result }: { job: ServiceJob; result: JobResult }) {
  const { c } = useTheme();
  const { L } = useI18n();
  const [busy, setBusy] = useState<'share' | 'save' | null>(null);
  const [saved, setSaved] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [version, setVersion] = useState(0);

  const run = async (which: 'share', task: () => Promise<unknown>) => {
    setBusy(which);
    try {
      await task();
    } catch {
      // The person can try again; the sheet itself reports its own errors.
    } finally {
      setBusy(null);
    }
  };

  if (result.type === 'text') {
    return (
      <View style={styles.wrap}>
        <Card style={styles.textCard}>
          <AppText size={15} lineHeight={26} selectable>
            {result.text}
          </AppText>
        </Card>
        <Button label={L('انشر أو شارك', 'Share')} icon="share" onPress={() => run('share', () => Share.share({ message: result.text }))} />
        <Button
          variant="secondary"
          label={copied ? L('تم النسخ', 'Copied') : L('انسخ النص', 'Copy text')}
          icon={copied ? 'check' : 'doc'}
          onPress={async () => {
            await Clipboard.setStringAsync(result.text);
            setCopied(true);
          }}
        />
      </View>
    );
  }

  const urls = result.type === 'image' ? (result.urls?.length ? result.urls : [result.url]) : [result.url];
  const url = urls[Math.min(version, urls.length - 1)];
  const save = async () => {
    setBusy('save');
    setSaved(null);
    try {
      setSaved({ tone: 'ok', text: savedText(await saveToDevice(result.type, url), L) });
    } catch (e) {
      console.warn('[save]', e);
      setSaved({
        tone: 'bad',
        text:
          e instanceof SaveDenied
            ? L('لم يُحفظ الملف: اسمح لـ SQ AI بإضافة الصور من إعدادات جهازك ثم أعد المحاولة.', 'Not saved: allow SQ AI to add photos in your device settings, then try again.')
            : L('تعذر حفظ الملف. تحقق من اتصالك وأعد المحاولة.', 'Could not save the file. Check your connection and try again.'),
      });
    } finally {
      setBusy(null);
    }
  };
  return (
    <View style={styles.wrap}>
      {result.type === 'image' && (
        <>
          <View style={[styles.imageFrame, { backgroundColor: c.tile, borderColor: c.line }]}>
            <Image source={{ uri: url }} style={[styles.image, { aspectRatio: imageRatio(job) }]} contentFit="contain" transition={200} accessibilityLabel={L('الإعلان الجاهز', 'The finished ad')} />
          </View>
          {urls.length > 1 && (
            <Segmented
              value={String(version)}
              onChange={(v) => setVersion(Number(v))}
              options={urls.map((_, i) => ({ value: String(i), label: L(`النسخة ${i + 1}`, `Version ${i + 1}`) }))}
            />
          )}
        </>
      )}
      {result.type === 'video' && <VideoResult url={url} />}
      {result.type === 'audio' && <AudioResult url={url} seed={job.id} />}
      <Button label={busy === 'share' ? L('جارٍ التحضير…', 'Preparing…') : L('انشر أو شارك', 'Share')} icon="share" loading={busy === 'share'} onPress={() => run('share', () => shareFile(result.type, url))} />
      <Button
        variant="secondary"
        label={busy === 'save' ? L('جارٍ الحفظ…', 'Saving…') : saved?.tone === 'ok' ? L('حُفظ في جهازك', 'Saved') : L('احفظ', 'Save')}
        icon={saved?.tone === 'ok' ? 'check' : 'download'}
        loading={busy === 'save'}
        onPress={save}
      />
      {saved && (
        <Note tone={saved.tone} icon={saved.tone === 'ok' ? 'check' : 'alert'}>
          {saved.text}
        </Note>
      )}
      <AppText size={11} lineHeight={16} color={c.placeholder} center>
        {L('يبقى الملف على خادم المعالجة مدة محدودة، فاحفظه على جهازك.', 'The file stays on the processing server for a limited time, so save it to your device.')}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  ltr: { writingDirection: 'ltr' },
  textCard: { paddingVertical: 16 },
  imageFrame: { borderRadius: radius.card, borderWidth: 1, overflow: 'hidden', alignItems: 'center' },
  image: { width: '100%', maxHeight: 520 },
  videoStage: { borderRadius: radius.card, overflow: 'hidden', backgroundColor: '#05080F', alignItems: 'center' },
  video: { height: 460, aspectRatio: 9 / 16, backgroundColor: '#000' },
  audio: { borderRadius: radius.card, padding: 18, gap: 16, alignItems: 'center' },
  audioRow: { flexDirection: 'row', alignItems: 'center', gap: 14, alignSelf: 'stretch' },
  playBtn: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  playNudge: { paddingLeft: 3 },
  pause: { flexDirection: 'row', gap: 5 },
  pauseBar: { width: 5, height: 18, borderRadius: 2 },
});
