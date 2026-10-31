import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { brand, formatIQD, formatNumber, formatPercent, radius } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Screen } from '@/components/Screen';
import { TAB_BAR_HEIGHT } from '@/components/TabBar';
import { ar } from '@/i18n/ar';
import { sampleCreator, sampleToday } from '@/mock/today';
import { useSession } from '@/state/session';
import { useTheme } from '@/theme/theme';

const t = ar.today;

// Tiles enter one after another; reduced motion shows them at once.
function Enter({ order, children, style }: { order: number; children: ReactNode; style?: object }) {
  const reduceMotion = useReducedMotion();
  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInDown.delay(80 * order).springify().damping(16).stiffness(140)}
      style={style}>
      {children}
    </Animated.View>
  );
}

export default function TodayScreen() {
  const { accountType } = useSession();
  const insets = useSafeAreaInsets();
  return (
    <Screen>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 36 }]}
        showsVerticalScrollIndicator={false}>
        {accountType === 'creator' ? <CreatorHome /> : <ShopHome />}
      </ScrollView>
    </Screen>
  );
}

function Header({ overline, title, initial }: { overline: string; title: string; initial: string }) {
  const { c } = useTheme();
  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <AppText size={13} color={c.muted}>
          {overline}
        </AppText>
        <AppText weight="semibold" size={21}>
          {title}
        </AppText>
      </View>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={t.account}
        onPress={() => router.push('/settings')}
        style={[styles.avatar, { backgroundColor: c.tile }]}>
        <AppText weight="semibold" size={17} color={c.primary}>
          {initial}
        </AppText>
      </PressableScale>
    </View>
  );
}

function SampleBadge() {
  const { c } = useTheme();
  return (
    <View style={[styles.sample, { backgroundColor: c.accSoft }]}>
      <AppText size={11.5} weight="medium" color={c.acc}>
        {t.sampleData}
      </AppText>
    </View>
  );
}

function ShopHome() {
  const { c } = useTheme();
  const { displayName } = useSession();
  const d = sampleToday;
  const name = displayName ?? d.greetingName;

  return (
    <>
      <Enter order={0}>
        <Header overline={t.goodMorning} title={name} initial={name.charAt(0)} />
      </Enter>
      <SampleBadge />

      <Enter order={1} style={[styles.hero, { backgroundColor: c.hero }]}>
        <View style={styles.rowBetween}>
          <AppText weight="medium" size={13} color={c.navActive}>
            {t.taskLabel}
          </AppText>
          <View
            accessible
            accessibilityLabel={`لقطة ${d.task.shotsDone} من ${d.task.shotsTotal}`}
            style={styles.dots}>
            {Array.from({ length: d.task.shotsTotal }, (_, i) => (
              <View key={i} style={[styles.dot, { backgroundColor: i < d.task.shotsDone ? c.navActive : brand.tealLine }]} />
            ))}
          </View>
        </View>
        <AppText weight="semibold" size={25} color={c.heroText} lineHeight={34}>
          {d.task.title}
        </AppText>
        <AppText size={13.5} color={c.heroMuted}>
          {d.task.hint}
        </AppText>
        <View style={styles.heroActions}>
          <Button
            label={t.startShooting}
            icon="camera"
            variant="hero"
            height={48}
            onPress={() => router.push('/(tabs)/camera')}
          />
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={t.noIdea}
            onPress={() => router.push('/assistant')}
            style={styles.askLink}>
            <Icon name="chat" color={c.heroText} size={16} />
            <AppText size={13} weight="medium" color={c.heroText}>
              {t.noIdea}
            </AppText>
          </PressableScale>
        </View>
      </Enter>

      <View style={styles.metricsRow}>
        <View style={styles.metricsCol}>
          <Enter order={2} style={[styles.small, { backgroundColor: c.greenTile }]}>
            <AppText size={13} color={c.onGreenTile}>
              {t.replyRate}
            </AppText>
            <AppText weight="bold" size={30} lineHeight={34} color={c.onGreenTile}>
              {formatPercent(d.replyRate)}
            </AppText>
          </Enter>
          <Enter order={3} style={[styles.small, { backgroundColor: c.tile }]}>
            <AppText size={13} color={c.muted}>
              {t.ordersToday}
            </AppText>
            <AppText weight="bold" size={30} lineHeight={34}>
              {formatNumber(d.ordersToday)}
            </AppText>
          </Enter>
        </View>
        <Enter order={2} style={[styles.cost, { backgroundColor: c.sandTile }]}>
          <AppText weight="medium" size={13} color={c.onSandTile}>
            {t.costPerOrder}
          </AppText>
          <View style={styles.costValue}>
            <AppText
              weight="bold"
              size={40}
              lineHeight={44}
              color={c.onSandTile}
              accessibilityLabel={formatIQD(d.costPerOrder)}>
              {formatNumber(d.costPerOrder)}
            </AppText>
            <AppText size={13} color={c.onSandTile}>
              {t.perOrder}
            </AppText>
            <View style={[styles.chip, { backgroundColor: brand.cream }]}>
              <AppText weight="semibold" size={12} color={brand.ink}>
                {t.lowerBy(d.costChangePercent)}
              </AppText>
            </View>
          </View>
        </Enter>
      </View>

      {d.pendingReel && (
        <Enter order={4}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={`${t.awaitingApproval}: ${d.pendingReel.title}`}
            onPress={() => undefined}
            style={[styles.wide, { backgroundColor: c.tile }]}>
            <View style={[styles.thumb, { backgroundColor: brand.thumb }]}>
              <Icon name="play" color={brand.cream} size={20} />
            </View>
            <View style={styles.flex}>
              <AppText size={12.5} color={c.muted}>
                {t.awaitingApproval}
              </AppText>
              <AppText weight="semibold" size={16}>
                {d.pendingReel.title}
              </AppText>
            </View>
            <View style={[styles.softBtn, { backgroundColor: c.priSoft }]}>
              <AppText weight="semibold" size={14} color={c.onPriSoft}>
                {t.review}
              </AppText>
            </View>
          </PressableScale>
        </Enter>
      )}

      <Enter order={5}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={`${t.messages}: ${t.needStaff(d.needsStaffCount)}`}
          onPress={() => router.push('/(tabs)/inbox')}
          style={[styles.wide, { backgroundColor: c.tile }]}>
          <View style={styles.flex}>
            <AppText size={12.5} color={c.muted}>
              {t.messages}
            </AppText>
            <AppText weight="semibold" size={16}>
              {t.needStaff(d.needsStaffCount)}
            </AppText>
          </View>
          <View style={[styles.badge, { backgroundColor: c.badSoft }]}>
            <AppText weight="bold" size={17} color={c.bad}>
              {formatNumber(d.needsStaffCount)}
            </AppText>
          </View>
        </PressableScale>
      </Enter>
    </>
  );
}

function CreatorHome() {
  const { c } = useTheme();
  const { displayName } = useSession();
  const d = sampleCreator;
  const ch = ar.creatorHome;
  const name = displayName ?? d.name;

  return (
    <>
      <Enter order={0}>
        <Header overline={d.niche} title={ch.hello(name)} initial={name.charAt(0)} />
      </Enter>
      <SampleBadge />

      <Enter order={1} style={[styles.hero, { backgroundColor: c.hero }]}>
        <AppText weight="medium" size={13} color={c.navActive}>
          {ch.ideaLabel}
        </AppText>
        <AppText weight="semibold" size={22} color={c.heroText} lineHeight={30}>
          {d.idea.title}
        </AppText>
        <AppText size={13} color={c.heroMuted}>
          {d.idea.hook}
        </AppText>
        <View style={styles.heroActions}>
          <Button label={ch.shootIdea} icon="camera" variant="hero" height={46} onPress={() => router.push('/(tabs)/camera')} />
        </View>
      </Enter>

      <View style={styles.metricsRow}>
        <View style={styles.metricsCol}>
          <Enter order={2} style={[styles.small, { backgroundColor: c.sandTile }]}>
            <AppText size={13} color={c.onSandTile}>
              {ch.engagement}
            </AppText>
            <AppText weight="bold" size={28} lineHeight={32} color={c.onSandTile}>
              {formatPercent(d.engagement, 1)}
            </AppText>
          </Enter>
          <Enter order={3} style={[styles.small, { backgroundColor: c.tile }]}>
            <AppText size={13} color={c.muted}>
              {ch.views}
            </AppText>
            <AppText weight="bold" size={28} lineHeight={32}>
              {d.views}
            </AppText>
          </Enter>
        </View>
        <Enter order={2} style={[styles.cost, { backgroundColor: c.greenTile }]}>
          <AppText size={13} color={c.onGreenTile}>
            {ch.newFollowers}
          </AppText>
          <View style={styles.costValue}>
            <AppText weight="bold" size={38} lineHeight={42} color={c.onGreenTile}>
              {`+${formatNumber(d.newFollowers)}`}
            </AppText>
            <AppText size={13} color={c.onGreenTile}>
              {ch.thisWeek}
            </AppText>
          </View>
        </Enter>
      </View>

      <Enter order={4} style={[styles.offer, { backgroundColor: c.tile }]}>
        <View style={styles.rowBetween}>
          <AppText size={12.5} color={c.muted}>
            {ch.collabOffer}
          </AppText>
          <AppText weight="bold" size={16}>
            {formatIQD(d.offer.price)}
          </AppText>
        </View>
        <AppText weight="semibold" size={17}>
          {d.offer.brand}
        </AppText>
        <AppText size={13} color={c.muted}>
          {d.offer.scope}
        </AppText>
        <View style={styles.offerActions}>
          <Button label={ch.accept} height={46} style={styles.flex} onPress={() => undefined} />
          <Button label={ch.details} variant="secondary" height={46} style={[styles.flex, { backgroundColor: c.bg }]} onPress={() => undefined} />
        </View>
      </Enter>
    </>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 22, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  headerText: { gap: 2 },
  avatar: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  sample: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, marginHorizontal: 4 },
  hero: { borderRadius: radius.tile, padding: 20, gap: 6, minHeight: 214 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dots: { flexDirection: 'row', gap: 5 },
  dot: { width: 22, height: 6, borderRadius: 3 },
  heroActions: { marginTop: 'auto', paddingTop: 10, flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap' },
  askLink: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 },
  metricsRow: { flexDirection: 'row', gap: 10, height: 214 },
  metricsCol: { flex: 1, gap: 10 },
  small: { flex: 1, borderRadius: radius.tile, paddingHorizontal: 18, paddingVertical: 16, justifyContent: 'space-between' },
  cost: { flex: 1, borderRadius: radius.tile, padding: 18 },
  costValue: { marginTop: 'auto', gap: 2 },
  chip: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginTop: 8 },
  wide: { borderRadius: radius.tile, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 102 },
  thumb: { width: 56, height: 74, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, gap: 3 },
  softBtn: { height: 44, paddingHorizontal: 16, borderRadius: 14, justifyContent: 'center' },
  badge: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  offer: { borderRadius: radius.tile, padding: 18, gap: 6 },
  offerActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
});
