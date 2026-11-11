import { router } from 'expo-router';
import { useState } from 'react';
import { AuthShell, SocialRow } from '@/auth';
import { useApp } from '@/store';
import { colors, font } from '@/theme';
import { Field, PrimaryButton, Txt } from '@/ui';

export default function EmailLogin() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const valid = /\S+@\S+\.\S+/.test(email) && pw.length >= 6;
  return (
    <AuthShell
      title="Welcome Back"
      sub="Sign in to continue your streak and keep your progress moving."
      footer={
        <Txt v="small" color={colors.textMuted} style={{ textAlign: 'center', marginTop: 28 }}>
          Don’t have an account?{' '}
          <Txt v="small" color={colors.primary} style={{ fontFamily: font.semibold }} onPress={() => router.replace('/signup')}>
            Create An account
          </Txt>
        </Txt>
      }
    >
      <Field placeholder="Email" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
      <Field placeholder="Password" secure value={pw} onChangeText={setPw} />
      <Txt v="small" color={colors.primary} style={{ textAlign: 'right', marginRight: 8 }} onPress={() => router.push('/forgot')}>
        Forgot password?
      </Txt>
      <PrimaryButton
        title="Login"
        disabled={!valid}
        style={{ marginTop: 10 }}
        onPress={() => {
          useApp.getState().set({ signedIn: true, email });
          router.replace('/home');
        }}
      />
      <SocialRow />
    </AuthShell>
  );
}
