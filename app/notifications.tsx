import { router } from 'expo-router';
import { Award, BellOff, Flame, Heart, Trophy, Utensils, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeOut, LinearTransition, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { notifications } from '@/data';
import { Reveal, useStagger } from '@/motion';
import { colors, radius } from '@/theme';
import { Card, EmptyState, HeroGlow, PulseDot, SectionHeader, TopBar, Txt, useTopInset } from '@/ui';

const kindIcon: Record<string, { icon: LucideIcon; color: string }> = {
  streak: { icon: Flame, color: colors.calories },
  challenge: { icon: Trophy, color: colors.primary },
  social: { icon: Heart, color: colors.danger },
  rank: { icon: Award, color: colors.carbs },
  meal: { icon: Utensils, color: colors.protein },
};

export default function Notifications() {
  const [items, setItems] = useState(notifications);
  const r = useStagger(items.length, { stagger: 0.06 });
  const top = useTopInset(0);
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <HeroGlow />
      <TopBar title="Notifications" right={<Txt v="small" color={colors.primary} onPress={() => setItems(items.map((i) => ({ ...i, unread: false })))}>Read all</Txt>} />
      <Animated.ScrollView contentContainerStyle={{ padding: 20, paddingTop: 10, paddingBottom: top + 40 }}>
        {items.length === 0 && <EmptyState icon={BellOff} title="You’re all caught up" body="We’ll let you know when something new happens." />}
        {items.length > 0 && <SectionHeader overline title="Swipe left to dismiss" style={{ paddingHorizontal: 0, marginBottom: 10 }} />}
        {items.map((n, k) => (
          <Animated.View key={n.id} layout={LinearTransition.springify()} exiting={FadeOut.duration(180)}>
            <Reveal p={r[k] ?? r[0]!} x={30} y={0}>
              <Swipeable onDismiss={() => setItems((xs) => xs.filter((x) => x.id !== n.id))}>
                <Card onPress={() => router.push(n.kind === 'challenge' ? '/challenges' : n.kind === 'rank' ? '/leaderboard' : n.kind === 'streak' ? '/streak' : '/meals')} style={{ flexDirection: 'row', gap: 14, alignItems: 'center', marginBottom: 10 }}>
                  {(() => {
                    const K = kindIcon[n.kind]!;
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
                    <Txt v="caption" color={colors.textMuted}>{n.time}</Txt>
                    {n.unread && <PulseDot color={colors.primary} />}
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
