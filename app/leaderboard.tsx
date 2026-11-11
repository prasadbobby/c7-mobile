import { ArrowDownUp, ChefHat, Crown, Dumbbell, Medal } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, LinearTransition, makeMutable, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming, type SharedValue } from 'react-native-reanimated';
import Svg, { Path, Polygon, Text as SvgText } from 'react-native-svg';
import { avatars, leaderboard } from '@/data';
import { ease, gsap, Reveal, svStagger, useScrollY, useStagger } from '@/motion';
import { useApp } from '@/store';
import { colors, font, radius, shadow } from '@/theme';
import { Avatar, HeroGlow, LimeGradient, RankBadge, SectionHeader, Segmented, TopBar, Txt, useTopInset } from '@/ui';

type Tab = 'workout' | 'cooking';

export default function Leaderboard() {
  const st = useApp();
  const { width } = useWindowDimensions();
  const top = useTopInset(64);
  const { y, onScroll } = useScrollY();
  const [tab, setTab] = useState<Tab>('workout');
  const [asc, setAsc] = useState(false);
  const data = leaderboard[tab];
  const rows = asc ? [...data].reverse() : data;
  const unit = tab === 'workout' ? '/steps' : '/pts';

  // GSAP podium sequence: blocks rise (elastic), then avatars pop in 2 → 1 → 3 order.
  const blocks = useMemo(() => [0, 1, 2].map(() => makeMutable(0)), []);
  const heads = useMemo(() => [0, 1, 2].map(() => makeMutable(0)), []);
  useEffect(() => {
    [...blocks, ...heads].forEach((v) => (v.value = 0));
    const tl = gsap.timeline();
    tl.add(svStagger(blocks, { duration: 1, ease: ease.spring, stagger: 0.12 }))
      .add(svStagger([heads[1]!, heads[0]!, heads[2]!], { duration: 0.6, ease: ease.pop, stagger: 0.12 }), 0.35);
    return () => {
      tl.kill();
    };
  }, [tab, blocks, heads]);

  const list = useStagger(rows.length + 1, { stagger: 0.06, delay: 0.5 }, [tab, asc]);
  const podiumW = width - 40;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <HeroGlow height={600} intensity={1.1} />
      <Rays />
      <TopBar title="Leaderboard" y={y} />
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: top + 20, paddingBottom: 40 }}>
        <Stars />
        {/* Podium: head stacked on its block, columns bottom-aligned */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 20 }}>
          <View style={{ alignItems: 'center' }}>
            <PodiumHead p={heads[0]!} u={data[1]!} size={88} rank={2} />
            <Block p={blocks[1]!} w={podiumW * 0.32} h={110} n="2" />
          </View>
          <View style={{ alignItems: 'center' }}>
            <PodiumHead p={heads[1]!} u={data[0]!} size={118} rank={1} />
            <Block p={blocks[0]!} w={podiumW * 0.36} h={150} n="1" />
          </View>
          <View style={{ alignItems: 'center' }}>
            <PodiumHead p={heads[2]!} u={data[2]!} size={84} rank={3} />
            <Block p={blocks[2]!} w={podiumW * 0.32} h={86} n="3" />
          </View>
        </View>

        {/* Sheet */}
        <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 36, borderTopRightRadius: 36, marginTop: -8, paddingTop: 22, minHeight: 600 }}>
          <View style={{ paddingHorizontal: 20 }}>
            <Segmented<Tab>
              value={tab}
              onChange={setTab}
              options={[
                { id: 'workout', label: 'Workout', icon: Dumbbell },
                { id: 'cooking', label: 'Cooking', icon: ChefHat },
              ]}
            />
          </View>
          <SectionHeader
            overline
            title="All Users"
            style={{ marginTop: 26 }}
            action={
              <Pressable onPress={() => setAsc(!asc)} hitSlop={10} accessibilityLabel="Reverse order">
                <ArrowDownUp size={22} color={colors.text} />
              </Pressable>
            }
          />
          <View style={{ paddingHorizontal: 20, gap: 12, marginTop: 16 }}>
            {rows.map((u, k) => {
              const rank = data.indexOf(u) + 1;
              return (
                <Reveal key={u.name + tab} p={list[k]!} y={30}>
                  <Animated.View layout={LinearTransition.springify()} style={{ flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: colors.secondary, borderRadius: radius.xl, padding: 16 }}>
                    <Avatar source={u.avatar} size={60} badge={<RankBadge n={rank} />} />
                    <View style={{ flex: 1 }}>
                      <Txt v="bodyLg">{u.name}</Txt>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        {tab === 'workout' ? <Dumbbell size={16} color={colors.primaryGlow} /> : <ChefHat size={16} color={colors.primaryGlow} />}
                        <Txt v="small" color={colors.textMuted}>
                          {tab === 'workout' ? 'Workout' : 'Cooking'} streak
                        </Txt>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Txt v="stat">{u.value}</Txt>
                      <Txt v="caption" color={colors.textMuted}>
                        {unit}
                      </Txt>
                    </View>
                  </Animated.View>
                </Reveal>
              );
            })}
            <Reveal p={list[rows.length]!} y={30}>
              <View style={[{ borderRadius: radius.xl, overflow: 'hidden' }, shadow.glow]}>
                <LimeGradient style={{ flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16 }}>
                  <Avatar source={avatars.emma} size={60} ring={false} badge={<RankBadge n={32} light />} />
                  <View style={{ flex: 1 }}>
                    <Txt v="bodyLg" color={colors.onPrimary} numberOfLines={1}>
                      (You) {st.name} Richardson
                    </Txt>
                    <Txt v="small" color="rgba(10,15,7,0.7)">
                      {tab === 'workout' ? 'Workout' : 'Cooking'} streak
                    </Txt>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Txt v="stat" color={colors.onPrimary}>
                      {tab === 'workout' ? '987k' : '214'}
                    </Txt>
                    <Txt v="caption" color="rgba(10,15,7,0.7)">
                      {unit}
                    </Txt>
                  </View>
                </LimeGradient>
              </View>
            </Reveal>
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

function PodiumHead({ p, u, size, rank }: { p: SharedValue<number>; u: { name: string; avatar: number }; size: number; rank: number }) {
  const a = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ scale: 0.4 + p.value * 0.6 }, { translateY: (1 - p.value) * 30 }] }));
  const [first, ...rest] = u.name.split(' ');
  return (
    <Animated.View style={[{ alignItems: 'center', marginBottom: 10 }, a]}>
      <View>
        <View style={{ borderRadius: size, borderWidth: 4, borderColor: colors.primaryGlow, padding: 2 }}>
          <Avatar source={u.avatar} size={size} ring={false} />
        </View>
        <View style={{ position: 'absolute', right: -2, top: 0, width: rank === 1 ? 38 : 32, height: rank === 1 ? 38 : 32, borderRadius: 20, backgroundColor: rank === 1 ? colors.primary : colors.cream, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.heroMid }}>
          {rank === 1 ? <Crown size={18} color={colors.onPrimary} /> : <Medal size={16} color={rank === 2 ? '#7C8077' : '#B4632D'} />}
        </View>
      </View>
      <Txt v={rank === 1 ? 'h3' : 'bodyLg'} style={{ textAlign: 'center', marginTop: 8 }}>
        {rank === 1 ? u.name : `${first}\n${rest.join(' ')}`}
      </Txt>
    </Animated.View>
  );
}

function Block({ p, w, h, n }: { p: SharedValue<number>; w: number; h: number; n: string }) {
  const cap = 22;
  const a = useAnimatedStyle(() => ({ height: (h + cap) * p.value }));
  return (
    <Animated.View style={[{ width: w, overflow: 'hidden', justifyContent: 'flex-end' }, a]}>
      <Svg width={w} height={h + cap}>
        <Polygon points={`${n === '1' ? 0 : 14},${cap} ${n === '1' ? 16 : 26},0 ${w - (n === '1' ? 16 : 26)},0 ${w - (n === '1' ? 0 : 14)},${cap}`} fill="#DDFB6A" />
        <Path d={`M0 ${cap} H${w} V${h + cap} H0 Z`} fill={colors.primary} />
        <SvgText x={w / 2} y={cap + (n === '1' ? 100 : h * 0.75)} fill={colors.onPrimary} fontSize={n === '1' ? 96 : 70} fontFamily={font.black} textAnchor="middle">
          {n}
        </SvgText>
      </Svg>
    </Animated.View>
  );
}

function Rays() {
  const r = useSharedValue(0);
  useEffect(() => {
    r.value = withRepeat(withTiming(360, { duration: 60000, easing: Easing.linear }), -1);
  }, [r]);
  const a = useAnimatedStyle(() => ({ transform: [{ rotate: `${r.value}deg` }] }));
  const S = 1100;
  const wedges = Array.from({ length: 18 }, (_, i) => {
    const a0 = (i * 20 * Math.PI) / 180;
    const a1 = ((i * 20 + 9) * Math.PI) / 180;
    return `M${S / 2},${S / 2} L${S / 2 + Math.cos(a0) * S},${S / 2 + Math.sin(a0) * S} L${S / 2 + Math.cos(a1) * S},${S / 2 + Math.sin(a1) * S} Z`;
  });
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { height: 520, overflow: 'hidden', alignItems: 'center' }]}>
      <Animated.View style={[{ width: S, height: S, marginTop: -S / 2 + 230 }, a]}>
        <Svg width={S} height={S}>
          {wedges.map((d, i) => (
            <Path key={i} d={d} fill="#fff" opacity={0.035} />
          ))}
        </Svg>
      </Animated.View>
    </View>
  );
}

function Star({ x, yy, d, size }: { x: string; yy: number; d: number; size: number }) {
  const o = useSharedValue(0.3);
  useEffect(() => {
    o.value = withDelay(d, withRepeat(withSequence(withTiming(1, { duration: 900 }), withTiming(0.3, { duration: 900 })), -1));
  }, [o, d]);
  const a = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ scale: 0.7 + o.value * 0.5 }] }));
  return (
    <Animated.View style={[{ position: 'absolute', left: x as `${number}%`, top: yy }, a]}>
      <Txt style={{ fontSize: size, color: colors.primary }}>✦</Txt>
    </Animated.View>
  );
}

function Stars() {
  const pts = [
    { x: '30%', yy: -6, d: 0, size: 16 },
    { x: '40%', yy: -18, d: 300, size: 10 },
    { x: '52%', yy: -24, d: 600, size: 12 },
    { x: '63%', yy: -14, d: 900, size: 10 },
    { x: '70%', yy: 8, d: 200, size: 16 },
    { x: '36%', yy: 30, d: 500, size: 8 },
  ];
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 70, height: 60 }}>
      {pts.map((p, i) => (
        <Star key={i} {...p} />
      ))}
    </View>
  );
}
