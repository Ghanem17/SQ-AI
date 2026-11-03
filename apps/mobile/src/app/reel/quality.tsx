import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { formatIQD, reelPrice, tierOrder, tiers, tools, type Tier } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Badge, Note, RadioCard, ScrollScreen, TopBar, ui } from '@/components/ui';
import { useI18n } from '@/i18n';
import { useStudio } from '@/state/studio';
import { useTheme } from '@/theme/theme';

// "How do you want your reel?" — three quality levels, each with its price, what it
// includes, and a link to the full receipt of the AI work behind it.
export default function QualityScreen() {
  const { c } = useTheme();
  const { L } = useI18n();
  const { draft, updateDraft } = useStudio();

  return (
    <ScrollScreen
      header={<TopBar title={L('كيف تريد الريل؟', 'How do you want the reel?')} subtitle={draft.title} />}
      footer={
        <>
          <View style={ui.between}>
            <AppText size={13} color={c.muted}>
              {L(
                `${tiers[draft.tier].name.ar} · جاهز خلال ${tiers[draft.tier].deliveryHours} ساعات`,
                `${tiers[draft.tier].name.en} · ready in ${tiers[draft.tier].deliveryHours} hours`,
              )}
            </AppText>
            <AppText weight="semibold" size={17} style={ui.tabular}>
              {formatIQD(reelPrice(draft.tier))}
            </AppText>
          </View>
          <Button label={L('التالي: النشر', 'Next: posting')} onPress={() => router.push('/reel/publish')} />
        </>
      }>
      <AppText size={13.5} color={c.muted} lineHeight={21}>
        {L(
          'اختر مستوى المونتاج. السعر هو تكلفة أدوات الذكاء الاصطناعي المستخدمة فعلًا مضافًا إليها رسوم الخدمة، ويمكنك رؤية التفاصيل لكل مستوى.',
          'Choose the editing level. The price is the cost of the AI tools actually used plus the service fee; see the details for each level.',
        )}
      </AppText>

      {tierOrder.map((id) => (
        <TierCard key={id} id={id} selected={draft.tier === id} onSelect={() => updateDraft({ tier: id })} />
      ))}

      <Note icon="shield">
        {L(
          'تُخصم القيمة عند موافقتك على الريل النهائي فقط. وإن لم يعجبك، نعيد المونتاج مرة واحدة مجانًا.',
          'You are charged only when you approve the final reel. If you do not like it, we re-edit once for free.',
        )}
      </Note>
    </ScrollScreen>
  );
}

function TierCard({ id, selected, onSelect }: { id: Tier; selected: boolean; onSelect: () => void }) {
  const { c } = useTheme();
  const { L, pick } = useI18n();
  const tier = tiers[id];
  const usedTools = [...new Set(tier.items.flatMap((i) => i.tools))].map((t) => tools[t].name);

  return (
    <RadioCard selected={selected} onPress={onSelect} label={`${pick(tier.name)}${L('، ', ', ')}${formatIQD(reelPrice(id))}`}>
      <View style={styles.head}>
        <View style={ui.flex}>
          <View style={styles.titleRow}>
            <AppText weight="semibold" size={16}>
              {pick(tier.name)}
            </AppText>
            {id === 'pro' && <Badge label={L('الأكثر طلبًا', 'Most popular')} tone="acc" />}
          </View>
          <AppText size={12.5} color={c.muted}>
            {pick(tier.summary)}
          </AppText>
        </View>
        <AppText weight="semibold" size={16} style={ui.tabular}>
          {formatIQD(reelPrice(id))}
        </AppText>
      </View>

      <View style={styles.specs}>
        <Spec icon="clock" label={L(`خلال ${tier.deliveryHours} ساعات`, `In ${tier.deliveryHours} hours`)} />
        <Spec icon="video" label={tier.resolution} />
        <Spec icon="layers" label={L(`${tier.items.length} مراحل`, `${tier.items.length} steps`)} />
      </View>

      <AppText size={12} color={c.placeholder} numberOfLines={2}>
        {usedTools.join(' · ')}
      </AppText>

      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={L(`لماذا هذا السعر؟ ${tier.name.ar}`, `Why this price? ${tier.name.en}`)}
        onPress={() => router.push({ pathname: '/reel/receipt', params: { tier: id } })}
        style={styles.why}>
        <Icon name="receipt" color={c.primary} size={16} />
        <AppText weight="medium" size={13} color={c.primary}>
          {L('لماذا هذا السعر؟', 'Why this price?')}
        </AppText>
      </PressableScale>
    </RadioCard>
  );
}

function Spec({ icon, label }: { icon: 'clock' | 'video' | 'layers'; label: string }) {
  const { c } = useTheme();
  return (
    <View style={styles.spec}>
      <Icon name={icon} color={c.muted} size={14} />
      <AppText size={12.5} color={c.muted}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  specs: { flexDirection: 'row', gap: 14, flexWrap: 'wrap', marginTop: 10 },
  spec: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  why: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', minHeight: 40, marginTop: 2 },
});
