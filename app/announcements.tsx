import { ArrowUpRight, Pin } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAnnouncements, useReadAllAnnouncements, useReadAnnouncement, type Announcement, type AnnouncementKind } from '@/api/gym';
import { ago, KIND } from '@/announce';
import { Empty, Label, Page, Tabs } from '@/gymui';
import { colors, font } from '@/theme';
import { Img, Press, Sheet, Skeleton, Txt } from '@/ui';

const FILTERS: { id: 'ALL' | AnnouncementKind; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'CLOSURE', label: 'Timings' },
  { id: 'EVENT', label: 'Event' },
  { id: 'OFFER', label: 'Offer' },
  { id: 'PAYMENT', label: 'Payment' },
  { id: 'GENERAL', label: 'Updates' },
];

/** Lovable "Announcements": an editorial feed — pinned first, type tags, unread dots, full note in a sheet. */
export default function Announcements() {
  const q = useAnnouncements();
  const read = useReadAnnouncement();
  const readAll = useReadAllAnnouncements();
  const [f, setF] = useState<(typeof FILTERS)[number]['id']>('ALL');
  const [open, setOpen] = useState<Announcement | null>(null);
  const list = (q.data?.announcements ?? []).filter((a) => f === 'ALL' || a.kind === f);
  const unread = q.data?.unread ?? 0;
  const show = (a: Announcement) => {
    setOpen(a);
    if (!a.read) read.mutate(a.id);
  };
  return (
    <Page
      title="Announcements"
      error={q.error}
      onRetry={() => q.refetch()}
      onRefresh={() => q.refetch()}
      refreshing={q.isRefetching}
      right={
        unread ? (
          <Txt v="small" color={colors.primary} onPress={() => readAll.mutate()} accessibilityRole="button" style={{ width: 64, textAlign: 'right' }}>
            Read all
          </Txt>
        ) : undefined
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingTop: 14 }}>
        <Txt style={{ fontFamily: font.light, fontSize: 36, lineHeight: 42 }} accessibilityRole="header">
          Studio notes.
        </Txt>
        <Txt style={{ fontSize: 12, letterSpacing: 1 }} color={unread ? colors.primary : colors.textMuted}>
          {unread ? `${unread} NEW` : 'ALL READ'}
        </Txt>
      </View>
      <Txt v="caption" color={colors.textMuted} style={{ marginTop: 6 }}>
        From the people behind your progress.
      </Txt>
      <View style={{ marginTop: 18 }}>
        <Tabs value={f} onChange={setF} options={FILTERS} />
      </View>

      {!q.data ? (
        <Skeleton height={220} style={{ marginTop: 18 }} />
      ) : list.length === 0 ? (
        <Empty art="announcements" title={f === 'ALL' ? 'Nothing new from the studio' : 'Nothing in this category'} body="Timings, events, offers and payment reminders from C7 show up here." />
      ) : (
        <View style={{ marginTop: 22 }}>
          {list.map((a) => {
            const k = KIND[a.kind];
            return (
              <View key={a.id} style={{ marginBottom: 24, paddingBottom: 24, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border, borderLeftWidth: a.pinned ? 2 : 0, borderLeftColor: colors.primary, paddingLeft: a.pinned ? 14 : 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ borderWidth: 1, borderColor: k.tone, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>
                    <Txt style={{ fontSize: 10 }} color={k.tone}>
                      {a.personal ? 'For you' : FILTERS.find((x) => x.id === a.kind)?.label ?? k.label}
                    </Txt>
                  </View>
                  <View style={{ flex: 1 }} />
                  {!!a.pinned && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Pin size={11} color={colors.textMuted} />
                      <Txt style={{ fontSize: 9, letterSpacing: 0.8 }} color={colors.textMuted}>
                        PINNED
                      </Txt>
                    </View>
                  )}
                  {!a.read && <View accessibilityLabel="Unread" style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary }} />}
                </View>
                <Press onPress={() => show(a)} scaleTo={0.99} accessibilityLabel={a.title} style={{ marginTop: 12 }}>
                  <Txt style={{ fontFamily: font.light, fontSize: 26, lineHeight: 31 }}>{a.title}</Txt>
                  <Txt v="caption" color={colors.textMuted} style={{ marginTop: 10, lineHeight: 20 }} numberOfLines={3}>
                    {a.body}
                  </Txt>
                </Press>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
                  <Label style={{ fontSize: 9 }}>{`${new Date(a.publishedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} · ${ago(a.publishedAt)}`}</Label>
                  <ArrowUpRight size={16} color={colors.textMuted} />
                </View>
              </View>
            );
          })}
        </View>
      )}

      <Sheet open={!!open} onClose={() => setOpen(null)} title={open ? (open.personal ? 'For you' : KIND[open.kind].label) : ''}>
        {!!open && (
          <View>
            <Label color={colors.primary}>{new Date(open.publishedAt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long' })}</Label>
            <Txt style={{ fontFamily: font.light, fontSize: 28, lineHeight: 34, marginTop: 10 }}>{open.title}</Txt>
            <Txt v="small" color={colors.textMuted} style={{ marginTop: 14, lineHeight: 22 }}>
              {open.body}
            </Txt>
            {!!open.imageUrl && <Img source={open.imageUrl} style={{ height: 180, borderRadius: 12, marginTop: 14 }} />}
            {!!open.expiresAt && (
              <Txt v="caption" color={colors.textMuted} style={{ marginTop: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border }}>
                Until {new Date(open.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </Txt>
            )}
          </View>
        )}
      </Sheet>
    </Page>
  );
}
