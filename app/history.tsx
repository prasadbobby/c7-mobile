import { router, useLocalSearchParams } from 'expo-router';
import { Dumbbell, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { ArtEmpty } from '@/badges';
import { dayLabel, duration, shortDate } from '@/api/dates';
import { useDashboard, useDeleteWorkoutLog, useWorkoutLog, useWorkoutLogs } from '@/api/hooks';
import { compact, setLabel } from '@/api/meta';
import { Reveal, useStagger } from '@/motion';
import { colors, font } from '@/theme';
import { ActivityRow, Card, ErrorState, HeroGlow, PrimaryButton, SecondaryButton, Sheet, Skeleton, toast, TopBar, Txt } from '@/ui';

export default function History() {
  const params = useLocalSearchParams<{ log?: string }>();
  const q = useWorkoutLogs();
  const dash = useDashboard();
  const [open, setOpen] = useState<string | null>(params.log ?? null);
  useEffect(() => setOpen(params.log ?? null), [params.log]);
  const logs = q.data?.pages.flatMap((p) => p.logs) ?? [];
  const r = useStagger(Math.min(logs.length, 20) + 1, { stagger: 0.05 }, [logs.length > 0]);
  const total = q.data?.pages[0]?.total ?? 0;
  const mins = logs.reduce((a, l) => a + l.duration / 60, 0);
  const vol = logs.reduce((a, l) => a + l.volume, 0);
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <HeroGlow />
      <TopBar title="Workout History" right={<View style={{ width: 48 }} />} />
      <Animated.ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 12 }}>
        {q.error ? (
          <ErrorState error={q.error} onRetry={() => q.refetch()} />
        ) : q.isLoading ? (
          <>
            <Skeleton height={90} />
            <Skeleton height={80} />
            <Skeleton height={80} />
          </>
        ) : logs.length === 0 ? (
          <ArtEmpty art="empty-workouts" title="No workouts yet" body="Your completed sessions will show up here." action={<PrimaryButton title="Browse workouts" onPress={() => router.navigate('/workout')} style={{ alignSelf: 'stretch', marginTop: 12 }} />} />
        ) : (
          <Reveal p={r[0]!} style={{ flexDirection: 'row', gap: 12 }}>
            {[
              { l: 'Sessions', v: String(total) },
              { l: 'Day streak', v: String(dash.data?.cards.dailyStreak ?? 0) },
              { l: 'Volume kg', v: compact(Math.round(vol)) },
            ].map((x) => (
              <Card key={x.l} style={{ flex: 1 }}>
                <Txt v="caption" color={colors.textMuted}>
                  {x.l}
                </Txt>
                <Txt style={{ fontFamily: font.light, fontSize: 26 }}>{x.v}</Txt>
              </Card>
            ))}
          </Reveal>
        )}
        {logs.map((l, k) => (
          <Reveal key={l.id} p={r[Math.min(k + 1, r.length - 1)]!}>
            <ActivityRow icon={Dumbbell} tone={k % 3 === 0 ? 'lime' : k % 3 === 1 ? 'danger' : 'deep'} title={l.planName} time={`${dayLabel(l.date)} · ${l.setCount} sets`} value={Math.round(l.duration / 60)} unit="/min" onPress={() => setOpen(l.id)} />
          </Reveal>
        ))}
        {q.hasNextPage && <SecondaryButton title={q.isFetchingNextPage ? 'Loading…' : 'Load more'} onPress={() => q.fetchNextPage()} />}
        {logs.length > 0 && (
          <Txt v="caption" color={colors.textMuted} style={{ textAlign: 'center' }}>
            {Math.round(mins)} minutes trained across the sessions shown
          </Txt>
        )}
      </Animated.ScrollView>
      <LogSheet id={open} onClose={() => setOpen(null)} />
    </View>
  );
}

function LogSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const q = useWorkoutLog(id ?? undefined);
  const del = useDeleteWorkoutLog();
  const [confirm, setConfirm] = useState(false);
  const l = q.data;
  return (
    <Sheet open={!!id} onClose={() => (setConfirm(false), onClose())} title={l?.planName ?? 'Workout'}>
      {!l ? (
        q.error ? <ErrorState error={q.error} style={{ margin: 0 }} /> : <Skeleton height={160} />
      ) : (
        <>
          <Txt v="small" color={colors.textMuted} style={{ marginBottom: 12 }}>
            {shortDate(l.date)} · {duration(l.duration)}
            {l.totalRestTimeSeconds ? ` · ${duration(l.totalRestTimeSeconds)} rest` : ''}
          </Txt>
          <ScrollView style={{ maxHeight: 340 }}>
            {l.exercises.map((e) => (
              <Card key={e.id} onPress={() => (onClose(), router.push(`/exercise/${e.exerciseId}`))} style={{ marginBottom: 10, gap: 4, backgroundColor: colors.secondary }}>
                <Txt v="bodyLg">{e.name}</Txt>
                <Txt v="small" color={colors.textMuted}>
                  {e.sets.map(setLabel).join('  ·  ')}
                </Txt>
              </Card>
            ))}
          </ScrollView>
          <PrimaryButton title="Do this workout again" style={{ marginTop: 12 }} onPress={() => (onClose(), router.push(`/program/${l.planId}?plan=1`))} />
          {confirm ? (
            <SecondaryButton
              title={del.isPending ? 'Deleting…' : 'Tap again to delete permanently'}
              leading={<Trash2 size={18} color={colors.danger} />}
              style={{ marginTop: 12 }}
              onPress={() => del.mutate(l.id, { onSuccess: () => (setConfirm(false), onClose(), toast.ok('Workout deleted')), onError: toast.error })}
            />
          ) : (
            <Txt v="small" color={colors.danger} style={{ textAlign: 'center', marginTop: 16 }} onPress={() => setConfirm(true)}>
              Delete this workout
            </Txt>
          )}
        </>
      )}
    </Sheet>
  );
}
