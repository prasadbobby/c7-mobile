import { router, useLocalSearchParams } from 'expo-router';
import { CalendarDays, Check, Gauge, Lock, Play, Repeat } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { programs, workouts } from '@/data';
import { Parallax, Reveal, ScrollReveal, useScrollY, useStagger } from '@/motion';
import { colors, radius } from '@/theme';
import { BackButton, Card, Chip, FadeBottom, Img, InfoPill, PrimaryButton, Txt } from '@/ui';

const HERO = 360;

export default function Program() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const p = programs.find((x) => x.id === id) ?? programs[0]!;
  const insets = useSafeAreaInsets();
  const { y, onScroll } = useScrollY();
  const [week, setWeek] = useState(1);
  const r = useStagger(2, { delay: 0.1 });
  const sessions = p.workouts.map((wid) => workouts.find((w) => w.id === wid)!);
  const currentWeek = 2;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}>
        <View style={{ height: HERO, overflow: 'hidden', borderBottomLeftRadius: 40, borderBottomRightRadius: 40 }}>
          <Parallax y={y} height={HERO} style={StyleSheet.absoluteFill}>
            <Img source={p.image} style={StyleSheet.absoluteFill} />
          </Parallax>
          <FadeBottom />
          <View style={{ position: 'absolute', left: 20, right: 20, bottom: 22 }}>
            <Txt v="overline" color={colors.primary}>
              Program
            </Txt>
            <Txt v="h1" style={{ marginTop: 6 }}>
              {p.title}
            </Txt>
          </View>
        </View>
        <View style={{ position: 'absolute', top: insets.top + 8, left: 20 }}>
          <BackButton />
        </View>

        <Reveal p={r[0]!} style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginTop: 20, flexWrap: 'wrap' }}>
          <InfoPill icon={CalendarDays} label={`${p.weeks} weeks`} />
          <InfoPill icon={Repeat} label={`${p.perWeek}x / week`} />
          <InfoPill icon={Gauge} label={p.level} />
        </Reveal>

        <Reveal p={r[1]!}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 20, marginTop: 22 }}>
            {Array.from({ length: p.weeks }, (_, k) => k + 1).map((wk) => (
              <Chip key={wk} label={`Week ${wk}`} icon={wk > currentWeek ? Lock : wk < currentWeek ? Check : undefined} active={week === wk} onPress={() => setWeek(wk)} />
            ))}
          </ScrollView>
        </Reveal>

        {sessions.slice(0, p.perWeek).map((w, k) => {
          const done = week < currentWeek || (week === currentWeek && k === 0);
          const locked = week > currentWeek;
          return (
            <ScrollReveal key={w.id + week} y={y} style={{ marginHorizontal: 20, marginTop: 14 }}>
              <Card onPress={locked ? undefined : () => router.push(`/exercise/${w.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 10, opacity: locked ? 0.45 : 1 }}>
                <Img source={w.image} style={{ width: 76, height: 76, borderRadius: radius.md }} />
                <View style={{ flex: 1 }}>
                  <Txt v="caption" color={colors.primary}>
                    DAY {k * 2 + 1}
                  </Txt>
                  <Txt v="bodyLg">{w.title}</Txt>
                  <Txt v="small" color={colors.textMuted}>
                    {w.minutes} min · {w.kcal} kcal
                  </Txt>
                </View>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: done ? colors.primary : colors.secondary, alignItems: 'center', justifyContent: 'center' }}>
                  {locked ? <Lock size={16} color={colors.textMuted} /> : done ? <Check size={18} color={colors.onPrimary} strokeWidth={3} /> : <Play size={16} color={colors.text} fill={colors.text} />}
                </View>
              </Card>
            </ScrollReveal>
          );
        })}
      </Animated.ScrollView>
      <View style={{ position: 'absolute', left: 20, right: 20, bottom: insets.bottom + 16 }}>
        <PrimaryButton title="Continue program" icon={Play} onPress={() => router.push(`/session/${sessions[1]?.id ?? sessions[0]!.id}`)} />
      </View>
    </View>
  );
}
