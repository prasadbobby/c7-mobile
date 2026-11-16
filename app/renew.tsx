import { router } from 'expo-router';
import { Check, LockKeyhole, LogOut } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { inr, useAnnouncements, useInvoices } from '@/api/gym';
import { useMembership } from '@/api/hooks';
import { useSession } from '@/api/session';
import { Group, Headline, Label, NavRow, Numeral, Page } from '@/gymui';
import { PackageList } from '@/packages';
import { colors } from '@/theme';
import { IconButton, Txt } from '@/ui';
import { Megaphone, ReceiptText } from 'lucide-react-native';

const d = (s: string | null | undefined) => (s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase() : '—');

/** Lovable "Renew": a calm, finished meter — what's paused, what's still yours, and packages to renew. */
export default function Renew() {
  const ms = useMembership();
  const session = useSession();
  const inv = useInvoices();
  const ann = useAnnouncements();
  const m = ms.data;
  const days = m?.duration ?? (m?.startDate && m.endDate ? Math.round((new Date(m.endDate).getTime() - new Date(m.startDate).getTime()) / 86400000) : null);
  return (
    <Page back={false} title="Your membership" right={<IconButton icon={LogOut} label="Log out" tint={colors.card} onPress={() => session.signOut().then(() => router.replace('/login'))} />} onRefresh={() => ms.refetch()} refreshing={ms.isRefetching}>
      <View style={{ paddingTop: 20 }}>
        <Label>{days ? `${days}-day package / ended` : 'Package / ended'}</Label>
        <View style={{ marginTop: 14 }}>
          <Headline lead="Your package has ended." tail="Not the finish line." size={30} />
        </View>
        {days ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 30 }}>
              <Numeral size={72}>{days}</Numeral>
              <Txt style={{ fontSize: 22 }} color={colors.textMuted}>
                / {days} days
              </Txt>
              <View style={{ flex: 1 }} />
              <Check size={22} color={colors.primary} />
            </View>
            <View style={{ height: 6, backgroundColor: colors.primary, marginTop: 14, borderRadius: 1 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Label style={{ fontSize: 10 }}>{d(m?.startDate)}</Label>
              <Label style={{ fontSize: 10 }}>{d(m?.endDate)} · IST</Label>
            </View>
          </>
        ) : null}
        <View style={{ flexDirection: 'row', gap: 20, marginTop: 28, paddingVertical: 18, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <LockKeyhole size={12} color={colors.textMuted} />
              <Label>Paused</Label>
            </View>
            <Txt v="small" color={colors.textMuted} style={{ marginTop: 10, lineHeight: 24 }}>
              {'Coach workouts\nCheck-ins & challenges\nMeals & tracking'}
            </Txt>
          </View>
          <View style={{ flex: 1 }}>
            <Label color={colors.primary}>Still yours</Label>
            <Txt v="small" style={{ marginTop: 10, lineHeight: 24 }}>
              {'Your history & photos\nInvoices\nStudio announcements'}
            </Txt>
          </View>
        </View>
      </View>

      <View style={{ marginTop: 28 }}>
        <PackageList heading="Your next chapter" />
      </View>

      <Group style={{ marginTop: 26 }}>
        <NavRow icon={ReceiptText} title="Invoices" sub={inv.data?.totals.due ? `${inr(inv.data.totals.due)} due` : 'Past payments and receipts'} onPress={() => router.push('/invoices')} />
        <NavRow icon={Megaphone} title="Announcements" badge={ann.data?.unread} onPress={() => router.push('/announcements')} last />
      </Group>
    </Page>
  );
}
