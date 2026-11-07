import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { platformNames, type Platform } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Icon, type IconName } from '@/components/Icon';
import { Badge, Card, ListRow, Note, PageTitle, PlatformTag, ScrollScreen, SectionTitle, ui } from '@/components/ui';
import { useI18n } from '@/i18n';
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
  const { L } = useI18n();
  return (
    <Card onPress={() => router.push('/test-chat')} accessibilityLabel={L('جرّب الرد على عميل', 'Try answering a customer')} style={styles.try}>
      <View style={[styles.tryIcon, { backgroundColor: c.priSoft }]}>
        <Icon name="sparkle" color={c.onPriSoft} size={17} />
      </View>
      <View style={ui.flex}>
        <AppText weight="medium" size={14.5}>
          {L('جرّب الرد على عميل', 'Try answering a customer')}
        </AppText>
        <AppText size={12.5} color={c.muted}>
          {L('اكتب كأنك عميل وشاهد كيف يرد المساعد من معلومات نشاطك', 'Write as a customer and see how the assistant answers from your business details')}
        </AppText>
      </View>
      <Icon name="chevronLeft" color={c.placeholder} size={18} />
    </Card>
  );
}

function Inbox() {
  const { businessInfo } = useSession();
  const { L, pick } = useI18n();
  return (
    <ScrollScreen inTabs>
      <PageTitle title={L('الرسائل', 'Messages')} subtitle={L('واتساب وإنستغرام وفيسبوك وماسنجر في مكان واحد', 'WhatsApp, Instagram, Facebook and Messenger in one place')} />
      <Empty
        icon="chat"
        title={L('لا توجد رسائل بعد', 'No messages yet')}
        body={L(
          'بعد ربط حساباتك تصل رسائل العملاء إلى هنا، فيرد عليها المساعد ويسجّل الطلبات ويحيل إليك ما يحتاج إلى تدخلك.',
          'Once your accounts are linked, customer messages arrive here. The assistant answers, logs orders and hands you anything that needs you.',
        )}
      />
      <TryCard />
      {!businessInfo.trim() && (
        <Note icon="info">
          {L(
            'قبل التجربة، اكتب أصنافك وأسعارك في «معلومات النشاط» من الإعدادات، ليرد المساعد بمعلومات صحيحة.',
            'Before trying, add your items and prices under "About your business" in Settings so the assistant answers correctly.',
          )}
        </Note>
      )}
      <SectionTitle title={L('القنوات', 'Channels')} />
      <Card style={styles.list}>
        {channels.map((p, i) => (
          <ListRow
            key={p}
            leading={<PlatformTag platform={p} size={34} />}
            title={pick(platformNames[p])}
            subtitle={L('يُربط عند تشغيل الخادم', 'Links once the server runs')}
            trailing={<Badge label={L('غير مربوط', 'Not linked')} />}
            last={i === channels.length - 1}
          />
        ))}
      </Card>
    </ScrollScreen>
  );
}

function Collabs() {
  const { L } = useI18n();
  return (
    <ScrollScreen inTabs>
      <PageTitle title={L('التعاونات', 'Collaborations')} subtitle={L('عروض من متاجر ومطاعم تريد العمل معك', 'Offers from shops and restaurants that want to work with you')} />
      <Empty
        icon="handshake"
        title={L('لا توجد عروض بعد', 'No offers yet')}
        body={L(
          'عندما يطلب متجر التعاون معك يصل العرض إلى هنا بالسعر والموعد، فتقبله أو تعتذر بضغطة واحدة.',
          'When a shop asks to work with you, the offer arrives here with the price and date. Accept or decline with one tap.',
        )}
      />
      <Note>
        {L(
          'اكتب مجالك وجمهورك في «عن محتواك» من الإعدادات، لتظهر للمتاجر المناسبة.',
          'Describe your niche and audience under "About your content" in Settings so the right shops find you.',
        )}
      </Note>
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
