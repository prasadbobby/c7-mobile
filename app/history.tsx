import { router } from 'expo-router';
import { Dumbbell, History as HistoryIcon } from 'lucide-react-native';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { workouts } from '@/data';
import { Reveal, useStagger } from '@/motion';
import { useApp } from '@/store';
import { colors, font } from '@/theme';
import { ActivityRow, Card, EmptyState, HeroGlow, PrimaryButton, TopBar, Txt } from '@/ui';

export default function History() {
  const log = useApp((s) => s.workoutLog);
  const r = useStagger(log.length + 1, { stagger: 0.05 });
  const mins = log.reduce((a, l) => a + l.minutes, 0);
  const kcal = log.reduce((a, l) => a + l.kcal, 0);
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <HeroGlow />
      <TopBar title="Workout History" />
      <Animated.ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 12 }}>
        {log.length === 0 ? (
          <EmptyState icon={HistoryIcon} title="No workouts yet" body="Your completed sessions will show up here." action={<PrimaryButton title="Browse workouts" onPress={() => router.navigate('/workout')} style={{ alignSelf: 'stretch', marginTop: 12 }} />} />
        ) : (
          <Reveal p={r[0]!} style={{ flexDirection: 'row', gap: 12 }}>
            {[{ l: 'Sessions', v: log.length }, { l: 'Minutes', v: mins }, { l: 'Kcal', v: kcal }].map((x) => (
              <Card key={x.l} style={{ flex: 1 }}>
                <Txt v="caption" color={colors.textMuted}>{x.l}</Txt>
                <Txt style={{ fontFamily: font.light, fontSize: 26 }}>{x.v}</Txt>
              </Card>
            ))}
          </Reveal>
        )}
        {log.map((l, k) => {
          const w = workouts.find((x) => x.id === l.workoutId);
          return (
            <Reveal key={l.id} p={r[k + 1]!}>
              <ActivityRow icon={Dumbbell} tone={k % 3 === 0 ? 'lime' : k % 3 === 1 ? 'danger' : 'deep'} title={w?.title ?? 'Workout'} time={new Date(l.at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} value={l.minutes} unit="/min" onPress={() => w && router.push(`/exercise/${w.id}`)} />
            </Reveal>
          );
        })}
      </Animated.ScrollView>
    </View>
  );
}
