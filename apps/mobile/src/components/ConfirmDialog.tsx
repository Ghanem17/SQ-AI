import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { radius } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/theme';

// A small in-app confirmation, the same on the web and on phones.
export function ConfirmDialog({
  visible,
  title,
  body,
  confirm,
  cancel,
  danger,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  body?: string;
  confirm: string;
  cancel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { c, elev } = useTheme();
  const { rtl } = useI18n();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={[styles.wrap, { direction: rtl ? 'rtl' : 'ltr' }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={cancel} style={styles.backdrop} onPress={onCancel} />
        <View accessibilityViewIsModal style={[styles.card, { backgroundColor: c.card, borderColor: c.line }, elev.raised]}>
          <AppText variant="h3" accessibilityRole="header">
            {title}
          </AppText>
          {body && (
            <AppText variant="small" lineHeight={19} color={c.muted}>
              {body}
            </AppText>
          )}
          <View style={styles.actions}>
            <Button label={cancel} variant="secondary" height={46} style={styles.flex} onPress={onCancel} />
            <Button
              label={confirm}
              height={46}
              style={styles.flex}
              colors={danger ? { bg: c.bad, fg: c.card } : undefined}
              onPress={onConfirm}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(11,19,43,0.45)' },
  card: { width: '100%', maxWidth: 360, borderRadius: radius.card, borderWidth: 1, padding: 20, gap: 10 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  flex: { flex: 1 },
});
