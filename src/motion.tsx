/**
 * Motion layer.
 *
 * GSAP drives *timelines* (orchestration, easing, stagger, count-ups). It tweens
 * plain JS proxies and writes the result into Reanimated shared values, so the
 * actual view updates still run on the UI thread via useAnimatedStyle.
 *
 * Reanimated drives *scroll-linked* effects (parallax, sticky headers, scroll
 * reveals) — GSAP's ScrollTrigger is DOM-only and does not run in React Native,
 * so <ScrollReveal> is its native equivalent.
 */
import { gsap } from 'gsap';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useWindowDimensions, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  makeMutable,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

export { gsap };

export const ease = {
  out: 'power3.out',
  inOut: 'power2.inOut',
  pop: 'back.out(1.8)',
  spring: 'elastic.out(1, 0.55)',
  expo: 'expo.out',
} as const;

/** Tween a shared value with GSAP. Returns the tween so it can be added to a timeline. */
export function svTo(sv: SharedValue<number>, to: number, vars: gsap.TweenVars = {}) {
  const proxy = { v: sv.value };
  const { onUpdate, ...rest } = vars;
  return gsap.to(proxy, {
    v: to,
    duration: 0.6,
    ease: ease.out,
    ...rest,
    onUpdate() {
      sv.value = proxy.v;
      onUpdate?.call(this);
    },
  });
}

/** Stagger a list of shared values 0 → 1 (one GSAP tween, many targets). */
export function svStagger(values: SharedValue<number>[], vars: gsap.TweenVars = {}) {
  const proxies = values.map((v) => ({ v: v.value }));
  return gsap.to(proxies, {
    v: 1,
    duration: 0.7,
    ease: ease.out,
    stagger: 0.07,
    ...vars,
    onUpdate() {
      for (let i = 0; i < proxies.length; i++) values[i]!.value = proxies[i]!.v;
    },
  });
}

/** Creates `count` progress values and plays a staggered GSAP entrance on mount. */
export function useStagger(count: number, vars: gsap.TweenVars = {}, deps: unknown[] = []) {
  const values = useMemo(() => Array.from({ length: count }, () => makeMutable(0)), [count]);
  useEffect(() => {
    values.forEach((v) => (v.value = 0));
    const t = svStagger(values, vars);
    return () => {
      t.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, ...deps]);
  return values;
}

/** Build a GSAP timeline once per deps change; killed on unmount. */
export function useTimeline(build: (tl: gsap.core.Timeline) => void, deps: unknown[] = []) {
  useEffect(() => {
    const tl = gsap.timeline();
    build(tl);
    return () => {
      tl.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** Animated number (GSAP tween with snap). */
export function useCountUp(target: number, opts: { duration?: number; delay?: number; decimals?: number } = {}) {
  const { duration = 1.2, delay = 0, decimals = 0 } = opts;
  const [val, setVal] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const p = { v: from.current };
    const t = gsap.to(p, {
      v: target,
      duration,
      delay,
      ease: ease.expo,
      onUpdate: () => setVal(Number(p.v.toFixed(decimals))),
      onComplete: () => {
        from.current = target;
      },
    });
    return () => {
      t.kill();
    };
  }, [target, duration, delay, decimals]);
  return val;
}

/** Fade + rise + scale driven by a 0 → 1 progress value. */
export function Reveal({
  p,
  y = 24,
  x = 0,
  scale = 1,
  style,
  children,
}: {
  p: SharedValue<number>;
  y?: number;
  x?: number;
  scale?: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const a = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [
      { translateY: (1 - p.value) * y },
      { translateX: (1 - p.value) * x },
      { scale: scale + (1 - scale) * p.value },
    ],
  }));
  return <Animated.View style={[style, a]}>{children}</Animated.View>;
}

/* ---------------------------------------------------------------- scroll ---- */

export function useScrollY() {
  const y = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    y.value = e.contentOffset.y;
  });
  return { y, onScroll };
}

/** Parallax image/header: scrolls at half speed, stretches on overscroll. */
export function Parallax({ y, height, children, style }: { y: SharedValue<number>; height: number; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const a = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(y.value, [-height, 0, height], [-height / 2, 0, height * 0.5], Extrapolation.CLAMP) },
      { scale: interpolate(y.value, [-height, 0], [2, 1], Extrapolation.CLAMP) },
    ],
    opacity: interpolate(y.value, [0, height * 0.9], [1, 0.25], Extrapolation.CLAMP),
  }));
  return <Animated.View style={[{ height, overflow: 'hidden' }, style, a]}>{children}</Animated.View>;
}

/**
 * ScrollTrigger-style reveal: the child fades/rises in as it scrolls into the
 * viewport. Place as a *direct child* of the scroll content so onLayout's y is
 * relative to the scroll container.
 */
export function ScrollReveal({ y, children, style, offset = 0 }: { y: SharedValue<number>; children: ReactNode; style?: StyleProp<ViewStyle>; offset?: number }) {
  const { height } = useWindowDimensions();
  const top = useSharedValue(1e6);
  const onLayout = (e: LayoutChangeEvent) => {
    top.value = e.nativeEvent.layout.y + offset;
  };
  const a = useAnimatedStyle(() => {
    const p = interpolate(y.value + height - top.value, [0, 140], [0, 1], Extrapolation.CLAMP);
    return { opacity: 0.15 + p * 0.85, transform: [{ translateY: (1 - p) * 40 }, { scale: 0.96 + p * 0.04 }] };
  });
  return (
    <Animated.View onLayout={onLayout} style={[style, a]}>
      {children}
    </Animated.View>
  );
}

/** Opacity for a compact header that fades in after `from` px of scroll. */
export function useHeaderFade(y: SharedValue<number>, from = 80, to = 140) {
  return useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [from, to], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(y.value, [from, to], [-8, 0], Extrapolation.CLAMP) }],
  }));
}
