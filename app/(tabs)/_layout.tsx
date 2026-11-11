import { BlurView } from 'expo-blur';
import { Tabs, type BottomTabBarProps } from 'expo-router/js-tabs';
import { ChartColumn, Dumbbell, House, UserRound, UtensilsCrossed, type LucideIcon } from 'lucide-react-native';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadow } from '@/theme';
import { haptic, Press, Txt } from '@/ui';

const META: Record<string, { label: string; icon: LucideIcon }> = {
  home: { label: 'Home', icon: House },
  workout: { label: 'Workout', icon: Dumbbell },
  meals: { label: 'Meals', icon: UtensilsCrossed },
  profile: { label: 'Profile', icon: UserRound },
};

function TabItem({ name, focused, onPress }: { name: string; focused: boolean; onPress: () => void }) {
  const m = META[name]!;
  const p = useSharedValue(focused ? 1 : 0);
  useEffect(() => {
    p.value = withSpring(focused ? 1 : 0, { damping: 14, stiffness: 220 });
  }, [focused, p]);
  const icon = useAnimatedStyle(() => ({ transform: [{ translateY: -2 * p.value }, { scale: 1 + 0.08 * p.value }] }));
  const dot = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ scale: p.value }] }));
  return (
    <Pressable onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel={m.label} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
      <Animated.View style={icon}>
        <m.icon size={24} color={focused ? colors.primary : colors.textMuted} strokeWidth={1.8} />
      </Animated.View>
      <Txt v="small" color={focused ? colors.primary : colors.textMuted}>
        {m.label}
      </Txt>
      <Animated.View style={[{ width: 5, height: 5, borderRadius: 3, backgroundColor: colors.primary }, dot]} />
    </Pressable>
  );
}

function Fab({ focused, onPress }: { focused: boolean; onPress: () => void }) {
  const g = useSharedValue(0);
  useEffect(() => {
    g.value = withRepeat(withSequence(withTiming(1, { duration: 1600 }), withTiming(0, { duration: 1600 })), -1);
  }, [g]);
  const halo = useAnimatedStyle(() => ({ opacity: 0.25 + g.value * 0.25, transform: [{ scale: 1 + g.value * 0.12 }] }));
  return (
    <View style={{ position: 'absolute', top: -34, left: 0, right: 0, alignItems: 'center' }} pointerEvents="box-none">
      <Animated.View style={[{ position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary }, halo]} />
      <Press accessibilityLabel="Stats" onPress={onPress} scaleTo={0.88} hapticKind="medium" style={[{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: focused ? 4 : 0, borderColor: 'rgba(5,6,5,0.35)' }, shadow.glow]}>
        <ChartColumn size={30} color={colors.onPrimary} strokeWidth={2.2} />
      </Press>
    </View>
  );
}

function TabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const go = (_name: string, key: string, focused: boolean) => {
    haptic();
    const e = emitter.emit({ type: 'tabPress', target: key, canPreventDefault: true });
    if (!focused && !e.defaultPrevented) navigateToTab(key);
  };
  const routes = state.routes;
  const item = (name: string) => {
    const i = routes.findIndex((r) => r.name === name);
    const r = routes[i]!;
    return <TabItem key={name} name={name} focused={state.index === i} onPress={() => go(name, r.key, state.index === i)} />;
  };
  const statsIdx = routes.findIndex((r) => r.name === 'stats');
  return (
    <View style={{ position: 'absolute', left: 12, right: 12, bottom: Math.max(insets.bottom, 12) }}>
      <View style={{ borderRadius: 36, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(21,24,22,0.86)' }]} />
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', paddingTop: 18, paddingBottom: 12, paddingHorizontal: 8 }}>
          {item('home')}
          {item('workout')}
          <View style={{ flex: 1.1 }} />
          {item('meals')}
          {item('profile')}
        </View>
      </View>
      <Fab focused={state.index === statsIdx} onPress={() => go('stats', routes[statsIdx]!.key, state.index === statsIdx)} />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={(p) => <TabBar {...p} />} screenOptions={{ headerShown: false, animation: 'shift', sceneStyle: { backgroundColor: colors.surface } }}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="workout" />
      <Tabs.Screen name="stats" />
      <Tabs.Screen name="meals" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
