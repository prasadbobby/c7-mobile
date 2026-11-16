import { router } from 'expo-router';
import { ChevronRight, Dumbbell, Footprints, Gauge, HeartPulse, Megaphone, PersonStanding, Salad, SlidersHorizontal, Trophy } from 'lucide-react-native';
import { useAnnouncements, useBmi } from '@/api/gym';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import Animated from 'react-native-reanimated';
import { addDays, dayLabel, today, ymd } from '@/api/dates';
import { useAssignments, useChallenges, useDashboard, useMe, useNotifications, useNutrition, useRequestChallengeAccess, useSteps, useStreaks, useWorkoutLogs } from '@/api/hooks';
import { workoutArt, weekDays } from '@/data';
import { WaterIcon } from '@/icons';
import { Reveal, ScrollReveal, useCountUp, useScrollY, useStagger } from '@/motion';
import { referenceWorkouts } from '@/reference';
import { useApp } from '@/store';
import { colors, font, radius, shadow } from '@/theme';
import { ActivityRow, Card, Chip, Greeting, Img, LimeGradient, MediaCard, PillButton, Press, Ring, Screen, SectionHeader, Skeleton, TAB_BAR_SPACE, toast, Txt, type Source } from '@/ui';

/** Same three chips as the original design. They show reference routines; real workouts are coach-assigned. */
const categories = [
  { id: 'warmup', label: 'Warm Up', icon: PersonStanding },
  { id: 'cardio', label: 'Cardio', icon: HeartPulse },
  { id: 'strength', label: 'Strength', icon: Dumbbell },
] as const;
type Cat = (typeof categories)[number]['id'];

export default function Home() {
  const me = useMe();
  const notes = useNotifications();
  const read = useApp((s) => s.readNotifications);
  const assignments = useAssignments('all');
  const challenges = useChallenges();
  const streaks = useStreaks();
  const steps = useSteps();
  const dash = useDashboard();
  const logs = useWorkoutLogs();
  const request = useRequestChallengeAccess();
  const { y, onScroll } = useScrollY();
  const ann = useAnnouncements();
  const bmiQ = useBmi();
  const firstUnread = ann.data?.announcements.find((a) => !a.read);
  const chk = bmiQ.data?.checkup;
  const notice = firstUnread
    ? { title: firstUnread.title, body: firstUnread.body, to: '/announcements', icon: Megaphone, tone: firstUnread.kind === 'PAYMENT' ? colors.carbs : firstUnread.kind === 'CLOSURE' ? colors.danger : colors.primary }
    : chk && chk.daysLeft <= 3
      ? { title: chk.overdue ? 'BMI check-up overdue' : chk.daysLeft <= 0 ? 'BMI check-up today' : `BMI check-up in ${chk.daysLeft} day${chk.daysLeft === 1 ? '' : 's'}`, body: 'Log your weight so your coach can track progress', to: '/bmi', icon: Gauge, tone: chk.overdue ? colors.danger : colors.primary }
      : null;
  const { width } = useWindowDimensions();
  const [cat, setCat] = useState<Cat | null>(null);
  const [desc, setDesc] = useState(true);
  const r = useStagger(5, { stagger: 0.09, delay: 0.05 });

  // Week strip (Sun–Sat). Selecting a day drives the cards, the rings card and the activity list.
  const now = new Date();
  const week = Array.from({ length: 7 }, (_, k) => addDays(now, k - now.getDay()));
  const [day, setDay] = useState(now.getDay());
  const selected = week[day]!;
  const sel = ymd(selected);
  const isToday = sel === today();
  const food = useNutrition(sel);
  const dayInfo = (d: Date) => streaks.data?.days.find((x) => x.date === ymd(d));
  const ringFor = (d: Date) => {
    const x = dayInfo(d);
    return x ? [x.workout, x.steps, x.checkIn].filter(Boolean).length / 3 : 0;
  };

  // Assigned workouts for the selected day: due that day, or (no due date) assigned that day; still-open ones also show today.
  const dayKey = (iso: string | null | undefined) => (iso ? ymd(new Date(iso)) : null);
  const assignedForDay = useMemo(
    () =>
      (assignments.data ?? []).filter((a) => {
        const due = dayKey(a.dueDate);
        if (due) return due === sel || (isToday && due < sel && (a.status === 'PENDING' || a.status === 'IN_PROGRESS'));
        const given = dayKey(a.assignedAt)!;
        return given === sel || (isToday && given < sel && (a.status === 'PENDING' || a.status === 'IN_PROGRESS'));
      }),
    [assignments.data, sel, isToday],
  );
  const loggedForDay = (logs.data?.pages[0]?.logs ?? []).filter((l) => dayKey(l.date) === sel);

  const list = useMemo(() => {
    if (cat)
      return referenceWorkouts.filter((w) => w.category === cat).map((w) => ({ key: w.id, image: w.image as Source, fallback: undefined, title: w.title, minutes: w.minutes, badge: 'REFERENCE', to: `/reference/${w.id}` }));
    return assignedForDay.map((a) => ({ key: a.id, image: a.plan.image as Source, fallback: workoutArt(a.plan.trainingType, a.plan.id), title: a.plan.name, minutes: a.plan.estimatedMinutes, badge: a.status === 'COMPLETED' ? 'DONE' : a.status === 'IN_PROGRESS' ? 'IN PROGRESS' : a.status === 'SKIPPED' ? 'SKIPPED' : 'FROM COACH', to: `/program/${a.id}` }));
  }, [cat, assignedForDay]);
  const cards = useStagger(list.length, { stagger: 0.06, duration: 0.5 }, [cat, sel, list.length]);
  const cardW = Math.min(180, Math.max(150, (width - 52) / 2.2));

  const dayLog = isToday ? steps.data?.todayLog : steps.data?.monthlyLogs.find((l) => l.date.slice(0, 10) === sel);
  const daySteps = dayLog?.actualSteps ?? 0;
  const stepTarget = dayLog?.targetSteps || steps.data?.activeGoal?.dailyTarget || 0;
  const stepsCount = useCountUp(daySteps, { delay: 0.2 });
  const waterGoal = food.data?.goal.waterMl ?? 2500;
  const water = food.data?.waterMl ?? 0;

  const featured = challenges.data?.find((c) => c.access === 'enabled') ?? challenges.data?.[0];
  const others = (challenges.data ?? []).filter((c) => c.id !== featured?.id);
  const unread = (notes.data ?? []).some((n) => !read.includes(n.id));

  const activity = useMemo(() => {
    const rows: { id: string; icon: typeof Footprints; tone: 'lime' | 'danger' | 'deep'; title: string; time: string; value: number; unit: string; at: number; go: () => void }[] = [];
    if (dayLog) rows.push({ id: 'steps', icon: Footprints, tone: 'lime', title: 'Walking', time: isToday ? 'Today' : dayLabel(selected), value: daySteps, unit: '/steps', at: selected.getTime() + 2, go: () => router.push('/stats') });
    if (food.data?.meals.length) rows.push({ id: 'food', icon: Salad, tone: 'deep', title: 'Nutrition', time: isToday ? 'Today' : dayLabel(selected), value: Math.round(food.data.totals.kcal), unit: '/kcal', at: selected.getTime() + 1, go: () => router.push('/meals') });
    for (const a of loggedForDay) rows.push({ id: a.id, icon: Dumbbell, tone: 'danger', title: a.planName, time: dayLabel(a.date), value: Math.round(a.duration / 60), unit: '/min', at: new Date(a.date).getTime(), go: () => router.push(`/history?log=${a.id}`) });
    return rows.sort((a, b) => (desc ? b.at - a.at : a.at - b.at));
  }, [dayLog, daySteps, food.data, loggedForDay, desc, isToday, selected]);

  return (
    <Screen>
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }}>
        <Reveal p={r[0]!}>
          <Greeting name={me.data?.user.firstName || 'there'} avatar={me.data?.user.imageUrl} unread={unread} subtitle={dash.data?.cards.pendingAssignments ? `${dash.data.cards.pendingAssignments} workout${dash.data.cards.pendingAssignments === 1 ? '' : 's'} from your coach` : 'Get ready'} />
        </Reveal>

        {/* Challenge pill — always on top, like the original design */}
        <Reveal p={r[1]!} scale={0.92} style={{ marginHorizontal: 20, marginTop: 26 }}>
          <Press onPress={() => router.push(featured ? `/challenge/${featured.id}` : '/challenges')} scaleTo={0.97} style={[{ borderRadius: radius.pill, overflow: 'hidden' }, shadow.card]} accessibilityLabel="Challenge">
            <LimeGradient style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 8, paddingRight: 12 }}>
              <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
                <Trophy size={30} color={colors.text} strokeWidth={1.6} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt v="h3" color={colors.onPrimary} numberOfLines={1}>
                  {featured?.access === 'enabled' ? featured.title : 'New Challenge'}
                </Txt>
                <Txt v="body" color="rgba(10,15,7,0.75)" numberOfLines={1}>
                  {!featured
                    ? challenges.isLoading
                      ? ' '
                      : 'Coming soon from your coach'
                    : featured.access === 'enabled' && featured.stats
                      ? `${featured.stats.completedDays} check-ins · ${featured.stats.streak} day streak`
                      : featured.title}
                </Txt>
              </View>
              <PillButton
                title={!featured ? 'VIEW' : featured.access === 'enabled' ? `DAY ${Math.min(featured.stats?.daysPassed ?? 1, featured.stats?.totalDays ?? 90)}` : featured.access === 'requested' ? 'PENDING' : 'START'}
                tone="cream"
                onPress={() => {
                  if (featured?.access === 'none') request.mutate(featured.id, { onSuccess: () => toast.ok('Request sent — your coach will add you'), onError: toast.error });
                  router.push(featured ? `/challenge/${featured.id}` : '/challenges');
                }}
              />
            </LimeGradient>
          </Press>
        </Reveal>

        {/* Studio notice: newest unread announcement, else a due BMI check-up */}
        {!!notice && (
          <Press onPress={() => router.push(notice.to as never)} scaleTo={0.99} accessibilityLabel={notice.title} style={{ marginHorizontal: 20, marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: radius.md, backgroundColor: colors.card, borderLeftWidth: 3, borderLeftColor: notice.tone }}>
            <notice.icon size={18} color={notice.tone} />
            <View style={{ flex: 1 }}>
              <Txt v="small" numberOfLines={1} style={{ fontFamily: font.medium }}>
                {notice.title}
              </Txt>
              <Txt v="caption" color={colors.textMuted} numberOfLines={1}>
                {notice.body}
              </Txt>
            </View>
            <ChevronRight size={16} color={colors.textDim} />
          </Press>
        )}

        {/* Week strip — rings fill as you train, hit steps and check in */}
        <Reveal p={r[2]!} style={{ flexDirection: 'row', paddingHorizontal: 12, marginTop: 26 }}>
          {week.map((d, k) => {
            const active = k === day;
            const v = ringFor(d);
            return (
              <Pressable key={k} onPress={() => (setDay(k), setCat(null))} style={{ flex: 1, alignItems: 'center', gap: 12 }} accessibilityLabel={`${weekDays[k]} ${d.getDate()}`}>
                <Txt color={active ? colors.primary : colors.textMuted}>{weekDays[k]}</Txt>
                <Ring value={v} size={46} stroke={2} color={active ? colors.primary : colors.text} track={v ? 'rgba(255,255,255,0.12)' : 'transparent'} delay={0.3 + k * 0.05}>
                  <Txt v="bodyLg" color={active ? colors.primary : colors.text}>
                    {d.getDate()}
                  </Txt>
                </Ring>
              </Pressable>
            );
          })}
        </Reveal>

        {/* Category chips */}
        <Reveal p={r[3]!}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 20, marginTop: 26 }}>
            {categories.map((c) => (
              <Chip key={c.id} label={c.label} icon={c.icon} active={cat === c.id} onPress={() => setCat(cat === c.id ? null : c.id)} />
            ))}
          </ScrollView>
        </Reveal>

        {/* Workout cards — coach-assigned for the selected day, or reference routines for a chip */}
        {!cat && assignments.isLoading ? (
          <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginTop: 16 }}>
            <Skeleton width={cardW} height={184} />
            <Skeleton width={cardW} height={184} />
          </View>
        ) : list.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={cardW + 12} decelerationRate="fast" contentContainerStyle={{ gap: 12, paddingHorizontal: 20, marginTop: 16 }}>
            {list.map((w, k) => (
              <Reveal key={w.key} p={cards[k] ?? cards[0]!} x={24} y={0}>
                <MediaCard image={w.image} fallback={w.fallback} title={w.title} minutes={w.minutes} badge={w.badge} width={cardW} onPress={() => router.push(w.to as never)} />
              </Reveal>
            ))}
          </ScrollView>
        ) : (
          <Card style={{ marginHorizontal: 20, marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Dumbbell size={22} color={colors.textMuted} />
            <Txt color={colors.textMuted} style={{ flex: 1 }}>
              {isToday ? 'No workout assigned for today. Your coach adds workouts in C7.' : `No workout assigned for ${dayLabel(selected)}.`}
            </Txt>
          </Card>
        )}

        {/* Today rings */}
        <ScrollReveal y={y} style={{ marginHorizontal: 20, marginTop: 28 }}>
          <Card onPress={() => router.push('/stats')} style={{ flexDirection: 'row', alignItems: 'center', gap: 18, padding: 18 }}>
            <Ring key={sel} value={stepTarget ? daySteps / stepTarget : 0} size={92} stroke={9}>
              <Ring value={water / waterGoal} size={64} stroke={7} color={colors.protein} track="rgba(22,179,235,0.15)" />
            </Ring>
            <View style={{ flex: 1, gap: 8 }}>
              <Txt v="overline" color={colors.textMuted}>
                {isToday ? 'Today' : selected.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}
              </Txt>
              <Txt style={{ fontFamily: font.light, fontSize: 28 }}>
                {stepsCount.toLocaleString()}
                <Txt v="small" color={colors.textMuted}>
                  {' '}
                  {stepTarget ? `/ ${stepTarget.toLocaleString()} steps` : 'steps'}
                </Txt>
              </Txt>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <WaterIcon size={16} />
                <Txt v="small" color={colors.textMuted}>
                  {(water / 1000).toFixed(2)}L of {(waterGoal / 1000).toFixed(1)}L water
                </Txt>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textMuted} />
          </Card>
        </ScrollReveal>

        {/* Recent activity */}
        <ScrollReveal y={y} style={{ marginTop: 30 }}>
          <SectionHeader
            title="Recent Activity"
            action={
              <Pressable onPress={() => setDesc(!desc)} accessibilityLabel="Sort activity" hitSlop={10}>
                <SlidersHorizontal size={22} color={colors.text} strokeWidth={1.8} />
              </Pressable>
            }
          />
        </ScrollReveal>
        {activity.length === 0 && !dash.isLoading && (
          <Txt color={colors.textMuted} style={{ marginHorizontal: 20, marginTop: 12 }}>
            {isToday ? 'Nothing logged yet today. Start a workout or log your steps.' : 'Nothing logged on this day.'}
          </Txt>
        )}
        {activity.map((a) => (
          <ScrollReveal key={a.id} y={y} style={{ marginHorizontal: 20, marginTop: 12 }}>
            <ActivityRow icon={a.icon} tone={a.tone} title={a.title} time={a.time} value={a.value} unit={a.unit} onPress={a.go} />
          </ScrollReveal>
        ))}

        {/* Challenges */}
        {others.length > 0 && (
          <>
            <ScrollReveal y={y} style={{ marginTop: 30 }}>
              <SectionHeader title="Challenges" action={<Txt v="small" color={colors.primary} onPress={() => router.push('/challenges')}>See all</Txt>} />
            </ScrollReveal>
            <ScrollReveal y={y}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 20, marginTop: 14 }}>
                {others.map((c) => (
                  <Press key={c.id} onPress={() => router.push(`/challenge/${c.id}`)} style={{ width: 220, borderRadius: radius.xl, backgroundColor: colors.card, overflow: 'hidden' }}>
                    <Img source={workoutArt('functional', c.id)} style={{ height: 110 }} />
                    <View style={{ padding: 14, gap: 4 }}>
                      <Txt v="bodyLg" numberOfLines={1}>{c.title}</Txt>
                      <Txt v="small" color={colors.textMuted}>
                        {c.participants.toLocaleString()} joined
                      </Txt>
                    </View>
                  </Press>
                ))}
              </ScrollView>
            </ScrollReveal>
          </>
        )}
      </Animated.ScrollView>
    </Screen>
  );
}
