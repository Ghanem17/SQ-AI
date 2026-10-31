import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { formatIQD, reelPrice, tierOrder, tiers, tools, type Tier } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Badge, Note, RadioCard, ScrollScreen, TopBar, ui } from '@/components/ui';
import { useStudio } from '@/state/studio';
import { useTheme } from '@/theme/theme';

// "كيف بدك ريلك؟" — three quality levels, each with its price, what it
// includes, and a link to the full receipt of the AI work behind it.
export default function QualityScreen() {
  const { c } = useTheme();
  const { draft, updateDraft } = useStudio();

  return (
    <ScrollScreen
      header={<TopBar title="كيف بدك ريلك؟" subtitle={draft.title} />}
      footer={
        <>
          <View style={ui.between}>
            <AppText size={13} color={c.muted}>
              {tiers[draft.tier].name} · جاهز خلال {tiers[draft.tier].deliveryHours} ساعات
            </AppText>
            <AppText weight="semibold" size={17} style={ui.tabular}>
              {formatIQD(reelPrice(draft.tier))}
            </AppText>
          </View>
          <Button label="التالي: النشر" onPress={() => router.push('/reel/publish')} />
        </>
      }>
      <AppText size={13.5} color={c.muted} lineHeight={21}>
        اختر مستوى المونتاج. السعر هو كلفة أدوات الذكاء الاصطناعي المستخدمة فعلًا، مضافًا إليها رسوم الخدمة، ويمكنك رؤية التفاصيل لكل مستوى.
      </AppText>

      {tierOrder.map((id) => (
        <TierCard key={id} id={id} selected={draft.tier === id} onSelect={() => updateDraft({ tier: id })} />
      ))}

      <Note icon="shield">تُخصم القيمة عند موافقتك على الريل النهائي فقط. إذا لم يعجبك، نعيد المونتاج مرة مجانًا.</Note>
    </ScrollScreen>
  );
}

function TierCard({ id, selected, onSelect }: { id: Tier; selected: boolean; onSelect: () => void }) {
  const { c } = useTheme();
  const tier = tiers[id];
  const usedTools = [...new Set(tier.items.flatMap((i) => i.tools))].map((t) => tools[t].name);

  return (
    <RadioCard selected={selected} onPress={onSelect} label={`${tier.name}، ${formatIQD(reelPrice(id))}`}>
      <View style={styles.head}>
        <View style={ui.flex}>
          <View style={styles.titleRow}>
            <AppText weight="semibold" size={16}>
              {tier.name}
            </AppText>
            {id === 'pro' && <Badge label="الأكثر طلبًا" tone="acc" />}
          </View>
          <AppText size={12.5} color={c.muted}>
            {tier.summary}
          </AppText>
        </View>
        <AppText weight="semibold" size={16} style={ui.tabular}>
          {formatIQD(reelPrice(id))}
        </AppText>
      </View>

      <View style={styles.specs}>
        <Spec icon="clock" label={`خلال ${tier.deliveryHours} ساعات`} />
        <Spec icon="video" label={tier.resolution} />
        <Spec icon="layers" label={`${tier.items.length} مراحل`} />
      </View>

      <AppText size={12} color={c.placeholder} numberOfLines={2}>
        {usedTools.join(' · ')}
      </AppText>

      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`ليش هالسعر؟ ${tier.name}`}
        onPress={() => router.push({ pathname: '/reel/receipt', params: { tier: id } })}
        style={styles.why}>
        <Icon name="receipt" color={c.primary} size={16} />
        <AppText weight="medium" size={13} color={c.primary}>
          ليش هالسعر؟
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
