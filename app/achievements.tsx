import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useAchievements } from '@/api/hooks';
import { Badge } from '@/badges';
import { Reveal, useStagger } from '@/motion';
import { colors, font } from '@/theme';
import { Bar, Card, ErrorState, HeroGlow, Skeleton, TopBar, Txt } from '@/ui';

export default function Achievements() {
  const q = useAchievements();
  const badges = q.data?.badges ?? [];
  const r = useStagger(badges.length + 1, { stagger: 0.07, ease: 'power3.out' }, [badges.length]);
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <HeroGlow />
      <TopBar title="Achievements" right={<View style={{ width: 48 }} />} />
      <Animated.ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        {q.error ? (
          <ErrorState error={q.error} onRetry={() => q.refetch()} />
        ) : !q.data ? (
          <Skeleton height={140} />
        ) : (
          <>
            <Reveal p={r[0]!}>
              <Card style={{ padding: 20, gap: 12 }}>
                <Txt v="small" color={colors.textMuted}>
                  Level {q.data.level} · {q.data.xp.toLocaleString()} XP
                </Txt>
                <Txt style={{ fontFamily: font.light, fontSize: 34 }}>
                  {q.data.earned} <Txt color={colors.textMuted}>/ {q.data.total} badges</Txt>
                </Txt>
                <Bar value={q.data.xpIntoLevel / q.data.xpForLevel} />
                <Txt v="caption" color={colors.textMuted}>
                  {q.data.xpForLevel - q.data.xpIntoLevel} XP to Level {q.data.level + 1} · workouts 50 XP, PBs 25, check-ins 20
                </Txt>
              </Card>
            </Reveal>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 }}>
              {badges.map((a, k) => (
                <Reveal key={a.id} p={r[k + 1]!} scale={0.85} style={{ width: '47.5%' }}>
                  <Card style={{ alignItems: 'center', gap: 10, paddingVertical: 22 }}>
                    <Badge id={a.id} earned={a.earned} size={84} />
                    <Txt style={{ textAlign: 'center' }} color={a.earned ? colors.text : colors.textMuted}>
                      {a.title}
                    </Txt>
                    <Txt v="caption" color={colors.textMuted} style={{ textAlign: 'center' }}>
                      {a.body}
                    </Txt>
                    {!a.earned && (
                      <View style={{ alignSelf: 'stretch', gap: 6 }}>
                        <Bar value={a.progress} height={6} />
                        <Txt v="caption" color={colors.textMuted} style={{ textAlign: 'center' }}>
                          {a.value} / {a.target}
                        </Txt>
                      </View>
                    )}
                  </Card>
                </Reveal>
              ))}
            </View>
          </>
        )}
      </Animated.ScrollView>
    </View>
  );
}
