import { router } from 'expo-router';
import { ChevronRight, Dumbbell, Flame, Footprints, Plus, Timer, Trophy, Watch } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Bars, ProgressLine } from '@/charts';
import { addDays, today, ymd } from '@/api/dates';
import { useChallenge, useChallenges, useCharts, useDashboard, useLogSteps, useMe, useMeasurements, useNutrition, useRecords, useSteps } from '@/api/hooks';
import { compact, setLabel } from '@/api/meta';
import { weekDays } from '@/data';
import { WaterIcon } from '@/icons';
import { Reveal, ScrollReveal, useCountUp, useScrollY, useStagger } from '@/motion';
import { colors, font, radius, shadow } from '@/theme';
import { Avatar, Card, Chip, Field, HeroGlow, LimeGradient, PillButton, Press, PrimaryButton, RankBadge, Ring, SectionHeader, Segmented, Sheet, Skeleton, TAB_BAR_SPACE, toast, Txt, useTopInset } from '@/ui';

type Range = '1W' | '1M' | '1Y';

export default function Stats() {
  const top = useTopInset(12);
  const { y, onScroll } = useScrollY();
  const [range, setRange] = useState<Range>('1W');
  const me = useMe();
  const steps = useSteps();
  const food = useNutrition();
  const dash = useDashboard();
  const charts = useCharts(range);
  const records = useRecords();
  const body = useMeasurements();
  const challenges = useChallenges();
  const active = challenges.data?.find((c) => c.access === 'enabled');
  const ch = useChallenge(active?.id);
  const logSteps = useLogSteps();
  const [logOpen, setLogOpen] = useState(false);
  const [stepInput, setStepInput] = useState('');
  const [logDay, setLogDay] = useState(0);
  const r = useStagger(4, { stagger: 0.1 });

  const points = charts.data ?? [];
  const totalWorkouts = points.reduce((a, p) => a + p.workouts, 0);
  const totalVolume = points.reduce((a, p) => a + p.volume, 0);
  const totalAnim = useCountUp(totalWorkouts);

  const todaySteps = steps.data?.todayLog?.actualSteps ?? 0;
  const target = steps.data?.todayLog?.targetSteps || steps.data?.activeGoal?.dailyTarget || 0;
  const goal = food.data?.goal;
  const week = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 7 }, (_, k) => {
      const d = addDays(now, k - 6);
      const log = steps.data?.monthlyLogs.find((l) => l.date.slice(0, 10) === ymd(d));
      return { label: weekDays[d.getDay()]![0]!, value: log?.actualSteps ?? 0 };
    });
  }, [steps.data]);

  const weights = (body.data?.measurements ?? []).filter((m) => m.measurementType === 'WEIGHT').slice(0, 8).reverse();
  const wv = weights.map((w) => w.value);
  const wLo = wv.length ? Math.floor(Math.min(...wv) - 1) : 0;
  const wHi = wv.length ? Math.ceil(Math.max(...wv) + 1) : 1;
  const latestWeight = body.data?.latest.WEIGHT?.value ?? me.data?.user.weight ?? null;

  const submitSteps = () => {
    const n = Math.round(Number(stepInput));
    if (!(n > 0)) return toast.error('Enter your step count');
    logSteps.mutate({ steps: n, date: ymd(addDays(new Date(), -logDay)) }, { onSuccess: (x) => (setLogOpen(false), setStepInput(''), toast.ok(x.message || 'Steps saved')), onError: toast.error });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <HeroGlow />
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: top, paddingBottom: TAB_BAR_SPACE + 20 }}>
        <Reveal p={r[0]!} style={{ paddingHorizontal: 20 }}>
          <Txt v="h1">Your Progress</Txt>
          <Txt color={colors.textMuted}>Every step counts. Here’s how you’re moving.</Txt>
        </Reveal>

        {/* Activity rings */}
        <Reveal p={r[1]!} scale={0.9} style={{ marginHorizontal: 20, marginTop: 22 }}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 20, padding: 20 }}>
            <Ring value={target ? todaySteps / target : 0} size={140} stroke={12}>
              <Ring value={goal ? (food.data?.totals.kcal ?? 0) / goal.kcal : 0} size={108} stroke={12} color={colors.calories} track="rgba(240,90,40,0.15)" delay={0.15}>
                <Ring value={goal ? (food.data?.waterMl ?? 0) / goal.waterMl : 0} size={76} stroke={12} color={colors.protein} track="rgba(22,179,235,0.15)" delay={0.3} />
              </Ring>
            </Ring>
            <View style={{ flex: 1, gap: 14 }}>
              <Legend color={colors.primary} icon={<Footprints size={16} color={colors.primary} />} label="Steps" value={target ? `${todaySteps.toLocaleString()} / ${compact(target)}` : todaySteps.toLocaleString()} />
              <Legend color={colors.calories} icon={<Flame size={16} color={colors.calories} />} label="Eaten" value={goal ? `${Math.round(food.data!.totals.kcal)} / ${goal.kcal} kcal` : '—'} />
              <Legend color={colors.protein} icon={<WaterIcon size={16} />} label="Water" value={goal ? `${((food.data?.waterMl ?? 0) / 1000).toFixed(1)}L / ${(goal.waterMl / 1000).toFixed(1)}L` : '—'} />
            </View>
          </Card>
        </Reveal>

        {/* Steps */}
        <Reveal p={r[2]!} style={{ marginHorizontal: 20, marginTop: 16 }}>
          <Card style={{ padding: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Txt v="small" color={colors.textMuted}>
                  Steps · last 7 days
                </Txt>
                <Txt style={{ fontFamily: font.light, fontSize: 34, lineHeight: 42 }}>{(steps.data?.stats.totalStepsWeek ?? 0).toLocaleString()}</Txt>
              </View>
              <PillButton title="LOG STEPS" onPress={() => setLogOpen(true)} />
            </View>
            <Txt v="small" color={colors.primary} style={{ marginBottom: 16 }}>
              {steps.data?.activeGoal ? `Daily target ${steps.data.activeGoal.dailyTarget.toLocaleString()} · ${steps.data.streak} day streak` : 'No step goal yet — your coach sets it in C7'}
            </Txt>
            {steps.isLoading ? <Skeleton height={160} /> : <Bars values={week.map((w) => w.value)} labels={week.map((w) => w.label)} highlight={6} goal={steps.data?.activeGoal?.dailyTarget} />}
            {!!steps.data?.weeklyProgress && (
              <Txt v="small" color={colors.textMuted} style={{ marginTop: 12 }}>
                This week {steps.data.weeklyProgress.actualStepsThisWeek.toLocaleString()} of {steps.data.weeklyProgress.totalWeeklyTarget.toLocaleString()} · {steps.data.weeklyProgress.isOnTrack ? 'on track ✅' : 'catch up to stay on track'}
              </Txt>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
              <Watch size={16} color={steps.data?.fitbit.isConnected ? colors.primary : colors.textMuted} />
              <Txt v="caption" color={colors.textMuted}>
                {steps.data?.fitbit.isConnected ? `Fitbit connected${steps.data.fitbit.lastSyncAt ? ` · synced ${new Date(steps.data.fitbit.lastSyncAt).toLocaleString()}` : ''}` : 'Connect Fitbit from your profile on the C7 website to sync automatically'}
              </Txt>
            </View>
          </Card>
        </Reveal>

        {/* Workouts */}
        <Reveal p={r[3]!} style={{ marginHorizontal: 20, marginTop: 22 }}>
          <Segmented<Range> value={range} onChange={setRange} options={[{ id: '1W', label: 'Week' }, { id: '1M', label: 'Month' }, { id: '1Y', label: 'Year' }]} />
        </Reveal>
        <View style={{ marginHorizontal: 20, marginTop: 16 }}>
          <Card style={{ padding: 20 }}>
            <Txt v="small" color={colors.textMuted}>
              Workouts
            </Txt>
            <Txt style={{ fontFamily: font.light, fontSize: 40, lineHeight: 48 }}>{totalAnim}</Txt>
            <Txt v="small" color={colors.primary} style={{ marginBottom: 16 }}>
              {compact(totalVolume)} kg total volume
            </Txt>
            {charts.isLoading ? <Skeleton height={160} /> : <Bars key={range} values={points.map((p) => p.workouts)} labels={points.map((p) => (range === '1Y' ? p.label[0]! : range === '1W' ? p.label.slice(0, 1) : p.label))} highlight={points.length - 1} />}
          </Card>
        </View>

        <ScrollReveal y={y} style={{ flexDirection: 'row', gap: 12, marginHorizontal: 20, marginTop: 12 }}>
          {[
            { icon: Dumbbell, v: `${dash.data?.cards.weeklyWorkouts ?? 0}`, u: 'workouts / 7d' },
            { icon: Timer, v: `${dash.data?.cards.avgWorkoutMinutes ?? 0}m`, u: 'avg session' },
            { icon: Trophy, v: `${dash.data?.cards.weeklyPBs ?? 0}`, u: 'PBs this week' },
          ].map((x) => (
            <Card key={x.u} style={{ flex: 1, gap: 10 }}>
              <x.icon size={20} color={colors.primary} />
              <Txt style={{ fontFamily: font.light, fontSize: 22 }}>{x.v}</Txt>
              <Txt v="caption" color={colors.textMuted}>
                {x.u}
              </Txt>
            </Card>
          ))}
        </ScrollReveal>

        {(records.data?.length ?? 0) > 0 && (
          <>
            <SectionHeader title="Personal records" style={{ marginTop: 26 }} />
            {records.data!.slice(0, 3).map((p) => (
              <ScrollReveal key={p.exerciseId} y={y} style={{ marginHorizontal: 20, marginTop: 10 }}>
                <Card onPress={() => router.push(`/exercise/${p.exerciseId}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Trophy size={20} color={colors.carbs} />
                  <Txt style={{ flex: 1 }} numberOfLines={1}>
                    {p.name}
                  </Txt>
                  <Txt v="small" color={colors.primary}>
                    {setLabel(p)}
                  </Txt>
                </Card>
              </ScrollReveal>
            ))}
          </>
        )}

        <ScrollReveal y={y} style={{ marginHorizontal: 20, marginTop: 24 }}>
          <Card style={{ padding: 20 }} onPress={() => router.push('/body')}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Txt v="h3">Weight trend</Txt>
              <ChevronRight size={20} color={colors.textMuted} />
            </View>
            <Txt style={{ fontFamily: font.light, fontSize: 32, color: colors.primary }}>{latestWeight != null ? `${latestWeight}kg` : 'Add weight'}</Txt>
            {wv.length >= 2 ? (
              <ProgressLine points={wv} labels={weights.map((w) => new Date(w.recordedDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }))} min={wLo} max={wHi} ticks={[wHi, Math.round((wHi + wLo) / 2), wLo]} marker={false} height={150} />
            ) : (
              <Txt v="small" color={colors.textMuted}>
                Log your weight twice to see your trend.
              </Txt>
            )}
          </Card>
        </ScrollReveal>

        {active && (
          <>
            <ScrollReveal y={y} style={{ marginTop: 26 }}>
              <SectionHeader title="Leaderboard" action={<Txt v="small" color={colors.primary} onPress={() => router.push(`/leaderboard?id=${active.id}`)}>View all</Txt>} />
            </ScrollReveal>
            <ScrollReveal y={y} style={{ marginHorizontal: 20, marginTop: 12 }}>
              <Press onPress={() => router.push(`/leaderboard?id=${active.id}`)} scaleTo={0.97} style={[{ borderRadius: radius.xl, overflow: 'hidden' }, shadow.glow]}>
                <LimeGradient style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 }}>
                  <Avatar source={me.data?.user.imageUrl} name={me.data?.user.firstName} size={56} ring={false} badge={ch.data?.rank ? <RankBadge n={ch.data.rank.rank} light /> : undefined} />
                  <View style={{ flex: 1 }}>
                    <Txt v="bodyLg" color={colors.onPrimary}>
                      {ch.data?.rank ? `You’re #${ch.data.rank.rank} of ${ch.data.rank.of}` : 'Post a check-in to get ranked'}
                    </Txt>
                    <Txt v="small" color="rgba(10,15,7,0.7)" numberOfLines={1}>
                      {active.title}
                      {ch.data?.rank ? ` · ${ch.data.rank.score} pts` : ''}
                    </Txt>
                  </View>
                  <Trophy size={28} color={colors.onPrimary} />
                </LimeGradient>
              </Press>
            </ScrollReveal>
          </>
        )}
      </Animated.ScrollView>

      <Sheet open={logOpen} onClose={() => setLogOpen(false)} title="Log steps">
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
          {['Today', 'Yesterday', '2 days ago'].map((l, k) => (
            <Chip key={`${l}-${k}`} label={l} active={logDay === k} onPress={() => setLogDay(k)} />
          ))}
        </View>
        <Field placeholder="Steps" keyboardType="number-pad" value={stepInput} onChangeText={(t) => setStepInput(t.replace(/\D/g, ''))} accessibilityLabel="Steps" />
        <Txt v="small" color={colors.textMuted} style={{ marginTop: 10 }}>
          {logDay === 0 && todaySteps ? `Replaces today’s ${todaySteps.toLocaleString()} steps.` : 'Enter the total for the day from your phone or watch.'}
        </Txt>
        <PrimaryButton title="Save steps" icon={Plus} style={{ marginTop: 16 }} loading={logSteps.isPending} onPress={submitSteps} />
      </Sheet>
    </View>
  );
}

function Legend({ color, icon, label, value }: { color: string; icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: color + '22', alignItems: 'center', justifyContent: 'center' }}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Txt v="caption" color={colors.textMuted}>
          {label}
        </Txt>
        <Txt v="small" numberOfLines={1}>
          {value}
        </Txt>
      </View>
    </View>
  );
}
