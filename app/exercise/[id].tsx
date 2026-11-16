import { useLocalSearchParams } from 'expo-router';
import { Activity, Dumbbell, Gauge, Heart, Flag, Lightbulb, Trophy } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProgressLine } from '@/charts';
import { shortDate } from '@/api/dates';
import { useExercise, useExerciseHistory, useSetExerciseGoal, useToggleFavourite } from '@/api/hooks';
import { pretty, setLabel } from '@/api/meta';
import { workoutArt } from '@/data';
import { DumbbellGlyph } from '@/icons';
import { Parallax, Reveal, ScrollReveal, useScrollY, useStagger } from '@/motion';
import { colors, font } from '@/theme';
import { BackButton, Card, ErrorState, FadeBottom, Field, IconButton, Img, InfoPill, PrimaryButton, Sheet, Skeleton, toast, Txt, HeroGlow } from '@/ui';

const HERO = 420;

export default function Exercise() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const q = useExercise(id);
  const hist = useExerciseHistory(id);
  const fav = useToggleFavourite();
  const goal = useSetExerciseGoal();
  const { y, onScroll } = useScrollY();
  const [more, setMore] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [goalValue, setGoalValue] = useState('');
  const r = useStagger(3, { delay: 0.2 });
  const e = q.data;

  if (q.error) return <View style={{ flex: 1, backgroundColor: colors.surface, paddingTop: insets.top + 60 }}><HeroGlow /><ErrorState error={q.error} onRetry={() => q.refetch()} /><View style={{ position: 'absolute', top: insets.top + 8, left: 20 }}><BackButton /></View></View>;

  const sessions = (hist.data ?? []).filter((s) => s.bestWeight > 0).slice(0, 7).reverse();
  const pts = sessions.map((s) => s.bestWeight);
  const lo = pts.length ? Math.floor(Math.min(...pts) * 0.8) : 0;
  const hi = pts.length ? Math.ceil(Math.max(...pts) * 1.15) : 10;
  const tick = (k: number) => Math.round(lo + ((hi - lo) * k) / 4);
  const instructions = e?.instructions ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}><HeroGlow />
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}>
        <View style={{ height: HERO, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, overflow: 'hidden' }}>
          <Parallax y={y} height={HERO} style={StyleSheet.absoluteFill}>
            <Img source={e?.image} fallback={workoutArt(e?.category, id)} style={StyleSheet.absoluteFill} />
          </Parallax>
          <FadeBottom />
          {!!e && (
            <View style={{ position: 'absolute', left: 20, right: 20, bottom: 22, flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {[...e.primaryMuscles, ...e.secondaryMuscles.slice(0, 2)].map((m, k) => (
                <View key={`${m}-${k}`} style={{ backgroundColor: k < e.primaryMuscles.length ? colors.primary : 'rgba(5,6,5,0.6)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
                  <Txt v="caption" color={k < e.primaryMuscles.length ? colors.onPrimary : colors.text}>
                    {pretty(m).toUpperCase()}
                  </Txt>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ position: 'absolute', top: insets.top + 8, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between' }}>
          <BackButton />
          <IconButton
            icon={<Heart size={20} color={e?.isFavourite ? colors.danger : colors.text} fill={e?.isFavourite ? colors.danger : 'transparent'} />}
            label={e?.isFavourite ? 'Remove from favourites' : 'Add to favourites'}
            onPress={() => fav.mutate(id, { onSuccess: (x) => toast.ok(x.isFavourite ? 'Added to favourites' : 'Removed from favourites'), onError: toast.error })}
          />
        </View>

        {!e ? (
          <View style={{ padding: 20, gap: 12 }}>
            <Skeleton height={40} />
            <Skeleton height={120} />
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
            <Reveal p={r[0]!}>
              <Txt v="h2">{e.name}</Txt>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
                <DumbbellGlyph size={22} />
                <Txt v="bodyLg" color={colors.textMuted}>
                  {pretty(e.equipment ?? 'body only')}
                </Txt>
              </View>
            </Reveal>
            <Reveal p={r[1]!}>
              {!!e.description && (
                <Txt color={colors.textMuted} style={{ marginTop: 18, lineHeight: 26 }}>
                  {e.description}
                </Txt>
              )}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
                <InfoPill icon={Gauge} label={pretty(e.level)} />
                <InfoPill icon={Dumbbell} label={pretty(e.category)} />
                {!!e.force && <InfoPill icon={Activity} label={pretty(e.force)} />}
                {!!e.mechanic && <InfoPill label={pretty(e.mechanic)} />}
              </View>
            </Reveal>

            <Reveal p={r[2]!} style={{ marginTop: 28 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Txt v="h3">My Progress</Txt>
                {!!e.goal && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Flag size={16} color={colors.primary} />
                    <Txt v="small" color={colors.textMuted}>
                      Goal {e.goal.goalValue} kg
                    </Txt>
                  </View>
                )}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, marginBottom: 20 }}>
                <Trophy size={20} color={colors.carbs} />
                <Txt style={{ fontFamily: font.light, fontSize: 32, lineHeight: 40, color: colors.primary }}>{e.pb ? setLabel(e.pb) : 'No PB yet'}</Txt>
              </View>
              {pts.length >= 2 ? (
                <ProgressLine points={pts} labels={sessions.map((s) => new Date(s.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }))} min={lo} max={hi} ticks={[tick(4), tick(3), tick(2), tick(1)]} />
              ) : (
                <Txt color={colors.textMuted}>Log this exercise in two or more workouts to see your strength trend.</Txt>
              )}
            </Reveal>

            {instructions.length > 0 && (
              <ScrollReveal y={y} offset={HERO} style={{ marginTop: 28 }}>
                <Txt v="h3" style={{ marginBottom: 12 }}>
                  How to do it
                </Txt>
                {(more ? instructions : instructions.slice(0, 4)).map((s, k) => (
                  <Card key={k} style={{ flexDirection: 'row', gap: 14, marginBottom: 10, paddingVertical: 14 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(198,242,27,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                      <Txt v="small" color={colors.primary}>
                        {k + 1}
                      </Txt>
                    </View>
                    <Txt style={{ flex: 1 }}>{s}</Txt>
                  </Card>
                ))}
                {instructions.length > 4 && (
                  <Txt v="small" color={colors.primary} onPress={() => setMore(!more)}>
                    {more ? 'Show less' : `Show all ${instructions.length} steps`}
                  </Txt>
                )}
              </ScrollReveal>
            )}

            {e.tips.length > 0 && (
              <Card style={{ marginTop: 18, gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Lightbulb size={18} color={colors.carbs} />
                  <Txt v="bodyLg">Coach tips</Txt>
                </View>
                {e.tips.map((t, keyIdx) => (
                  <Txt key={`${t}-${keyIdx}`} v="small" color={colors.textMuted}>
                    • {t}
                  </Txt>
                ))}
              </Card>
            )}

            {(hist.data?.length ?? 0) > 0 && (
              <View style={{ marginTop: 28 }}>
                <Txt v="h3" style={{ marginBottom: 12 }}>
                  History
                </Txt>
                {hist.data!.slice(0, 10).map((s) => (
                  <Card key={s.logId} style={{ marginBottom: 10, gap: 4 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Txt v="bodyLg">{shortDate(s.date)}</Txt>
                      <Txt v="small" color={colors.textMuted}>
                        {s.planName}
                      </Txt>
                    </View>
                    <Txt v="small" color={colors.textMuted}>
                      {s.sets.map(setLabel).join('  ·  ')}
                    </Txt>
                  </Card>
                ))}
              </View>
            )}
          </View>
        )}
      </Animated.ScrollView>

      <View style={{ position: 'absolute', left: 20, right: 20, bottom: insets.bottom + 16 }}>
        <PrimaryButton title={e?.goal ? 'Update goal' : 'Set a goal'} icon={Flag} disabled={!e} onPress={() => (setGoalValue(e?.goal ? String(e.goal.goalValue) : ''), setGoalOpen(true))} />
      </View>

      <Sheet open={goalOpen} onClose={() => setGoalOpen(false)} title="Target weight">
        <Txt color={colors.textMuted} style={{ marginBottom: 14 }}>
          {e?.pb ? `Your best is ${setLabel(e.pb)}.` : 'Set the weight you want to lift for this exercise.'}
        </Txt>
        <Field placeholder="Goal (kg)" keyboardType="decimal-pad" value={goalValue} onChangeText={(t) => setGoalValue(t.replace(/[^0-9.]/g, ''))} accessibilityLabel="Goal in kilograms" />
        <PrimaryButton
          title="Save goal"
          style={{ marginTop: 16 }}
          loading={goal.isPending}
          disabled={!(Number(goalValue) > 0)}
          onPress={() => goal.mutate({ exerciseId: id, goalValue: Number(goalValue) }, { onSuccess: () => (setGoalOpen(false), toast.ok('Goal saved')), onError: toast.error })}
        />
      </Sheet>
    </View>
  );
}
