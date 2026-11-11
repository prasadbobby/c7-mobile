import { BlurView } from 'expo-blur';
import { router, useLocalSearchParams } from 'expo-router';
import { Pause, Play, SkipBack, SkipForward, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { workouts } from '@/data';
import { ease, svTo, useTimeline } from '@/motion';
import { colors, font, radius } from '@/theme';
import { Card, haptic, IconButton, Img, Press, Ring, Sheet, PrimaryButton, SecondaryButton, Txt } from '@/ui';

/** Active workout player: per-step countdown ring, rest states, next-up preview. */
export default function Session() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const w = workouts.find((x) => x.id === id) ?? workouts[0]!;
  const insets = useSafeAreaInsets();
  const [idx, setIdx] = useState(0);
  const [left, setLeft] = useState(w.steps[0]!.seconds);
  const [running, setRunning] = useState(true);
  const [quit, setQuit] = useState(false);
  const elapsed = useRef(0);
  const step = w.steps[idx]!;
  const rest = step.name === 'Rest';

  const finish = () => router.replace({ pathname: '/complete', params: { id: w.id, secs: String(elapsed.current) } });
  const go = (n: number) => {
    if (n >= w.steps.length) return finish();
    const k = Math.max(0, n);
    setIdx(k);
    setLeft(w.steps[k]!.seconds);
    haptic('medium');
  };

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      elapsed.current += 1;
      setLeft((l) => {
        if (l <= 1) {
          setTimeout(() => go(idx + 1), 0);
          return 0;
        }
        if (l <= 4) haptic();
        return l - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, idx]);

  // GSAP: step title slides up, counter punches in.
  const title = useSharedValue(0);
  const punch = useSharedValue(0);
  useTimeline((tl) => {
    title.value = 0;
    punch.value = 0;
    tl.add(svTo(title, 1, { duration: 0.6, ease: ease.out })).add(svTo(punch, 1, { duration: 0.7, ease: ease.spring }), 0.1);
  }, [idx]);
  const titleA = useAnimatedStyle(() => ({ opacity: title.value, transform: [{ translateY: (1 - title.value) * 30 }] }));
  const punchA = useAnimatedStyle(() => ({ transform: [{ scale: 0.7 + punch.value * 0.3 }] }));

  const next = w.steps[idx + 1];
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <Img source={w.image} style={StyleSheet.absoluteFill} />
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: rest ? 'rgba(5,6,5,0.82)' : 'rgba(14,61,20,0.55)' }]} />

      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <IconButton icon={X} label="End workout" onPress={() => (setRunning(false), setQuit(true))} />
        <View style={{ flex: 1, flexDirection: 'row', gap: 4 }}>
          {w.steps.map((_, k) => (
            <View key={k} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: k < idx ? colors.primary : k === idx ? colors.text : 'rgba(255,255,255,0.2)' }} />
          ))}
        </View>
        <Txt v="small" color={colors.textMuted}>
          {idx + 1}/{w.steps.length}
        </Txt>
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 }}>
        <Animated.View style={[{ alignItems: 'center' }, titleA]}>
          <Txt v="overline" color={rest ? colors.protein : colors.primary}>
            {rest ? 'Recover' : w.title}
          </Txt>
          <Txt v="h1" style={{ marginTop: 8, textAlign: 'center', paddingHorizontal: 20 }}>
            {step.name}
          </Txt>
          {step.reps && (
            <Txt color={colors.textMuted} style={{ marginTop: 4 }}>
              {step.reps}
            </Txt>
          )}
        </Animated.View>
        <Animated.View style={punchA}>
          <Ring key={idx} duration={1} linear value={1 - (left - 1) / step.seconds} size={250} stroke={14} color={rest ? colors.protein : colors.primary} track="rgba(255,255,255,0.1)">
            <Txt style={{ fontFamily: font.light, fontSize: 76, lineHeight: 84 }}>{left}</Txt>
            <Txt v="small" color={colors.textMuted}>
              seconds
            </Txt>
          </Ring>
        </Animated.View>
      </View>

      {next && (
        <Card style={{ marginHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'rgba(21,24,22,0.85)' }}>
          <Img source={w.image} style={{ width: 52, height: 52, borderRadius: radius.sm }} />
          <View style={{ flex: 1 }}>
            <Txt v="caption" color={colors.textMuted}>
              NEXT UP
            </Txt>
            <Txt>{next.name}</Txt>
          </View>
          <Txt v="small" color={colors.textMuted}>
            {next.reps ?? `${next.seconds}s`}
          </Txt>
        </Card>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28, paddingTop: 24, paddingBottom: insets.bottom + 28 }}>
        <IconButton icon={SkipBack} label="Previous" size={58} tint={colors.card} onPress={() => go(idx - 1)} />
        <Press accessibilityLabel={running ? 'Pause' : 'Resume'} onPress={() => setRunning(!running)} scaleTo={0.88} hapticKind="medium" style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
          {running ? <Pause size={34} color={colors.onPrimary} fill={colors.onPrimary} /> : <Play size={34} color={colors.onPrimary} fill={colors.onPrimary} style={{ marginLeft: 4 }} />}
        </Press>
        <IconButton icon={SkipForward} label="Skip" size={58} tint={colors.card} onPress={() => go(idx + 1)} />
      </View>

      <Sheet open={quit} onClose={() => (setQuit(false), setRunning(true))} title="End this workout?">
        <Txt color={colors.textMuted} style={{ marginBottom: 20 }}>
          You’re {Math.round((idx / w.steps.length) * 100)}% through. Progress so far will still count toward your streak.
        </Txt>
        <PrimaryButton title="Keep going" onPress={() => (setQuit(false), setRunning(true))} />
        <SecondaryButton title="End & save" style={{ marginTop: 12 }} onPress={finish} />
      </Sheet>
    </View>
  );
}
