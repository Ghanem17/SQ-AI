import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { platformNames, type Platform } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Icon, type IconName } from '@/components/Icon';
import { Badge, Card, ListRow, Note, PageTitle, PlatformTag, ScrollScreen, SectionTitle, ui } from '@/components/ui';
import { useSession } from '@/state/session';
import { useTheme } from '@/theme/theme';

const channels: Platform[] = ['whatsapp', 'instagram', 'facebook', 'messenger'];

export default function InboxTab() {
  const { accountType } = useSession();
  return accountType === 'creator' ? <Collabs /> : <Inbox />;
}

function Empty({ icon, title, body }: { icon: IconName; title: string; body: string }) {
  const { c } = useTheme();
  return (
    <Card style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: c.tile }]}>
        <Icon name={icon} color={c.muted} size={22} />
      </View>
      <AppText weight="semibold" size={15} center>
        {title}
      </AppText>
      <AppText size={13} color={c.muted} center lineHeight={20}>
        {body}
      </AppText>
    </Card>
  );
}

function TryCard() {
  const { c } = useTheme();
  return (
    <Card onPress={() => router.push('/test-chat')} accessibilityLabel="جرّب الرد على زبون" style={styles.try}>
      <View style={[styles.tryIcon, { backgroundColor: c.priSoft }]}>
        <Icon name="sparkle" color={c.onPriSoft} size={17} />
      </View>
      <View style={ui.flex}>
        <AppText weight="medium" size={14.5}>
          جرّب الرد على زبون
        </AppText>
        <AppText size={12.5} color={c.muted}>
          اكتب كأنك زبون وشوف كيف يرد المساعد من معلومات محلك
        </AppText>
      </View>
      <Icon name="chevronLeft" color={c.placeholder} size={18} />
    </Card>
  );
}

function Inbox() {
  const { businessInfo } = useSession();
  return (
    <ScrollScreen inTabs>
      <PageTitle title="الرسائل" subtitle="واتساب وإنستغرام وفيسبوك وماسنجر في مكان واحد" />
      <Empty icon="chat" title="لا توجد رسائل بعد" body="بعد ربط حساباتك تصل رسائل الزبائن هنا، ويرد عليها المساعد ويسجّل الطلبات ويحوّل لك ما يحتاج تدخلك." />
      <TryCard />
      {!businessInfo.trim() && (
        <Note icon="info">قبل التجربة، اكتب أصنافك وأسعارك في «معلومات المحل» من الإعدادات، حتى يرد المساعد بمعلومات صحيحة.</Note>
      )}
      <SectionTitle title="القنوات" />
      <Card style={styles.list}>
        {channels.map((p, i) => (
          <ListRow
            key={p}
            leading={<PlatformTag platform={p} size={34} />}
            title={platformNames[p]}
            subtitle="يُربط عند تشغيل السيرفر"
            trailing={<Badge label="غير مربوط" />}
            last={i === channels.length - 1}
          />
        ))}
      </Card>
    </ScrollScreen>
  );
}

function Collabs() {
  return (
    <ScrollScreen inTabs>
      <PageTitle title="التعاونات" subtitle="عروض من محلات ومطاعم تريد العمل معك" />
      <Empty
        icon="handshake"
        title="لا توجد عروض بعد"
        body="عندما يطلب محل تعاونًا معك يصل العرض هنا بالسعر والموعد، وتقبله أو تعتذر بضغطة."
      />
      <Note>اكتب مجالك وجمهورك في «عن محتواك» من الإعدادات، حتى تظهر للمحلات المناسبة.</Note>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', paddingVertical: 26, gap: 8 },
  emptyIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  try: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tryIcon: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  list: { paddingVertical: 2, gap: 0 },
});
