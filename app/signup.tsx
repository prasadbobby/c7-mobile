import { router } from 'expo-router';
import { useState } from 'react';
import { useApp } from '@/store';
import { colors, font } from '@/theme';
import { Checkbox, Field, PrimaryButton, Txt } from '@/ui';
import { AuthShell, SocialRow } from '@/auth';

export default function Signup() {
  const [f, setF] = useState({ name: '', email: '', pw: '', pw2: '' });
  const [agree, setAgree] = useState(false);
  const mismatch = f.pw2.length > 0 && f.pw !== f.pw2;
  const valid = f.name.trim() && /\S+@\S+\.\S+/.test(f.email) && f.pw.length >= 6 && !mismatch && agree;
  return (
    <AuthShell
      title="Create An Account"
      sub="Create an account to set goals, track your progress, and stay motivated every step of the way."
      footer={
        <Txt v="body" color={colors.textMuted} style={{ textAlign: 'center', marginTop: 28 }}>
          Already have an account?{' '}
          <Txt color={colors.primary} style={{ fontFamily: font.semibold }} onPress={() => router.replace('/email-login')}>
            Login
          </Txt>
        </Txt>
      }
    >
      <Field placeholder="Name" value={f.name} onChangeText={(name) => setF({ ...f, name })} />
      <Field placeholder="Email" keyboardType="email-address" autoCapitalize="none" value={f.email} onChangeText={(email) => setF({ ...f, email })} />
      <Field placeholder="Password" secure value={f.pw} onChangeText={(pw) => setF({ ...f, pw })} />
      <Field placeholder="Confirm Password" secure value={f.pw2} onChangeText={(pw2) => setF({ ...f, pw2 })} style={mismatch ? { borderColor: colors.danger } : undefined} />
      {mismatch && (
        <Txt v="small" color={colors.danger} style={{ marginLeft: 20 }}>
          Passwords don’t match
        </Txt>
      )}
      <Checkbox
        checked={agree}
        onChange={setAgree}
        label={
          <Txt color={colors.textMuted}>
            I agree to the <Txt color={colors.text}>Terms & Condition</Txt>
          </Txt>
        }
      />
      <PrimaryButton
        title="Create an Account"
        disabled={!valid}
        style={{ marginTop: 12 }}
        onPress={() => {
          useApp.getState().set({ name: f.name.trim().split(' ')[0]!, email: f.email });
          router.replace('/goals');
        }}
      />
      <SocialRow />
    </AuthShell>
  );
}
