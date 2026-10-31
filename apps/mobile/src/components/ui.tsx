// The app's building blocks. Flat surfaces, hairline borders, tight corners and
// tabular numbers: the look of a tool people trust with their money.

import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Switch, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { platformMarks, radius, type Platform } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Icon, type IconName } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Screen } from '@/components/Screen';
import { TAB_BAR_HEIGHT } from '@/components/TabBar';
import { ar } from '@/i18n/ar';
import { useTheme } from '@/theme/theme';

const hair = StyleSheet.hairlineWidth;

export function ScrollScreen({
  children,
  header,
  footer,
  inTabs = false,
  edges,
  contentStyle,
}: {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  inTabs?: boolean;
  edges?: ('top' | 'bottom')[];
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  const bottom = inTabs ? TAB_BAR_HEIGHT + insets.bottom + 24 : footer ? 24 : insets.bottom + 24;
  return (
    <Screen edges={edges ?? (inTabs || footer ? ['top'] : ['top'])}>
      {header}
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottom }, contentStyle]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
      {footer && <Footer>{footer}</Footer>}
    </Screen>
  );
}

export function Footer({ children }: { children: ReactNode }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.footer, { backgroundColor: c.bg, borderTopColor: c.line, paddingBottom: insets.bottom + 12 }]}>
      {children}
    </View>
  );
}

export function TopBar({
  title,
  subtitle,
  mode = 'back',
  right,
  onBack,
}: {
  title: string;
  subtitle?: string;
  mode?: 'back' | 'close' | 'none';
  right?: ReactNode;
  onBack?: () => void;
}) {
  const { c } = useTheme();
  const leave = onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')));
  return (
    <View style={[styles.topBar, { borderBottomColor: c.line }]}>
      {mode !== 'none' && (
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={mode === 'close' ? ar.common.close : ar.common.back}
          onPress={leave}
          style={styles.topBtn}>
          <Icon name={mode === 'close' ? 'close' : 'back'} color={c.text} size={22} strokeWidth={1.8} />
        </PressableScale>
      )}
      <View style={styles.topText}>
        <AppText weight="semibold" size={16.5} numberOfLines={1}>
          {title}
        </AppText>
        {subtitle && (
          <AppText size={12} color={c.muted} numberOfLines={1}>
            {subtitle}
          </AppText>
        )}
      </View>
      <View style={styles.topRight}>{right}</View>
    </View>
  );
}

// Big page title for tab roots.
export function PageTitle({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={styles.pageTitle}>
      <View style={styles.flex}>
        <AppText weight="semibold" size={24} lineHeight={32}>
          {title}
        </AppText>
        {subtitle && (
          <AppText size={13} color={c.muted}>
            {subtitle}
          </AppText>
        )}
      </View>
      {right}
    </View>
  );
}

export function IconButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.iconBtn, { borderColor: c.line, backgroundColor: c.card }]}>
      <Icon name={icon} color={c.text} size={19} />
    </PressableScale>
  );
}

export function Card({
  children,
  style,
  onPress,
  accessibilityLabel,
  tone = 'card',
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityLabel?: string;
  tone?: 'card' | 'hero' | 'tile';
}) {
  const { c } = useTheme();
  const surface =
    tone === 'hero'
      ? { backgroundColor: c.hero, borderColor: c.hero }
      : tone === 'tile'
        ? { backgroundColor: c.tile, borderColor: c.tile }
        : { backgroundColor: c.card, borderColor: c.line };
  if (onPress) {
    return (
      <PressableScale accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} style={[styles.card, surface, style]}>
        {children}
      </PressableScale>
    );
  }
  return <View style={[styles.card, surface, style]}>{children}</View>;
}

export function Appear({ children, order = 0, style }: { children: ReactNode; order?: number; style?: StyleProp<ViewStyle> }) {
  const reduceMotion = useReducedMotion();
  return (
    <Animated.View entering={reduceMotion ? undefined : FadeIn.delay(40 * order).duration(260)} style={style}>
      {children}
    </Animated.View>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const { c } = useTheme();
  return (
    <View style={styles.section}>
      <AppText weight="semibold" size={13} color={c.muted}>
        {title}
      </AppText>
      {action && onAction && (
        <PressableScale accessibilityRole="button" onPress={onAction} style={styles.sectionAction} haptic={false}>
          <AppText weight="medium" size={13} color={c.primary}>
            {action}
          </AppText>
        </PressableScale>
      )}
    </View>
  );
}

export function Stat({
  label,
  value,
  unit,
  delta,
  good,
  onHero,
}: {
  label: string;
  value: string;
  unit?: string;
  delta?: string;
  // Whether the change is good news; colors the delta.
  good?: boolean;
  onHero?: boolean;
}) {
  const { c } = useTheme();
  const fg = onHero ? c.heroText : c.text;
  const muted = onHero ? c.heroMuted : c.muted;
  return (
    <View style={styles.stat}>
      <AppText size={12.5} color={muted} numberOfLines={1}>
        {label}
      </AppText>
      <View style={styles.statValue}>
        <AppText weight="semibold" size={22} lineHeight={28} color={fg} style={styles.tabular}>
          {value}
        </AppText>
        {unit && (
          <AppText size={12} color={muted}>
            {unit}
          </AppText>
        )}
      </View>
      {delta && (
        <AppText size={12} weight="medium" color={onHero ? c.heroMuted : good ? c.ok : c.bad}>
          {delta}
        </AppText>
      )}
    </View>
  );
}

export type Tone = 'neutral' | 'ok' | 'bad' | 'acc' | 'pri';

export function Badge({ label, tone = 'neutral', icon }: { label: string; tone?: Tone; icon?: IconName }) {
  const { c } = useTheme();
  const map: Record<Tone, [string, string]> = {
    neutral: [c.tile, c.muted],
    ok: [c.okSoft, c.ok],
    bad: [c.badSoft, c.bad],
    acc: [c.accSoft, c.acc],
    pri: [c.priSoft, c.onPriSoft],
  };
  const [bg, fg] = map[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      {icon && <Icon name={icon} color={fg} size={12} strokeWidth={2.2} />}
      <AppText weight="medium" size={11.5} lineHeight={16} color={fg}>
        {label}
      </AppText>
    </View>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { c } = useTheme();
  return (
    <View accessibilityRole="tablist" style={[styles.segmented, { backgroundColor: c.tile }]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <PressableScale
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            style={[styles.segment, active && { backgroundColor: c.card, borderColor: c.line, borderWidth: hair * 2 }]}>
            <AppText weight={active ? 'semibold' : 'regular'} size={13} color={active ? c.text : c.muted}>
              {o.label}
            </AppText>
          </PressableScale>
        );
      })}
    </View>
  );
}

export function Chip({ label, selected, onPress, icon }: { label: string; selected: boolean; onPress: () => void; icon?: IconName }) {
  const { c } = useTheme();
  return (
    <PressableScale
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[
        styles.chip,
        selected ? { backgroundColor: c.primary, borderColor: c.primary } : { backgroundColor: c.card, borderColor: c.line },
      ]}>
      {icon && <Icon name={icon} color={selected ? c.onPrimary : c.text} size={14} />}
      <AppText weight="medium" size={13} color={selected ? c.onPrimary : c.text}>
        {label}
      </AppText>
    </PressableScale>
  );
}

export function ListRow({
  title,
  subtitle,
  icon,
  leading,
  trailing,
  onPress,
  chevron = !!onPress,
  last,
}: {
  title: string;
  subtitle?: string;
  icon?: IconName;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  last?: boolean;
}) {
  const { c } = useTheme();
  const body = (
    <>
      {leading ??
        (icon && (
          <View style={[styles.rowIcon, { backgroundColor: c.tile }]}>
            <Icon name={icon} color={c.text} size={17} />
          </View>
        ))}
      <View style={styles.flex}>
        <AppText weight="medium" size={14.5} numberOfLines={1}>
          {title}
        </AppText>
        {subtitle && (
          <AppText size={12.5} color={c.muted} numberOfLines={2}>
            {subtitle}
          </AppText>
        )}
      </View>
      {typeof trailing === 'string' ? (
        <AppText size={13} color={c.muted} style={styles.tabular}>
          {trailing}
        </AppText>
      ) : (
        trailing
      )}
      {chevron && <Icon name="chevronLeft" color={c.placeholder} size={18} />}
    </>
  );
  const style = [styles.listRow, !last && { borderBottomColor: c.line, borderBottomWidth: hair }];
  if (onPress) {
    return (
      <PressableScale accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={style} pressedScale={1}>
        {body}
      </PressableScale>
    );
  }
  return <View style={style}>{body}</View>;
}

export function ToggleRow({
  title,
  subtitle,
  value,
  onChange,
  last,
  disabled,
}: {
  title: string;
  subtitle?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
  disabled?: boolean;
}) {
  const { c } = useTheme();
  return (
    <View style={[styles.listRow, !last && { borderBottomColor: c.line, borderBottomWidth: hair }, disabled && { opacity: 0.5 }]}>
      <View style={styles.flex}>
        <AppText weight="medium" size={14.5}>
          {title}
        </AppText>
        {subtitle && (
          <AppText size={12.5} color={c.muted}>
            {subtitle}
          </AppText>
        )}
      </View>
      <Switch
        accessibilityLabel={title}
        value={value}
        disabled={disabled}
        onValueChange={onChange}
        trackColor={{ true: c.primary, false: c.track }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={c.track}
      />
    </View>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  return <View style={[{ height: hair, backgroundColor: c.line }, style]} />;
}

export function Progress({ value, onHero, color }: { value: number; onHero?: boolean; color?: string }) {
  const { c } = useTheme();
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}
      style={[styles.progress, { backgroundColor: onHero ? 'rgba(255,255,255,0.16)' : c.track }]}>
      <View style={[styles.progressFill, { width: `${pct * 100}%`, backgroundColor: color ?? (onHero ? c.navActive : c.primary) }]} />
    </View>
  );
}

export function KeyValue({ label, value, strong, sub }: { label: string; value: string; strong?: boolean; sub?: string }) {
  const { c } = useTheme();
  return (
    <View style={styles.kv}>
      <View style={styles.flex}>
        <AppText size={strong ? 15 : 14} weight={strong ? 'semibold' : 'regular'} color={strong ? c.text : c.muted}>
          {label}
        </AppText>
        {sub && (
          <AppText size={12} color={c.placeholder}>
            {sub}
          </AppText>
        )}
      </View>
      <AppText size={strong ? 16 : 14} weight={strong ? 'semibold' : 'medium'} style={styles.tabular}>
        {value}
      </AppText>
    </View>
  );
}

export function Note({ children, tone = 'neutral', icon = 'info' }: { children: ReactNode; tone?: Tone; icon?: IconName }) {
  const { c } = useTheme();
  const map: Record<Tone, [string, string]> = {
    neutral: [c.tile, c.muted],
    ok: [c.okSoft, c.ok],
    bad: [c.badSoft, c.bad],
    acc: [c.accSoft, c.acc],
    pri: [c.priSoft, c.onPriSoft],
  };
  const [bg, fg] = map[tone];
  return (
    <View style={[styles.note, { backgroundColor: bg }]}>
      <Icon name={icon} color={fg} size={16} />
      <AppText size={12.5} lineHeight={19} color={fg} style={styles.flex}>
        {children}
      </AppText>
    </View>
  );
}

export function RadioCard({
  selected,
  onPress,
  children,
  label,
}: {
  selected: boolean;
  onPress: () => void;
  children: ReactNode;
  label: string;
}) {
  const { c } = useTheme();
  return (
    <PressableScale
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[
        styles.card,
        styles.radioCard,
        { backgroundColor: c.card, borderColor: selected ? c.primary : c.line, borderWidth: selected ? 1.5 : hair * 2 },
      ]}>
      <View style={[styles.radio, { borderColor: selected ? c.primary : c.lineStrong }]}>
        {selected && <View style={[styles.radioDot, { backgroundColor: c.primary }]} />}
      </View>
      <View style={styles.flex}>{children}</View>
    </PressableScale>
  );
}

export function PlatformTag({ platform, size = 22 }: { platform: Platform; size?: number }) {
  const { c } = useTheme();
  return (
    <View style={[styles.platform, { width: size, height: size, backgroundColor: c.tile, borderColor: c.line }]}>
      <AppText weight="semibold" size={size * 0.4} lineHeight={size * 0.55} color={c.muted}>
        {platformMarks[platform]}
      </AppText>
    </View>
  );
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const { c } = useTheme();
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: c.avatar }]}>
      <AppText weight="semibold" size={size * 0.38} color={c.text}>
        {name.trim().charAt(0)}
      </AppText>
    </View>
  );
}

export function Stepper({ value, onChange, min, max, step = 1, format }: { value: number; onChange: (v: number) => void; min: number; max: number; step?: number; format?: (v: number) => string }) {
  const { c } = useTheme();
  return (
    <View style={[styles.stepper, { borderColor: c.line }]}>
      <PressableScale accessibilityRole="button" accessibilityLabel="زيادة" disabled={value >= max} onPress={() => onChange(Math.min(max, value + step))} style={styles.stepBtn}>
        <Icon name="plus" color={value >= max ? c.placeholder : c.text} size={16} />
      </PressableScale>
      <AppText weight="semibold" size={15} style={[styles.tabular, styles.stepValue]} center>
        {format ? format(value) : String(value)}
      </AppText>
      <PressableScale accessibilityRole="button" accessibilityLabel="إنقاص" disabled={value <= min} onPress={() => onChange(Math.max(min, value - step))} style={styles.stepBtn}>
        <Icon name="minus" color={value <= min ? c.placeholder : c.text} size={16} />
      </PressableScale>
    </View>
  );
}

export const ui = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  gap8: { gap: 8 },
  gap12: { gap: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tabular: { fontVariant: ['tabular-nums'] },
  ltr: { writingDirection: 'ltr' },
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  tabular: { fontVariant: ['tabular-nums'] },
  scroll: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  footer: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: hair, gap: 8 },
  topBar: { flexDirection: 'row', alignItems: 'center', minHeight: 54, paddingHorizontal: 8, borderBottomWidth: hair, gap: 4 },
  topBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  topText: { flex: 1, paddingHorizontal: 4 },
  topRight: { minWidth: 44, alignItems: 'flex-end', paddingEnd: 8 },
  pageTitle: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 8, paddingBottom: 4 },
  iconBtn: { width: 40, height: 40, borderRadius: radius.control, borderWidth: hair * 2, alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: radius.tile, borderWidth: hair * 2, padding: 16, gap: 10 },
  section: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingHorizontal: 2 },
  sectionAction: { minHeight: 32, justifyContent: 'center' },
  stat: { flex: 1, gap: 2 },
  statValue: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.chip },
  segmented: { flexDirection: 'row', borderRadius: radius.control, padding: 3, gap: 3 },
  segment: { flex: 1, height: 36, borderRadius: radius.control - 3, alignItems: 'center', justifyContent: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 12, borderRadius: radius.control - 2, borderWidth: hair * 2 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingVertical: 10 },
  rowIcon: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  progress: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  kv: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 34 },
  note: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: radius.control, alignItems: 'flex-start' },
  radioCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  platform: { borderRadius: 5, borderWidth: hair * 2, alignItems: 'center', justifyContent: 'center' },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: hair * 2, borderRadius: radius.control, height: 40 },
  stepBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  stepValue: { minWidth: 56 },
});
