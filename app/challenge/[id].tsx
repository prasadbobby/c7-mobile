import { router, useLocalSearchParams } from 'expo-router';
import { CalendarDays, Clock, Flame, Lock, Share2, Trophy, Users } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChallenge, useChallenges, useLeaderboard, useMe, useRequestChallengeAccess, useTodayPost } from '@/api/hooks';
import { fullName } from '@/api/meta';
import { ArtEmpty } from '@/badges';
import { ChallengeCalendar, CheckIn, Feed } from '@/challenge';
import { workoutArt } from '@/data';
import { Parallax, Reveal, useCountUp, useScrollY, useStagger } from '@/motion';
import { colors, font } from '@/theme';
import { Avatar, BackButton, Bar, Card, ErrorState, FadeBottom, IconButton, Img, InfoPill, PrimaryButton, RankBadge, SectionHeader, Segmented, Skeleton, toast, Txt, HeroGlow } from '@/ui';

const HERO = 340;
type Tab = 'overview' | 'checkin' | 'feed';

export default function ChallengeDetail() {
  const { id, tab: tabParam } = useLocalSearchParams<{ id: string; tab?: Tab }>();
  const insets = useSafeAreaInsets();
  const list = useChallenges();
  const item = list.data?.find((c) => c.id === id);
  const enabled = item?.access === 'enabled' || (item == null && false);
  const me = useMe();
  const isAdmin = me.data?.user.role !== undefined && me.data.user.role !== 'USER';
  const canView = enabled || isAdmin;
  const detail = useChallenge(canView ? id : undefined);
  const today = useTodayPost(canView ? id : undefined);
  const lb = useLeaderboard(canView ? id : undefined);
  const request = useRequestChallengeAccess();
  const { y, onScroll } = useScrollY();
  const [tab, setTab] = useState<Tab>(tabParam ?? 'overview');
  useEffect(() => {
    if (tabParam) setTab(tabParam);
  }, [tabParam]);
  const r = useStagger(3, { delay: 0.1 });
  const s = detail.data?.stats;
  const done = useCountUp(s?.completedDays ?? 0);
  const ch = detail.data?.challenge ?? item;
  const day = Math.min(s?.daysPassed ?? 1, s?.totalDays ?? 90);

  if (list.error) return <View style={{ flex: 1, backgroundColor: colors.surface, paddingTop: insets.top + 60 }}><HeroGlow /><ErrorState error={list.error} onRetry={() => list.refetch()} /></View>;

  const header = (
    <>
      <View style={{ height: HERO, overflow: 'hidden', borderBottomLeftRadius: 40, borderBottomRightRadius: 40 }}>
        <Parallax y={y} height={HERO} style={StyleSheet.absoluteFill}>
          <Img source={null} fallback={workoutArt('functional', id)} style={StyleSheet.absoluteFill} />
        </Parallax>
        <FadeBottom />
        <View style={{ position: 'absolute', left: 20, right: 20, bottom: 22 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Trophy size={16} color={colors.primary} />
            <Txt v="overline" color={colors.primary}>
              {canView && s ? `Day ${day} of ${s.totalDays}` : 'Challenge'}
            </Txt>
          </View>
          <Txt v="h1" style={{ marginTop: 6 }}>
            {ch?.title ?? ' '}
          </Txt>
        </View>
      </View>
      <View style={{ position: 'absolute', top: insets.top + 8, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between' }}>
        <BackButton />
        <IconButton icon={Share2} label="Share" onPress={() => Share.share({ message: `I’m doing ${ch?.title ?? 'a challenge'} at C7 Personal Fitness 💪` })} />
      </View>
    </>
  );

  // Not enabled: request access (admins enable participants in FitForge).
  if (item && !canView)
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface }}><HeroGlow />
        <Animated.ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}>
          {header}
          <View style={{ padding: 20, gap: 16 }}>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <InfoPill icon={Users} label={`${item.participants} members`} />
              <InfoPill icon={CalendarDays} label={new Date(item.startDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} />
            </View>
            {!!item.description && <Txt color={colors.textMuted}>{item.description}</Txt>}
            <Card style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <Lock size={20} color={colors.primary} />
              <Txt v="small" style={{ flex: 1 }}>
                {item.access === 'requested' ? 'Request sent. Your coach will enable you from the C7 dashboard.' : 'Challenges are coached. Request access and your coach will add you.'}
              </Txt>
            </Card>
          </View>
        </Animated.ScrollView>
        <View style={{ position: 'absolute', left: 20, right: 20, bottom: insets.bottom + 16 }}>
          <PrimaryButton title={item.access === 'requested' ? 'Request pending' : 'Request to join'} disabled={item.access === 'requested'} loading={request.isPending} onPress={() => request.mutate(id, { onSuccess: () => toast.ok('Request sent'), onError: toast.error })} />
        </View>
      </View>
    );

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}><HeroGlow />
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + (tab === 'overview' ? 110 : 40) }}>
        {header}
        <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
          <Segmented<Tab> value={tab} onChange={setTab} options={[{ id: 'overview', label: 'Overview' }, { id: 'checkin', label: today.data ? 'Today ✓' : 'Check-in' }, { id: 'feed', label: 'Feed' }]} />
        </View>
        {!detail.data ? (
          detail.error ? <ErrorState error={detail.error} onRetry={() => detail.refetch()} /> : <Skeleton height={300} style={{ margin: 20, width: undefined }} />
        ) : (
          <Animated.View key={tab} entering={FadeIn.duration(260)} style={{ marginTop: 18 }}>
            {tab === 'overview' && (
              <View style={{ paddingHorizontal: 20, gap: 14 }}>
                <Reveal p={r[0]!}>
                  <Card style={{ padding: 18 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                      <Txt v="h3">Your progress</Txt>
                      <Txt style={{ fontFamily: font.light, fontSize: 28, color: colors.primary }}>
                        {done}
                        <Txt v="small" color={colors.textMuted}>
                          /{s!.totalDays}
                        </Txt>
                      </Txt>
                    </View>
                    <Bar value={s!.completedDays / s!.totalDays} />
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                      <InfoPill icon={Flame} label={`${s!.streak} day streak`} />
                      <InfoPill icon={Clock} label={`${s!.daysRemaining} days left`} />
                      {!!detail.data.rank && <InfoPill icon={Trophy} label={`#${detail.data.rank.rank} of ${detail.data.rank.of}`} />}
                    </View>
                  </Card>
                </Reveal>
                <Reveal p={r[1]!}>
                  <ChallengeCalendar challengeId={id} startDate={detail.data.challenge.startDate} endDate={detail.data.challenge.endDate} />
                </Reveal>
                {!!detail.data.challenge.description && (
                  <Card>
                    <Txt v="small" color={colors.textMuted}>
                      {detail.data.challenge.description}
                    </Txt>
                  </Card>
                )}
                <Reveal p={r[2]!}>
                  <SectionHeader title="Top challengers" style={{ paddingHorizontal: 0 }} action={<Txt v="small" color={colors.primary} onPress={() => router.push(`/leaderboard?id=${id}`)}>Leaderboard</Txt>} />
                  {(lb.data?.overall ?? []).slice(0, 3).map((u) => (
                    <Card key={u.userId} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 10, paddingVertical: 12 }}>
                      <Avatar source={u.imageUrl} name={fullName(u)} size={46} badge={<RankBadge n={u.rank} />} />
                      <Txt style={{ flex: 1 }} numberOfLines={1}>
                        {fullName(u)}
                      </Txt>
                      <Txt v="small" color={colors.textMuted}>
                        {u.score} pts
                      </Txt>
                    </Card>
                  ))}
                  {!!(lb.data && lb.data.overall.length === 0) && <ArtEmpty art="empty-feed" title="No one ranked yet" body="Post your first check-in to top the board." />}
                </Reveal>
              </View>
            )}
            {tab === 'checkin' && (s!.isCompleted ? <ArtEmpty art="no-challenge" title="Challenge finished" body="This challenge has ended. Check the leaderboard for final standings." /> : <CheckIn challengeId={id} dayNumber={day} />)}
            {tab === 'feed' && <Feed challengeId={id} startDate={detail.data.challenge.startDate} />}
          </Animated.View>
        )}
      </Animated.ScrollView>
      {!!(tab === 'overview' && detail.data && !s!.isCompleted) && (
        <View style={{ position: 'absolute', left: 20, right: 20, bottom: insets.bottom + 16 }}>
          <PrimaryButton title={today.data ? 'View today’s check-in' : `Check in · Day ${day}`} onPress={() => setTab('checkin')} />
        </View>
      )}
    </View>
  );
}
