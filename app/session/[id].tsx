import { BlurView } from 'expo-blur';
import { router, useLocalSearchParams } from 'expo-router';
import { Check, ChevronLeft, ChevronRight, Minus, Pause, Play, Plus, SkipForward, Trophy, X } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlan, useSaveWorkout, type LogPayload } from '@/api/hooks';
import { pretty, setLabel } from '@/api/meta';
import type { PlanExercise } from '@/api/types';
import { workoutArt } from '@/data';
import { ease, svTo, useTimeline } from '@/motion';
import { useApp, type DraftSet, type WorkoutDraft } from '@/store';
import { colors, font, radius, type } from '@/theme';
import { Card, ErrorState, haptic, IconButton, Img, Press, PrimaryButton, Ring, SecondaryButton, Sheet, Skeleton, toast, Txt, HeroGlow } from '@/ui';

const num = (s: string) => (s.trim() === '' ? null : Number(s));

function initialSets(e: PlanExercise): DraftSet[] {
  return Array.from({ length: Math.max(1, e.sets) }, (_, i) => {
    const prev = e.previous[i] ?? e.previous[e.previous.length - 1];
    return {
      weight: prev?.weight != null ? String(prev.weight) : '',
      reps: e.trackingType === 'reps' ? String(prev?.reps ?? e.reps ?? '') : '',
      duration: e.trackingType === 'duration' ? String(prev?.exerciseDuration ?? e.exerciseDuration ?? '') : '',
      done: false,
    };
  });
}

/** Set-by-set workout logger with rest timer — saves to FitForge's WorkoutLog/SetLog via c7-backend. */
export default function Session() {
  const { id, assignment } = useLocalSearchParams<{ id: string; assignment?: string }>();
  const insets = useSafeAreaInsets();
  const plan = usePlan(id);
  const save = useSaveWorkout();
  const draft = useApp((s) => s.draft);
  const setStore = useApp((s) => s.set);

  // Create (or resume) the draft once the plan loads.
  useEffect(() => {
    const p = plan.data;
    if (!p) return;
    const cur = useApp.getState().draft;
    if (cur && cur.planId === p.id) return;
    const sets: WorkoutDraft['sets'] = {};
    for (const e of p.exercises) sets[e.id] = initialSets(e);
    setStore({ draft: { planId: p.id, assignmentId: assignment, startedAt: Date.now(), restSeconds: 0, sets } });
  }, [plan.data, assignment, setStore]);

  const ex = plan.data?.exercises ?? [];
  const d = draft && draft.planId === id ? draft : null;
  const firstOpen = useMemo(() => Math.max(0, ex.findIndex((e) => d?.sets[e.id]?.some((s) => !s.done))), [ex, d]);
  const [idx, setIdx] = useState<number | null>(null);
  const i = idx ?? firstOpen;
  const e = ex[i];
  const sets = (e && d?.sets[e.id]) || [];
  const setIdxInEx = Math.max(0, sets.findIndex((s) => !s.done));
  const current = sets[setIdxInEx];
  const allDoneHere = sets.length > 0 && sets.every((s) => s.done);

  const [rest, setRest] = useState<{ total: number; left: number } | null>(null);
  const [paused, setPaused] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const setStart = useRef<string>(new Date().toISOString());

  useEffect(() => {
    const t = setInterval(() => d && setElapsed(Math.round((Date.now() - d.startedAt) / 1000)), 1000);
    return () => clearInterval(t);
  }, [d]);

  useEffect(() => {
    if (!rest || paused) return;
    const t = setInterval(() => {
      setRest((r) => {
        if (!r) return r;
        if (r.left <= 1) {
          haptic('success');
          setStart.current = new Date().toISOString();
          return null;
        }
        if (r.left <= 4) haptic();
        return { ...r, left: r.left - 1 };
      });
      const st = useApp.getState();
      if (st.draft) st.set({ draft: { ...st.draft, restSeconds: st.draft.restSeconds + 1 } });
    }, 1000);
    return () => clearInterval(t);
  }, [rest, paused]);

  const title = useSharedValue(0);
  useTimeline((tl) => {
    title.value = 0;
    tl.add(svTo(title, 1, { duration: 0.6, ease: ease.out }));
  }, [i]);
  const titleA = useAnimatedStyle(() => ({ opacity: title.value, transform: [{ translateY: (1 - title.value) * 30 }] }));

  const patchSet = (k: number, patch: Partial<DraftSet>) => {
    const st = useApp.getState();
    if (!st.draft || !e) return;
    const list = [...(st.draft.sets[e.id] ?? [])];
    list[k] = { ...list[k]!, ...patch };
    st.set({ draft: { ...st.draft, sets: { ...st.draft.sets, [e.id]: list } } });
  };

  const completeSet = () => {
    if (!e || !current) return;
    const metric = e.trackingType === 'duration' ? num(current.duration) : num(current.reps);
    if (!metric || metric <= 0) return toast.error(e.trackingType === 'duration' ? 'Enter how many seconds you held it' : 'Enter the reps you completed');
    const restSecs = e.rest.defaultRestSeconds;
    patchSet(setIdxInEx, { done: true, startedAt: setStart.current, endedAt: new Date().toISOString(), restTimeSeconds: restSecs });
    haptic('success');
    const last = setIdxInEx === sets.length - 1;
    if (last && i === ex.length - 1) return setFinishOpen(true);
    if (e.rest.autoStart && restSecs > 0) setRest({ total: restSecs, left: restSecs });
    else setStart.current = new Date().toISOString();
    if (last) setIdx(Math.min(ex.length - 1, i + 1));
  };

  const doneSets = d ? Object.values(d.sets).flat().filter((s) => s.done).length : 0;
  const totalSets = d ? Object.values(d.sets).flat().length : 0;

  const finish = () => {
    if (!d || !plan.data) return;
    const exercises: LogPayload['exercises'] = plan.data.exercises
      .map((x) => ({
        exerciseId: x.exerciseId,
        trackingType: x.trackingType,
        sets: (d.sets[x.id] ?? [])
          .filter((s) => s.done)
          .map((s) => ({ weight: num(s.weight), reps: x.trackingType === 'reps' ? num(s.reps) : null, exerciseDuration: x.trackingType === 'duration' ? num(s.duration) : null, restTimeSeconds: s.restTimeSeconds ?? null, setStartTime: s.startedAt ?? null, setEndTime: s.endedAt ?? null })),
      }))
      .filter((x) => x.sets.length);
    if (!exercises.length) return toast.error('Complete at least one set to save the workout');
    const duration = Math.round((Date.now() - d.startedAt) / 1000);
    save.mutate(
      { workoutPlanId: plan.data.id, assignmentId: d.assignmentId, duration, totalRestTime: d.restSeconds, totalActiveTime: Math.max(0, duration - d.restSeconds), exercises },
      {
        onSuccess: (r) => {
          setStore({ draft: null });
          const names = Object.fromEntries(plan.data!.exercises.map((x) => [x.exerciseId, x.name]));
          router.replace({
            pathname: '/complete',
            params: { name: r.workoutLog.workoutPlanName, secs: String(r.workoutLog.duration), sets: String(r.workoutLog.setCount), volume: String(Math.round(r.workoutLog.volume)), pbs: JSON.stringify(r.newPBs.map((p) => ({ name: names[p.exerciseId] ?? 'Exercise', label: setLabel(p) }))), log: r.workoutLog.id },
          });
        },
        onError: toast.error,
      },
    );
  };

  const discard = () => {
    setStore({ draft: null });
    router.back();
  };

  if (plan.error) return <View style={{ flex: 1, backgroundColor: colors.surface, paddingTop: insets.top + 40 }}><HeroGlow /><ErrorState error={plan.error} onRetry={() => plan.refetch()} /></View>;
  if (!e || !d) return <View style={{ flex: 1, backgroundColor: colors.surface, padding: 20, paddingTop: insets.top + 40, gap: 12 }}><HeroGlow /><Skeleton height={60} /><Skeleton height={260} /><Skeleton height={80} /></View>;

  const next = ex[i + 1];
  const mm = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`;
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}><HeroGlow />
      <Img source={e.image} fallback={workoutArt(e.category, e.exerciseId)} style={StyleSheet.absoluteFill} />
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: rest ? 'rgba(5,6,5,0.85)' : 'rgba(14,61,20,0.55)' }]} />

      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <IconButton icon={X} label="End workout" onPress={() => setFinishOpen(true)} />
        <View style={{ flex: 1, flexDirection: 'row', gap: 4 }}>
          {ex.map((x, k) => {
            const xs = d.sets[x.id] ?? [];
            const complete = xs.length > 0 && xs.every((s) => s.done);
            return <View key={x.id} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: complete ? colors.primary : k === i ? colors.text : 'rgba(255,255,255,0.2)' }} />;
          })}
        </View>
        <Txt v="small" color={colors.textMuted} accessibilityLabel="Elapsed time">
          {mm}
        </Txt>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 20 }} keyboardShouldPersistTaps="handled">
        <Animated.View style={[{ alignItems: 'center', paddingHorizontal: 20 }, titleA]}>
          <Txt v="overline" color={rest ? colors.protein : colors.primary}>
            {rest ? 'Recover' : `Exercise ${i + 1} of ${ex.length} · ${pretty(e.category)}`}
          </Txt>
          <Txt v="h1" style={{ marginTop: 8, textAlign: 'center' }}>
            {rest ? 'Rest' : e.name}
          </Txt>
          {!rest && (
            <Txt color={colors.textMuted} style={{ marginTop: 4 }}>
              {allDoneHere ? 'All sets done' : `Set ${setIdxInEx + 1} of ${sets.length}`} · target {e.trackingType === 'duration' ? `${e.exerciseDuration ?? '—'}s` : `${e.reps ?? '—'} reps`}
            </Txt>
          )}
        </Animated.View>

        {rest ? (
          <View style={{ alignItems: 'center', marginTop: 28, gap: 18 }}>
            <Ring key={rest.total} duration={1} linear value={1 - (rest.left - 1) / rest.total} size={240} stroke={14} color={colors.protein} track="rgba(255,255,255,0.1)">
              <Txt style={{ fontFamily: font.light, fontSize: 72, lineHeight: 80 }}>{rest.left}</Txt>
              <Txt v="small" color={colors.textMuted}>
                seconds rest
              </Txt>
            </Ring>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <SecondaryButton title="+15s" style={{ height: 46, paddingHorizontal: 22 }} onPress={() => setRest((r) => r && { total: Math.min(e.rest.maxRestSeconds, r.total + 15), left: Math.min(e.rest.maxRestSeconds, r.left + 15) })} />
              <SecondaryButton title="Skip rest" style={{ height: 46, paddingHorizontal: 22 }} onPress={() => ((setStart.current = new Date().toISOString()), setRest(null))} />
            </View>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20, marginTop: 24, gap: 12 }}>
            {/* Set list */}
            {sets.map((s, k) => {
              const active = k === setIdxInEx && !s.done;
              return (
                <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.lg, backgroundColor: active ? 'rgba(21,24,22,0.92)' : 'rgba(21,24,22,0.6)', borderWidth: active ? 1.5 : 0, borderColor: colors.primary }}>
                  <View style={{ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: s.done ? colors.primary : colors.secondary }}>
                    {s.done ? <Check size={16} color={colors.onPrimary} strokeWidth={3} /> : <Txt v="small">{k + 1}</Txt>}
                  </View>
                  <NumberField label="kg" value={s.weight} onChange={(v) => patchSet(k, { weight: v })} step={2.5} decimals />
                  {e.trackingType === 'duration' ? (
                    <NumberField label="sec" value={s.duration} onChange={(v) => patchSet(k, { duration: v })} step={5} />
                  ) : (
                    <NumberField label="reps" value={s.reps} onChange={(v) => patchSet(k, { reps: v })} step={1} />
                  )}
                  {s.done && (
                    <Press accessibilityLabel={`Undo set ${k + 1}`} onPress={() => patchSet(k, { done: false })} hitSlop={8}>
                      <Txt v="caption" color={colors.textMuted}>
                        UNDO
                      </Txt>
                    </Press>
                  )}
                </View>
              );
            })}
            <Press accessibilityLabel="Add set" onPress={() => { const st = useApp.getState(); if (!st.draft) return; const list = st.draft.sets[e.id] ?? []; const last = list[list.length - 1]; st.set({ draft: { ...st.draft, sets: { ...st.draft.sets, [e.id]: [...list, { weight: last?.weight ?? '', reps: last?.reps ?? '', duration: last?.duration ?? '', done: false }] } } }); }} style={{ alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8 }}>
              <Plus size={16} color={colors.primary} />
              <Txt v="small" color={colors.primary}>
                Add set
              </Txt>
            </Press>
            {(!!(e.pb || e.previous.length > 0)) && (
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16 }}>
                {e.previous.length > 0 && <Txt v="caption" color={colors.textMuted}>LAST: {setLabel(e.previous[0]!)}</Txt>}
                {!!e.pb && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Trophy size={12} color={colors.carbs} />
                    <Txt v="caption" color={colors.textMuted}>PB: {setLabel(e.pb)}</Txt>
                  </View>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {!!(next && !rest) && (
        <Card style={{ marginHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'rgba(21,24,22,0.85)' }}>
          <Img source={next.image} fallback={workoutArt(next.category, next.exerciseId)} style={{ width: 52, height: 52, borderRadius: radius.sm }} />
          <View style={{ flex: 1 }}>
            <Txt v="caption" color={colors.textMuted}>
              NEXT UP
            </Txt>
            <Txt numberOfLines={1}>{next.name}</Txt>
          </View>
          <Txt v="small" color={colors.textMuted}>
            {next.sets} × {next.trackingType === 'duration' ? `${next.exerciseDuration ?? '—'}s` : next.reps ?? '—'}
          </Txt>
        </Card>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28, paddingTop: 20, paddingBottom: insets.bottom + 24 }}>
        <IconButton icon={ChevronLeft} label="Previous exercise" size={58} tint={colors.card} onPress={() => (setRest(null), setIdx(Math.max(0, i - 1)))} />
        {rest ? (
          <Press accessibilityLabel={paused ? 'Resume rest' : 'Pause rest'} onPress={() => setPaused(!paused)} scaleTo={0.88} hapticKind="medium" style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
            {paused ? <Play size={34} color={colors.onPrimary} fill={colors.onPrimary} style={{ marginLeft: 4 }} /> : <Pause size={34} color={colors.onPrimary} fill={colors.onPrimary} />}
          </Press>
        ) : allDoneHere ? (
          <Press accessibilityLabel={i === ex.length - 1 ? 'Finish workout' : 'Next exercise'} onPress={() => (i === ex.length - 1 ? setFinishOpen(true) : setIdx(i + 1))} scaleTo={0.88} hapticKind="medium" style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
            {i === ex.length - 1 ? <Trophy size={32} color={colors.onPrimary} /> : <SkipForward size={32} color={colors.onPrimary} fill={colors.onPrimary} />}
          </Press>
        ) : (
          <Press accessibilityLabel="Complete set" onPress={completeSet} scaleTo={0.88} hapticKind="medium" style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Check size={38} color={colors.onPrimary} strokeWidth={3} />
          </Press>
        )}
        <IconButton icon={ChevronRight} label="Next exercise" size={58} tint={colors.card} onPress={() => (setRest(null), setIdx(Math.min(ex.length - 1, i + 1)))} />
      </View>

      <Sheet open={finishOpen} onClose={() => setFinishOpen(false)} title={doneSets === totalSets ? 'Great work — save it?' : 'Finish this workout?'}>
        <Txt color={colors.textMuted} style={{ marginBottom: 20 }}>
          {doneSets} of {totalSets} sets completed in {mm}. {doneSets < totalSets ? 'Only completed sets are saved.' : 'Your coach will see it in C7.'}
        </Txt>
        <PrimaryButton title="Finish & save" loading={save.isPending} disabled={!doneSets} onPress={finish} />
        <SecondaryButton title="Keep going" style={{ marginTop: 12 }} onPress={() => setFinishOpen(false)} />
        <Txt v="small" color={colors.danger} style={{ textAlign: 'center', marginTop: 16 }} onPress={discard}>
          Discard workout
        </Txt>
      </Sheet>
    </View>
  );
}

function NumberField({ label, value, onChange, step, decimals }: { label: string; value: string; onChange: (v: string) => void; step: number; decimals?: boolean }) {
  const bump = (dir: 1 | -1) => {
    const n = Math.max(0, (Number(value) || 0) + dir * step);
    onChange(String(Math.round(n * 10) / 10));
  };
  return (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.secondary, borderRadius: radius.pill, paddingHorizontal: 4, height: 44 }}>
      <Press accessibilityLabel={`Decrease ${label}`} onPress={() => bump(-1)} hitSlop={6} style={{ width: 30, height: 30, alignItems: 'center', justifyContent: 'center' }}>
        <Minus size={14} color={colors.text} />
      </Press>
      <TextInput
        value={value}
        onChangeText={(t) => onChange(t.replace(decimals ? /[^0-9.]/g : /[^0-9]/g, ''))}
        keyboardType={decimals ? 'decimal-pad' : 'number-pad'}
        accessibilityLabel={label}
        placeholder="0"
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.primary}
        style={[type.bodyLg, { flex: 1, minWidth: 0, textAlign: 'center', color: colors.text, padding: 0 }]}
      />
      <Txt v="caption" color={colors.textMuted} style={{ marginRight: 2 }}>
        {label}
      </Txt>
      <Press accessibilityLabel={`Increase ${label}`} onPress={() => bump(1)} hitSlop={6} style={{ width: 30, height: 30, alignItems: 'center', justifyContent: 'center' }}>
        <Plus size={14} color={colors.text} />
      </Press>
    </View>
  );
}
