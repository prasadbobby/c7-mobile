import { router } from 'expo-router';
import { Users } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { challenges, type Challenge } from '@/data';
import { Reveal, ScrollReveal, useScrollY, useStagger } from '@/motion';
import { kindIcon } from '@/shared';
import { useApp } from '@/store';
import { colors, radius, shadow } from '@/theme';
import { Bar, Card, Chip, FadeBottom, HeroGlow, Img, LimeGradient, PillButton, Press, SectionHeader, TopBar, Txt, useTopInset } from '@/ui';

export default function Challenges() {
  const st = useApp();
  const top = useTopInset(70);
  const { y, onScroll } = useScrollY();
  const [kind, setKind] = useState<Challenge['kind'] | 'all'>('all');
  const r = useStagger(3);
  const active = challenges.filter((c) => st.joinedChallenges.includes(c.id));
  const discover = challenges.filter((c) => !c.featured && !st.joinedChallenges.includes(c.id) && (kind === 'all' || c.kind === kind));
  const featured = challenges.find((c) => c.featured)!;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <HeroGlow />
      <TopBar title="Challenges" y={y} />
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: top, paddingBottom: 40 }}>
        <Reveal p={r[0]!} scale={0.94} style={{ marginHorizontal: 20, marginTop: 10 }}>
          <Press onPress={() => router.push(`/challenge/${featured.id}`)} scaleTo={0.98} style={[{ height: 240, borderRadius: radius.xxl, overflow: 'hidden' }, shadow.card]}>
            <Img source={featured.image} style={StyleSheet.absoluteFill} />
            <FadeBottom />
            <View style={{ position: 'absolute', left: 20, right: 20, bottom: 20 }}>
              <Txt v="overline" color={colors.primary}>
                Featured · {featured.days} days
              </Txt>
              <Txt v="h1" style={{ marginTop: 6 }}>
                {featured.subtitle}
              </Txt>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Users size={16} color={colors.textMuted} />
                  <Txt v="small" color={colors.textMuted}>
                    {featured.participants.toLocaleString()} joined
                  </Txt>
                </View>
                <PillButton title={st.joinedChallenges.includes(featured.id) ? 'View' : 'Join now'} onPress={() => (st.joinChallenge(featured.id), router.push(`/challenge/${featured.id}`))} />
              </View>
            </View>
          </Press>
        </Reveal>

        {active.length > 0 && (
          <Reveal p={r[1]!} style={{ marginTop: 28 }}>
            <SectionHeader title="In progress" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 20, marginTop: 14 }}>
              {active.map((c) => {
                const done = st.challengeProgress[c.id] ?? 0;
                const Icon = kindIcon[c.kind];
                return (
                  <Card key={c.id} onPress={() => router.push(`/challenge/${c.id}`)} style={{ width: 230, gap: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <LimeGradient style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={20} color={colors.onPrimary} />
                      </LimeGradient>
                      <View style={{ flex: 1 }}>
                        <Txt numberOfLines={1}>{c.title}</Txt>
                        <Txt v="caption" color={colors.textMuted}>
                          Day {Math.min(done + 1, c.days)} of {c.days}
                        </Txt>
                      </View>
                    </View>
                    <Bar value={done / c.days} />
                  </Card>
                );
              })}
            </ScrollView>
          </Reveal>
        )}

        <Reveal p={r[2]!} style={{ marginTop: 28 }}>
          <SectionHeader title="Discover" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 20, marginTop: 14 }}>
            {(['all', 'workout', 'steps', 'nutrition', 'hydration'] as const).map((k) => (
              <Chip key={k} label={k[0]!.toUpperCase() + k.slice(1)} icon={k === 'all' ? undefined : kindIcon[k]} active={kind === k} onPress={() => setKind(k)} />
            ))}
          </ScrollView>
        </Reveal>
        {discover.map((c) => {
          const Icon = kindIcon[c.kind];
          return (
            <ScrollReveal key={c.id} y={y} style={{ marginHorizontal: 20, marginTop: 14 }}>
              <Card onPress={() => router.push(`/challenge/${c.id}`)} style={{ flexDirection: 'row', gap: 14, padding: 10, alignItems: 'center' }}>
                <Img source={c.image} style={{ width: 86, height: 86, borderRadius: radius.md }} />
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Icon size={14} color={colors.primary} />
                    <Txt v="caption" color={colors.primary}>
                      {c.days} DAYS
                    </Txt>
                  </View>
                  <Txt v="bodyLg">{c.title}</Txt>
                  <Txt v="small" color={colors.textMuted}>
                    {c.subtitle}
                  </Txt>
                </View>
                <PillButton title="Join" onPress={() => st.joinChallenge(c.id)} />
              </Card>
            </ScrollReveal>
          );
        })}
      </Animated.ScrollView>
    </View>
  );
}
