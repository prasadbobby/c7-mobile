import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useMe } from '@/api/hooks';
import { useSession } from '@/api/session';
import { useApp } from '@/store';
import { colors } from '@/theme';
import { ErrorState } from '@/ui';

function SignedInGate() {
  const me = useMe();
  if (me.error) return <View style={{ flex: 1, backgroundColor: colors.surface, justifyContent: 'center' }}><ErrorState error={me.error} onRetry={() => me.refetch()} /></View>;
  if (!me.data) return <View style={{ flex: 1, backgroundColor: colors.surface }} />;
  const access = me.data.user.access ?? 'MEMBER';
  // Self-signed-up guests do the same first-time setup as members, then see packages.
  if (access === 'GUEST') return <Redirect href={me.data.preferences.onboardingCompleted ? '/guest' : '/goals'} />;
  if (access === 'EXPIRED') return <Redirect href="/renew" />;
  return <Redirect href={me.data.preferences.onboardingCompleted ? '/home' : '/goals'} />;
}

export default function Index() {
  const session = useSession();
  const onboarded = useApp((s) => s.onboarded);
  const [hydrated, setHydrated] = useState(useApp.persist.hasHydrated());
  useEffect(() => useApp.persist.onFinishHydration(() => setHydrated(true)), []);
  if (!hydrated || !session.ready) return <View style={{ flex: 1, backgroundColor: colors.surface }} />;
  if (session.signedIn) return <SignedInGate />;
  if (!onboarded) return <Redirect href="/onboarding" />;
  return <Redirect href="/login" />;
}
