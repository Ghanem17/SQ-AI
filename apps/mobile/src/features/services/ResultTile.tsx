// A finished order as a thumbnail: the image itself, a branded tile with a
// play mark for a video, a waveform for a voice-over, or the opening lines of
// written copy. Orders still running or stopped show their status instead.
// Only real orders are drawn here; nothing is made up.

import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { formatDate, photoVideoSeconds, radius, services, videoSeconds } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Badge, Progress } from '@/components/ui';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/theme';
import { jobStatus, serviceIcons } from './OrderRow';
import type { ServiceJob } from './store';

// The length of a finished video, where the order fixes it.
export function resultSeconds(job: ServiceJob): number | null {
  if (job.params.kind === 'imageVideo') return photoVideoSeconds(job.params.duration, job.tier);
  if (job.params.kind === 'textVideo') return videoSeconds(job.params.duration, job.tier);
  return null;
}

// Bar heights for a decorative waveform, the same for the same order.
function bars(seed: string, count: number): number[] {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return Array.from({ length: count }, (_, i) => {
    h = (h * 1103515245 + 12345) >>> 0;
    const wave = Math.abs(Math.sin(i * 0.55)) * 0.5 + 0.2;
    return Math.min(1, wave + ((h >>> 16) % 100) / 220);
  });
}

// A row of rounded bars; `played` of them (from the reading start) are bright.
export function Waveform({ seed, count = 28, height = 40, color, dim, played = 0, style }: { seed: string; count?: number; height?: number; color: string; dim?: string; played?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.wave, { height }, style]} accessibilityElementsHidden importantForAccessibility="no">
      {bars(seed, count).map((v, i) => (
        <View key={i} style={[styles.bar, { height: Math.max(4, Math.round(v * height)), backgroundColor: i < played || !dim ? color : dim }]} />
      ))}
    </View>
  );
}

function Media({ job }: { job: ServiceJob }) {
  const { c } = useTheme();
  const { L, rtl } = useI18n();
  const result = job.status === 'done' ? job.result : undefined;

  if (result?.type === 'image') {
    return <Image source={{ uri: result.urls?.[0] ?? result.url }} style={[StyleSheet.absoluteFill, { backgroundColor: c.tile }]} contentFit="cover" transition={150} />;
  }
  if (result?.type === 'video') {
    const seconds = resultSeconds(job);
    // A video from photos shows the customer's first photo behind the mark.
    const poster = job.params.kind === 'imageVideo' ? job.images?.[0]?.uri : undefined;
    return (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: c.hero }]}>
        {poster && <Image source={{ uri: poster }} style={[StyleSheet.absoluteFill, styles.poster]} contentFit="cover" />}
        {/* The brand arcs, centred on the top end corner. */}
        <View style={[styles.arc, rtl ? { left: -90 } : { right: -90 }, { borderColor: c.heroLine }]} />
        <View style={[styles.arc, styles.arc2, rtl ? { left: -130 } : { right: -130 }, { borderColor: c.heroLine }]} />
        <View style={styles.center}>
          <View style={[styles.play, { borderColor: c.heroAccent, backgroundColor: 'rgba(11,19,43,0.55)' }]}>
            <Icon name="play" color={c.heroAccent} size={20} />
          </View>
        </View>
        <View style={styles.mediaFoot}>
          <Icon name="video" color={c.heroText} size={14} />
          <AppText weight="medium" size={11} lineHeight={15} color={c.heroText}>
            {seconds ? L(`فيديو · ${seconds} ث`, `Video · ${seconds}s`) : L('فيديو', 'Video')}
          </AppText>
        </View>
      </View>
    );
  }
  if (result?.type === 'audio') {
    return (
      <View style={[StyleSheet.absoluteFill, styles.audio, { backgroundColor: c.priSoft }]}>
        <Waveform seed={job.id} count={16} height={44} color={c.onPriSoft} />
        <View style={[styles.mediaFoot, styles.mediaFootStatic]}>
          <Icon name="mic" color={c.onPriSoft} size={14} />
          <AppText weight="medium" size={11} lineHeight={15} color={c.onPriSoft}>
            {L('تعليق صوتي', 'Voice-over')}
          </AppText>
        </View>
      </View>
    );
  }
  if (result?.type === 'text') {
    return (
      <View style={[StyleSheet.absoluteFill, styles.text, { backgroundColor: c.card }]}>
        <Icon name="doc" color={c.muted} size={16} />
        <AppText size={11.5} lineHeight={18} color={c.text} numberOfLines={6} style={styles.snippet}>
          {result.text.replace(/\s*\n+\s*/g, ' ')}
        </AppText>
      </View>
    );
  }
  // Still running, waiting or stopped.
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: c.tile }]}>
      <View style={styles.center}>
        <Icon name={serviceIcons[job.kind]} color={c.placeholder} size={28} />
      </View>
      {job.status === 'running' && (
        <View style={styles.progress}>
          <Progress value={job.progress} />
        </View>
      )}
    </View>
  );
}

export function ResultTile({ job, width, mediaHeight }: { job: ServiceJob; width?: number; mediaHeight?: number }) {
  const { c, elev } = useTheme();
  const { pick, lang, rtl, L } = useI18n();
  const status = jobStatus[job.status];
  const pct = Math.round(job.progress * 100);
  const showBadge = job.status !== 'done';
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${job.title || pick(services[job.kind].name)}، ${pick(status.label)}`}
      onPress={() => router.push({ pathname: '/job/[id]', params: { id: job.id } })}
      pressedScale={0.98}
      style={[styles.tile, { backgroundColor: c.card, borderColor: c.line }, elev.card, width ? { width } : styles.fill]}>
      <View style={[styles.media, mediaHeight ? { height: mediaHeight } : styles.mediaRatio, { borderBottomColor: c.line }]}>
        <Media job={job} />
        {(job.version ?? 1) > 1 && (
          <Badge small tone="pri" icon="refresh" label={L(`نسخة ${job.version}`, `Version ${job.version}`)} style={[styles.badge, rtl ? { left: 8 } : { right: 8 }]} />
        )}
        {showBadge && (
          <Badge
            small
            tone={status.tone}
            icon={job.status === 'running' ? 'clock' : job.status === 'failed' ? 'alert' : undefined}
            label={job.status === 'running' && pct > 0 ? `${pick(status.label)} ⁦${pct}%⁩` : pick(status.label)}
            style={[styles.badge, rtl ? { right: 8 } : { left: 8 }]}
          />
        )}
      </View>
      <View style={styles.caption}>
        <AppText weight="semibold" size={13} lineHeight={19} numberOfLines={1}>
          {job.title || pick(services[job.kind].name)}
        </AppText>
        <AppText size={11.5} lineHeight={16} color={c.muted} numberOfLines={1}>
          {job.status === 'done' ? formatDate(job.createdAt, lang) : pick(services[job.kind].name)}
        </AppText>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  tile: { borderRadius: radius.tier, borderWidth: 1, overflow: 'hidden' },
  fill: { flex: 1 },
  media: { overflow: 'hidden', borderBottomWidth: 1 },
  mediaRatio: { aspectRatio: 4 / 5 },
  poster: { opacity: 0.45 },
  arc: { position: 'absolute', width: 180, height: 180, borderRadius: 90, borderWidth: 1, top: -90 },
  arc2: { width: 260, height: 260, borderRadius: 130, top: -130 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  play: { width: 46, height: 46, borderRadius: 23, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', paddingLeft: 3 },
  mediaFoot: { position: 'absolute', bottom: 8, left: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 5 },
  mediaFootStatic: { position: 'relative', bottom: 0, left: 0, right: 0, marginTop: 12, justifyContent: 'center' },
  audio: { alignItems: 'center', justifyContent: 'center', padding: 12 },
  text: { padding: 12, gap: 6 },
  snippet: { flexShrink: 1 },
  badge: { position: 'absolute', top: 8 },
  progress: { position: 'absolute', left: 12, right: 12, bottom: 12 },
  wave: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  bar: { width: 3, borderRadius: 2 },
  caption: { paddingHorizontal: 10, paddingTop: 7, paddingBottom: 9 },
});
