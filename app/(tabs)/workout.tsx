import { router } from 'expo-router';
import { CalendarDays, Check, History, Play, Timer } from 'lucide-react-native';
import { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { dayLabel, duration, today, ymd } from '@/api/dates';
import { useAssignments, useDashboard, useWorkoutLogs } from '@/api/hooks';

import type { Assignment } from '@/api/types';
import { ArtEmpty } from '@/badges';
import { workoutArt } from '@/data';
import { Reveal, ScrollReveal, useHeaderFade, useScrollY, useStagger } from '@/motion';
import { colors, radius } from '@/theme';
import { Card, ErrorState, FadeBottom, HeroGlow, Img, LimeGradient, Press, SectionHeader, Skeleton, TAB_BAR_SPACE, Txt, useTopInset } from '@/ui';

/** The day an assignment belongs to: its due date, else the day it was assigned. */
const dayOf = (a: Assignment) => ymd(new Date(a.dueDate ?? a.assignedAt));
const open = (a: Assignment) => a.status === 'PENDING' || a.status === 'IN_PROGRESS';

/** Workout tab — only workouts the coach assigned in FitForge, grouped by date. */
export default function Workout() {
  const top = useTopInset(12);
  const { width } = useWindowDimensions();
  const { y, onScroll } = useScrollY();
  const q = useAssignments('all');
  const dash = useDashboard();
  const logs = useWorkoutLogs();
  const r = useStagger(2);
  const titleA = useAnimatedStyle(() => ({ transform: [{ scale: interpolate(y.value, [-100, 0], [1.1, 1], Extrapolation.CLAMP) }] }));
  const compact = useHeaderFade(y, 60, 110);
  const t = today();

  const groups = useMemo(() => {
    const all = q.data ?? [];
    const todayList = all.filter((a) => open(a) && dayOf(a) <= t);
    const upcoming = all.filter((a) => open(a) && dayOf(a) > t).sort((a, b) => dayOf(a).localeCompare(dayOf(b)));
    const done = all.filter((a) => !open(a)).sort((a, b) => dayOf(b).localeCompare(dayOf(a)));
    return [
      { key: 'today', title: 'Today', items: todayList, empty: 'Nothing due today.' },
      { key: 'upcoming', title: 'Upcoming', items: upcoming, empty: '' },
      { key: 'done', title: 'Completed & earlier', items: done.slice(0, 12), empty: '' },
    ].filter((g) => g.items.length || g.key === 'today');
  }, [q.data, t]);
  const recent = (logs.data?.pages[0]?.logs ?? []).slice(0, 4);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <HeroGlow />
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5, paddingTop: top, paddingBottom: 14, alignItems: 'center', backgroundColor: 'rgba(5,6,5,0.92)', borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border }, compact]}>
        <Txt v="h3">Workouts</Txt>
      </Animated.View>
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: top, paddingBottom: TAB_BAR_SPACE }}>
        <Reveal p={r[0]!} style={{ paddingHorizontal: 20 }}>
          <Animated.View style={[{ transformOrigin: 'left' }, titleA]}>
            <Txt v="h1">Workouts</Txt>
            <Txt color={colors.textMuted}>{dash.data ? `${dash.data.cards.weeklyWorkouts} sessions this week · assigned by your coach` : ' '}</Txt>
          </Animated.View>
        </Reveal>

        {q.error ? (
          <ErrorState error={q.error} onRetry={() => q.refetch()} />
        ) : q.isLoading ? (
          <View style={{ padding: 20, gap: 12 }}>
            <Skeleton height={200} radius={radius.xxl} />
            <Skeleton height={96} />
          </View>
        ) : !q.data?.length ? (
          <ArtEmpty art="empty-workouts" title="No workouts assigned yet" body="Your coach builds routines in the C7 dashboard and assigns them to you. They’ll appear here by date." />
        ) : (
          groups.map((g, gi) => (
            <View key={g.key} style={{ marginTop: gi ? 26 : 22 }}>
              <SectionHeader title={g.title} action={<Txt v="small" color={colors.textMuted}>{g.items.length || ''}</Txt>} />
              {g.items.length === 0 && (
                <Card style={{ marginHorizontal: 20, marginTop: 12 }}>
                  <Txt color={colors.textMuted}>{g.empty}</Txt>
                </Card>
              )}
              {g.items.map((a, k) =>
                g.key === 'today' ? (
                  <ScrollReveal key={a.id} y={y} style={{ marginHorizontal: 20, marginTop: 12 }}>
                    <Press onPress={() => router.push(`/program/${a.id}`)} scaleTo={0.98} accessibilityLabel={a.plan.name} style={{ height: Math.round(Math.min(230, width * 0.52)), borderRadius: radius.xxl, overflow: 'hidden' }}>
                      <Img source={a.plan.image} fallback={workoutArt(a.plan.trainingType, a.plan.id)} style={StyleSheet.absoluteFill} />
                      <FadeBottom />
                      <View style={{ position: 'absolute', top: 16, left: 16, backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 }}>
                        <Txt v="caption" color={colors.onPrimary}>
                          {a.status === 'IN_PROGRESS' ? 'IN PROGRESS' : dayOf(a) < t ? 'CARRIED OVER' : 'TODAY'}
                        </Txt>
                      </View>
                      <View style={{ position: 'absolute', left: 18, right: 18, bottom: 18, flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
                        <View style={{ flex: 1 }}>
                          <Txt v="h2" numberOfLines={1}>
                            {a.plan.name}
                          </Txt>
                          <Txt v="small" color={colors.textMuted} numberOfLines={1}>
                            {a.plan.exerciseCount} exercises · ~{a.plan.estimatedMinutes} min · {a.assignedBy.name}
                          </Txt>
                        </View>
                        <LimeGradient style={{ width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' }}>
                          <Play size={22} color={colors.onPrimary} fill={colors.onPrimary} style={{ marginLeft: 3 }} />
                        </LimeGradient>
                      </View>
                    </Press>
                  </ScrollReveal>
                ) : (
                  <ScrollReveal key={a.id} y={y} style={{ marginHorizontal: 20, marginTop: 12 }}>
                    <Card onPress={() => router.push(`/program/${a.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 10, opacity: g.key === 'done' ? 0.8 : 1 }}>
                      <Img source={a.plan.image} fallback={workoutArt(a.plan.trainingType, a.plan.id)} style={{ width: 70, height: 70, borderRadius: radius.md }} />
                      <View style={{ flex: 1, gap: 4 }}>
                        <Txt v="bodyLg" numberOfLines={1}>
                          {a.plan.name}
                        </Txt>
                        <View style={{ flexDirection: 'row', gap: 14, flexWrap: 'wrap' }}>
                          <Meta icon={<CalendarDays size={14} color={colors.textMuted} />} t={dayLabel(a.dueDate ?? a.assignedAt).replace(/ at .*/, '')} />
                          <Meta icon={<Timer size={14} color={colors.textMuted} />} t={`~${a.plan.estimatedMinutes} min`} />
                        </View>
                      </View>
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: a.status === 'COMPLETED' ? colors.primary : colors.secondary, alignItems: 'center', justifyContent: 'center' }}>
                        {a.status === 'COMPLETED' ? <Check size={18} color={colors.onPrimary} strokeWidth={3} /> : a.status === 'SKIPPED' ? <Txt v="caption" color={colors.textMuted}>—</Txt> : <Play size={16} color={colors.text} fill={colors.text} />}
                      </View>
                    </Card>
                  </ScrollReveal>
                ),
              )}
            </View>
          ))
        )}

        {recent.length > 0 && (
          <>
            <SectionHeader title="Recent sessions" style={{ marginTop: 28 }} action={<Txt v="small" color={colors.primary} onPress={() => router.push('/history')}>History</Txt>} />
            {recent.map((l) => (
              <View key={l.id} style={{ marginHorizontal: 20, marginTop: 12 }}>
                <Card onPress={() => router.push(`/history?log=${l.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' }}>
                    <History size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Txt v="bodyLg" numberOfLines={1}>{l.planName}</Txt>
                    <Txt v="small" color={colors.textMuted}>
                      {dayLabel(l.date)} · {duration(l.duration)} · {l.setCount} sets
                    </Txt>
                  </View>
                </Card>
              </View>
            ))}
          </>
        )}
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
