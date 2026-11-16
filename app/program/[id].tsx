import { router, useLocalSearchParams } from 'expo-router';
import { CalendarDays, Dumbbell, Layers, MessageSquareQuote, Play, Timer } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { shortDate } from '@/api/dates';
import { useAssignments, usePlan, useStartAssignment } from '@/api/hooks';
import { pretty, setLabel } from '@/api/meta';
import { workoutArt } from '@/data';
import { Parallax, Reveal, ScrollReveal, useScrollY, useStagger } from '@/motion';
import { useApp } from '@/store';
import { colors, radius } from '@/theme';
import { BackButton, Card, ErrorState, FadeBottom, Img, InfoPill, PrimaryButton, Skeleton, toast, Txt, HeroGlow } from '@/ui';

const HERO = 360;

/** A coach-assigned workout (id = assignment id), or a plan opened from history (?plan=1, id = plan id). */
export default function Program() {
  const { id, plan: isPlan } = useLocalSearchParams<{ id: string; plan?: string }>();
  const insets = useSafeAreaInsets();
  const { y, onScroll } = useScrollY();
  const r = useStagger(3, { delay: 0.1 });
  const assignments = useAssignments('all');
  const assignment = isPlan ? undefined : assignments.data?.find((a) => a.id === id);
  const planId = isPlan ? id : assignment?.plan.id;
  const plan = usePlan(planId);
  const start = useStartAssignment();
  const draft = useApp((s) => s.draft);

  if (plan.error || (!isPlan && assignments.data && !assignment)) return <View style={{ flex: 1, backgroundColor: colors.surface, paddingTop: insets.top + 60 }}><HeroGlow /><ErrorState error={plan.error ?? new Error('This workout is no longer assigned to you.')} onRetry={() => (plan.refetch(), assignments.refetch())} /><View style={{ position: 'absolute', top: insets.top + 8, left: 20 }}><BackButton /></View></View>;

  const p = plan.data;
  const resuming = draft && p && draft.planId === p.id;
  const go = () => {
    if (!p) return;
    const aid = assignment?.id ?? p.assignment?.id;
    if (aid && (assignment?.status ?? p.assignment?.status) === 'PENDING') start.mutate(aid, { onError: toast.error });
    router.push({ pathname: '/session/[id]', params: { id: p.id, ...(aid ? { assignment: aid } : {}) } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}><HeroGlow />
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}>
        <View style={{ height: HERO, overflow: 'hidden', borderBottomLeftRadius: 40, borderBottomRightRadius: 40 }}>
          <Parallax y={y} height={HERO} style={StyleSheet.absoluteFill}>
            <Img source={assignment?.plan.image ?? p?.exercises.find((e) => e.image)?.image} fallback={workoutArt(p?.trainingType, p?.id ?? id)} style={StyleSheet.absoluteFill} />
          </Parallax>
          <FadeBottom />
          <View style={{ position: 'absolute', left: 20, right: 20, bottom: 22 }}>
            <Txt v="overline" color={colors.primary}>
              {assignment ? `Assigned by ${assignment.assignedBy.name}` : 'Workout'}
            </Txt>
            <Txt v="h1" style={{ marginTop: 6 }}>
              {p?.name ?? assignment?.plan.name ?? ' '}
            </Txt>
          </View>
        </View>
        <View style={{ position: 'absolute', top: insets.top + 8, left: 20 }}>
          <BackButton />
        </View>

        {!p ? (
          <View style={{ padding: 20, gap: 12 }}>
            <Skeleton height={40} />
            <Skeleton height={90} />
            <Skeleton height={90} />
          </View>
        ) : (
          <>
            <Reveal p={r[0]!} style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginTop: 20, flexWrap: 'wrap' }}>
              <InfoPill icon={Dumbbell} label={`${p.exercises.length} exercises`} />
              <InfoPill icon={Layers} label={`${p.totalSets} sets`} />
              <InfoPill icon={Timer} label={`~${p.estimatedMinutes} min`} />
              {!!p.trainingType && <InfoPill label={pretty(p.trainingType)} />}
              {!!assignment?.dueDate && <InfoPill icon={CalendarDays} label={`Due ${shortDate(assignment.dueDate)}`} />}
            </Reveal>

            {!!(assignment?.notes || p.notes) && (
              <Reveal p={r[1]!} style={{ marginHorizontal: 20, marginTop: 18 }}>
                <Card style={{ flexDirection: 'row', gap: 12 }}>
                  <MessageSquareQuote size={22} color={colors.primary} />
                  <View style={{ flex: 1, gap: 6 }}>
                    {!!assignment?.notes && <Txt>{assignment.notes}</Txt>}
                    {!!p.notes && <Txt color={colors.textMuted}>{p.notes}</Txt>}
                  </View>
                </Card>
              </Reveal>
            )}

            {p.exercises.map((e, k) => (
              <ScrollReveal key={e.id} y={y} style={{ marginHorizontal: 20, marginTop: 14 }}>
                <Card onPress={() => router.push(`/exercise/${e.exerciseId}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 10 }}>
                  <Img source={e.image} fallback={workoutArt(e.category, e.exerciseId)} style={{ width: 76, height: 76, borderRadius: radius.md }} />
                  <View style={{ flex: 1 }}>
                    <Txt v="caption" color={colors.primary}>
                      {String(k + 1).padStart(2, '0')} · {pretty(e.category)}
                    </Txt>
                    <Txt v="bodyLg" numberOfLines={1}>
                      {e.name}
                    </Txt>
                    <Txt v="small" color={colors.textMuted}>
                      {e.sets} × {e.trackingType === 'duration' ? `${e.exerciseDuration ?? '—'}s` : `${e.reps ?? '—'} reps`} · rest {e.rest.defaultRestSeconds}s
                    </Txt>
                    {e.previous.length > 0 && (
                      <Txt v="caption" color={colors.textMuted}>
                        Last time: {setLabel(e.previous[0]!)}
                      </Txt>
                    )}
                  </View>
                </Card>
              </ScrollReveal>
            ))}
          </>
        )}
      </Animated.ScrollView>
      <View style={{ position: 'absolute', left: 20, right: 20, bottom: insets.bottom + 16 }}>
        <PrimaryButton title={resuming ? 'Resume workout' : 'Start workout'} icon={Play} disabled={!p?.exercises.length} onPress={go} />
      </View>
    </View>
  );
}
