import { router } from 'expo-router';
import { Award, Bookmark, ChevronRight, Dumbbell, EllipsisVertical, History, ListFilter, Scale, Settings, Trophy, Zap, type LucideIcon } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { achievements, images, workouts } from '@/data';
import { Parallax, Reveal, ScrollReveal, useCountUp, useScrollY, useStagger } from '@/motion';
import { useApp } from '@/store';
import { colors, font, radius } from '@/theme';
import { ActivityRow, Card, FadeBottom, IconButton, Img, SectionHeader, TAB_BAR_SPACE, Txt } from '@/ui';

const HERO = 560;
const tags = ['#IronPrincess', '#CompeteLikeAGirl', '#WellnessBabe', '#MuscleMood'];

export default function Profile() {
  const st = useApp();
  const insets = useSafeAreaInsets();
  const { y, onScroll } = useScrollY();
  const r = useStagger(4, { delay: 0.15, stagger: 0.1 });
  const followers = useCountUp(542);
  const last = st.workoutLog[0];
  const lastW = workouts.find((w) => w.id === last?.workoutId);

  const menu: { icon: LucideIcon; label: string; to: string; meta?: string }[] = [
    { icon: Scale, label: 'Body & weight', to: '/body', meta: `${st.weightKg}kg` },
    { icon: History, label: 'Workout history', to: '/history', meta: `${st.workoutLog.length}` },
    { icon: Trophy, label: 'Challenges', to: '/challenges', meta: `${st.joinedChallenges.length} active` },
    { icon: Award, label: 'Achievements', to: '/achievements', meta: `${achievements.filter((a) => a.earned).length}/${achievements.length}` },
    { icon: Bookmark, label: 'Saved', to: '/saved', meta: `${st.saved.length}` },
    { icon: Settings, label: 'Settings', to: '/settings' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }}>
        <View style={{ height: HERO }}>
          <Parallax y={y} height={HERO} style={StyleSheet.absoluteFill}>
            <Img source={images.profileEmma} style={StyleSheet.absoluteFill} contentPosition="top" />
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
                1,2k <Txt v="small">Following</Txt>
              </Txt>
            </View>
          </Reveal>
        </View>

        <Reveal p={r[1]!} style={{ alignItems: 'center', paddingHorizontal: 20, marginTop: 18 }}>
          <Txt v="h1" style={{ fontFamily: font.semibold }}>
            {st.name} Richardson
          </Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 8, maxWidth: 320 }}>
            {tags.map((t) => (
              <Txt key={t} color={colors.primary}>
                {t}
              </Txt>
            ))}
          </View>
        </Reveal>

        <Reveal p={r[2]!} style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginTop: 24 }}>
          {[
            { l: 'Age', v: st.age, u: 'y.o.' },
            { l: 'Weight', v: st.weightKg, u: 'kg' },
            { l: 'Height', v: st.heightCm, u: 'cm' },
            { l: 'Fat', v: 18, u: '%' },
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
          <SectionHeader overline title="Last Activity" action={<ListFilter size={22} color={colors.text} onPress={() => router.push('/history')} />} />
        </ScrollReveal>
        <ScrollReveal y={y} style={{ marginHorizontal: 20, marginTop: 12 }}>
          <ActivityRow icon={Dumbbell} tone="danger" title={lastW?.title ?? 'Workout'} time={last ? new Date(last.at).toDateString() : 'Yesterday at 8:00pm'} value={last?.minutes ?? 50} unit="/min" onPress={() => router.push('/history')} />
        </ScrollReveal>

        <ScrollReveal y={y} style={{ marginTop: 28 }}>
          <SectionHeader title="Badges" action={<Txt v="small" color={colors.primary} onPress={() => router.push('/achievements')}>See all</Txt>} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 20, marginTop: 14 }}>
            {achievements.map((a) => (
              <View key={a.id} style={{ width: 92, alignItems: 'center', gap: 8, opacity: a.earned ? 1 : 0.35 }}>
                <View style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: a.tone, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card }}>
                  <Award size={30} color={a.tone} />
                </View>
                <Txt v="caption" style={{ textAlign: 'center' }}>
                  {a.title}
                </Txt>
              </View>
            ))}
          </ScrollView>
        </ScrollReveal>

        <ScrollReveal y={y} style={{ marginHorizontal: 20, marginTop: 28 }}>
          <Card style={{ padding: 6 }}>
            {menu.map((m, i) => (
              <Pressable key={m.label} onPress={() => router.push(m.to as never)} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderTopWidth: i ? StyleSheet.hairlineWidth : 0, borderColor: colors.border }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' }}>
                  <m.icon size={20} color={colors.primary} strokeWidth={1.8} />
                </View>
                <Txt style={{ flex: 1 }}>{m.label}</Txt>
                {m.meta && (
                  <Txt v="small" color={colors.textMuted}>
                    {m.meta}
                  </Txt>
                )}
                <ChevronRight size={18} color={colors.textMuted} />
              </Pressable>
            ))}
          </Card>
        </ScrollReveal>
      </Animated.ScrollView>
    </View>
  );
}

const pill = { backgroundColor: 'rgba(28,33,29,0.92)', borderRadius: radius.pill, paddingHorizontal: 20, paddingVertical: 12, borderWidth: 1, borderColor: colors.border } as const;
