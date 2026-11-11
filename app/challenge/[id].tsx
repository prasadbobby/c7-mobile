import { router, useLocalSearchParams } from 'expo-router';
import { Award, CalendarDays, Check, Share2, Users } from 'lucide-react-native';
import { useMemo } from 'react';
import { Share, StyleSheet, View } from 'react-native';
import Animated, { makeMutable, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { challenges, leaderboard } from '@/data';
import { ease, gsap, Parallax, Reveal, ScrollReveal, svStagger, svTo, useScrollY, useStagger, useTimeline } from '@/motion';
import { kindIcon } from '@/shared';
import { useApp } from '@/store';
import { colors, font } from '@/theme';
import { Avatar, BackButton, Card, FadeBottom, haptic, IconButton, Img, InfoPill, PrimaryButton, PulseDot, RankBadge, SectionHeader, Txt } from '@/ui';

const HERO = 380;

export default function ChallengeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = challenges.find((x) => x.id === id) ?? challenges[0]!;
  const insets = useSafeAreaInsets();
  const st = useApp();
  const joined = st.joinedChallenges.includes(c.id);
  const done = st.challengeProgress[c.id] ?? 0;
  const finished = done >= c.days;
  const { y, onScroll } = useScrollY();
  const r = useStagger(3, { delay: 0.1 });
  const Icon = kindIcon[c.kind];

  // GSAP: day cells cascade in, completed ones fill lime.
  const cells = useMemo(() => Array.from({ length: c.days }, () => makeMutable(0)), [c.days]);
  useTimeline((tl) => {
    cells.forEach((v) => (v.value = 0));
    tl.add(svStagger(cells, { duration: 0.5, ease: ease.pop, stagger: { each: 0.03, grid: [Math.ceil(c.days / 7), 7], from: 'start' } as gsap.StaggerVars }), 0.3);
  }, [c.id]);

  const burst = useSharedValue(0);
  const burstA = useAnimatedStyle(() => ({ opacity: 1 - burst.value, transform: [{ scale: 0.5 + burst.value * 2.5 }] }));
  const checkIn = () => {
    if (!joined) return st.joinChallenge(c.id);
    if (finished) return;
    st.checkInChallenge(c.id);
    haptic('success');
    burst.value = 0;
    const cell = cells[done];
    const tl = gsap.timeline();
    tl.add(svTo(burst, 1, { duration: 0.8, ease: 'power2.out' }));
    if (cell) {
      cell.value = 0;
      tl.add(svTo(cell, 1, { duration: 0.7, ease: ease.spring }), 0);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}>
        <View style={{ height: HERO, overflow: 'hidden', borderBottomLeftRadius: 40, borderBottomRightRadius: 40 }}>
          <Parallax y={y} height={HERO} style={StyleSheet.absoluteFill}>
            <Img source={c.image} style={StyleSheet.absoluteFill} />
          </Parallax>
          <FadeBottom />
          <View style={{ position: 'absolute', left: 20, right: 20, bottom: 22 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon size={16} color={colors.primary} />
              <Txt v="overline" color={colors.primary}>
                {c.kind} challenge
              </Txt>
            </View>
            <Txt v="h1" style={{ marginTop: 6 }}>
              {c.subtitle}
            </Txt>
          </View>
        </View>
        <View style={{ position: 'absolute', top: insets.top + 8, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between' }}>
          <BackButton />
          <IconButton icon={Share2} label="Invite friends" onPress={() => Share.share({ message: `Join me on the ${c.subtitle} challenge in PulseFit!` })} />
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
          <Reveal p={r[0]!} style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <InfoPill icon={CalendarDays} label={`${c.days} days`} />
            <InfoPill icon={Users} label={`${(c.participants / 1000).toFixed(1)}k`} />
            <InfoPill icon={Award} label={c.reward.split(' ')[0] + ' Badge'} />
          </Reveal>

          <Reveal p={r[1]!} style={{ marginTop: 22 }}>
            <Card style={{ padding: 18 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <Txt v="h3">Your progress</Txt>
                <Txt style={{ fontFamily: font.light, fontSize: 28, color: colors.primary }}>
                  {done}
                  <Txt v="small" color={colors.textMuted}>
                    /{c.days}
                  </Txt>
                </Txt>
              </View>
              <Txt v="small" color={colors.textMuted} style={{ marginTop: 4 }}>
                Daily: {c.daily}
              </Txt>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
                {cells.map((p, k) => (
                  <DayCell key={k} p={p} n={k + 1} state={k < done ? 'done' : k === done && joined ? 'today' : 'todo'} />
                ))}
              </View>
            </Card>
          </Reveal>

          <ScrollReveal y={y} offset={HERO} style={{ marginTop: 24 }}>
            <Txt v="h3">How it works</Txt>
            {[`Complete “${c.daily.toLowerCase()}” each day.`, 'Check in before midnight to keep your streak.', `Finish all ${c.days} days to earn ${c.reward}.`].map((t, k) => (
              <View key={k} style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
                  <Txt v="caption" color={colors.primary}>
                    {k + 1}
                  </Txt>
                </View>
                <Txt color={colors.textMuted} style={{ flex: 1 }}>
                  {t}
                </Txt>
              </View>
            ))}
          </ScrollReveal>

          <ScrollReveal y={y} offset={HERO} style={{ marginTop: 26 }}>
            <SectionHeader title="Top challengers" style={{ paddingHorizontal: 0 }} action={<Txt v="small" color={colors.primary} onPress={() => router.push('/leaderboard')}>Leaderboard</Txt>} />
            {leaderboard.workout.slice(0, 3).map((u, k) => (
              <Card key={u.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 10, paddingVertical: 12 }}>
                <Avatar source={u.avatar} size={46} badge={<RankBadge n={k + 1} />} />
                <Txt style={{ flex: 1 }}>{u.name}</Txt>
                <Txt v="small" color={colors.textMuted}>
                  Day {c.days - k}
                </Txt>
              </Card>
            ))}
          </ScrollReveal>
        </View>
      </Animated.ScrollView>

      <View style={{ position: 'absolute', left: 20, right: 20, bottom: insets.bottom + 16 }}>
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', alignSelf: 'center', top: 0, width: 58, height: 58, borderRadius: 29, borderWidth: 3, borderColor: colors.primary }, burstA]} />
        <PrimaryButton title={!joined ? 'Join challenge' : finished ? 'Completed 🎉' : `Check in · Day ${done + 1}`} icon={joined && !finished ? Check : undefined} disabled={finished} onPress={checkIn} />
      </View>
    </View>
  );
}

function DayCell({ p, n, state }: { p: SharedValue<number>; n: number; state: 'done' | 'today' | 'todo' }) {
  const a = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ scale: 0.5 + p.value * 0.5 }] }));
  return (
    <Animated.View style={[{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: state === 'done' ? colors.primary : colors.secondary, borderWidth: state === 'today' ? 2 : 0, borderColor: colors.primary }, a]}>
      {state === 'done' ? <Check size={18} color={colors.onPrimary} strokeWidth={3} /> : <Txt v="small" color={state === 'today' ? colors.primary : colors.textMuted}>{n}</Txt>}
      {state === 'today' && <PulseDot color={colors.primary} style={{ position: 'absolute', top: -2, right: -2, transform: [{ scale: 0.7 }] }} />}
    </Animated.View>
  );
}

