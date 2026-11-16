import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { ArrowLeft, X } from 'lucide-react-native';
import { HERO_ART } from '@/assetkit';
import { Headline, NextBar } from '@/onboard';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { API_URL } from '@/api/client';
import { AUTH_MODE } from '@/api/session';
import { authError, NeedsSignUp, useEmailCode } from '@/auth';
import { useApp } from '@/store';
import { colors, font } from '@/theme';
import { Field, haptic, Press, Txt } from '@/ui';

const LEN = 6;
type Flow = { send: (email: string) => Promise<string>; signUp: (email: string, first: string, last: string) => Promise<string>; resend: (id: string) => Promise<void>; verify: (code: string) => Promise<void> };

/** Test builds (backend AUTH_MODE=test): same screens, code is always 424242. */
function useTestFlow(): Flow {
  const userId = useRef<string | null>(null);
  return {
    async send(email) {
      const r = await fetch(`${API_URL}/__test/lookup?email=${encodeURIComponent(email.trim())}`);
      if (!r.ok) throw new NeedsSignUp();
      userId.current = (await r.json()).userId;
      return 'test';
    },
    async signUp(email, firstName, lastName) {
      const id = `user_${email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      await fetch(`${API_URL}/__test/users`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: id, firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim().toLowerCase() }) });
      userId.current = id;
      return 'signup';
    },
    async resend() {},
    async verify(code) {
      if (code !== '424242') throw new Error('That code isn’t right. Check the latest email and try again.');
      useApp.getState().set({ testUserId: userId.current });
    },
  };
}

function ClerkEmailLogin() {
  const flow = useEmailCode();
  return <EmailCode flow={flow} />;
}
function TestEmailLogin() {
  return <EmailCode flow={useTestFlow()} />;
}
export default function EmailLogin() {
  return AUTH_MODE === 'test' ? <TestEmailLogin /> : <ClerkEmailLogin />;
}

function EmailCode({ flow }: { flow: Flow }) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<'email' | 'name' | 'code'>('email');
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [isNew, setIsNew] = useState(false);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [factor, setFactor] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secs, setSecs] = useState(30);
  const shake = useSharedValue(0);
  const shakeA = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));
  const input = useRef<React.ComponentRef<typeof TextInput>>(null);
  useEffect(() => {
    if (step !== 'code' || secs <= 0) return;
    const t = setTimeout(() => setSecs(secs - 1), 1000);
    return () => clearTimeout(t);
  }, [step, secs]);

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      setFactor(await flow.send(email));
      setIsNew(false);
      setStep('code');
      setSecs(30);
    } catch (e) {
      if (e instanceof NeedsSignUp) setStep('name');
      else setError(authError(e));
    } finally {
      setBusy(false);
    }
  };
  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      setFactor(await flow.signUp(email, first, last));
      setIsNew(true);
      setStep('code');
      setSecs(30);
    } catch (e) {
      setError(authError(e));
    } finally {
      setBusy(false);
    }
  };
  const verify = async (c = code) => {
    setBusy(true);
    setError(null);
    try {
      await flow.verify(c);
      router.replace('/');
    } catch (e) {
      haptic('medium');
      shake.value = withSequence(...[12, -12, 8, -8, 0].map((v) => withTiming(v, { duration: 60 })));
      setCode('');
      setError(authError(e));
    } finally {
      setBusy(false);
    }
  };

  if (step === 'email')
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.surface }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}>
          <View style={{ height: 300, overflow: 'hidden' }}>
            <SvgXml xml={HERO_ART} width="100%" height={340} preserveAspectRatio="xMidYMid slice" />
            <Press accessibilityLabel="Close" onPress={() => (router.canGoBack() ? router.back() : router.replace('/login'))} style={{ position: 'absolute', top: insets.top + 12, right: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(5,6,5,0.6)', alignItems: 'center', justifyContent: 'center' }}>
              <X size={18} color={colors.text} />
            </Press>
          </View>
          <Animated.View entering={FadeInDown.duration(420)} style={{ paddingHorizontal: 20, marginTop: -10, gap: 16 }}>
            <Headline text="*Ready* to push?" size={48} />
            <Txt color={colors.textMuted}>Use the email your gym invited. We’ll send a 6-digit code — no password needed.</Txt>
            <Field placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" value={email} onChangeText={(t) => (setEmail(t), setError(null))} onSubmitEditing={send} accessibilityLabel="Email" />
            {!!error && (
              <Txt v="small" color={colors.danger} style={{ marginHorizontal: 12 }} accessibilityRole="alert">
                {error}
              </Txt>
            )}
            <Txt v="small" color={colors.textMuted}>
              Members: use the email your gym invited. New here? Enter your email and we’ll set you up to explore C7 packages.
            </Txt>
          </Animated.View>
        </ScrollView>
        <NextBar label="Send code" loading={busy} disabled={!/\S+@\S+\.\S+/.test(email)} onNext={send} />
      </KeyboardAvoidingView>
    );

  if (step === 'name')
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.surface }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: insets.top + 14, paddingHorizontal: 20, paddingBottom: insets.bottom + 140, gap: 16 }}>
          <Press accessibilityLabel="Use a different email" onPress={() => (setStep('email'), setError(null))} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={20} color={colors.text} />
          </Press>
          <Animated.View entering={FadeInDown.duration(420)} style={{ gap: 16, marginTop: 24 }}>
            <Headline text="New to *C7*?" size={46} />
            <Txt color={colors.textMuted}>There’s no account for {email.trim()} yet. Tell us your name and we’ll create one — you can browse packages and request one. If the gym invited you on a different email, go back and use that.</Txt>
            <Field placeholder="First name" autoComplete="given-name" value={first} onChangeText={(t) => (setFirst(t), setError(null))} accessibilityLabel="First name" />
            <Field placeholder="Last name (optional)" autoComplete="family-name" value={last} onChangeText={setLast} accessibilityLabel="Last name" />
            {!!error && (
              <Txt v="small" color={colors.danger} accessibilityRole="alert">
                {error}
              </Txt>
            )}
            {/* Web only: Clerk's bot-protection mounts its CAPTCHA here during sign-up (custom flow). */}
            {Platform.OS === 'web' && <View nativeID="clerk-captcha" style={{ minHeight: 1 }} />}
          </Animated.View>
        </ScrollView>
        <NextBar label="Create account" loading={busy} disabled={first.trim().length < 2} onNext={create} />
      </KeyboardAvoidingView>
    );

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ paddingTop: insets.top + 14, paddingHorizontal: 20 }}>
        <Press accessibilityLabel="Use a different email" onPress={() => (setStep('email'), setCode(''), setError(null))} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={20} color={colors.text} />
        </Press>
      </View>
      <Animated.View entering={FadeInDown.duration(420)} style={{ paddingHorizontal: 24, marginTop: 56, alignItems: 'center', gap: 14 }}>
        <Headline text={isNew ? 'Confirm *email*' : 'Confirm *sign in*'} center size={46} />
        <Txt color={colors.textMuted} style={{ textAlign: 'center' }}>
          A 6-digit code has been sent to {email.trim()}
        </Txt>
      </Animated.View>
      <Animated.View style={[{ flexDirection: 'row', justifyContent: 'center', gap: 14, marginTop: 56 }, shakeA]}>
        {Array.from({ length: LEN }, (_, k) => (
          <Pressable key={k} onPress={() => input.current?.focus()} style={{ width: 38, alignItems: 'center', gap: 6 }}>
            <Txt style={{ fontFamily: font.bold, fontSize: 44, lineHeight: 52 }}>{code[k] ?? ''}</Txt>
            <View style={{ height: 3, width: 30, borderRadius: 2, backgroundColor: code.length === k ? colors.primary : code[k] ? colors.text : colors.muted }} />
          </Pressable>
        ))}
      </Animated.View>
      <TextInput
        ref={input}
        autoFocus
        value={code}
        accessibilityLabel="Verification code"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        onChangeText={(t) => {
          const v = t.replace(/\D/g, '').slice(0, LEN);
          setCode(v);
          setError(null);
          if (v.length === LEN) verify(v);
        }}
        keyboardType="number-pad"
        style={{ position: 'absolute', opacity: 0, height: 1 }}
      />
      {!!error && (
        <Txt v="small" color={colors.danger} style={{ textAlign: 'center', marginTop: 20, paddingHorizontal: 24 }} accessibilityRole="alert">
          {error}
        </Txt>
      )}
      <Txt
        color={colors.textMuted}
        style={{ textAlign: 'center', marginTop: 36 }}
        onPress={() => {
          if (secs > 0) return;
          setSecs(30);
          flow.resend(factor).catch((e) => setError(authError(e)));
        }}
      >
        {secs > 0 ? (
          <>
            You can resend the code in <Txt color={colors.primary}>00:{String(secs).padStart(2, '0')}</Txt>
          </>
        ) : (
          <Txt color={colors.primary}>Resend code</Txt>
        )}
      </Txt>
      <NextBar label="Verify" loading={busy} disabled={code.length < LEN} onNext={() => verify()} />
    </View>
  );
}
