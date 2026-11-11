import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useApp } from '@/store';
import { colors } from '@/theme';

export default function Index() {
  const { onboarded, signedIn } = useApp();
  const [ready, setReady] = useState(useApp.persist.hasHydrated());
  useEffect(() => useApp.persist.onFinishHydration(() => setReady(true)), []);
  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.surface }} />;
  if (!onboarded) return <Redirect href="/onboarding" />;
  if (!signedIn) return <Redirect href="/login" />;
  return <Redirect href="/home" />;
}
