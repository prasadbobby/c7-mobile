import { router } from 'expo-router';
import { MailCheck, ShieldCheck, Smartphone } from 'lucide-react-native';
import { View } from 'react-native';
import { AuthShell } from '@/auth';
import { colors, font } from '@/theme';
import { Card, Icon, PrimaryButton, Txt } from '@/ui';

const steps = [
  { icon: MailCheck, title: 'Sign up with your email or Google', body: 'Anyone can create an account and see C7’s online and studio packages.' },
  { icon: ShieldCheck, title: 'Request a package', body: 'The studio calls you to confirm timings and payment, then enrols you.' },
  { icon: Smartphone, title: 'Your full app unlocks', body: 'Workouts from your coach, meals, check-ins, attendance and more. Invited members get this straight away.' },
];

export default function Signup() {
  return (
    <AuthShell
      title="How C7 works"
      sub="Members get the full app. Everyone else can explore packages first."
      footer={
        <Txt v="body" color={colors.textMuted} style={{ textAlign: 'center', marginTop: 28 }}>
          Have an account?{' '}
          <Txt color={colors.primary} style={{ fontFamily: font.semibold }} onPress={() => router.replace('/email-login')}>
            Sign in
          </Txt>
        </Txt>
      }
    >
      {steps.map((s, i) => (
        <Card key={s.title} style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: i === 2 ? colors.primary : colors.secondary, alignItems: 'center', justifyContent: 'center' }}>
            <Icon as={s.icon} color={i === 2 ? colors.onPrimary : colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt v="bodyLg">{s.title}</Txt>
            <Txt v="small" color={colors.textMuted}>
              {s.body}
            </Txt>
          </View>
        </Card>
      ))}
      <PrimaryButton title="Get started" style={{ marginTop: 10 }} onPress={() => router.replace('/email-login')} />
    </AuthShell>
  );
}
