import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import type { Announcement, AnnouncementKind } from './api/gym';
import { Tag } from './gymui';
import { colors, radius } from './theme';
import { Img, Press, Txt } from './ui';

export const KIND: Record<AnnouncementKind, { label: string; tone: string }> = {
  GENERAL: { label: 'Update', tone: colors.textMuted },
  EVENT: { label: 'Event', tone: colors.protein },
  OFFER: { label: 'Offer', tone: colors.primary },
  PAYMENT: { label: 'Payment', tone: colors.carbs },
  CLOSURE: { label: 'Timings', tone: colors.danger },
};

export const ago = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `${Math.max(1, m)}m ago`;
  if (m < 1440) return `${Math.round(m / 60)}h ago`;
  if (m < 10080) return `${Math.round(m / 1440)}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export function AnnouncementItem({ a, compact, onRead }: { a: Announcement; compact?: boolean; onRead?: (id: string) => void }) {
  const k = KIND[a.kind];
  return (
    <Press
      onPress={() => (onRead ? onRead(a.id) : router.push('/announcements'))}
      scaleTo={0.99}
      accessibilityLabel={a.title}
      style={{ backgroundColor: colors.card, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, padding: 16, gap: 8, borderLeftWidth: a.read ? StyleSheet.hairlineWidth : 3, borderLeftColor: a.read ? colors.border : k.tone }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Tag label={a.personal ? 'For you' : k.label} tone={k.tone} />
        {!!a.pinned && <Tag label="Pinned" />}
        <View style={{ flex: 1 }} />
        <Txt v="caption" color={colors.textDim}>
          {ago(a.publishedAt)}
        </Txt>
      </View>
      <Txt v={compact ? 'body' : 'bodyLg'} style={{ fontFamily: a.read ? undefined : 'Lexend_500Medium' }}>
        {a.title}
      </Txt>
      <Txt v="small" color={colors.textMuted} numberOfLines={compact ? 2 : undefined}>
        {a.body}
      </Txt>
      {!compact && !!a.imageUrl && <Img source={a.imageUrl} style={{ height: 160, borderRadius: 12, marginTop: 4 }} />}
    </Press>
  );
}
