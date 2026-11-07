// The app's building blocks, from the formal redesign: one control shape
// (radius 12), cards at 16 with a hairline border, squircle icon badges in
// one tint, grouped statement-style lists and start-aligned headings.

import { router } from 'expo-router';
import { useState, type ReactNode, type Ref } from 'react';
import { ScrollView, StyleSheet, TextInput, View, type StyleProp, type TextInputProps, type TextInputInstance, type ViewStyle } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { font, platformMarks, radius, type Platform } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Icon, type IconName } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Screen } from '@/components/Screen';
import { TAB_BAR_HEIGHT } from '@/components/layout';
import { useI18n } from '@/i18n';
import { useSession } from '@/state/session';
import { useTheme } from '@/theme/theme';

export const GUTTER = 20;

export function ScrollScreen({
  children,
  header,
  footer,
  inTabs = false,
  bleed = false,
  edges,
  contentStyle,
}: {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  inTabs?: boolean;
  // Content starts under the status bar and runs edge to edge (Home's hero).
  bleed?: boolean;
  edges?: ('top' | 'bottom')[];
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  const bottom = inTabs ? TAB_BAR_HEIGHT + insets.bottom + 28 : footer ? 24 : insets.bottom + 24;
  return (
    <Screen edges={edges ?? (bleed ? [] : ['top'])}>
      {header}
      <ScrollView
        contentContainerStyle={[bleed ? styles.bleed : styles.scroll, { paddingBottom: bottom }, contentStyle]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
      {footer && <Footer>{footer}</Footer>}
    </Screen>
  );
}

// Sticky footer in the nav surface with a hairline on top.
export function Footer({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return <View style={[styles.footer, { backgroundColor: c.nav, borderTopColor: c.line, paddingBottom: insets.bottom + 14 }, style]}>{children}</View>;
}

// Pushed screens: back at the start, a centred title, an optional action at
// the end, all on 40×40 icon buttons.
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
  const { t } = useI18n();
  const leave = onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')));
  return (
    <View style={styles.topBar}>
      {mode !== 'none' ? (
        <IconButton icon={mode === 'close' ? 'close' : 'back'} label={mode === 'close' ? t.common.close : t.common.back} onPress={leave} />
      ) : (
        <View style={styles.topSpacer} />
      )}
      <View style={styles.topText}>
        <AppText weight="semibold" size={16} lineHeight={22} numberOfLines={1} center>
          {title}
        </AppText>
        {subtitle && (
          <AppText size={11.5} lineHeight={16} color={c.muted} numberOfLines={1} center>
            {subtitle}
          </AppText>
        )}
      </View>
      <View style={styles.topEnd}>{right ?? <View style={styles.topSpacer} />}</View>
    </View>
  );
}

// Tab roots: a start-aligned h1 with a subtitle and an icon button at the end.
export function PageTitle({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={styles.pageTitle}>
      <View style={styles.flex}>
        <AppText variant="h1" accessibilityRole="header">
          {title}
        </AppText>
        {subtitle && (
          <AppText variant="small" color={c.muted}>
            {subtitle}
          </AppText>
        )}
      </View>
      {right}
    </View>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  dot,
  size = 40,
  onHero,
  disabled,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  // A small unread dot at the top end corner.
  dot?: boolean;
  size?: number;
  onHero?: boolean;
  disabled?: boolean;
}) {
  const { c } = useTheme();
  const surface = onHero ? { backgroundColor: c.heroTile, borderColor: c.heroTileLine } : { backgroundColor: c.card, borderColor: c.line };
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      style={[styles.iconBtn, { width: size, height: size }, surface, disabled && { opacity: 0.4 }]}>
      <Icon name={icon} color={onHero ? c.heroText : c.text} size={20} />
      {dot && <View style={[styles.dot, { backgroundColor: onHero ? c.heroAccent : c.accent, borderColor: onHero ? c.hero : c.card }]} />}
    </PressableScale>
  );
}

export function Card({
  children,
  style,
  onPress,
  accessibilityLabel,
  tone = 'card',
  flush = false,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityLabel?: string;
  tone?: 'card' | 'hero' | 'tile';
  // Grouped lists: no inner padding, the rows carry it.
  flush?: boolean;
}) {
  const { c, elev } = useTheme();
  const surface =
    tone === 'hero'
      ? { backgroundColor: c.hero, borderColor: c.hero }
      : tone === 'tile'
        ? { backgroundColor: c.tile, borderColor: c.tile }
        : [{ backgroundColor: c.card, borderColor: c.line }, elev.card];
  const all = [styles.card, flush && styles.flush, surface, style];
  if (onPress) {
    return (
      <PressableScale accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} pressedScale={0.99} style={all}>
        {children}
      </PressableScale>
    );
  }
  return <View style={all}>{children}</View>;
}

// A grouped list card: rows separated by hairlines, like a bank statement.
export function ListCard({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <Card flush style={style}>
      {children}
    </Card>
  );
}

export function Appear({ children, order = 0, style }: { children: ReactNode; order?: number; style?: StyleProp<ViewStyle> }) {
  const reduceMotion = useReducedMotion();
  return (
    <Animated.View entering={reduceMotion ? undefined : FadeIn.delay(40 * order).duration(260)} style={style}>
      {children}
    </Animated.View>
  );
}

// A section heading (h3) with an optional link at the end.
export function SectionTitle({ title, action, onAction, icon }: { title: string; action?: string; onAction?: () => void; icon?: IconName }) {
  const { c } = useTheme();
  return (
    <View style={styles.section}>
      <AppText variant="h3" accessibilityRole="header" style={styles.flex}>
        {title}
      </AppText>
      {action && onAction ? (
        <PressableScale accessibilityRole="button" onPress={onAction} style={styles.sectionAction} haptic={false}>
          {icon && <Icon name={icon} color={c.muted} size={14} />}
          <AppText weight="medium" size={12.5} color={c.muted}>
            {action}
          </AppText>
        </PressableScale>
      ) : action ? (
        <View style={styles.sectionAction}>
          {icon && <Icon name={icon} color={c.muted} size={14} />}
          <AppText weight="medium" size={12.5} color={c.muted}>
            {action}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

// The small caption above a grouped settings section.
export function GroupLabel({ title, badge }: { title: string; badge?: ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={styles.groupLabel}>
      <AppText weight="semibold" size={11} lineHeight={16} color={c.muted} accessibilityRole="header">
        {title}
      </AppText>
      {badge}
    </View>
  );
}

export type BadgeTone = 'pri' | 'acc' | 'ok' | 'tile' | 'solid' | 'bad' | 'warn';

// A squircle icon badge in one tint. `solid` marks the screen's one primary
// action.
export function IconBadge({ icon, size = 40, tone = 'pri' }: { icon: IconName; size?: number; tone?: BadgeTone }) {
  const { c } = useTheme();
  const map: Record<BadgeTone, [string, string]> = {
    pri: [c.priSoft, c.onPriSoft],
    acc: [c.accSoft, c.acc],
    ok: [c.okSoft, c.ok],
    tile: [c.tile, c.text],
    solid: [c.hero, c.heroAccent],
    bad: [c.badSoft, c.bad],
    warn: [c.warnSoft, c.warn],
  };
  const [bg, fg] = map[tone];
  return (
    <View style={[styles.iconBadge, { width: size, height: size, borderRadius: size <= 34 ? 10 : radius.control, backgroundColor: bg }]}>
      <Icon name={icon} color={fg} size={Math.round(size * 0.5)} />
    </View>
  );
}

// A metric card: icon badge and delta on top, then the label and value.
// Lower cost is good news, so a falling cost delta is green too.
export function StatCard({
  icon,
  tone = 'pri',
  label,
  value,
  delta,
  down,
  bad,
}: {
  icon: IconName;
  tone?: BadgeTone;
  label: string;
  // null shows the empty "—".
  value: string | null;
  delta?: string;
  down?: boolean;
  bad?: boolean;
}) {
  const { c } = useTheme();
  return (
    <Card style={styles.stat}>
      <View style={styles.between}>
        <IconBadge icon={icon} tone={tone} size={32} />
        {delta && value !== null && (
          <View style={styles.delta}>
            <Icon name={down ? 'arrowDown' : 'arrowUp'} color={bad ? c.bad : c.ok} size={12} strokeWidth={2.2} />
            <AppText weight="semibold" size={11.5} lineHeight={16} color={bad ? c.bad : c.ok}>
              {delta}
            </AppText>
          </View>
        )}
      </View>
      <View>
        <AppText size={12} lineHeight={17} color={c.muted} numberOfLines={1} style={styles.statLabel}>
          {label}
        </AppText>
        <AppText variant="metric" color={value === null ? c.placeholder : c.text} numberOfLines={1}>
          {value ?? '—'}
        </AppText>
      </View>
    </Card>
  );
}

// A plain label over a value, for compact summaries.
export function Stat({ label, value, unit, onHero }: { label: string; value: string; unit?: string; onHero?: boolean }) {
  const { c } = useTheme();
  const fg = onHero ? c.heroText : c.text;
  const muted = onHero ? c.heroMuted : c.muted;
  return (
    <View style={styles.flex}>
      <AppText size={11} lineHeight={16} color={muted} numberOfLines={1}>
        {label}
      </AppText>
      <View style={styles.statValue}>
        <AppText weight="semibold" size={15} lineHeight={22} color={fg} numberOfLines={1}>
          {value}
        </AppText>
        {unit && (
          <AppText size={12} color={muted}>
            {unit}
          </AppText>
        )}
      </View>
    </View>
  );
}

export type Tone = 'neutral' | 'ok' | 'bad' | 'acc' | 'pri' | 'warn' | 'outline';

export function Badge({ label, tone = 'neutral', icon, small, style }: { label: string; tone?: Tone; icon?: IconName; small?: boolean; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  const map: Record<Tone, [string, string]> = {
    neutral: [c.tile, c.muted],
    ok: [c.okSoft, c.ok],
    bad: [c.badSoft, c.bad],
    acc: [c.accSoft, c.acc],
    pri: [c.priSoft, c.onPriSoft],
    warn: [c.warnSoft, c.warn],
    outline: ['transparent', c.muted],
  };
  const [bg, fg] = map[tone];
  return (
    <View style={[styles.badge, { height: small ? 20 : 22, backgroundColor: bg }, tone === 'outline' && { borderWidth: 1, borderColor: c.line }, style]}>
      {icon && <Icon name={icon} color={fg} size={13} strokeWidth={2} />}
      <AppText weight="medium" size={small ? 11 : 11.5} lineHeight={16} color={fg} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

// A model name such as "Kling 3 Pro", always left to right.
export function ModelChip({ label }: { label: string }) {
  const { c } = useTheme();
  return (
    <View style={[styles.model, { backgroundColor: c.priSoft }]}>
      <AppText weight="semibold" size={11.5} lineHeight={17} color={c.onPriSoft} style={styles.ltr}>
        {label}
      </AppText>
    </View>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  compact,
  style,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  // The 28-high version used inside a settings row.
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { c, elev } = useTheme();
  return (
    <View accessibilityRole="tablist" style={[styles.segmented, compact && styles.segCompact, { backgroundColor: c.tile }, style]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <PressableScale
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            style={[styles.segment, compact && styles.segmentCompact, active && [{ backgroundColor: c.card, borderColor: c.line, borderWidth: 1 }, elev.raised]]}>
            <AppText weight={active ? 'semibold' : 'medium'} size={compact ? 12 : 13} lineHeight={18} color={active ? c.text : c.muted} numberOfLines={1}>
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
      style={[styles.chip, selected ? { backgroundColor: c.primary, borderColor: c.primary } : { backgroundColor: c.card, borderColor: c.line }]}>
      {icon && <Icon name={icon} color={selected ? c.onPrimary : c.muted} size={15} />}
      <AppText weight={selected ? 'semibold' : 'medium'} size={13} lineHeight={18} color={selected ? c.onPrimary : c.muted}>
        {label}
      </AppText>
    </PressableScale>
  );
}

// The chevron that points toward the end of the reading direction.
export function Chevron({ size = 16 }: { size?: number }) {
  const { c } = useTheme();
  return <Icon name="chevronLeft" color={c.placeholder} size={size} strokeWidth={1.8} />;
}

export function ListRow({
  title,
  subtitle,
  icon,
  iconTone = 'pri',
  leading,
  trailing,
  value,
  onPress,
  chevron = !!onPress,
  last,
  compact,
  subtitleLines = 1,
  disabled,
}: {
  title: string;
  subtitle?: string;
  icon?: IconName;
  iconTone?: BadgeTone;
  leading?: ReactNode;
  trailing?: ReactNode;
  // A short value at the end, in small muted text.
  value?: string;
  onPress?: () => void;
  chevron?: boolean;
  last?: boolean;
  // Settings rows: 52 high with a 34 badge and a medium-weight label.
  compact?: boolean;
  subtitleLines?: number;
  disabled?: boolean;
}) {
  const { c } = useTheme();
  const body = (
    <>
      {leading ?? (icon && <IconBadge icon={icon} tone={iconTone} size={compact ? 34 : 40} />)}
      <View style={styles.flex}>
        <AppText weight={compact ? 'medium' : 'semibold'} size={compact ? 14 : 14.5} lineHeight={21} numberOfLines={1}>
          {title}
        </AppText>
        {subtitle && (
          <AppText variant="small" color={c.muted} numberOfLines={subtitleLines}>
            {subtitle}
          </AppText>
        )}
      </View>
      {value !== undefined && (
        <AppText variant="small" color={c.muted} numberOfLines={1} style={styles.rowValue}>
          {value}
        </AppText>
      )}
      {typeof trailing === 'string' ? (
        <AppText size={13} weight="semibold">
          {trailing}
        </AppText>
      ) : trailing ? (
        <View style={styles.trailing}>{trailing}</View>
      ) : null}
      {chevron && <Chevron />}
    </>
  );
  const style = [styles.listRow, compact && styles.listRowCompact, !last && { borderBottomColor: c.line, borderBottomWidth: 1 }, disabled && { opacity: 0.5 }];
  if (onPress) {
    return (
      <PressableScale accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={style} pressedScale={1} disabled={disabled}>
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
  icon,
}: {
  title: string;
  subtitle?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
  disabled?: boolean;
  icon?: IconName;
}) {
  const { c } = useTheme();
  return (
    <View style={[styles.listRow, !last && { borderBottomColor: c.line, borderBottomWidth: 1 }, disabled && { opacity: 0.5 }]}>
      {icon && <IconBadge icon={icon} size={34} />}
      <View style={styles.flex}>
        <AppText weight="semibold" size={14.5} lineHeight={21}>
          {title}
        </AppText>
        {subtitle && (
          <AppText variant="small" color={c.muted}>
            {subtitle}
          </AppText>
        )}
      </View>
      <Toggle label={title} value={value} disabled={disabled} onChange={onChange} />
    </View>
  );
}

// The switch from the spec (44×26, 20 knob). Drawn here so it looks the same
// on every platform and mirrors with the language: on puts the knob at the
// end side (left in Arabic, right in English).
export function Toggle({ value, onChange, label, disabled }: { value: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  const { c } = useTheme();
  return (
    <PressableScale
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled: !!disabled }}
      disabled={disabled}
      haptic
      pressedScale={0.96}
      onPress={() => onChange(!value)}
      style={[styles.toggle, { backgroundColor: value ? c.primary : c.track, justifyContent: value ? 'flex-end' : 'flex-start' }]}>
      <View style={[styles.knob, { backgroundColor: value ? c.onPrimary : '#FFFFFF' }]} />
    </PressableScale>
  );
}

export function Divider({ style, dashed }: { style?: StyleProp<ViewStyle>; dashed?: boolean }) {
  const { c } = useTheme();
  if (dashed) return <View style={[{ borderTopWidth: 1, borderStyle: 'dashed', borderColor: c.line }, style]} />;
  return <View style={[{ height: 1, backgroundColor: c.line }, style]} />;
}

// Fills from the reading start, so it grows from the right in Arabic.
export function Progress({ value, onHero, color }: { value: number; onHero?: boolean; color?: string }) {
  const { c } = useTheme();
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}
      style={[styles.progress, { backgroundColor: onHero ? 'rgba(255,255,255,0.10)' : c.track }]}>
      {pct > 0 && <View style={[styles.progressFill, { width: `${pct * 100}%`, backgroundColor: color ?? (onHero ? c.heroAccent : c.primary) }]} />}
    </View>
  );
}

export function KeyValue({
  label,
  value,
  strong,
  sub,
  icon,
  divider,
  ltrValue,
}: {
  label: string;
  value: string;
  strong?: boolean;
  sub?: string;
  icon?: IconName;
  // A hairline above the row, for stacked rows.
  divider?: boolean;
  // Model names and ids read left to right.
  ltrValue?: boolean;
}) {
  const { c } = useTheme();
  return (
    <View style={[styles.kv, strong && styles.kvStrong, divider && { borderTopWidth: 1, borderTopColor: c.line }]}>
      <View style={[styles.flex, styles.kvLabel]}>
        {icon && <Icon name={icon} color={strong ? c.text : c.muted} size={16} />}
        <View style={styles.flex}>
          <AppText size={13.5} lineHeight={20} weight={strong ? 'semibold' : 'regular'} color={strong ? c.text : c.muted}>
            {label}
          </AppText>
          {sub && (
            <AppText size={11.5} lineHeight={16} color={c.placeholder}>
              {sub}
            </AppText>
          )}
        </View>
      </View>
      <AppText size={strong ? 18 : 13.5} lineHeight={strong ? 26 : 20} weight={strong ? 'bold' : 'semibold'} style={[styles.kvValue, ltrValue && styles.ltr]}>
        {value}
      </AppText>
    </View>
  );
}

// A note with a 3px stripe on the start side.
export function Note({ children, tone = 'neutral', icon = 'info' }: { children: ReactNode; tone?: Tone | 'info'; icon?: IconName }) {
  const { c } = useTheme();
  const map: Record<Tone | 'info', [string, string, string]> = {
    neutral: [c.tile, c.muted, c.accent],
    outline: [c.tile, c.muted, c.accent],
    info: [c.priSoft, c.onPriSoft, c.chart],
    pri: [c.priSoft, c.onPriSoft, c.chart],
    ok: [c.okSoft, c.ok, c.ok],
    bad: [c.badSoft, c.bad, c.bad],
    acc: [c.accSoft, c.acc, c.accent],
    warn: [c.warnSoft, c.warn, c.accent],
  };
  const [bg, fg, stripe] = map[tone];
  return (
    <View style={[styles.note, { backgroundColor: bg, borderStartColor: stripe }]}>
      <Icon name={icon} color={fg} size={18} />
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
  style,
}: {
  selected: boolean;
  onPress: () => void;
  children: ReactNode;
  label: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { c, elev } = useTheme();
  return (
    <PressableScale
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      pressedScale={0.99}
      style={[
        styles.radioCard,
        { backgroundColor: c.card, borderColor: selected ? c.primary : c.line, borderWidth: selected ? 1.5 : 1 },
        selected && elev.raised,
        style,
      ]}>
      <View style={[styles.radio, { borderColor: selected ? c.primary : c.lineStrong }]}>{selected && <View style={[styles.radioDot, { backgroundColor: c.primary }]} />}</View>
      <View style={styles.flex}>{children}</View>
    </PressableScale>
  );
}

export function PlatformTag({ platform, size = 22 }: { platform: Platform; size?: number }) {
  const { c } = useTheme();
  return (
    <View style={[styles.platform, { width: size, height: size, borderRadius: size >= 30 ? 10 : 6, backgroundColor: c.priSoft }]}>
      <AppText weight="semibold" size={size * 0.38} lineHeight={size * 0.55} color={c.onPriSoft}>
        {platformMarks[platform]}
      </AppText>
    </View>
  );
}

// A squircle with the first letter; `hero` is the profile's navy tile.
export function Avatar({ name, size = 40, hero }: { name: string; size?: number; hero?: boolean }) {
  const { c } = useTheme();
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: Math.round(size * 0.27), backgroundColor: hero ? c.hero : c.avatar },
        hero && { borderWidth: 1, borderColor: 'rgba(244,214,176,0.35)' },
      ]}>
      <AppText weight="bold" size={size * 0.42} lineHeight={size * 0.6} color={hero ? c.heroAccent : c.text}>
        {name.trim().charAt(0)}
      </AppText>
    </View>
  );
}

// Minus at the start, plus at the end, mirrored with the reading direction.
export function Stepper({ value, onChange, min, max, step = 1, format }: { value: number; onChange: (v: number) => void; min: number; max: number; step?: number; format?: (v: number) => string }) {
  const { c } = useTheme();
  const { L } = useI18n();
  return (
    <View style={[styles.stepper, { borderColor: c.line, backgroundColor: c.card }]}>
      <PressableScale accessibilityRole="button" accessibilityLabel={L('إنقاص', 'Decrease')} disabled={value <= min} onPress={() => onChange(Math.max(min, value - step))} style={styles.stepBtn}>
        <Icon name="minus" color={value <= min ? c.placeholder : c.text} size={16} />
      </PressableScale>
      <AppText weight="semibold" size={15} style={styles.stepValue} center>
        {format ? format(value) : String(value)}
      </AppText>
      <PressableScale accessibilityRole="button" accessibilityLabel={L('زيادة', 'Increase')} disabled={value >= max} onPress={() => onChange(Math.min(max, value + step))} style={styles.stepBtn}>
        <Icon name="plus" color={value >= max ? c.placeholder : c.text} size={16} />
      </PressableScale>
    </View>
  );
}

export type StepState = 'done' | 'now' | 'todo';

// Order progress: a row of dots with labels under them, top-aligned so a
// two-line label does not shift its dot. Runs in reading direction.
export function StepTrack({ steps }: { steps: { label: string; state: StepState }[] }) {
  const { c } = useTheme();
  return (
    <View style={styles.track}>
      {steps.map((s, i) => (
        <View key={`${s.label}${i}`} style={styles.trackItem} accessible accessibilityLabel={s.label} accessibilityState={{ checked: s.state === 'done', selected: s.state === 'now' }}>
          <View
            style={[
              styles.trackDot,
              s.state === 'done'
                ? { backgroundColor: c.ok }
                : s.state === 'now'
                  ? { borderWidth: 2, borderColor: c.accent, backgroundColor: c.card }
                  : { borderWidth: 1.5, borderColor: c.lineStrong },
            ]}>
            {s.state === 'done' && <Icon name="check" color={c.card} size={12} strokeWidth={2.6} />}
            {s.state === 'now' && <View style={[styles.trackNow, { backgroundColor: c.accent }]} />}
          </View>
          <AppText size={10.5} lineHeight={14} weight={s.state === 'now' ? 'semibold' : 'regular'} color={s.state === 'todo' ? c.placeholder : c.text} center>
            {s.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}

// Switches the interface between Arabic and English.
export function LangSwitch({ color, border, background }: { color?: string; border?: string; background?: string }) {
  const { c } = useTheme();
  const { lang } = useI18n();
  const { setLang } = useSession();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
      onPress={() => setLang(lang === 'ar' ? 'en' : 'ar')}
      style={[styles.langSwitch, { borderColor: border ?? c.line, backgroundColor: background ?? c.card }]}>
      <Icon name="globe" color={color ?? c.text} size={16} />
      <AppText weight="medium" size={13} lineHeight={18} color={color ?? c.text} style={{ writingDirection: lang === 'ar' ? 'ltr' : 'rtl' }}>
        {lang === 'ar' ? 'English' : 'العربية'}
      </AppText>
    </PressableScale>
  );
}

// Keeps the full structure of a screen's empty card: an icon, one plain
// sentence about what will appear, and one clear first action.
export function EmptyState({
  icon,
  title,
  body,
  action,
  onAction,
  actionIcon,
}: {
  icon: IconName;
  title: string;
  body?: string;
  action?: string;
  onAction?: () => void;
  actionIcon?: IconName;
}) {
  const { c } = useTheme();
  return (
    <Card style={styles.empty}>
      <IconBadge icon={icon} tone="tile" size={44} />
      <AppText variant="h3" center>
        {title}
      </AppText>
      {body && (
        <AppText variant="small" lineHeight={19} color={c.muted} center>
          {body}
        </AppText>
      )}
      {action && onAction && <Button label={action} small icon={actionIcon} onPress={onAction} style={styles.emptyAction} />}
    </Card>
  );
}

// A labelled text field: 52 high on the card surface, a 1.5px primary border
// on focus, and an error line under it.
export function Field({
  label,
  error,
  hint,
  icon,
  inputRef,
  style,
  multiline,
  ltr,
  ...input
}: TextInputProps & {
  label?: string;
  error?: string | null;
  hint?: string;
  icon?: IconName;
  inputRef?: Ref<TextInputInstance>;
  // Codes, numbers and links are typed left to right.
  ltr?: boolean;
}) {
  const { c } = useTheme();
  const { rtl } = useI18n();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? c.bad : focused ? c.primary : c.line;
  return (
    <View style={styles.field}>
      {label && (
        <AppText weight="medium" size={12.5} lineHeight={18} color={c.muted}>
          {label}
        </AppText>
      )}
      <View
        style={[
          styles.fieldBox,
          multiline && styles.fieldMulti,
          { backgroundColor: c.card, borderColor, borderWidth: error || focused ? 1.5 : 1 },
          style,
        ]}>
        {icon && <Icon name={icon} color={c.placeholder} size={18} />}
        <TextInput
          ref={inputRef}
          placeholderTextColor={c.placeholder}
          multiline={multiline}
          accessibilityLabel={label}
          {...input}
          onFocus={(e) => {
            setFocused(true);
            input.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            input.onBlur?.(e);
          }}
          style={[
            styles.fieldInput,
            multiline && styles.fieldInputMulti,
            { color: c.text, textAlign: ltr ? 'left' : rtl ? 'right' : 'left', writingDirection: ltr ? 'ltr' : rtl ? 'rtl' : 'ltr' },
          ]}
        />
      </View>
      {error ? (
        <AppText size={12.5} lineHeight={18} color={c.bad} accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : hint ? (
        <AppText size={12} lineHeight={17} color={c.placeholder}>
          {hint}
        </AppText>
      ) : null}
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
  // Readex Pro has no tabular figures: amounts sit at the row's end instead,
  // so columns of amounts line up on their end edge.
  tabular: { flexShrink: 0 },
  ltr: { writingDirection: 'ltr' },
});

const styles = StyleSheet.create({
  langSwitch: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 12, borderRadius: radius.chip, borderWidth: 1 },
  flex: { flex: 1 },
  ltr: { writingDirection: 'ltr' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scroll: { paddingHorizontal: GUTTER, paddingTop: 8, gap: 12 },
  bleed: { gap: 12 },
  footer: { paddingHorizontal: GUTTER, paddingTop: 14, borderTopWidth: 1, gap: 8 },
  topBar: { flexDirection: 'row', alignItems: 'center', height: 56, paddingHorizontal: 16, gap: 12 },
  topSpacer: { width: 40, height: 40 },
  topText: { flex: 1 },
  topEnd: { minWidth: 40, alignItems: 'flex-end' },
  pageTitle: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 8, paddingBottom: 4 },
  iconBtn: { borderRadius: radius.control, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', top: 6, end: 6, width: 9, height: 9, borderRadius: 5, borderWidth: 2 },
  card: { borderRadius: radius.card, borderWidth: 1, padding: 16, gap: 10 },
  flush: { padding: 0, gap: 0, overflow: 'hidden' },
  section: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 8, marginBottom: -2, gap: 8 },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 32 },
  groupLabel: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, marginBottom: -4, paddingHorizontal: 4 },
  iconBadge: { alignItems: 'center', justifyContent: 'center' },
  stat: { flex: 1, padding: 14, gap: 10 },
  statLabel: { marginBottom: 2 },
  statValue: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  delta: { flexDirection: 'row', alignItems: 'center', gap: 2, direction: 'ltr' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 8, borderRadius: radius.badge },
  model: { borderRadius: radius.badge, paddingHorizontal: 7, paddingVertical: 2, alignSelf: 'flex-start', maxWidth: '100%' },
  segmented: { flexDirection: 'row', borderRadius: radius.control, padding: 3, gap: 2 },
  segCompact: { padding: 2, width: 170 },
  segment: { flex: 1, height: 34, borderRadius: radius.segItem, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  segmentCompact: { height: 28 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 14, borderRadius: radius.chip, borderWidth: 1 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingVertical: 12, paddingHorizontal: 14 },
  listRowCompact: { minHeight: 52, paddingVertical: 8 },
  rowValue: { maxWidth: '45%' },
  trailing: { justifyContent: 'center' },
  toggle: { width: 44, height: 26, borderRadius: 13, padding: 3, flexDirection: 'row', alignItems: 'center', marginStart: 6 },
  knob: { width: 20, height: 20, borderRadius: 10, boxShadow: '0px 1px 3px rgba(0,0,0,0.2)' },
  progress: { height: 6, borderRadius: 3, overflow: 'hidden', flexDirection: 'row' },
  progressFill: { height: 6, borderRadius: 3 },
  kv: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 42, paddingVertical: 6 },
  kvStrong: { minHeight: 50 },
  kvLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kvValue: { flexShrink: 1 },
  note: { flexDirection: 'row', gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderRadius: radius.control, alignItems: 'flex-start', borderStartWidth: 3 },
  radioCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: radius.tier, paddingVertical: 12, paddingHorizontal: 14 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  platform: { alignItems: 'center', justifyContent: 'center' },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radius.control, height: 40 },
  stepBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  stepValue: { minWidth: 56 },
  track: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  trackItem: { width: 60, alignItems: 'center', gap: 6 },
  trackDot: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  trackNow: { width: 6, height: 6, borderRadius: 3 },
  empty: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyAction: { marginTop: 4 },
  field: { gap: 6 },
  fieldBox: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 52, borderRadius: radius.control, paddingHorizontal: 14 },
  fieldMulti: { height: undefined, minHeight: 120, alignItems: 'flex-start', paddingVertical: 12 },
  fieldInput: { flex: 1, minWidth: 0, height: '100%', fontFamily: font.regular, fontSize: 15, paddingVertical: 0 },
  fieldInputMulti: { height: undefined, minHeight: 96, fontSize: 14, lineHeight: 22, textAlignVertical: 'top' },
});
