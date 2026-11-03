// Shows a finished order: the text with copy and share, or the image, audio
// or video with a share button that hands the file to Instagram, WhatsApp
// or the gallery.

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
import { Card, ui } from '@/components/ui';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/theme';
import type { JobResult } from './store';

const ext: Record<'audio' | 'image' | 'video', string> = { audio: 'mp3', image: 'png', video: 'mp4' };
const mime: Record<'audio' | 'image' | 'video', string> = { audio: 'audio/mpeg', image: 'image/png', video: 'video/mp4' };

async function shareFile(type: 'audio' | 'image' | 'video', url: string) {
  if (Platform.OS === 'web') {
    await Linking.openURL(url);
    return;
  }
  const local = `${FileSystem.cacheDirectory}sq-${Date.now()}.${ext[type]}`;
  const { uri } = await FileSystem.downloadAsync(url, local);
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: mime[type] });
  else await Linking.openURL(url);
}

function ShareButton({ type, url, label }: { type: 'audio' | 'image' | 'video'; url: string; label?: string }) {
  const [busy, setBusy] = useState(false);
  const { L } = useI18n();
  return (
    <Button
      label={busy ? L('جارٍ التحضير…', 'Preparing…') : (label ?? L('احفظ أو شارك', 'Save or share'))}
      icon="send"
      loading={busy}
      onPress={async () => {
        setBusy(true);
        try {
          await shareFile(type, url);
        } finally {
          setBusy(false);
        }
      }}
    />
  );
}

function VideoResult({ url }: { url: string }) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = true;
  });
  return (
    <View style={styles.videoWrap}>
      <VideoView player={player} style={styles.video} nativeControls contentFit="contain" />
    </View>
  );
}

function AudioResult({ url }: { url: string }) {
  const player = useAudioPlayer({ uri: url });
  const status = useAudioPlayerStatus(player);
  const { L } = useI18n();
  return (
    <Button
      label={status.playing ? L('إيقاف', 'Pause') : L('استمع إلى الصوت', 'Play the audio')}
      icon={status.playing ? 'minus' : 'play'}
      variant="secondary"
      onPress={async () => {
        if (status.playing) {
          player.pause();
          return;
        }
        await setAudioModeAsync({ playsInSilentMode: true }).catch(() => undefined);
        if (status.didJustFinish || (status.duration > 0 && status.currentTime >= status.duration)) player.seekTo(0);
        player.play();
      }}
    />
  );
}

export function ResultView({ result }: { result: JobResult }) {
  const { c } = useTheme();
  const { L } = useI18n();
  const [copied, setCopied] = useState(false);

  if (result.type === 'text') {
    return (
      <Card>
        <AppText size={14.5} lineHeight={25} selectable>
          {result.text}
        </AppText>
        <View style={styles.row}>
          <Button
            label={copied ? L('تم النسخ', 'Copied') : L('انسخ النص', 'Copy text')}
            icon={copied ? 'check' : 'layers'}
            variant="secondary"
            style={ui.flex}
            onPress={async () => {
              await Clipboard.setStringAsync(result.text);
              setCopied(true);
            }}
          />
          <Button label={L('شارك', 'Share')} icon="send" style={ui.flex} onPress={() => Share.share({ message: result.text })} />
        </View>
      </Card>
    );
  }

  return (
    <Card>
      {result.type === 'image' &&
        (result.urls ?? [result.url]).map((u, i, all) => (
          <View key={u} style={styles.version}>
            <Image source={{ uri: u }} style={[styles.image, { backgroundColor: c.tile }]} contentFit="contain" />
            {all.length > 1 && <ShareButton type="image" url={u} label={L(`احفظ النسخة ${i + 1}`, `Save version ${i + 1}`)} />}
          </View>
        ))}
      {result.type === 'video' && <VideoResult url={result.url} />}
      {result.type === 'audio' && <AudioResult url={result.url} />}
      {!(result.type === 'image' && (result.urls?.length ?? 0) > 1) && <ShareButton type={result.type} url={result.url} />}
      <AppText size={11.5} color={c.placeholder} center>
        {L('يُحفظ الملف لدى fal مدة محدودة، فاحفظه على جهازك.', 'fal keeps the file for a limited time, so save it to your device.')}
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  version: { gap: 8 },
  image: { width: '100%', aspectRatio: 1, borderRadius: radius.control },
  videoWrap: { alignItems: 'center' },
  video: { width: '72%', aspectRatio: 9 / 16, borderRadius: radius.control, backgroundColor: '#000' },
});
