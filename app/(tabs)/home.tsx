import { router } from 'expo-router';
import { Bike, ChevronRight, Dumbbell, Footprints, HeartPulse, PersonStanding, SlidersHorizontal, Trophy } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { activity, avatars, challenges, weekDays, workouts, type Category } from '@/data';
import { WaterIcon } from '@/icons';
import { Reveal, ScrollReveal, useCountUp, useScrollY, useStagger } from '@/motion';
import { useApp } from '@/store';
import { colors, font, radius, shadow } from '@/theme';
import { ActivityRow, Card, Chip, Greeting, Img, LimeGradient, MediaCard, PillButton, Press, Ring, Screen, SectionHeader, TAB_BAR_SPACE, Txt } from '@/ui';

const categories: { id: Category; label: string; icon: typeof HeartPulse }[] = [
  { id: 'warmup', label: 'Warm Up', icon: PersonStanding },
  { id: 'cardio', label: 'Cardio', icon: HeartPulse },
  { id: 'strength', label: 'Strength', icon: Dumbbell },
];
const dayProgress = [1, 0.4, 0.6, 0.35, 0, 1, 0];
const toneIcon = { walk: Footprints, workout: Dumbbell, cycle: Bike } as const;

export default function Home() {
  const st = useApp();
  const { y, onScroll } = useScrollY();
  const [day, setDay] = useState(3);
  const [cat, setCat] = useState<Category | 'all'>('all');
  const [desc, setDesc] = useState(true);
  const list = workouts.filter((w) => cat === 'all' || w.category === cat);
  const sorted = useMemo(() => [...activity].sort((a, b) => (desc ? b.value - a.value : a.value - b.value)), [desc]);
  const r = useStagger(5, { stagger: 0.09, delay: 0.05 });
  const cards = useStagger(list.length, { stagger: 0.07, duration: 0.6 }, [cat]);
  const steps = useCountUp(7890, { delay: 0.4 });
  const featured = challenges[0]!;
  const joined = st.joinedChallenges.includes(featured.id);

  return (
    <Screen>
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }}>
        <Reveal p={r[0]!}>
          <Greeting name={st.name} avatar={avatars.emma} />
        </Reveal>

        {/* New Challenge pill */}
        <Reveal p={r[1]!} scale={0.92} style={{ marginHorizontal: 20, marginTop: 26 }}>
          <Press onPress={() => router.push(`/challenge/${featured.id}`)} scaleTo={0.97} style={[{ borderRadius: radius.pill, overflow: 'hidden' }, shadow.card]}>
            <LimeGradient style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 8, paddingRight: 12 }}>
              <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
                <Trophy size={30} color={colors.text} strokeWidth={1.6} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt v="h3" color={colors.onPrimary}>
                  {featured.title}
                </Txt>
                <Txt v="body" color="rgba(10,15,7,0.75)">
                  {featured.subtitle}
                </Txt>
              </View>
              <PillButton
                title={joined ? `DAY ${(st.challengeProgress[featured.id] ?? 0) + 1}` : 'START'}
                tone="cream"
                onPress={() => {
                  if (!joined) st.joinChallenge(featured.id);
                  router.push(`/challenge/${featured.id}`);
                }}
              />
            </LimeGradient>
          </Press>
        </Reveal>

        {/* Week strip */}
        <Reveal p={r[2]!} style={{ flexDirection: 'row', paddingHorizontal: 12, marginTop: 26 }}>
          {weekDays.map((d, k) => {
            const active = k === day;
            return (
              <Pressable key={d} onPress={() => setDay(k)} style={{ flex: 1, alignItems: 'center', gap: 12 }} accessibilityLabel={`${d} ${13 + k}`}>
                <Txt color={active ? colors.primary : colors.textMuted}>{d}</Txt>
                <Ring value={dayProgress[k]!} size={46} stroke={2} color={active ? colors.primary : colors.text} track={dayProgress[k] ? 'rgba(255,255,255,0.12)' : 'transparent'} delay={0.3 + k * 0.05}>
                  <Txt v="bodyLg" color={active ? colors.primary : colors.text}>
                    {13 + k}
                  </Txt>
                </Ring>
              </Pressable>
            );
          })}
        </Reveal>

        {/* Category chips */}
        <Reveal p={r[3]!}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 20, marginTop: 26 }}>
            {categories.map((c) => (
              <Chip key={c.id} label={c.label} icon={c.icon} active={cat === c.id} onPress={() => setCat(cat === c.id ? 'all' : c.id)} />
            ))}
          </ScrollView>
        </Reveal>

        {/* Workout cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={172} decelerationRate="fast" contentContainerStyle={{ gap: 12, paddingHorizontal: 20, marginTop: 16 }}>
          {list.map((w, k) => (
            <Reveal key={w.id} p={cards[k]!} x={40} y={0}>
              <MediaCard image={w.image} title={w.title} minutes={w.minutes} onPress={() => router.push(`/exercise/${w.id}`)} />
            </Reveal>
          ))}
        </ScrollView>

        {/* Today rings — scroll-triggered */}
        <ScrollReveal y={y} style={{ marginHorizontal: 20, marginTop: 28 }}>
          <Card onPress={() => router.push('/stats')} style={{ flexDirection: 'row', alignItems: 'center', gap: 18, padding: 18 }}>
            <Ring value={steps / st.stepGoal} size={92} stroke={9}>
              <Ring value={st.waterMl / 2000} size={64} stroke={7} color={colors.protein} track="rgba(22,179,235,0.15)" />
            </Ring>
            <View style={{ flex: 1, gap: 8 }}>
              <Txt v="overline" color={colors.textMuted}>
                Today
              </Txt>
              <Txt style={{ fontFamily: font.light, fontSize: 28 }}>
                {steps.toLocaleString()}
                <Txt v="small" color={colors.textMuted}>
                  {' '}
                  / {st.stepGoal.toLocaleString()} steps
                </Txt>
              </Txt>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <WaterIcon size={16} />
                <Txt v="small" color={colors.textMuted}>
                  {(st.waterMl / 1000).toFixed(2)}L of 2L water
                </Txt>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textMuted} />
          </Card>
        </ScrollReveal>

        {/* Recent activity */}
        <ScrollReveal y={y} style={{ marginTop: 30 }}>
          <SectionHeader
            title="Recent Activity"
            action={
              <Pressable onPress={() => setDesc(!desc)} accessibilityLabel="Sort activity" hitSlop={10}>
                <SlidersHorizontal size={22} color={colors.text} strokeWidth={1.8} />
              </Pressable>
            }
          />
        </ScrollReveal>
        {sorted.map((a) => (
          <ScrollReveal key={a.id} y={y} style={{ marginHorizontal: 20, marginTop: 12 }}>
            <ActivityRow icon={toneIcon[a.id as keyof typeof toneIcon]} tone={a.tone} title={a.title} time={a.time} value={a.id === 'walk' ? steps : a.value} unit={a.unit} onPress={() => router.push('/history')} />
          </ScrollReveal>
        ))}

        {/* Challenges teaser */}
        <ScrollReveal y={y} style={{ marginTop: 30 }}>
          <SectionHeader
            title="Challenges"
            action={
              <Txt v="small" color={colors.primary} onPress={() => router.push('/challenges')}>
                See all
              </Txt>
            }
          />
        </ScrollReveal>
        <ScrollReveal y={y}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 20, marginTop: 14 }}>
            {challenges.slice(1).map((c) => (
              <Press key={c.id} onPress={() => router.push(`/challenge/${c.id}`)} style={{ width: 220, borderRadius: radius.xl, backgroundColor: colors.card, overflow: 'hidden' }}>
                <Img source={c.image} style={{ height: 110 }} />
                <View style={{ padding: 14, gap: 4 }}>
                  <Txt v="bodyLg">{c.title}</Txt>
                  <Txt v="small" color={colors.textMuted}>
                    {c.subtitle} · {c.participants.toLocaleString()} joined
                  </Txt>
                </View>
              </Press>
            ))}
          </ScrollView>
        </ScrollReveal>
      </Animated.ScrollView>
    </Screen>
  );
}
