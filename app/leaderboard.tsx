import { ArrowDownUp, CalendarCheck, Crown, Medal, Trophy } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, LinearTransition, makeMutable, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming, type SharedValue } from 'react-native-reanimated';
import Svg, { Path, Polygon, Text as SvgText } from 'react-native-svg';
import { useChallenges, useLeaderboard, useMe } from '@/api/hooks';
import { fullName } from '@/api/meta';
import type { LeaderEntry } from '@/api/types';
import { ArtEmpty } from '@/badges';
import { ease, gsap, Reveal, svStagger, useScrollY, useStagger } from '@/motion';
import { colors, font, radius, shadow } from '@/theme';
import { Avatar, Chip, ErrorState, HeroGlow, LimeGradient, RankBadge, SectionHeader, Segmented, Skeleton, TopBar, Txt, useTopInset } from '@/ui';

type Tab = 'overall' | 'weekly';

export default function Leaderboard() {
  const params = useLocalSearchParams<{ id?: string }>();
  const challenges = useChallenges();
  const id = params.id ?? challenges.data?.find((c) => c.access === 'enabled')?.id;
  const title = challenges.data?.find((c) => c.id === id)?.title;
  const { width } = useWindowDimensions();
  const top = useTopInset(64);
  const { y, onScroll } = useScrollY();
  const [tab, setTab] = useState<Tab>('overall');
  const [week, setWeek] = useState<number | undefined>();
  const [asc, setAsc] = useState(false);
  const me = useMe();
  const q = useLeaderboard(id, week);
  const data: LeaderEntry[] = (tab === 'overall' ? q.data?.overall : q.data?.weekly) ?? [];
  const rows = asc ? [...data].reverse() : data;
  const mine = tab === 'overall' ? q.data?.me.overall : q.data?.me.weekly;
  const unit = 'pts';

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
  }, [tab, week, q.data, blocks, heads]);

  const list = useStagger(rows.length + 1, { stagger: 0.05, delay: 0.4 }, [tab, asc, week, rows.length]);
  const podiumW = width - 40;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <HeroGlow height={600} intensity={1.1} />
      <Rays />
      <TopBar title="Leaderboard" y={y} right={<View style={{ width: 48 }} />} />
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: top + 20, paddingBottom: 40 }}>
        <Stars />
        {!id && challenges.data ? (
          <ArtEmpty art="no-challenge" title="No leaderboard yet" body="Leaderboards rank members in a challenge. Join one from Challenges to get ranked." />
        ) : q.error ? (
          <ErrorState error={q.error} onRetry={() => q.refetch()} />
        ) : !q.data ? (
          <Skeleton height={260} style={{ marginHorizontal: 20, width: width - 40 }} />
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: 20 }}>
            <View style={{ alignItems: 'center' }}>
              {!!data[1] && <PodiumHead p={heads[0]!} u={data[1]} size={84} rank={2} />}
              <Block p={blocks[1]!} w={podiumW * 0.32} h={110} n="2" />
            </View>
            <View style={{ alignItems: 'center' }}>
              {!!data[0] && <PodiumHead p={heads[1]!} u={data[0]} size={110} rank={1} />}
              <Block p={blocks[0]!} w={podiumW * 0.36} h={150} n="1" />
            </View>
            <View style={{ alignItems: 'center' }}>
              {!!data[2] && <PodiumHead p={heads[2]!} u={data[2]} size={80} rank={3} />}
              <Block p={blocks[2]!} w={podiumW * 0.32} h={86} n="3" />
            </View>
          </View>
        )}

        {/* Sheet */}
        <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 36, borderTopRightRadius: 36, marginTop: -8, paddingTop: 22, minHeight: 600 }}>
          <View style={{ paddingHorizontal: 20 }}>
            <Segmented<Tab>
              value={tab}
              onChange={setTab}
              options={[
                { id: 'overall', label: 'Overall', icon: Trophy },
                { id: 'weekly', label: 'Weekly', icon: CalendarCheck },
              ]}
            />
          </View>
          {tab === 'weekly' && (q.data?.weeks.length ?? 0) > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 20, marginTop: 14 }}>
              {q.data!.weeks.map((w) => (
                <Chip key={w.weekNumber} label={w.isCurrentWeek ? 'This week' : `Week ${w.weekNumber}`} active={(week ?? q.data!.selectedWeek) === w.weekNumber} onPress={() => setWeek(w.weekNumber)} />
              ))}
            </ScrollView>
          )}
          <SectionHeader
            overline
            title={title ? title.toUpperCase() : 'All members'}
            style={{ marginTop: 26 }}
            action={
              <Pressable onPress={() => setAsc(!asc)} hitSlop={10} accessibilityLabel="Reverse order">
                <ArrowDownUp size={22} color={colors.text} />
              </Pressable>
            }
          />
          <View style={{ paddingHorizontal: 20, gap: 12, marginTop: 16 }}>
            {!!(q.data && rows.length === 0) && (
              <Txt color={colors.textMuted}>No check-ins yet{tab === 'weekly' ? ' this week' : ''}. Post today to take the lead.</Txt>
            )}
            {rows.map((u, k) => {
              const isMe = u.userId === me.data?.user.id;
              return (
                <Reveal key={u.userId + tab + (week ?? '')} p={list[k] ?? list[0]!} y={30}>
                  <Animated.View layout={LinearTransition.duration(220)} style={{ flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: colors.secondary, borderRadius: radius.xl, padding: 16, borderWidth: isMe ? 1.5 : 0, borderColor: colors.primary }}>
                    <Avatar source={u.imageUrl} name={fullName(u)} size={56} badge={<RankBadge n={u.rank} />} />
                    <View style={{ flex: 1 }}>
                      <Txt v="bodyLg" numberOfLines={1}>
                        {fullName(u)}
                        {isMe ? ' (You)' : ''}
                      </Txt>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <CalendarCheck size={15} color={colors.primaryGlow} />
                        <Txt v="small" color={colors.textMuted}>
                          {u.totalPosts} check-ins · {u.consistency}%
                        </Txt>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Txt v="stat">{u.score}</Txt>
                      <Txt v="caption" color={colors.textMuted}>
                        {unit}
                      </Txt>
                    </View>
                  </Animated.View>
                </Reveal>
              );
            })}
            {!!mine && (
              <Reveal p={list[rows.length] ?? list[0]!} y={30}>
                <View style={[{ borderRadius: radius.xl, overflow: 'hidden' }, shadow.glow]}>
                  <LimeGradient style={{ flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16 }}>
                    <Avatar source={me.data?.user.imageUrl} name={fullName(me.data?.user)} size={56} ring={false} badge={<RankBadge n={mine.rank} light />} />
                    <View style={{ flex: 1 }}>
                      <Txt v="bodyLg" color={colors.onPrimary} numberOfLines={1}>
                        (You) {fullName(me.data?.user)}
                      </Txt>
                      <Txt v="small" color="rgba(10,15,7,0.7)">
                        #{mine.rank} of {data.length} · {mine.consistency}% consistency
                      </Txt>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Txt v="stat" color={colors.onPrimary}>
                        {mine.score}
                      </Txt>
                      <Txt v="caption" color="rgba(10,15,7,0.7)">
                        {unit}
                      </Txt>
                    </View>
                  </LimeGradient>
                </View>
              </Reveal>
            )}
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

function PodiumHead({ p, u, size, rank }: { p: SharedValue<number>; u: LeaderEntry; size: number; rank: number }) {
  const a = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ scale: 0.4 + p.value * 0.6 }, { translateY: (1 - p.value) * 30 }] }));
  const name = fullName(u);
  const [first, ...rest] = name.split(' ');
  return (
    <Animated.View style={[{ alignItems: 'center', marginBottom: 10 }, a]}>
      <View>
        <View style={{ borderRadius: size, borderWidth: 4, borderColor: colors.primaryGlow, padding: 2 }}>
          <Avatar source={u.imageUrl} name={name} size={size} ring={false} />
        </View>
        <View style={{ position: 'absolute', right: -2, top: 0, width: rank === 1 ? 38 : 32, height: rank === 1 ? 38 : 32, borderRadius: 20, backgroundColor: rank === 1 ? colors.primary : colors.cream, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.heroMid }}>
          {rank === 1 ? <Crown size={18} color={colors.onPrimary} /> : <Medal size={16} color={rank === 2 ? '#7C8077' : '#B4632D'} />}
        </View>
      </View>
      <Txt v={rank === 1 ? 'h3' : 'bodyLg'} style={{ textAlign: 'center', marginTop: 8 }}>
        {rank === 1 ? name : `${first}\n${rest.join(' ')}`}
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
