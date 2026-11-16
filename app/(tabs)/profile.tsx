import { router } from 'expo-router';
import { Award, Bell, Bookmark, CalendarCheck, ChevronRight, Clapperboard, CreditCard, Dumbbell, EllipsisVertical, FileHeart, Gauge, History, Images, ListFilter, Megaphone, Package, ReceiptText, Scale, Settings, Trophy, Watch, Zap, type LucideIcon } from 'lucide-react-native';
import { useAnnouncements, useBmi, useInvoices } from '@/api/gym';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { dayLabel } from '@/api/dates';
import { useAchievements, useChallenges, useDashboard, useMe, useMeasurements, useMembership } from '@/api/hooks';
import { fullName } from '@/api/meta';
import { Badge } from '@/badges';
import { images } from '@/data';
import { Parallax, Reveal, ScrollReveal, useCountUp, useScrollY, useStagger } from '@/motion';
import { colors, font, radius } from '@/theme';
import { ActivityRow, Card, FadeBottom, IconButton, Img, SectionHeader, Skeleton, TAB_BAR_SPACE, Txt, HeroGlow } from '@/ui';

const HERO = 560;

export default function Profile() {
  const me = useMe();
  const dash = useDashboard();
  const ach = useAchievements();
  const invoices = useInvoices();
  const ann = useAnnouncements();
  const bmi = useBmi();
  const body = useMeasurements();
  const membership = useMembership();
  const challenges = useChallenges();
  const insets = useSafeAreaInsets();
  const { y, onScroll } = useScrollY();
  const r = useStagger(4, { delay: 0.15, stagger: 0.1 });
  const u = me.data?.user;
  const followers = useCountUp(me.data?.social.followers ?? 0);
  const last = dash.data?.recentActivity[0];
  const weight = body.data?.latest.WEIGHT?.value ?? u?.weight;
  const fat = body.data?.latest.BODY_FAT_PERCENTAGE?.value;
  const ms = membership.data;
  const msLabel = !ms?.hasValidMembership ? 'No plan' : ms.status === 'PAUSED' ? 'Paused' : ms.isExpired ? 'Expired' : `${ms.daysRemaining}d left`;

  const due = invoices.data?.totals.due ?? 0;
  const sections: { title: string; items: { icon: LucideIcon; label: string; to: string; meta?: string }[] }[] = [
    {
      title: 'Studio',
      items: [
        { icon: CreditCard, label: 'Membership & payments', to: '/membership', meta: msLabel },
        { icon: ReceiptText, label: 'Invoices', to: '/invoices', meta: due > 0 ? `₹${Math.round(due).toLocaleString('en-IN')} due` : invoices.data ? `${invoices.data.invoices.length}` : undefined },
        { icon: Package, label: 'Packages', to: '/packages' },
        { icon: CalendarCheck, label: 'Attendance', to: '/attendance' },
        { icon: Megaphone, label: 'Announcements', to: '/announcements', meta: ann.data?.unread ? `${ann.data.unread} new` : undefined },
      ],
    },
    {
      title: 'Health',
      items: [
        { icon: Scale, label: 'Body & measurements', to: '/body', meta: weight ? `${weight}kg` : undefined },
        { icon: Gauge, label: 'BMI & check-ups', to: '/bmi', meta: bmi.data?.bmi ? `${bmi.data.bmi}` : undefined },
        { icon: FileHeart, label: 'Medical reports', to: '/reports' },
        { icon: Images, label: 'Progress photos', to: '/photos' },
        { icon: Watch, label: 'Devices & steps', to: '/devices' },
      ],
    },
    {
      title: 'Training',
      items: [
        { icon: History, label: 'Workout history', to: '/history', meta: dash.data ? `${dash.data.cards.totalWorkouts}` : undefined },
        { icon: Clapperboard, label: 'Workout videos', to: '/videos' },
        { icon: Trophy, label: 'Challenges', to: '/challenges', meta: `${(challenges.data ?? []).filter((c) => c.access === 'enabled').length} active` },
        { icon: Award, label: 'Achievements', to: '/achievements', meta: ach.data ? `${ach.data.earned}/${ach.data.total}` : undefined },
        { icon: Bookmark, label: 'Saved', to: '/saved' },
      ],
    },
    {
      title: 'App',
      items: [
        { icon: Bell, label: 'Notifications', to: '/notifications' },
        { icon: Settings, label: 'Settings', to: '/settings' },
      ],
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}><HeroGlow />
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }}>
        <View style={{ height: HERO }}>
          <Parallax y={y} height={HERO} style={StyleSheet.absoluteFill}>
            <Img source={u?.imageUrl} fallback={images.onboarding} style={StyleSheet.absoluteFill} contentPosition="top" />
          </Parallax>
          <FadeBottom />
          <View style={{ position: 'absolute', top: insets.top + 8, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between' }}>
            <IconButton icon={<Zap size={26} color={colors.primary} />} label="Boost" style={{ borderWidth: 2, borderColor: colors.primary, width: 60, height: 60, borderRadius: 30 }} onPress={() => router.push('/streak')} />
            <IconButton icon={EllipsisVertical} label="More" onPress={() => router.push('/settings')} />
          </View>
          <Reveal p={r[0]!} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
            <View style={pill}>
              <Txt v="bodyLg">
                {followers} <Txt v="small">Followers</Txt>
              </Txt>
            </View>
            <View style={pill}>
              <Txt v="bodyLg">
                {me.data?.social.following ?? 0} <Txt v="small">Following</Txt>
              </Txt>
            </View>
          </Reveal>
        </View>

        <Reveal p={r[1]!} style={{ alignItems: 'center', paddingHorizontal: 20, marginTop: 18 }}>
          {u ? (
            <Txt v="h1" style={{ fontFamily: font.semibold, textAlign: 'center' }}>
              {fullName(u)}
            </Txt>
          ) : (
            <Skeleton height={36} width={220} />
          )}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 8, maxWidth: 320 }}>
            {!!u?.memberId && <Txt color={colors.primary}>#{u.memberId}</Txt>}
            {!!(u?.role && u.role !== 'USER') && <Txt color={colors.primary}>Coach</Txt>}
            {!!u && <Txt color={colors.textMuted}>Member since {new Date(u.memberSince).getFullYear()}</Txt>}
          </View>
        </Reveal>

        <Reveal p={r[2]!} style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginTop: 24 }}>
          {[
            { l: 'Age', v: u?.age ?? '—', u: u?.age ? 'y.o.' : '' },
            { l: 'Weight', v: weight ?? '—', u: weight ? 'kg' : '' },
            { l: 'Height', v: body.data?.latest.HEIGHT?.value ?? u?.height ?? '—', u: (body.data?.latest.HEIGHT?.value ?? u?.height) ? 'cm' : '' },
            { l: 'Fat', v: fat ?? '—', u: fat ? '%' : '' },
          ].map((m) => (
            <Pressable key={m.l} onPress={() => router.push('/body')} style={{ flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, padding: 14 }}>
              <Txt v="caption" color={colors.textMuted}>
                {m.l}
              </Txt>
              <Txt numberOfLines={1} adjustsFontSizeToFit style={{ fontFamily: font.light, fontSize: 24, marginTop: 6 }}>
                {m.v}
                <Txt v="caption">{m.u}</Txt>
              </Txt>
            </Pressable>
          ))}
        </Reveal>

        <ScrollReveal y={y} style={{ marginTop: 28 }}>
          <SectionHeader overline title="Last Activity" action={<Pressable accessibilityLabel="Workout history" hitSlop={10} onPress={() => router.push('/history')}><ListFilter size={22} color={colors.text} /></Pressable>} />
        </ScrollReveal>
        <ScrollReveal y={y} style={{ marginHorizontal: 20, marginTop: 12 }}>
          {last ? (
            <ActivityRow icon={Dumbbell} tone="danger" title={last.planName} time={dayLabel(last.date)} value={last.durationMinutes} unit="/min" onPress={() => router.push(`/history?log=${last.id}`)} />
          ) : (
            <Card>
              <Txt color={colors.textMuted}>No workouts yet — your first one will show up here.</Txt>
            </Card>
          )}
        </ScrollReveal>

        <ScrollReveal y={y} style={{ marginTop: 28 }}>
          <SectionHeader title="Badges" action={<Txt v="small" color={colors.primary} onPress={() => router.push('/achievements')}>See all</Txt>} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 20, marginTop: 14 }}>
            {(ach.data?.badges ?? []).map((a) => (
              <View key={a.id} style={{ width: 92, alignItems: 'center', gap: 8 }}>
                <Badge id={a.id} earned={a.earned} size={72} />
                <Txt v="caption" style={{ textAlign: 'center' }} color={a.earned ? colors.text : colors.textMuted}>
                  {a.title}
                </Txt>
              </View>
            ))}
          </ScrollView>
        </ScrollReveal>

        {sections.map((sec) => (
        <ScrollReveal key={sec.title} y={y} style={{ marginHorizontal: 20, marginTop: 28 }}>
          <Txt v="overline" color={colors.textDim} style={{ marginBottom: 10 }}>
            {sec.title}
          </Txt>
          <Card style={{ padding: 6 }}>
            {sec.items.map((m, i) => (
              <Pressable key={m.label} accessibilityRole="button" accessibilityLabel={m.label} onPress={() => router.push(m.to as never)} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderTopWidth: i ? StyleSheet.hairlineWidth : 0, borderColor: colors.border }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' }}>
                  <m.icon size={20} color={colors.primary} strokeWidth={1.8} />
                </View>
                <Txt style={{ flex: 1 }}>{m.label}</Txt>
                {!!m.meta && (
                  <Txt v="small" color={colors.textMuted}>
                    {m.meta}
                  </Txt>
                )}
                <ChevronRight size={18} color={colors.textMuted} />
              </Pressable>
            ))}
          </Card>
        </ScrollReveal>
        ))}
      </Animated.ScrollView>
    </View>
  );
}

const pill = { backgroundColor: 'rgba(28,33,29,0.92)', borderRadius: radius.pill, paddingHorizontal: 20, paddingVertical: 12, borderWidth: 1, borderColor: colors.border } as const;
