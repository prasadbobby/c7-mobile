import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AUTH_MODE } from '@/api/session';
import { authError, useGoogle } from '@/auth';
import { images } from '@/data';
import { GoogleIcon } from '@/icons';
import { Reveal, useStagger } from '@/motion';
import { colors, font } from '@/theme';
import { Divider, Img, PrimaryButton, SecondaryButton, toast, Txt } from '@/ui';

function GoogleButton() {
  const google = useGoogle();
  const [busy, setBusy] = useState(false);
  return (
    <SecondaryButton
      title={busy ? 'Opening Google…' : 'Continue with Google'}
      leading={<GoogleIcon />}
      disabled={busy}
      onPress={async () => {
        setBusy(true);
        try {
          if (await google()) router.replace('/');
        } catch (e) {
          toast.error(authError(e));
        } finally {
          setBusy(false);
        }
      }}
    />
  );
}

export default function Login() {
  const insets = useSafeAreaInsets();
  const r = useStagger(6, { stagger: 0.08, duration: 0.7 });
  const float = useSharedValue(0);
  useEffect(() => {
    float.value = 0;
  }, [float]);
  const floatA = useAnimatedStyle(() => ({ transform: [{ translateY: float.value }] }));
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surface }} contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24, paddingHorizontal: 24, flexGrow: 1 }}>
      <Reveal p={r[0]!} scale={0.8} y={0} style={{ alignItems: 'center' }}>
        <Animated.View style={floatA}>
          <Img source={images.loginIllustration} style={{ width: 270, height: 270, backgroundColor: 'transparent' }} contentFit="contain" />
        </Animated.View>
      </Reveal>
      <Reveal p={r[1]!}>
        <Txt v="h1" style={{ textAlign: 'center', marginTop: 12, fontFamily: font.semibold }}>
          Let’s log you in
        </Txt>
        <Txt color={colors.textMuted} style={{ textAlign: 'center', marginTop: 12 }}>
          Your workouts, check-ins, streaks and coach’s plan are waiting for you.
        </Txt>
      </Reveal>
      <View style={{ gap: 14, marginTop: 36 }}>
        {AUTH_MODE === 'clerk' && (
          <Reveal p={r[2]!}>
            <GoogleButton />
          </Reveal>
        )}
      </View>
      {AUTH_MODE === 'clerk' && (
        <Reveal p={r[3]!} style={{ marginVertical: 28 }}>
          <Divider label="Or" />
        </Reveal>
      )}
      <Reveal p={r[4]!}>
        <PrimaryButton title="Continue with Email" onPress={() => router.push('/email-login')} />
      </Reveal>
      <View style={{ flex: 1 }} />
      <Reveal p={r[5]!}>
        <Txt v="small" color={colors.textMuted} style={{ textAlign: 'center', marginTop: 28 }}>
          New to C7?{' '}
          <Txt v="small" color={colors.primary} style={{ fontFamily: font.semibold }} onPress={() => router.push('/signup')}>
            How it works
          </Txt>
        </Txt>
      </Reveal>
    </ScrollView>
  );
}
