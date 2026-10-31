import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { formatIQD, platformNames } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Appear, Avatar, Badge, Card, ListRow, Note, PageTitle, PlatformTag, ScrollScreen, Segmented, Stat, ui } from '@/components/ui';
import { tagTone } from '@/features/inbox/tags';
import { collabs, conversations, tagLabels, type Collab } from '@/mock/data';
import { useSession } from '@/state/session';
import { useTheme } from '@/theme/theme';

export default function InboxTab() {
  const { accountType } = useSession();
  return accountType === 'creator' ? <Collabs /> : <Inbox />;
}

type Filter = 'all' | 'needsStaff' | 'newOrder' | 'fromAd';

function Inbox() {
  const { c } = useTheme();
  const [filter, setFilter] = useState<Filter>('all');
  const shown = filter === 'all' ? conversations : conversations.filter((x) => x.tag === filter);

  return (
    <ScrollScreen inTabs>
      <PageTitle title="الرسائل" subtitle="واتساب، إنستغرام، فيسبوك وماسنجر في مكان واحد" />

      <Card>
        <View style={styles.stats}>
          <Stat label="رد المساعد" value="38" delta="رسالة اليوم" good />
          <Stat label="زمن الرد" value="40 ث" delta="متوسط" good />
          <Stat label="طلبات مسجلة" value="11" delta="من المحادثات" good />
        </View>
      </Card>

      <Card onPress={() => router.push('/test-chat')} accessibilityLabel="جرّب الرد على زبون" style={styles.try}>
        <View style={[styles.tryIcon, { backgroundColor: c.priSoft }]}>
          <Icon name="sparkle" color={c.onPriSoft} size={17} />
        </View>
        <View style={ui.flex}>
          <AppText weight="medium" size={14.5}>
            جرّب الرد على زبون
          </AppText>
          <AppText size={12.5} color={c.muted}>
            اكتب كأنك زبون وشوف كيف يرد المساعد ويسجّل الطلب
          </AppText>
        </View>
        <Icon name="chevronLeft" color={c.placeholder} size={18} />
      </Card>

      <Segmented
        options={[
          { value: 'all', label: 'الكل' },
          { value: 'needsStaff', label: 'تحتاجك' },
          { value: 'newOrder', label: 'طلبات' },
          { value: 'fromAd', label: 'من إعلان' },
        ]}
        value={filter}
        onChange={setFilter}
      />

      <Card style={styles.list}>
        {shown.length === 0 && (
          <AppText size={13.5} color={c.muted} center style={styles.empty}>
            لا توجد محادثات هنا الآن.
          </AppText>
        )}
        {shown.map((x, i) => (
          <Appear key={x.id} order={i}>
            <ListRow
              leading={
                <View>
                  <Avatar name={x.name} size={42} />
                  <View style={styles.platform}>
                    <PlatformTag platform={x.platform} size={18} />
                  </View>
                </View>
              }
              title={x.name}
              subtitle={x.lastMessage}
              trailing={
                <View style={styles.trail}>
                  <AppText size={11.5} color={c.placeholder} style={ui.tabular}>
                    {x.time}
                  </AppText>
                  <Badge label={tagLabels[x.tag]} tone={tagTone[x.tag]} />
                  {x.unread > 0 && (
                    <View style={[styles.unread, { backgroundColor: c.primary }]}>
                      <AppText size={10.5} weight="semibold" color={c.onPrimary}>
                        {x.unread}
                      </AppText>
                    </View>
                  )}
                </View>
              }
              chevron={false}
              onPress={() => router.push({ pathname: '/conversation/[id]', params: { id: x.id } })}
              last={i === shown.length - 1}
            />
          </Appear>
        ))}
      </Card>

      <Note icon="shield">المساعد يحوّل لك أي محادثة فيها شكوى، تعديل طلب، أو سؤال لا يعرف جوابه، ولا يعد الزبون بشيء خارج قائمتك.</Note>
      <AppText size={11.5} color={c.placeholder} center>
        بيانات تجريبية · {conversations.length} محادثات من {[...new Set(conversations.map((x) => platformNames[x.platform]))].length} منصات
      </AppText>
    </ScrollScreen>
  );
}

function Collabs() {
  const { c } = useTheme();
  const [state, setState] = useState<Record<string, Collab['status']>>({});
  const status = (k: Collab) => state[k.id] ?? k.status;
  const active = collabs.filter((k) => status(k) !== 'done');
  const done = collabs.filter((k) => status(k) === 'done');
  const earned = collabs.filter((k) => status(k) !== 'new').reduce((s, k) => s + k.price, 0);

  return (
    <ScrollScreen inTabs>
      <PageTitle title="التعاونات" subtitle="عروض من محلات ومطاعم تريد العمل معك" />
      <Card>
        <View style={styles.stats}>
          <Stat label="عروض جديدة" value={String(active.filter((k) => status(k) === 'new').length)} />
          <Stat label="دخل هذا الشهر" value={formatIQD(earned)} />
        </View>
      </Card>

      {active.map((k) => (
        <Card key={k.id}>
          <View style={ui.between}>
            <AppText weight="semibold" size={15.5}>
              {k.brand}
            </AppText>
            <AppText weight="semibold" size={15} style={ui.tabular}>
              {formatIQD(k.price)}
            </AppText>
          </View>
          <AppText size={13} color={c.muted}>
            {k.scope} · {k.deadline}
          </AppText>
          {status(k) === 'new' ? (
            <View style={styles.actions}>
              <Button label="اقبل" height={42} style={ui.flex} onPress={() => setState((s) => ({ ...s, [k.id]: 'accepted' }))} />
              <Button label="اعتذر" variant="secondary" height={42} style={ui.flex} onPress={() => setState((s) => ({ ...s, [k.id]: 'done' }))} />
            </View>
          ) : (
            <Badge label="مقبول · أضفناه لخطة التصوير" tone="ok" icon="check" />
          )}
        </Card>
      ))}

      {done.length > 0 && (
        <Card style={styles.list}>
          {done.map((k, i) => (
            <ListRow key={k.id} icon="handshake" title={k.brand} subtitle={k.scope} trailing={formatIQD(k.price)} last={i === done.length - 1} />
          ))}
        </Card>
      )}
      <Note>المبلغ يُحوَّل لك بعد نشر المحتوى وتأكيد صاحب العرض. نسبة المنصة 10%.</Note>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 12 },
  list: { paddingVertical: 2, gap: 0 },
  empty: { paddingVertical: 24 },
  platform: { position: 'absolute', bottom: -2, end: -4 },
  trail: { alignItems: 'flex-end', gap: 4 },
  unread: { minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  try: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tryIcon: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
