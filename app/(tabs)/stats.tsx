import { router } from 'expo-router';
import { ChevronRight, Flame, Footprints, Moon, Timer, Trophy } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Bars, ProgressLine } from '@/charts';
import { avatars, weekDays, weekSteps } from '@/data';
import { WaterIcon } from '@/icons';
import { Reveal, ScrollReveal, useCountUp, useScrollY, useStagger } from '@/motion';
import { useApp } from '@/store';
import { colors, font, radius, shadow } from '@/theme';
import { Avatar, Card, HeroGlow, LimeGradient, Press, RankBadge, Ring, SectionHeader, Segmented, TAB_BAR_SPACE, Txt, useTopInset } from '@/ui';

type Range = 'week' | 'month' | 'year';
const ranges: Record<Range, { steps: number[]; labels: string[] }> = {
  week: { steps: weekSteps, labels: weekDays.map((d) => d[0]!) },
  month: { steps: [52000, 61000, 58400, 66900], labels: ['W1', 'W2', 'W3', 'W4'] },
  year: { steps: [180, 210, 240, 220, 260, 290, 270, 300, 280, 310, 260, 120].map((v) => v * 1000), labels: 'JFMAMJJASOND'.split('') },
};

export default function Stats() {
  const st = useApp();
  const top = useTopInset(12);
  const { y, onScroll } = useScrollY();
  const [range, setRange] = useState<Range>('week');
  const data = ranges[range];
  const total = data.steps.reduce((a, b) => a + b, 0);
  const totalAnim = useCountUp(total);
  const r = useStagger(4, { stagger: 0.1 });
  const mins = st.workoutLog.reduce((a, l) => a + l.minutes, 0);
  const kcal = st.workoutLog.reduce((a, l) => a + l.kcal, 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <HeroGlow />
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: top, paddingBottom: TAB_BAR_SPACE + 20 }}>
        <Reveal p={r[0]!} style={{ paddingHorizontal: 20 }}>
          <Txt v="h1">Your Progress</Txt>
          <Txt color={colors.textMuted}>Every step counts. Here’s how you’re moving.</Txt>
        </Reveal>

        {/* Activity rings */}
        <Reveal p={r[1]!} scale={0.9} style={{ marginHorizontal: 20, marginTop: 22 }}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 20, padding: 20 }}>
            <Ring value={7890 / st.stepGoal} size={140} stroke={12}>
              <Ring value={kcal / 800} size={108} stroke={12} color={colors.calories} track="rgba(240,90,40,0.15)" delay={0.15}>
                <Ring value={st.waterMl / 2000} size={76} stroke={12} color={colors.protein} track="rgba(22,179,235,0.15)" delay={0.3} />
              </Ring>
            </Ring>
            <View style={{ flex: 1, gap: 14 }}>
              <Legend color={colors.primary} icon={<Footprints size={16} color={colors.primary} />} label="Steps" value={`7,890 / ${(st.stepGoal / 1000).toFixed(0)}k`} />
              <Legend color={colors.calories} icon={<Flame size={16} color={colors.calories} />} label="Burned" value={`${kcal} kcal`} />
              <Legend color={colors.protein} icon={<WaterIcon size={16} />} label="Water" value={`${(st.waterMl / 1000).toFixed(1)}L / 2L`} />
            </View>
          </Card>
        </Reveal>

        <Reveal p={r[2]!} style={{ marginHorizontal: 20, marginTop: 22 }}>
          <Segmented<Range>
            value={range}
            onChange={setRange}
            options={[
              { id: 'week', label: 'Week' },
              { id: 'month', label: 'Month' },
              { id: 'year', label: 'Year' },
            ]}
          />
        </Reveal>

        <Reveal p={r[3]!} style={{ marginHorizontal: 20, marginTop: 16 }}>
          <Card style={{ padding: 20 }}>
            <Txt v="small" color={colors.textMuted}>
              Total steps
            </Txt>
            <Txt style={{ fontFamily: font.light, fontSize: 40, lineHeight: 48 }}>{totalAnim.toLocaleString()}</Txt>
            <Txt v="small" color={colors.primary} style={{ marginBottom: 16 }}>
              ▲ 12% vs last {range}
            </Txt>
            <Bars key={range} values={data.steps} labels={data.labels} highlight={range === 'week' ? 3 : data.steps.length - 1} goal={range === 'week' ? st.stepGoal : undefined} />
          </Card>
        </Reveal>

        <ScrollReveal y={y} style={{ flexDirection: 'row', gap: 12, marginHorizontal: 20, marginTop: 12 }}>
          {[
            { icon: Timer, v: `${mins}`, u: 'active min' },
            { icon: Flame, v: `${kcal}`, u: 'kcal burned' },
            { icon: Moon, v: '7h 20m', u: 'avg sleep' },
          ].map((x) => (
            <Card key={x.u} style={{ flex: 1, gap: 10 }}>
              <x.icon size={20} color={colors.primary} />
              <Txt style={{ fontFamily: font.light, fontSize: 22 }}>{x.v}</Txt>
              <Txt v="caption" color={colors.textMuted}>
                {x.u}
              </Txt>
            </Card>
          ))}
        </ScrollReveal>

        <ScrollReveal y={y} style={{ marginHorizontal: 20, marginTop: 24 }}>
          <Card style={{ padding: 20 }} onPress={() => router.push('/body')}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Txt v="h3">Weight trend</Txt>
              <ChevronRight size={20} color={colors.textMuted} />
            </View>
            <Txt style={{ fontFamily: font.light, fontSize: 32, color: colors.primary }}>{st.weightKg}kg</Txt>
            <ProgressLine points={st.weightLog.map((w) => w.kg)} labels={['6w', '4w', '2w', 'Now']} min={46} max={54} ticks={[53, 50, 47]} marker={false} height={150} />
          </Card>
        </ScrollReveal>

        {/* Leaderboard teaser */}
        <ScrollReveal y={y} style={{ marginTop: 26 }}>
          <SectionHeader title="Leaderboard" action={<Txt v="small" color={colors.primary} onPress={() => router.push('/leaderboard')}>View all</Txt>} />
        </ScrollReveal>
        <ScrollReveal y={y} style={{ marginHorizontal: 20, marginTop: 12 }}>
          <Press onPress={() => router.push('/leaderboard')} scaleTo={0.97} style={[{ borderRadius: radius.xl, overflow: 'hidden' }, shadow.glow]}>
            <LimeGradient style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 }}>
              <Avatar source={avatars.emma} size={56} ring={false} badge={<RankBadge n={32} light />} />
              <View style={{ flex: 1 }}>
                <Txt v="bodyLg" color={colors.onPrimary}>
                  You’re #32 this week
                </Txt>
                <Txt v="small" color="rgba(10,15,7,0.7)">
                  13k steps to pass Sara Kim
                </Txt>
              </View>
              <Trophy size={28} color={colors.onPrimary} />
            </LimeGradient>
          </Press>
        </ScrollReveal>
      </Animated.ScrollView>
    </View>
  );
}

function Legend({ color, icon, label, value }: { color: string; icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: color + '22', alignItems: 'center', justifyContent: 'center' }}>{icon}</View>
      <View>
        <Txt v="caption" color={colors.textMuted}>
          {label}
        </Txt>
        <Txt v="small">{value}</Txt>
      </View>
    </View>
  );
}
