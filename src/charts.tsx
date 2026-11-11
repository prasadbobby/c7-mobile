import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import Animated, { makeMutable, useAnimatedProps, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Svg, { Defs, G, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';
import { DumbbellGlyph } from './icons';
import { ease, gsap, svStagger, svTo } from './motion';
import { colors, font } from './theme';
import { Txt } from './ui';

const APath = Animated.createAnimatedComponent(Path);

function smooth(pts: (readonly [number, number])[]) {
  return pts.reduce((acc, [x, y], i) => {
    if (i === 0) return `M${x},${y}`;
    const [px, py] = pts[i - 1]!;
    const cx = (px + x) / 2;
    return `${acc} C${cx},${py} ${cx},${y} ${x},${y}`;
  }, '');
}

/**
 * "My Progress" smooth line with dumbbell markers. GSAP timeline: draw the
 * line, then pop the markers with a back-out stagger.
 */
export function ProgressLine({ points, labels, min = 15, max = 55, height = 170, ticks = [50, 40, 30, 20], unit = 'kg', marker = true }: { points: number[]; labels: string[]; min?: number; max?: number; height?: number; ticks?: number[]; unit?: string; marker?: boolean }) {
  const [w, setW] = useState(0);
  const left = 46;
  const H = height - 30;
  const xy = useMemo(() => points.map((p, i) => [left + 10 + (i * (w - left - 30)) / Math.max(1, points.length - 1), 10 + (H - 10) - ((p - min) / (max - min)) * (H - 10)] as const), [points, w, H, min, max]);
  const d = smooth(xy);
  const len = useMemo(() => xy.reduce((a, [x, y], i) => (i ? a + Math.hypot(x - xy[i - 1]![0], y - xy[i - 1]![1]) : 0), 0) * 1.2 + 10, [xy]);
  const draw = useSharedValue(0);
  const pops = useMemo(() => points.map(() => makeMutable(0)), [points]);
  useEffect(() => {
    if (!w) return;
    draw.value = 0;
    pops.forEach((p) => (p.value = 0));
    const tl = gsap.timeline();
    tl.add(svTo(draw, 1, { duration: 1.4, ease: 'power2.inOut' }));
    tl.add(svStagger(pops, { duration: 0.5, ease: ease.pop, stagger: 0.1 }), '-=0.8');
    return () => {
      tl.kill();
    };
  }, [w, d, draw, pops]);
  const lineProps = useAnimatedProps(() => ({ strokeDashoffset: len * (1 - draw.value) }));

  return (
    <View style={{ height }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {w > 0 && (
        <Svg width={w} height={height}>
          <Defs>
            <LinearGradient id="ln" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={colors.primary} stopOpacity={0.15} />
              <Stop offset="0.4" stopColor={colors.primary} />
              <Stop offset="1" stopColor={colors.primaryGlow} stopOpacity={0.5} />
            </LinearGradient>
          </Defs>
          {ticks.map((v) => {
            const y = 10 + (H - 10) - ((v - min) / (max - min)) * (H - 10);
            return (
              <SvgText key={v} x={0} y={y + 4} fill={colors.textMuted} fontSize={12} fontFamily={font.regular}>
                {`${v}${unit}`}
              </SvgText>
            );
          })}
          {xy.map(([x], i) => (i % 2 === 1 ? <Line key={i} x1={x} x2={x} y1={0} y2={H} stroke={colors.muted} strokeDasharray="2 5" /> : null))}
          <APath d={d} stroke="url(#ln)" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeDasharray={`${len} ${len}`} animatedProps={lineProps} />
          {labels.map((l, i) => {
            const idx = Math.round(((i + 0.5) * (xy.length - 1)) / labels.length);
            return (
              <SvgText key={l} x={xy[idx]?.[0] ?? 0} y={height - 4} fill={colors.textMuted} fontSize={13} fontFamily={font.regular} textAnchor="middle">
                {l}
              </SvgText>
            );
          })}
        </Svg>
      )}
      {w > 0 && marker && xy.map(([x, y], i) => (i % 2 === 1 ? <Marker key={i} x={x} y={y} p={pops[i]!} /> : null))}
    </View>
  );
}

function Marker({ x, y, p }: { x: number; y: number; p: ReturnType<typeof makeMutable<number>> }) {
  const a = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ scale: p.value }] }));
  return (
    <Animated.View style={[{ position: 'absolute', left: x - 20, top: y - 46, width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }, a]}>
      <DumbbellGlyph size={20} />
    </Animated.View>
  );
}

/** Rising bar chart (weekly steps / kcal). Bars stagger up with GSAP. */
export function Bars({ values, labels, highlight, height = 160, goal }: { values: number[]; labels: string[]; highlight?: number; height?: number; goal?: number }) {
  const max = Math.max(...values, goal ?? 0) * 1.1;
  const ps = useMemo(() => values.map(() => makeMutable(0)), [values]);
  useEffect(() => {
    ps.forEach((p) => (p.value = 0));
    const t = svStagger(ps, { duration: 0.9, ease: ease.spring, stagger: 0.06 });
    return () => {
      t.kill();
    };
  }, [ps]);
  return (
    <View style={{ height: height + 24 }}>
      {goal && (
        <View style={{ position: 'absolute', left: 0, right: 0, top: height - (goal / max) * height, borderTopWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(198,242,27,0.45)' }}>
          <Txt v="caption" color={colors.primary} style={{ position: 'absolute', right: 0, top: -16 }}>
            Goal
          </Txt>
        </View>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height, gap: 10 }}>
        {values.map((v, i) => (
          <BarCol key={i} p={ps[i]!} h={(v / max) * height} active={i === highlight} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
        {labels.map((l, i) => (
          <Txt key={l} v="caption" color={i === highlight ? colors.primary : colors.textMuted} style={{ flex: 1, textAlign: 'center' }}>
            {l}
          </Txt>
        ))}
      </View>
    </View>
  );
}

function BarCol({ p, h, active }: { p: ReturnType<typeof makeMutable<number>>; h: number; active?: boolean }) {
  const a = useAnimatedStyle(() => ({ height: Math.max(6, h * p.value) }));
  return <Animated.View style={[{ flex: 1, borderRadius: 12, backgroundColor: active ? colors.primary : colors.muted }, a]} />;
}

export { G };
