import { LinearGradient } from 'expo-linear-gradient';
import { Redirect } from 'expo-router';
import { Tabs, type BottomTabBarProps } from 'expo-router/js-tabs';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, SvgXml } from 'react-native-svg';
import { useMe } from '@/api/hooks';
import { useSession } from '@/api/session';
import { NAV } from '@/assetkit';
import { colors } from '@/theme';
import { haptic, Press } from '@/ui';

const META: Record<string, { label: string; icon: string }> = {
  home: { label: 'Home', icon: 'home' },
  workout: { label: 'Workout', icon: 'workout' },
  meals: { label: 'Meals', icon: 'meals' },
  profile: { label: 'Profile', icon: 'profile' },
};
const NAV_BG = '#22262A';

const BAR_H = 76;
const FAB = 64;
const FAB_TOP = -26; // FAB sits proud of the bar, cradled by the notch with an even gap

/** Bar silhouette with a smooth notch cradling the centre button. */
function barPath(w: number) {
  const r = 30;
  const cx = w / 2;
  const half = 66;
  const depth = FAB_TOP + FAB + 8;
  return [
    `M${r},0`,
    `H${cx - half}`,
    `C${cx - half + 26},0 ${cx - 44},${depth} ${cx},${depth}`,
    `C${cx + 44},${depth} ${cx + half - 26},0 ${cx + half},0`,
    `H${w - r}`,
    `A${r},${r} 0 0 1 ${w},${r}`,
    `V${BAR_H - r}`,
    `A${r},${r} 0 0 1 ${w - r},${BAR_H}`,
    `H${r}`,
    `A${r},${r} 0 0 1 0,${BAR_H - r}`,
    `V${r}`,
    `A${r},${r} 0 0 1 ${r},0`,
    'Z',
  ].join(' ');
}

function TabItem({ name, focused, onPress }: { name: string; focused: boolean; onPress: () => void }) {
  const m = META[name]!;
  const p = useSharedValue(focused ? 1 : 0);
  useEffect(() => {
    p.value = withTiming(focused ? 1 : 0, { duration: 200, easing: Easing.out(Easing.cubic) });
  }, [focused, p]);
  const icon = useAnimatedStyle(() => ({ opacity: 0.85 + 0.15 * p.value }));
  const bar = useAnimatedStyle(() => ({ opacity: p.value }));
  return (
    <Pressable onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel={m.label} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, height: BAR_H }}>
      <Animated.View style={icon}>
        <SvgXml xml={NAV[`${m.icon}-${focused ? 'active' : 'outline'}`]!} width={28} height={28} />
      </Animated.View>
      <Animated.View style={[{ width: 18, height: 4, borderRadius: 2, backgroundColor: colors.primary }, bar]} />
    </Pressable>
  );
}

function Fab({ focused, onPress }: { focused: boolean; onPress: () => void }) {
  return (
    <View style={{ position: 'absolute', top: FAB_TOP, left: 0, right: 0, alignItems: 'center' }} pointerEvents="box-none">
      <Press accessibilityLabel="Stats" accessibilityRole="tab" accessibilityState={{ selected: focused }} onPress={onPress} scaleTo={0.92} hapticKind="medium" style={{ width: FAB, height: FAB, borderRadius: FAB / 2, overflow: 'hidden' }}>
        {/* Clean, matte lime: light top-left to deeper olive bottom-right, no glow */}
        <LinearGradient colors={['#D4F25C', '#9DBB2E']} start={{ x: 0.2, y: 0 }} end={{ x: 0.85, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <SvgXml xml={NAV['center-fab-stats']!.replace('#0A0F07', '#3E4A12')} width={26} height={26} />
        </LinearGradient>
      </Press>
    </View>
  );
}

function TabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [w, setW] = useState(0);
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
    <View style={{ position: 'absolute', left: 14, right: 14, bottom: Math.max(insets.bottom, 14) }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {/* Backdrop so content doesn't show through the notch */}
      <LinearGradient pointerEvents="none" colors={['rgba(5,6,5,0)', 'rgba(5,6,5,0.92)', colors.surface]} locations={[0, 0.45, 1]} style={{ position: 'absolute', left: -14, right: -14, top: FAB_TOP - 18, height: -FAB_TOP + 18 + BAR_H / 2 }} />
      <View pointerEvents="none" style={{ position: 'absolute', left: -14, right: -14, top: BAR_H / 2, bottom: -60, backgroundColor: colors.surface }} />
      {w > 0 && (
        <Svg width={w} height={BAR_H} style={StyleSheet.absoluteFill}>
          <Path d={barPath(w)} fill={NAV_BG} />
        </Svg>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', height: BAR_H, paddingHorizontal: 10 }}>
        {item('home')}
        {item('workout')}
        <View style={{ width: 132 }} />
        {item('meals')}
        {item('profile')}
      </View>
      <Fab focused={state.index === statsIdx} onPress={() => go('stats', routes[statsIdx]!.key, state.index === statsIdx)} />
    </View>
  );
}

export default function TabsLayout() {
  const { ready, signedIn } = useSession();
  const me = useMe(ready && signedIn);
  if (ready && !signedIn) return <Redirect href="/login" />;
  // Guests (packages only) and expired members (renew only) never see the member tabs.
  if (me.data && me.data.user.access && me.data.user.access !== 'MEMBER') return <Redirect href="/" />;
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
