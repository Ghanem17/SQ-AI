import { router } from 'expo-router';

import { platformNames, type Platform } from '@sq/shared';
import { Badge, EmptyState, GroupLabel, ListCard, ListRow, Note, PlatformTag, ScrollScreen, TopBar } from '@/components/ui';
import { useI18n } from '@/i18n';
import { useSession } from '@/state/session';

const channels: Platform[] = ['whatsapp', 'instagram', 'facebook', 'messenger'];

// Customer messages from every channel. Creators get collaboration offers.
export default function InboxScreen() {
  const { accountType } = useSession();
  return accountType === 'creator' ? <Collabs /> : <Inbox />;
}

function TryRow() {
  const { L } = useI18n();
  return (
    <ListCard>
      <ListRow
        icon="sparkle"
        iconTone="solid"
        title={L('جرّب الرد على عميل', 'Try answering a customer')}
        subtitle={L('اكتب كأنك عميل وشاهد كيف يرد المساعد من معلومات نشاطك', 'Write as a customer and see how the assistant answers from your business details')}
        subtitleLines={2}
        onPress={() => router.push('/test-chat')}
        last
      />
    </ListCard>
  );
}

function Inbox() {
  const { businessInfo } = useSession();
  const { L, pick } = useI18n();
  return (
    <ScrollScreen header={<TopBar title={L('الرسائل', 'Messages')} subtitle={L('واتساب وإنستغرام وفيسبوك وماسنجر', 'WhatsApp, Instagram, Facebook and Messenger')} />}>
      <EmptyState
        icon="chat"
        title={L('لا توجد رسائل بعد', 'No messages yet')}
        body={L(
          'بعد ربط حساباتك تصل رسائل العملاء إلى هنا، فيرد عليها المساعد ويسجّل الطلبات ويحيل إليك ما يحتاج إلى تدخلك.',
          'Once your accounts are linked, customer messages arrive here. The assistant answers, logs orders and hands you anything that needs you.',
        )}
      />
      <TryRow />
      {!businessInfo.trim() && (
        <Note tone="info">
          {L(
            'قبل التجربة، اكتب أصنافك وأسعارك في «معلومات النشاط» من حسابي، ليرد المساعد بمعلومات صحيحة.',
            'Before trying, add your items and prices under "About your business" in Account so the assistant answers correctly.',
          )}
        </Note>
      )}
      <GroupLabel title={L('القنوات', 'Channels')} />
      <ListCard>
        {channels.map((p, i) => (
          <ListRow
            key={p}
            leading={<PlatformTag platform={p} size={40} />}
            title={pick(platformNames[p])}
            subtitle={L('يُربط عند تشغيل الخادم', 'Links once the server runs')}
            trailing={<Badge label={L('غير مربوط', 'Not linked')} />}
            last={i === channels.length - 1}
          />
        ))}
      </ListCard>
    </ScrollScreen>
  );
}

function Collabs() {
  const { L } = useI18n();
  return (
    <ScrollScreen header={<TopBar title={L('التعاونات', 'Collaborations')} subtitle={L('عروض من متاجر ومطاعم', 'Offers from shops and restaurants')} />}>
      <EmptyState
        icon="handshake"
        title={L('لا توجد عروض بعد', 'No offers yet')}
        body={L(
          'عندما يطلب متجر التعاون معك يصل العرض إلى هنا بالسعر والموعد، فتقبله أو تعتذر بضغطة واحدة.',
          'When a shop asks to work with you, the offer arrives here with the price and date. Accept or decline with one tap.',
        )}
      />
      <Note>
        {L(
          'اكتب مجالك وجمهورك في «عن محتواك» من حسابي، لتظهر للمتاجر المناسبة.',
          'Describe your niche and audience under "About your content" in Account so the right shops find you.',
        )}
      </Note>
    </ScrollScreen>
  );
}
