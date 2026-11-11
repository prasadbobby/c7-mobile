import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { colors, font, radius } from '@/theme';
import { Field, haptic, PrimaryButton, Txt } from '@/ui';
import { AuthShell } from '@/auth';

export default function Forgot() {
  const [step, setStep] = useState<'email' | 'code' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [pw, setPw] = useState('');
  const [secs, setSecs] = useState(30);
  const shake = useSharedValue(0);
  const shakeA = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));
  const input = useRef<React.ComponentRef<typeof TextInput>>(null);
  useEffect(() => {
    if (step !== 'code' || secs <= 0) return;
    const t = setTimeout(() => setSecs(secs - 1), 1000);
    return () => clearTimeout(t);
  }, [step, secs]);

  if (step === 'email')
    return (
      <AuthShell title="Forgot Password?" sub="Enter the email linked to your account and we’ll send you a 4-digit code." footer={null}>
        <Field placeholder="Email" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
        <PrimaryButton title="Send Code" disabled={!/\S+@\S+\.\S+/.test(email)} onPress={() => setStep('code')} />
      </AuthShell>
    );
  if (step === 'code')
    return (
      <AuthShell title="Check Your Inbox" sub={`We sent a code to ${email}. Hint: use 1234.`} footer={null}>
        <Animated.View style={[{ flexDirection: 'row', justifyContent: 'center', gap: 14 }, shakeA]}>
          {[0, 1, 2, 3].map((k) => (
            <View key={k} onTouchEnd={() => input.current?.focus()} style={{ width: 64, height: 72, borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 2, borderColor: code.length === k ? colors.primary : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
              <Txt style={{ fontFamily: font.light, fontSize: 32 }}>{code[k] ?? ''}</Txt>
            </View>
          ))}
        </Animated.View>
        <TextInput ref={input} autoFocus value={code} onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" style={{ position: 'absolute', opacity: 0, height: 1 }} />
        <Txt v="small" color={colors.textMuted} style={{ textAlign: 'center' }} onPress={() => secs === 0 && setSecs(30)}>
          {secs > 0 ? `Resend code in 0:${String(secs).padStart(2, '0')}` : 'Resend code'}
        </Txt>
        <PrimaryButton
          title="Verify"
          disabled={code.length < 4}
          onPress={() => {
            if (code === '1234') return setStep('reset');
            haptic('medium');
            shake.value = withSequence(...[12, -12, 8, -8, 0].map((v) => withTiming(v, { duration: 60 })));
            setCode('');
          }}
        />
      </AuthShell>
    );
  return (
    <AuthShell title="New Password" sub="Choose a strong password you haven’t used before." footer={null}>
      <Field placeholder="New password" secure value={pw} onChangeText={setPw} />
      <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 8 }}>
        {[0, 1, 2, 3].map((k) => (
          <View key={k} style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: pw.length > k * 3 ? colors.primary : colors.muted }} />
        ))}
      </View>
      <PrimaryButton title="Save & Login" disabled={pw.length < 6} onPress={() => router.replace('/email-login')} />
    </AuthShell>
  );
}
