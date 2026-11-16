import { Lexend_300Light, Lexend_400Regular, Lexend_500Medium, Lexend_600SemiBold, Lexend_700Bold, Lexend_800ExtraBold, useFonts } from '@expo-google-fonts/lexend';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Lock } from 'lucide-react-native';
import { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useMe } from '@/api/hooks';
import { AppProviders, useSession } from '@/api/session';
import { useSessionUi } from '@/store';
import { colors } from '@/theme';
import { EmptyState, PillButton, setHapticsEnabled, Toaster } from '@/ui';

SplashScreen.preventAutoHideAsync().catch(() => {});

/** Applies the member's saved preferences on this device. */
function PrefsSync() {
  const { signedIn } = useSession();
  const me = useMe();
  useEffect(() => {
    if (signedIn && me.data) setHapticsEnabled(me.data.preferences.hapticsEnabled);
  }, [signedIn, me.data]);
  return null;
}

/** Shown when the gym has locked the account in FitForge (API answers 423). */
function LockedOverlay() {
  const locked = useSessionUi((s) => s.locked);
  const { signOut } = useSession();
  if (!locked) return null;
  return (
    <View style={{ position: 'absolute', inset: 0, backgroundColor: colors.surface, justifyContent: 'center', zIndex: 999 }}>
      <EmptyState icon={Lock} title="Account locked" body="Your gym has paused access to this account. Please contact the C7 front desk to unlock it." action={<PillButton title="SIGN OUT" onPress={signOut} style={{ marginTop: 12 }} />} />
    </View>
  );
}

function Signed() {
  const { signedIn } = useSession();
  return signedIn ? <PrefsSync /> : null;
}

export default function RootLayout() {
  const [loaded] = useFonts({ Lexend_300Light, Lexend_400Regular, Lexend_500Medium, Lexend_600SemiBold, Lexend_700Bold, Lexend_800ExtraBold });
  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);
  if (!loaded) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.surface }}>
      <SafeAreaProvider>
        <AppProviders>
          <StatusBar style="light" />
          <Signed />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surface }, animation: 'fade_from_bottom', animationDuration: 280 }}>
            <Stack.Screen name="index" options={{ animation: 'none' }} />
            <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
            <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
            <Stack.Screen name="exercise/[id]" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="session/[id]" options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
            <Stack.Screen name="complete" options={{ animation: 'fade', gestureEnabled: false }} />
            <Stack.Screen name="meal/[id]" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
          </Stack>
          <LockedOverlay />
          <Toaster />
        </AppProviders>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
