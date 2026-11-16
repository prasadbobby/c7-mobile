import { router } from 'expo-router';
import { CreditCard, Dumbbell, Footprints, Gauge, Heart, Megaphone, Trophy, Wallet, type LucideIcon } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeOut, LinearTransition, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { relative } from '@/api/dates';
import { useNotifications } from '@/api/hooks';
import type { Notification } from '@/api/types';
import { ArtEmpty } from '@/badges';
import { useApp } from '@/store';
import { Reveal, useStagger } from '@/motion';
import { colors, radius } from '@/theme';
import { Card, ErrorState, HeroGlow, PulseDot, SectionHeader, Skeleton, TopBar, Txt, useTopInset } from '@/ui';

const kindIcon: Record<Notification['kind'], { icon: LucideIcon; color: string }> = {
  membership: { icon: CreditCard, color: colors.carbs },
  payment: { icon: Wallet, color: colors.calories },
  workout: { icon: Dumbbell, color: colors.primary },
  challenge: { icon: Trophy, color: colors.primary },
  social: { icon: Heart, color: colors.danger },
  steps: { icon: Footprints, color: colors.protein },
  announcement: { icon: Megaphone, color: colors.primary },
  checkup: { icon: Gauge, color: colors.primary },
};

/** Server links → app routes. */
function routeFor(n: Notification): string {
  if (n.link.startsWith('/workout-plan/')) return `/program/${n.link.split('/')[2]}`;
  if (n.link.endsWith('/post')) return `/challenge/${n.link.split('/')[2]}?tab=checkin`;
  if (n.link.endsWith('/feed')) return `/challenge/${n.link.split('/')[2]}?tab=feed`;
  if (n.link === '/steps') return '/stats';
  return n.link;
}

export default function Notifications() {
  const q = useNotifications();
  const read = useApp((st) => st.readNotifications);
  const markRead = useApp((st) => st.markRead);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const items = useMemo(() => (q.data ?? []).filter((n) => !dismissed.includes(n.id)), [q.data, dismissed]);
  const r = useStagger(items.length, { stagger: 0.06 }, [items.length > 0]);
  const top = useTopInset(0);
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <HeroGlow />
      <TopBar title="Notifications" right={<Txt v="small" color={colors.primary} onPress={() => markRead(items.map((i) => i.id))}>Read all</Txt>} />
      <Animated.ScrollView contentContainerStyle={{ padding: 20, paddingTop: 10, paddingBottom: top + 40 }}>
        {!!q.error && <ErrorState error={q.error} onRetry={() => q.refetch()} />}
        {q.isLoading && <Skeleton height={80} />}
        {!!(q.data && items.length === 0) && <ArtEmpty art="empty-notifications" title="You’re all caught up" body="Reminders about workouts, check-ins, steps and your membership show up here." />}
        {items.length > 0 && <SectionHeader overline title="Swipe left to dismiss" style={{ paddingHorizontal: 0, marginBottom: 10 }} />}
        {items.map((n, k) => (
          <Animated.View key={n.id} layout={LinearTransition.duration(220)} exiting={FadeOut.duration(180)}>
            <Reveal p={r[k] ?? r[0]!} x={30} y={0}>
              <Swipeable onDismiss={() => (markRead([n.id]), setDismissed((xs) => [...xs, n.id]))}>
                <Card onPress={() => (markRead([n.id]), router.push(routeFor(n) as never))} style={{ flexDirection: 'row', gap: 14, alignItems: 'center', marginBottom: 10 }}>
                  {(() => {
                    const K = kindIcon[n.kind] ?? kindIcon.workout;
                    return (
                      <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: K.color + '22', alignItems: 'center', justifyContent: 'center' }}>
                        <K.icon size={22} color={K.color} />
                      </View>
                    );
                  })()}
                  <View style={{ flex: 1 }}>
                    <Txt>{n.title}</Txt>
                    <Txt v="small" color={colors.textMuted}>{n.body}</Txt>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 8 }}>
                    <Txt v="caption" color={colors.textMuted}>{relative(n.at)}</Txt>
                    {!read.includes(n.id) && <PulseDot color={colors.primary} />}
                  </View>
                </Card>
              </Swipeable>
            </Reveal>
          </Animated.View>
        ))}
      </Animated.ScrollView>
    </View>
  );
}

function Swipeable({ children, onDismiss }: { children: React.ReactNode; onDismiss: () => void }) {
  const x = useSharedValue(0);
  const pan = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .onUpdate((e) => {
      x.value = Math.min(0, e.translationX);
    })
    .onEnd((e) => {
      if (e.translationX < -120) x.value = withTiming(-500, { duration: 200 }, () => runOnJS(onDismiss)());
      else x.value = withTiming(0);
    });
  const a = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }], opacity: 1 + x.value / 400 }));
  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[a, { borderRadius: radius.xl }]}>{children}</Animated.View>
    </GestureDetector>
  );
}
