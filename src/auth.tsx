import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppleIcon, FacebookIcon, GoogleIcon } from './icons';
import { Reveal, useStagger } from './motion';
import { useApp } from './store';
import { colors, font } from './theme';
import { Divider, IconButton, Txt } from './ui';

export function AuthShell({ title, sub, children, footer }: { title: string; sub: string; children: React.ReactNode; footer: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const r = useStagger(3, { stagger: 0.1 });
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24, paddingHorizontal: 24, flexGrow: 1 }}>
        <IconButton icon={ArrowLeft} label="Go back" tint={colors.card} onPress={() => (router.canGoBack() ? router.back() : router.replace('/login'))} />
        <Reveal p={r[0]!}>
          <Txt v="h1" style={{ textAlign: 'center', marginTop: 48, fontFamily: font.semibold }}>
            {title}
          </Txt>
          <Txt color={colors.textMuted} style={{ textAlign: 'center', marginTop: 12, marginBottom: 32 }}>
            {sub}
          </Txt>
        </Reveal>
        <Reveal p={r[1]!} style={{ gap: 14 }}>
          {children}
        </Reveal>
        <View style={{ flex: 1 }} />
        <Reveal p={r[2]!}>{footer}</Reveal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function SocialRow() {
  const go = () => {
    useApp.getState().set({ signedIn: true });
    router.replace('/home');
  };
  return (
    <View style={{ marginTop: 40, gap: 20 }}>
      <Divider label="Or Login with" />
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20 }}>
        <IconButton icon={<GoogleIcon size={24} />} label="Google" tint={colors.card} onPress={go} />
        <IconButton icon={<FacebookIcon size={24} />} label="Facebook" tint={colors.card} onPress={go} />
        <IconButton icon={<AppleIcon size={24} />} label="Apple" tint={colors.card} onPress={go} />
      </View>
    </View>
  );
}

