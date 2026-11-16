import { router } from 'expo-router';
import { ArrowUpRight, Bell, ChevronRight, LogOut } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useAnnouncements } from '@/api/gym';
import { useMe } from '@/api/hooks';
import { useSession } from '@/api/session';
import { Headline, Label, Page } from '@/gymui';
import { PackageList } from '@/packages';
import { colors } from '@/theme';
import { Avatar, IconButton, Press, Txt } from '@/ui';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning,' : h < 17 ? 'Good afternoon,' : 'Good evening,';
};

/** Lovable "Guest home": greeting, one big statement, packages as tickets, a studio note. */
export default function GuestHome() {
  const me = useMe();
  const session = useSession();
  const ann = useAnnouncements();
  const u = me.data?.user;
  const note = ann.data?.announcements[0];
  return (
    <Page back={false} title="C7 Personal Fitness" right={<IconButton icon={LogOut} label="Log out" tint={colors.card} onPress={() => session.signOut().then(() => router.replace('/login'))} />} onRefresh={() => (me.refetch(), ann.refetch())} refreshing={me.isRefetching}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 }}>
        <Avatar source={u?.imageUrl} name={`${u?.firstName ?? ''} ${u?.lastName ?? ''}`} size={46} ring={false} />
        <View style={{ flex: 1 }}>
          <Label>{greeting()}</Label>
          <Txt v="bodyLg" style={{ marginTop: 2 }}>{u ? `${u.firstName} ${u.lastName}`.trim() : ' '}</Txt>
        </View>
        <Press onPress={() => router.push('/announcements')} accessibilityLabel="Announcements" style={{ padding: 10 }}>
          <Bell size={20} color={colors.text} />
          {!!ann.data?.unread && <View style={{ position: 'absolute', right: 9, top: 8, width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary }} />}
        </Press>
      </View>

      <View style={{ paddingTop: 36, paddingBottom: 32 }}>
        <Label>Your next chapter / 01</Label>
        <View style={{ marginTop: 14 }}>
          <Headline lead="You showed up." tail={'Now get\nstronger.'} tone="lime" size={44} />
        </View>
        <View style={{ marginTop: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border, paddingTop: 14 }}>
          <Txt v="caption" color={colors.textMuted}>
            A plan. A coach. Your kind of pace.
          </Txt>
          <ArrowUpRight size={20} color={colors.primary} />
        </View>
      </View>

      <PackageList />

      {!!note && (
        <Press onPress={() => router.push('/announcements')} accessibilityLabel={note.title} style={{ marginTop: 22, flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border, paddingVertical: 14 }}>
          <View style={{ width: 2, height: 26, backgroundColor: colors.primary }} />
          <View style={{ flex: 1 }}>
            <Label color={colors.primary}>Studio note</Label>
            <Txt v="caption" style={{ marginTop: 3 }} numberOfLines={2}>
              {note.title} — {note.body}
            </Txt>
          </View>
          <ChevronRight size={16} color={colors.textMuted} />
        </Press>
      )}
    </Page>
  );
}
