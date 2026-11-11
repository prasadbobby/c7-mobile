import { router } from 'expo-router';
import { Dumbbell, Flame, HeartPulse, LayoutGrid, PersonStanding, Play, Search, Timer } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { programs, workouts, type Category } from '@/data';
import { Reveal, ScrollReveal, useHeaderFade, useScrollY, useStagger } from '@/motion';
import { useApp } from '@/store';
import { colors, radius } from '@/theme';
import { Card, Chip, FadeBottom, HeroGlow, IconButton, Img, LimeGradient, MediaCard, Press, SectionHeader, TAB_BAR_SPACE, Txt, useTopInset } from '@/ui';

const cats = [
  { id: 'all' as const, label: 'All', icon: LayoutGrid },
  { id: 'warmup' as const, label: 'Warm Up', icon: PersonStanding },
  { id: 'cardio' as const, label: 'Cardio', icon: HeartPulse },
  { id: 'strength' as const, label: 'Strength', icon: Dumbbell },
];

export default function Workout() {
  const st = useApp();
  const top = useTopInset(12);
  const { width } = useWindowDimensions();
  const { y, onScroll } = useScrollY();
  const [cat, setCat] = useState<Category | 'all'>('all');
  const list = workouts.filter((w) => cat === 'all' || w.category === cat);
  const r = useStagger(3);
  const grid = useStagger(list.length, { stagger: 0.06 }, [cat]);
  const titleA = useAnimatedStyle(() => ({ transform: [{ scale: interpolate(y.value, [-100, 0], [1.15, 1], Extrapolation.CLAMP) }] }));
  const compact = useHeaderFade(y, 60, 110);
  const cardW = (width - 52) / 2;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <HeroGlow />
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5, paddingTop: top, paddingBottom: 14, alignItems: 'center', backgroundColor: 'rgba(5,6,5,0.92)', borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border }, compact]}>
        <Txt v="h3">Workouts</Txt>
      </Animated.View>
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: top, paddingBottom: TAB_BAR_SPACE }}>
        <Reveal p={r[0]!} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 }}>
          <Animated.View style={[{ flex: 1, transformOrigin: 'left' }, titleA]}>
            <Txt v="h1">Workouts</Txt>
            <Txt color={colors.textMuted}>{st.workoutLog.length} sessions this month · keep going</Txt>
          </Animated.View>
          <IconButton icon={Search} label="Search workouts" tint={colors.card} onPress={() => router.push('/search')} />
        </Reveal>

        {/* Programs carousel */}
        <Reveal p={r[1]!}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={width - 40 + 12} decelerationRate="fast" contentContainerStyle={{ gap: 12, paddingHorizontal: 20, marginTop: 22 }}>
            {programs.map((p, i) => (
              <Press key={p.id} onPress={() => router.push(`/program/${p.id}`)} scaleTo={0.98} style={{ width: width - 40, height: 210, borderRadius: radius.xxl, overflow: 'hidden' }}>
                <Img source={p.image} style={StyleSheet.absoluteFill} />
                <FadeBottom />
                <View style={{ position: 'absolute', top: 16, left: 16, backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 }}>
                  <Txt v="caption" color={colors.onPrimary}>
                    {i === 0 ? 'RECOMMENDED' : 'PROGRAM'}
                  </Txt>
                </View>
                <View style={{ position: 'absolute', left: 18, right: 18, bottom: 18, flexDirection: 'row', alignItems: 'flex-end' }}>
                  <View style={{ flex: 1 }}>
                    <Txt v="h2">{p.title}</Txt>
                    <Txt v="small" color={colors.textMuted}>
                      {p.weeks} weeks · {p.perWeek}x / week · {p.level}
                    </Txt>
                  </View>
                  <LimeGradient style={{ width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' }}>
                    <Play size={22} color={colors.onPrimary} fill={colors.onPrimary} style={{ marginLeft: 3 }} />
                  </LimeGradient>
                </View>
              </Press>
            ))}
          </ScrollView>
        </Reveal>

        <Reveal p={r[2]!}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 20, marginTop: 22 }}>
            {cats.map((c) => (
              <Chip key={c.id} label={c.label} icon={c.icon} active={cat === c.id} onPress={() => setCat(c.id)} />
            ))}
          </ScrollView>
        </Reveal>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20, marginTop: 16 }}>
          {list.map((w, k) => (
            <Reveal key={w.id} p={grid[k]!} scale={0.9}>
              <MediaCard image={w.image} title={w.title} minutes={w.minutes} width={cardW} height={210} badge={w.level} onPress={() => router.push(`/exercise/${w.id}`)} />
            </Reveal>
          ))}
        </View>

        <ScrollReveal y={y} style={{ marginTop: 28 }}>
          <SectionHeader title="Quick sessions" />
        </ScrollReveal>
        {workouts
          .filter((w) => w.minutes <= 15)
          .map((w) => (
            <ScrollReveal key={w.id} y={y} style={{ marginHorizontal: 20, marginTop: 12 }}>
              <Card onPress={() => router.push(`/exercise/${w.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 10 }}>
                <Img source={w.image} style={{ width: 70, height: 70, borderRadius: radius.md }} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Txt v="bodyLg">{w.title}</Txt>
                  <View style={{ flexDirection: 'row', gap: 14 }}>
                    <Meta icon={<Timer size={14} color={colors.textMuted} />} t={`${w.minutes} min`} />
                    <Meta icon={<Flame size={14} color={colors.textMuted} />} t={`${w.kcal} kcal`} />
                  </View>
                </View>
                <Press onPress={() => router.push(`/session/${w.id}`)} accessibilityLabel={`Start ${w.title}`} style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <Play size={18} color={colors.onPrimary} fill={colors.onPrimary} style={{ marginLeft: 2 }} />
                </Press>
              </Card>
            </ScrollReveal>
          ))}
      </Animated.ScrollView>
    </View>
  );
}

const Meta = ({ icon, t }: { icon: React.ReactNode; t: string }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
    {icon}
    <Txt v="small" color={colors.textMuted}>
      {t}
    </Txt>
  </View>
);
