import { router, useLocalSearchParams } from 'expo-router';
import { Flame, Share2, Timer, Trophy, Zap } from 'lucide-react-native';
import { useEffect, useMemo, useRef } from 'react';
import { Share, View } from 'react-native';
import Animated, { makeMutable, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { workouts } from '@/data';
import { ease, gsap, svTo, useCountUp } from '@/motion';
import { useApp } from '@/store';
import { colors, font, radius, shadow } from '@/theme';
import { haptic, HeroGlow, LimeGradient, PrimaryButton, SecondaryButton, Txt } from '@/ui';

const CONFETTI = 28;
const palette = [colors.primary, colors.primaryGlow, colors.cream, colors.carbs, colors.protein];

/** Workout summary with a GSAP-orchestrated celebration: trophy pop → confetti burst → stat count-ups. */
export default function Complete() {
  const { id, secs } = useLocalSearchParams<{ id: string; secs?: string }>();
  const w = workouts.find((x) => x.id === id) ?? workouts[0]!;
  const insets = useSafeAreaInsets();
  const logged = useRef(false);
  const minutes = Math.max(1, Math.round(Number(secs ?? w.minutes * 60) / 60));
  const kcal = Math.round((w.kcal / w.minutes) * minutes);
  useEffect(() => {
    if (logged.current) return;
    logged.current = true;
    useApp.getState().logWorkout(w.id, minutes, kcal);
    haptic('success');
  }, [w.id, minutes, kcal]);

  const trophy = useSharedValue(0);
  const text = useSharedValue(0);
  const burst = useMemo(() => Array.from({ length: CONFETTI }, () => makeMutable(0)), []);
  const seeds = useMemo(() => burst.map((_, i) => ({ a: (i / CONFETTI) * Math.PI * 2 + Math.random() * 0.4, d: 120 + Math.random() * 120, c: palette[i % palette.length]!, r: Math.random() * 360, s: 6 + Math.random() * 8 })), [burst]);
  useEffect(() => {
    const proxies = burst.map(() => ({ v: 0 }));
    const tl = gsap.timeline();
    tl.add(svTo(trophy, 1, { duration: 0.9, ease: ease.spring }))
      .to(proxies, { v: 1, duration: 1.6, ease: 'power4.out', stagger: 0.01, onUpdate: () => proxies.forEach((p, i) => (burst[i]!.value = p.v)) }, 0.15)
      .add(svTo(text, 1, { duration: 0.7 }), 0.4);
    return () => {
      tl.kill();
    };
  }, [burst, trophy, text]);
  const trophyA = useAnimatedStyle(() => ({ transform: [{ scale: trophy.value }, { rotate: `${(1 - trophy.value) * -30}deg` }] }));
  const textA = useAnimatedStyle(() => ({ opacity: text.value, transform: [{ translateY: (1 - text.value) * 30 }] }));

  const m = useCountUp(minutes, { delay: 0.6 });
  const k = useCountUp(kcal, { delay: 0.7 });
  const xp = useCountUp(minutes * 10 + 50, { delay: 0.8 });

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, paddingTop: insets.top, paddingBottom: insets.bottom + 20 }}>
      <HeroGlow height={700} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 1, height: 1, alignItems: 'center', justifyContent: 'center' }}>
          {seeds.map((sd, i) => (
            <Piece key={i} p={burst[i]!} {...sd} />
          ))}
        </View>
        <Animated.View style={[{ position: 'absolute' }, trophyA]}>
          <LimeGradient horizontal={false} style={[{ width: 150, height: 150, borderRadius: 75, alignItems: 'center', justifyContent: 'center' }, shadow.glow]}>
            <Trophy size={70} color={colors.onPrimary} strokeWidth={1.6} />
          </LimeGradient>
        </Animated.View>
      </View>
      <Animated.View style={[{ paddingHorizontal: 20 }, textA]}>
        <Txt v="h1" style={{ textAlign: 'center' }}>
          Workout complete!
        </Txt>
        <Txt color={colors.textMuted} style={{ textAlign: 'center', marginTop: 8 }}>
          {w.title} · You’re on a 4 day streak 🔥
        </Txt>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 28 }}>
          {[
            { icon: Timer, v: m, u: 'min' },
            { icon: Flame, v: k, u: 'kcal' },
            { icon: Zap, v: xp, u: 'XP' },
          ].map((x) => (
            <View key={x.u} style={{ flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, alignItems: 'center', gap: 8 }}>
              <x.icon size={22} color={colors.primary} />
              <Txt style={{ fontFamily: font.light, fontSize: 30, lineHeight: 34 }}>{x.v}</Txt>
              <Txt v="caption" color={colors.textMuted}>
                {x.u}
              </Txt>
            </View>
          ))}
        </View>
        <PrimaryButton title="Done" style={{ marginTop: 28 }} onPress={() => router.replace('/home')} />
        <SecondaryButton title="Share result" leading={<Share2 size={18} color={colors.textMuted} />} style={{ marginTop: 12 }} onPress={() => Share.share({ message: `Just crushed ${w.title} on PulseFit — ${minutes} min, ${kcal} kcal 💪` })} />
      </Animated.View>
    </View>
  );
}

function Piece({ p, a, d, c, r, s }: { p: SharedValue<number>; a: number; d: number; c: string; r: number; s: number }) {
  const st = useAnimatedStyle(() => ({
    opacity: p.value < 0.85 ? Math.min(1, p.value * 6) : (1 - p.value) * 6.6,
    transform: [{ translateX: Math.cos(a) * d * p.value }, { translateY: Math.sin(a) * d * p.value + p.value * p.value * 80 }, { rotate: `${r + p.value * 540}deg` }],
  }));
  return <Animated.View style={[{ position: 'absolute', width: s, height: s * 0.5, borderRadius: 2, backgroundColor: c, left: -s / 2, top: -s / 4 }, st]} />;
}
