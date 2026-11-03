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

function ShareButton({ type, url }: { type: 'audio' | 'image' | 'video'; url: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      label={busy ? 'جارٍ التحضير…' : 'احفظ أو شارك'}
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
  return (
    <Button
      label={status.playing ? 'إيقاف' : 'اسمع الصوت'}
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
  const [copied, setCopied] = useState(false);

  if (result.type === 'text') {
    return (
      <Card>
        <AppText size={14.5} lineHeight={25} selectable>
          {result.text}
        </AppText>
        <View style={styles.row}>
          <Button
            label={copied ? 'تم النسخ' : 'انسخ النص'}
            icon={copied ? 'check' : 'layers'}
            variant="secondary"
            style={ui.flex}
            onPress={async () => {
              await Clipboard.setStringAsync(result.text);
              setCopied(true);
            }}
          />
          <Button label="شارك" icon="send" style={ui.flex} onPress={() => Share.share({ message: result.text })} />
        </View>
      </Card>
    );
  }

  return (
    <Card>
      {result.type === 'image' && <Image source={{ uri: result.url }} style={[styles.image, { backgroundColor: c.tile }]} contentFit="contain" />}
      {result.type === 'video' && <VideoResult url={result.url} />}
      {result.type === 'audio' && <AudioResult url={result.url} />}
      <ShareButton type={result.type} url={result.url} />
      <AppText size={11.5} color={c.placeholder} center>
        الملف محفوظ عند fal لمدة محدودة، احفظه على جهازك.
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  image: { width: '100%', aspectRatio: 1, borderRadius: radius.control },
  videoWrap: { alignItems: 'center' },
  video: { width: '72%', aspectRatio: 9 / 16, borderRadius: radius.control, backgroundColor: '#000' },
});
