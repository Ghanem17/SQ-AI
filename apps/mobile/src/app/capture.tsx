import { CameraView, useCameraPermissions, useMicrophonePermissions, type CameraType } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { brand, radius } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Screen } from '@/components/Screen';
import { IconBadge } from '@/components/ui';
import { useI18n } from '@/i18n';
import { useStudio } from '@/state/studio';
import { useTheme } from '@/theme/theme';

type Phase = 'ready' | 'countdown' | 'recording' | 'done';

const white = '#FFFFFF';
const scrim = 'rgba(0,0,0,0.45)';

// Full-screen guided camera for one shot: thirds grid, a frame for the
// product, live checks, and a recording that stops on its own at the shot's
// length so every clip fits the edit.
export default function CaptureScreen() {
  const { shot: shotParam } = useLocalSearchParams<{ shot?: string }>();
  const { L, rtl, n } = useI18n();
  const { c } = useTheme();
  const { draft, updateDraft } = useStudio();
  const shots = draft.shots;
  const index = Math.max(0, Math.min(shots.length - 1, Number(shotParam ?? 0) || 0));
  const shot = shots[index];

  const [camPerm, requestCam] = useCameraPermissions();
  const [micPerm, requestMic] = useMicrophonePermissions();
  const camera = useRef<CameraView>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState<Phase>('ready');
  const [count, setCount] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [grid, setGrid] = useState(true);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    if (phase !== 'recording') return;
    const started = Date.now();
    const t = setInterval(() => setElapsed(Math.min(shot.seconds, (Date.now() - started) / 1000)), 100);
    return () => clearInterval(t);
  }, [phase, shot.seconds]);

  const finish = () => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    if (!draft.captured.includes(index)) updateDraft({ captured: [...draft.captured, index].sort() });
    setPhase('done');
  };

  const startRecording = () => {
    setElapsed(0);
    setPhase('recording');
    const cam = camera.current;
    if (!cam || !ready || Platform.OS === 'web') {
      // Preview without a recorder (web, or camera still starting): time the shot only.
      timers.current.push(setTimeout(finish, shot.seconds * 1000));
      return;
    }
    cam
      .recordAsync({ maxDuration: shot.seconds })
      .then(() => finish())
      .catch(() => finish());
  };

  // A short countdown so the hand is steady before recording starts.
  const begin = async () => {
    if (micPerm && !micPerm.granted && micPerm.canAskAgain) await requestMic();
    setCount(3);
    setPhase('countdown');
    timers.current.push(
      setTimeout(() => setCount(2), 700),
      setTimeout(() => setCount(1), 1400),
      setTimeout(startRecording, 2100),
    );
  };

  const stop = () => {
    camera.current?.stopRecording();
  };

  if (!camPerm) return <Screen background="#000">{null}</Screen>;

  if (!camPerm.granted) {
    return (
      <Screen edges={['top', 'bottom']} style={styles.perm}>
        <IconBadge icon="camera" tone="solid" size={56} />
        <AppText variant="h2" center style={styles.permTitle}>
          {L('نحتاج إلى إذن الكاميرا', 'We need camera access')}
        </AppText>
        <AppText size={14} center lineHeight={22} color={c.muted}>
          {L('نستخدم الكاميرا لتصوير لقطات الريل فقط، ولا نرفع أي فيديو قبل موافقتك.', 'We use the camera only to film reel shots, and upload nothing until you approve.')}
        </AppText>
        <Button
          label={camPerm.canAskAgain ? L('اسمح باستخدام الكاميرا', 'Allow camera') : L('افتح الإعدادات', 'Open Settings')}
          onPress={() => (camPerm.canAskAgain ? requestCam() : Linking.openSettings())}
          style={styles.permBtn}
        />
        <Button label={L('ليس الآن', 'Not now')} variant="ghost" onPress={() => router.back()} style={styles.permBtn} />
      </Screen>
    );
  }

  const progress = phase === 'recording' ? elapsed / shot.seconds : phase === 'done' ? 1 : 0;
  const nextIndex = shots.findIndex((_, i) => i !== index && !draft.captured.includes(i));

  return (
    <View style={[styles.root, { direction: rtl ? 'rtl' : 'ltr' }]}>
      <CameraView
        ref={camera}
        style={StyleSheet.absoluteFill}
        facing={facing}
        mode="video"
        mute={!micPerm?.granted}
        videoQuality="1080p"
        onCameraReady={() => setReady(true)}
      />

      {grid && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={[styles.gridV, { left: '33.33%' }]} />
          <View style={[styles.gridV, { left: '66.66%' }]} />
          <View style={[styles.gridH, { top: '33.33%' }]} />
          <View style={[styles.gridH, { top: '66.66%' }]} />
        </View>
      )}

      <View pointerEvents="none" style={styles.frameWrap}>
        <View style={styles.frame}>
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
        </View>
      </View>

      <SafeAreaView edges={['top', 'bottom']} style={styles.overlay}>
        <View style={styles.top}>
          <PressableScale accessibilityRole="button" accessibilityLabel={L('إغلاق', 'Close')} onPress={() => router.back()} style={styles.round}>
            <Icon name="close" color={white} size={22} />
          </PressableScale>
          <View style={styles.topText}>
            <AppText weight="semibold" size={14} color={white} center>
              {L(`اللقطة ${index + 1} من ${shots.length}`, `Shot ${index + 1} of ${shots.length}`)}
            </AppText>
            <AppText size={12} color="rgba(255,255,255,0.8)" center>
              {shot.title}
            </AppText>
          </View>
          <View style={styles.topTools}>
            <PressableScale accessibilityRole="button" accessibilityLabel={L('الشبكة', 'Grid')} accessibilityState={{ selected: grid }} onPress={() => setGrid((g) => !g)} style={styles.round}>
              <Icon name="grid" color={grid ? brand.peach : white} size={20} />
            </PressableScale>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={L('بدّل الكاميرا', 'Flip camera')}
              disabled={phase === 'recording'}
              onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
              style={styles.round}>
              <Icon name="flip" color={white} size={20} />
            </PressableScale>
          </View>
        </View>

        <View style={styles.checks}>
          <Check ok label={L('عمودي 9:16', 'Vertical 9:16')} />
          <Check ok={ready} label={ready ? L('الكاميرا جاهزة', 'Camera ready') : L('جارٍ تشغيل الكاميرا', 'Starting camera')} />
          {!micPerm?.granted && <Check ok={false} label={L('دون صوت', 'No sound')} />}
        </View>

        {phase === 'countdown' && (
          <View pointerEvents="none" style={styles.countWrap}>
            <AppText weight="bold" size={72} lineHeight={84} color={white}>
              {count}
            </AppText>
          </View>
        )}

        <View style={styles.bottom}>
          <View style={styles.hint}>
            <AppText size={13.5} color={white} center lineHeight={20}>
              {phase === 'done' ? L('حُفظت اللقطة. شاهدها في المعاينة بعد المونتاج.', 'Shot saved. See it in the preview after editing.') : shot.hint}
            </AppText>
          </View>

          <View style={styles.bar}>
            <View style={[styles.barFill, { width: `${progress * 100}%` }]} />
          </View>
          <AppText size={12} color="rgba(255,255,255,0.85)" center style={styles.tabular}>
            {phase === 'recording' ? L(`${elapsed.toFixed(1)} / ${shot.seconds} ث`, `${elapsed.toFixed(1)} / ${shot.seconds}s`) : L(`مدة اللقطة: ${n(shot.seconds, 'second')}`, `Shot length: ${n(shot.seconds, 'second')}`)}
          </AppText>

          {phase === 'done' ? (
            <View style={styles.doneRow}>
              <Button
                label={L('أعد اللقطة', 'Retake')}
                icon="refresh"
                colors={{ bg: 'rgba(255,255,255,0.14)', fg: white }}
                style={styles.flex}
                onPress={() => setPhase('ready')}
              />
              <Button
                label={nextIndex === -1 ? L('اختر جودة الريل', 'Choose reel quality') : L(`اللقطة ${nextIndex + 1}`, `Shot ${nextIndex + 1}`)}
                colors={{ bg: brand.peach, fg: brand.navyDeep }}
                icon="arrow"
                iconEnd
                style={styles.flex}
                onPress={() => {
                  if (nextIndex === -1) router.replace('/reel/quality');
                  else router.setParams({ shot: String(nextIndex) });
                  setPhase('ready');
                }}
              />
            </View>
          ) : (
            <View style={styles.shutterRow}>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={phase === 'recording' ? L('إيقاف', 'Stop') : L('ابدأ التسجيل', 'Start recording')}
                disabled={phase === 'countdown'}
                onPress={phase === 'recording' ? stop : begin}
                style={styles.shutter}>
                <View style={[styles.shutterInner, phase === 'recording' && styles.shutterStop]} />
              </PressableScale>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <View style={styles.check}>
      <View style={[styles.checkDot, { backgroundColor: ok ? brand.greenLight : brand.peach }]} />
      <AppText size={12} color={white}>
        {label}
      </AppText>
    </View>
  );
}

const C = 26;
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  flex: { flex: 1 },
  tabular: { minWidth: 120, alignSelf: 'center' },
  overlay: { flex: 1, justifyContent: 'space-between' },
  gridV: { position: 'absolute', top: 0, bottom: 0, width: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.35)' },
  gridH: { position: 'absolute', left: 0, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.35)' },
  frameWrap: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' },
  frame: { width: '64%', aspectRatio: 1 },
  corner: { position: 'absolute', width: C, height: C, borderColor: brand.peach },
  tl: { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2 },
  tr: { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2 },
  br: { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2 },
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 6, gap: 8 },
  topText: { flex: 1 },
  topTools: { flexDirection: 'row', gap: 6 },
  round: { width: 42, height: 42, borderRadius: radius.control, backgroundColor: scrim, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  checks: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  check: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: scrim, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.badge },
  checkDot: { width: 7, height: 7, borderRadius: 4 },
  countWrap: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' },
  bottom: { paddingHorizontal: 16, paddingBottom: 12, gap: 10 },
  hint: { backgroundColor: scrim, borderRadius: radius.control, paddingHorizontal: 14, paddingVertical: 10 },
  bar: { height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden', direction: 'ltr' },
  barFill: { height: 3, backgroundColor: brand.peach },
  shutterRow: { alignItems: 'center', paddingTop: 4 },
  shutter: { width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: white, alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#D9443A' },
  shutterStop: { width: 28, height: 28, borderRadius: 6 },
  doneRow: { flexDirection: 'row', gap: 8, paddingTop: 4 },
  perm: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 12 },
  permTitle: { marginTop: 8 },
  permBtn: { alignSelf: 'stretch' },
});
