import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Segmented, ui } from '@/components/ui';
import { useAiStatus, voiceUrl } from '@/lib/ai';
import { useTheme } from '@/theme/theme';

type Voice = 'brian' | 'sarah';

// Strips hashtags and emoji so the voice reads only the words.
function spoken(caption: string): string {
  return caption
    .split('\n')
    .filter((l) => !l.trim().startsWith('#'))
    .join(' ')
    .replace(/#\S+/g, '')
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 300);
}

// Plays the caption as a voice-over through ElevenLabs on fal.ai.
export function VoicePreview({ caption }: { caption: string }) {
  const { c } = useTheme();
  const status = useAiStatus();
  const [voice, setVoice] = useState<Voice>('brian');
  const player = useAudioPlayer(null);
  const playback = useAudioPlayerStatus(player);
  const [requested, setRequested] = useState(false);
  const text = spoken(caption);
  const loading = requested && !playback.playing && !playback.isLoaded;

  const play = async () => {
    if (playback.playing) {
      player.pause();
      return;
    }
    await setAudioModeAsync({ playsInSilentMode: true }).catch(() => undefined);
    player.replace({ uri: voiceUrl(text, voice) });
    setRequested(true);
    player.play();
  };

  return (
    <View style={styles.wrap}>
      <View style={ui.between}>
        <AppText weight="medium" size={14}>
          التعليق الصوتي
        </AppText>
        <AppText size={12} color={c.muted}>
          ElevenLabs v4
        </AppText>
      </View>
      <Segmented<Voice>
        options={[
          { value: 'brian', label: 'صوت رجالي' },
          { value: 'sarah', label: 'صوت نسائي' },
        ]}
        value={voice}
        onChange={(v) => {
          setVoice(v);
          player.pause();
          setRequested(false);
        }}
      />
      <Button
        label={playback.playing ? 'إيقاف' : loading ? 'جارٍ التحضير…' : 'اسمع التعليق الصوتي'}
        icon={playback.playing ? 'minus' : 'play'}
        variant="secondary"
        height={42}
        disabled={status !== 'online' || !text}
        onPress={play}
      />
      {status === 'offline' && (
        <AppText size={12} color={c.placeholder}>
          يعمل بعد إضافة مفتاح fal على الكمبيوتر.
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
});
