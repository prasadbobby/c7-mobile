import { router } from 'expo-router';
import { ArrowUpRight } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { images, workouts } from '@/data';
import { ease, svTo, useTimeline } from '@/motion';
import { useApp } from '@/store';
import { colors, font, shadow } from '@/theme';
import { FadeBottom, Img, Press, Txt } from '@/ui';

const slides = [
  { img: images.onboarding, score: 88, big: '+1,012', label: 'Steps Taken', note: 'You still need 819 steps to complete your day. Do it now!!! ⚡' },
  { img: workouts[0]!.image, score: 92, big: '47.5kg', label: 'Lifted Today', note: 'Guided workouts with video and progress you can see. 💪' },
  { img: images.mBowl, score: 76, big: '1120', label: 'Kcal Tracked', note: 'Daily nutrition and a cooking community that keeps you fuelled. 🥗' },
  { img: workouts[2]!.image, score: 95, big: '#32', label: 'Your Rank', note: 'Climb the leaderboard with friends every single week. 🏆' },
];

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const [i, setI] = useState(0);
  const s = slides[i]!;
  const finish = () => {
    useApp.getState().set({ onboarded: true });
    router.replace('/login');
  };

  // GSAP slide timeline: image zooms out, score chip pops, copy rises in sequence.
  const img = useSharedValue(0);
  const chip = useSharedValue(0);
  const note = useSharedValue(0);
  const big = useSharedValue(0);
  const label = useSharedValue(0);
  useTimeline(
    (tl) => {
      [img, chip, note, big, label].forEach((v) => (v.value = 0));
      tl.add(svTo(img, 1, { duration: 1.1, ease: ease.expo }))
        .add(svTo(chip, 1, { duration: 0.6, ease: ease.pop }), 0.25)
        .add(svTo(note, 1, { duration: 0.6 }), 0.35)
        .add(svTo(big, 1, { duration: 0.7, ease: ease.expo }), 0.45)
        .add(svTo(label, 1, { duration: 0.6 }), 0.55);
    },
    [i],
  );
  const imgA = useAnimatedStyle(() => ({ opacity: 0.2 + img.value * 0.8, transform: [{ scale: 1.12 - img.value * 0.12 }] }));
  const chipA = useAnimatedStyle(() => ({ opacity: chip.value, transform: [{ scale: 0.6 + chip.value * 0.4 }, { translateX: (1 - chip.value) * 30 }] }));
  const rise = (v: typeof note, d = 24) => useAnimatedStyle(() => ({ opacity: v.value, transform: [{ translateY: (1 - v.value) * d }] })); // eslint-disable-line react-hooks/rules-of-hooks
  const noteA = rise(note);
  const bigA = rise(big, 40);
  const labelA = rise(label);

  // Swipe between slides
  const drag = useSharedValue(0);
  const next = () => (i < slides.length - 1 ? setI(i + 1) : finish());
  const prev = () => i > 0 && setI(i - 1);
  const pan = Gesture.Pan()
    .runOnJS(true)
    .onUpdate((e) => (drag.value = e.translationX * 0.3))
    .onEnd((e) => {
      if (e.translationX < -60) next();
      else if (e.translationX > 60) prev();
      drag.value = withSpring(0);
    });
  const dragA = useAnimatedStyle(() => ({ transform: [{ translateX: drag.value }] }));

  // FAB rotates 45° on press (mirrors web hover)
  const rot = useSharedValue(0);
  const fabA = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));

  return (
    <GestureDetector gesture={pan}>
      <View style={{ flex: 1, backgroundColor: colors.surface }}>
        <Animated.View style={[StyleSheet.absoluteFill, imgA]}>
          <Img source={s.img} style={StyleSheet.absoluteFill} transition={0} />
        </Animated.View>
        <FadeBottom />

        <Pressable onPress={finish} accessibilityLabel="Skip" style={{ position: 'absolute', right: -28, top: -28, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(5,6,5,0.6)', justifyContent: 'flex-end', paddingLeft: 30, paddingBottom: 34 }}>
          <Txt v="bodyLg" style={{ marginTop: insets.top }}>
            Skip
          </Txt>
        </Pressable>

        <Animated.View style={[{ position: 'absolute', right: 24, top: '38%', flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(5,6,5,0.5)', borderRadius: 14, padding: 6, paddingRight: 16 }, chipA]}>
          <View style={{ backgroundColor: colors.cream, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 }}>
            <Txt style={{ fontFamily: font.regular, fontSize: 30, lineHeight: 36 }} color={colors.surface}>
              {s.score}
            </Txt>
          </View>
          <Txt v="small">{'SCORE\nNOW'}</Txt>
        </Animated.View>

        <Animated.View style={[{ position: 'absolute', left: 24, right: 24, bottom: insets.bottom + 140 }, dragA]}>
          <Animated.View style={noteA}>
            <Txt v="small" style={{ maxWidth: 210 }}>
              {s.note}
            </Txt>
          </Animated.View>
          <Animated.View style={bigA}>
            <Txt v="display" style={{ marginTop: 24, fontSize: 64, lineHeight: 70 }}>
              {s.big}
            </Txt>
          </Animated.View>
          <Animated.View style={labelA}>
            <Txt style={{ fontFamily: font.light, fontSize: 32, lineHeight: 38, marginTop: 4 }}>{s.label}</Txt>
          </Animated.View>
        </Animated.View>

        <View style={{ position: 'absolute', left: 24, right: 24, bottom: insets.bottom + 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {slides.map((_, k) => (
              <Dot key={k} active={k === i} onPress={() => setI(k)} />
            ))}
          </View>
          <Press
            accessibilityLabel="Next"
            onPress={() => {
              rot.value = withSpring(rot.value + 45);
              next();
            }}
            scaleTo={0.88}
            hapticKind="medium"
            style={[{ width: 68, height: 68, borderRadius: 34, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, shadow.glow]}
          >
            <Animated.View style={fabA}>
              <ArrowUpRight size={30} color={colors.onPrimary} strokeWidth={2} />
            </Animated.View>
          </Press>
        </View>
      </View>
    </GestureDetector>
  );
}

function Dot({ active, onPress }: { active: boolean; onPress: () => void }) {
  const w = useSharedValue(active ? 46 : 10);
  useEffect(() => {
    w.value = withSpring(active ? 46 : 10, { damping: 15, stiffness: 180 });
  }, [active, w]);
  const a = useAnimatedStyle(() => ({ width: w.value, backgroundColor: w.value > 20 ? colors.primary : colors.text }));
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityLabel="Go to slide">
      <Animated.View style={[{ height: 10, borderRadius: 5 }, a]} />
    </Pressable>
  );
}
