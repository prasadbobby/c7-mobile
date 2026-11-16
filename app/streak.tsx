import { router } from 'expo-router';
import { CircleCheck, Dumbbell, Footprints } from 'lucide-react-native';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { today } from '@/api/dates';
import { useStreaks } from '@/api/hooks';
import { FlameIcon } from '@/icons';
import { Reveal, useCountUp, useStagger } from '@/motion';
import { colors, font, radius } from '@/theme';
import { Card, ErrorState, HeroGlow, PrimaryButton, TopBar, Txt } from '@/ui';

export default function Streak() {
  const q = useStreaks();
  const s = q.data;
  const days = useCountUp(s?.activeStreak ?? 0, { duration: 1.5 });
  const best = useCountUp(s?.bestStreak ?? 0, { delay: 0.3 });
  const r = useStagger(4, { stagger: 0.1 });
  const flicker = useSharedValue(1);
  useEffect(() => {
    flicker.value = 1;
  }, [flicker]);
  const flameA = useAnimatedStyle(() => ({ transform: [{ scale: flicker.value }] }));
  const t = today();
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <HeroGlow />
      <TopBar title="Streak" right={<View style={{ width: 48 }} />} />
      {q.error ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : (
        <Animated.ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
          <Reveal p={r[0]!} scale={0.6} style={{ alignItems: 'center', marginTop: 24 }}>
            <Animated.View style={flameA}>
              <FlameIcon size={120} />
            </Animated.View>
            <Txt style={{ fontFamily: font.light, fontSize: 72, lineHeight: 80, marginTop: 8 }}>{days}</Txt>
            <Txt v="h3">day streak</Txt>
            <Txt color={colors.textMuted} style={{ marginTop: 6, textAlign: 'center' }}>
              Best: {best} days · a day counts when you train, hit your steps or check in
            </Txt>
          </Reveal>
          <Reveal p={r[1]!} style={{ marginTop: 28 }}>
            <Card style={{ padding: 18 }}>
              <Txt v="h3" style={{ marginBottom: 14 }}>
                Last 5 weeks
              </Txt>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' }}>
                {(s?.days ?? Array.from({ length: 35 }, (_, i) => ({ date: String(i), workout: false, steps: false, checkIn: false }))).map((d) => {
                  const hit = d.workout || d.steps || d.checkIn;
                  const isToday = d.date === t;
                  return (
                    <View key={d.date} accessibilityLabel={`${d.date}${hit ? ' active' : ''}`} style={{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: hit ? colors.primary : colors.secondary, borderWidth: isToday ? 2 : 0, borderColor: colors.primary }}>
                      {d.workout ? <Dumbbell size={15} color={colors.onPrimary} /> : d.checkIn ? <CircleCheck size={15} color={colors.onPrimary} /> : d.steps ? <Footprints size={15} color={colors.onPrimary} /> : <Txt v="caption" color={colors.textMuted}>{Number(d.date.slice(8, 10)) || ''}</Txt>}
                    </View>
                  );
                })}
              </View>
            </Card>
          </Reveal>
          <Reveal p={r[2]!} style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
            {[
              { l: 'This week', v: `${s?.thisWeek ?? 0}/7` },
              { l: 'Workout streak', v: `${s?.workoutStreak ?? 0}d` },
              { l: 'Steps streak', v: `${s?.stepStreak ?? 0}d` },
            ].map((x) => (
              <Card key={x.l} style={{ flex: 1, borderRadius: radius.lg }}>
                <Txt v="caption" color={colors.textMuted}>
                  {x.l}
                </Txt>
                <Txt style={{ fontFamily: font.light, fontSize: 22, marginTop: 4 }}>{x.v}</Txt>
              </Card>
            ))}
          </Reveal>
          <Reveal p={r[3]!} style={{ marginTop: 24 }}>
            <PrimaryButton title="Keep it alive — start a workout" onPress={() => router.push('/workout')} />
          </Reveal>
        </Animated.ScrollView>
      )}
    </View>
  );
}
