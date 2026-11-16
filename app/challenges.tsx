import { router } from 'expo-router';
import { CalendarDays, Flame, Trophy, Users } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { shortDate } from '@/api/dates';
import { useChallenges, useRequestChallengeAccess } from '@/api/hooks';
import type { ChallengeListItem } from '@/api/types';
import { ArtEmpty } from '@/badges';
import { workoutArt } from '@/data';
import { Reveal, ScrollReveal, useScrollY, useStagger } from '@/motion';
import { colors, radius, shadow } from '@/theme';
import { Bar, Card, ErrorState, FadeBottom, HeroGlow, Img, LimeGradient, PillButton, Press, SectionHeader, Skeleton, toast, TopBar, Txt, useTopInset } from '@/ui';

export default function Challenges() {
  const top = useTopInset(70);
  const { y, onScroll } = useScrollY();
  const q = useChallenges();
  const request = useRequestChallengeAccess();
  const r = useStagger(3);
  const list = q.data ?? [];
  const active = list.filter((c) => c.access === 'enabled');
  const featured = active[0] ?? list[0];
  const others = list.filter((c) => c.id !== featured?.id && c.access !== 'enabled');
  const ask = (c: ChallengeListItem) => request.mutate(c.id, { onSuccess: () => toast.ok('Request sent — your coach will enable you in C7'), onError: toast.error });

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <HeroGlow />
      <TopBar title="Challenges" y={y} right={<View style={{ width: 48 }} />} />
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: top, paddingBottom: 40 }}>
        {q.error ? (
          <ErrorState error={q.error} onRetry={() => q.refetch()} />
        ) : q.isLoading ? (
          <Skeleton height={240} style={{ marginHorizontal: 20, marginTop: 10, width: undefined }} radius={radius.xxl} />
        ) : !featured ? (
          <ArtEmpty art="no-challenge" title="No challenges running" body="When your gym starts a challenge in the C7 dashboard it’ll appear here." />
        ) : (
          <Reveal p={r[0]!} scale={0.94} style={{ marginHorizontal: 20, marginTop: 10 }}>
            <Press onPress={() => router.push(`/challenge/${featured.id}`)} scaleTo={0.98} style={[{ height: 240, borderRadius: radius.xxl, overflow: 'hidden' }, shadow.card]} accessibilityLabel={featured.title}>
              <Img source={null} fallback={workoutArt('functional', featured.id)} style={StyleSheet.absoluteFill} />
              <FadeBottom />
              <View style={{ position: 'absolute', left: 20, right: 20, bottom: 20 }}>
                <Txt v="overline" color={colors.primary}>
                  {featured.access === 'enabled' ? 'Your challenge' : 'Featured'} · {featured.stats?.totalDays ?? Math.round((new Date(featured.endDate).getTime() - new Date(featured.startDate).getTime()) / 86400000)} days
                </Txt>
                <Txt v="h1" style={{ marginTop: 6 }} numberOfLines={2}>
                  {featured.title}
                </Txt>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Users size={16} color={colors.textMuted} />
                    <Txt v="small" color={colors.textMuted}>
                      {featured.participants.toLocaleString()} taking part
                    </Txt>
                  </View>
                  <PillButton
                    title={featured.access === 'enabled' ? 'Open' : featured.access === 'requested' ? 'Requested' : 'Request to join'}
                    active={featured.access === 'requested'}
                    onPress={() => (featured.access === 'none' ? ask(featured) : router.push(`/challenge/${featured.id}`))}
                  />
                </View>
              </View>
            </Press>
          </Reveal>
        )}

        {active.length > 0 && (
          <Reveal p={r[1]!} style={{ marginTop: 28 }}>
            <SectionHeader title="In progress" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 20, marginTop: 14 }}>
              {active.map((c) => (
                <Card key={c.id} onPress={() => router.push(`/challenge/${c.id}`)} style={{ width: 240, gap: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <LimeGradient style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' }}>
                      <Trophy size={20} color={colors.onPrimary} />
                    </LimeGradient>
                    <View style={{ flex: 1 }}>
                      <Txt numberOfLines={1}>{c.title}</Txt>
                      <Txt v="caption" color={colors.textMuted}>
                        Day {Math.min(c.stats?.daysPassed ?? 1, c.stats?.totalDays ?? 90)} of {c.stats?.totalDays ?? 90}
                      </Txt>
                    </View>
                  </View>
                  <Bar value={(c.stats?.completedDays ?? 0) / (c.stats?.totalDays || 90)} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Txt v="caption" color={colors.textMuted}>
                      {c.stats?.completedDays ?? 0} check-ins
                    </Txt>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Flame size={12} color={colors.calories} />
                      <Txt v="caption" color={colors.textMuted}>
                        {c.stats?.streak ?? 0} streak
                      </Txt>
                    </View>
                  </View>
                </Card>
              ))}
            </ScrollView>
          </Reveal>
        )}

        {others.length > 0 && (
          <Reveal p={r[2]!} style={{ marginTop: 28 }}>
            <SectionHeader title="Other challenges" />
          </Reveal>
        )}
        {others.map((c) => (
          <ScrollReveal key={c.id} y={y} style={{ marginHorizontal: 20, marginTop: 14 }}>
            <Card onPress={() => router.push(`/challenge/${c.id}`)} style={{ flexDirection: 'row', gap: 14, padding: 10, alignItems: 'center' }}>
              <Img source={null} fallback={workoutArt('functional', c.id)} style={{ width: 86, height: 86, borderRadius: radius.md }} />
              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <CalendarDays size={14} color={colors.primary} />
                  <Txt v="caption" color={colors.primary}>
                    {shortDate(c.startDate).toUpperCase()}
                  </Txt>
                </View>
                <Txt v="bodyLg" numberOfLines={1}>
                  {c.title}
                </Txt>
                <Txt v="small" color={colors.textMuted}>
                  {c.participants} members
                </Txt>
              </View>
              <PillButton title={c.access === 'requested' ? 'Requested' : 'Join'} active={c.access === 'requested'} onPress={() => c.access === 'none' && ask(c)} />
            </Card>
          </ScrollReveal>
        ))}
      </Animated.ScrollView>
    </View>
  );
}
