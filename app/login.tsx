import { router } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { images } from '@/data';
import { AppleIcon, FacebookIcon, GoogleIcon } from '@/icons';
import { Reveal, useStagger } from '@/motion';
import { useApp } from '@/store';
import { colors, font } from '@/theme';
import { Divider, Img, PrimaryButton, SecondaryButton, Txt } from '@/ui';

export default function Login() {
  const insets = useSafeAreaInsets();
  const r = useStagger(7, { stagger: 0.08, duration: 0.7 });
  const float = useSharedValue(0);
  useEffect(() => {
    float.value = withRepeat(withSequence(withTiming(-8, { duration: 1800 }), withTiming(0, { duration: 1800 })), -1);
  }, [float]);
  const floatA = useAnimatedStyle(() => ({ transform: [{ translateY: float.value }] }));
  const social = () => {
    useApp.getState().set({ signedIn: true });
    router.replace('/home');
  };
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surface }} contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24, paddingHorizontal: 24, flexGrow: 1 }}>
      <Reveal p={r[0]!} scale={0.8} y={0} style={{ alignItems: 'center' }}>
        <Animated.View style={floatA}>
          <Img source={images.loginIllustration} style={{ width: 270, height: 270 }} contentFit="contain" />
        </Animated.View>
      </Reveal>
      <Reveal p={r[1]!}>
        <Txt v="h1" style={{ textAlign: 'center', marginTop: 12, fontFamily: font.semibold }}>
          Let’s Login you in
        </Txt>
        <Txt color={colors.textMuted} style={{ textAlign: 'center', marginTop: 12 }}>
          Log in to pick up where you left off. Your habits, streaks, and progress are waiting for you.
        </Txt>
      </Reveal>
      <View style={{ gap: 14, marginTop: 36 }}>
        <Reveal p={r[2]!}>
          <SecondaryButton title="Login with Google" leading={<GoogleIcon />} onPress={social} />
        </Reveal>
        <Reveal p={r[3]!}>
          <SecondaryButton title="Login with Facebook" leading={<FacebookIcon />} onPress={social} />
        </Reveal>
        <Reveal p={r[4]!}>
          <SecondaryButton title="Continue with Apple" leading={<AppleIcon />} onPress={social} />
        </Reveal>
      </View>
      <Reveal p={r[5]!} style={{ marginVertical: 28 }}>
        <Divider label="Or" />
      </Reveal>
      <Reveal p={r[6]!}>
        <PrimaryButton title="Login with Email" onPress={() => router.push('/email-login')} />
      </Reveal>
      <View style={{ flex: 1 }} />
      <Txt v="small" color={colors.textMuted} style={{ textAlign: 'center', marginTop: 28 }}>
        Don’t have an account ?{' '}
        <Txt v="small" color={colors.primary} style={{ fontFamily: font.semibold }} onPress={() => router.push('/signup')}>
          Create An account
        </Txt>
      </Txt>
    </ScrollView>
  );
}
