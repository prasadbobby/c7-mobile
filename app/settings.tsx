import { router } from 'expo-router';
import { Bell, ChevronRight, CircleHelp, Lock, LogOut, Ruler, Shield, Smartphone, Target, Vibrate, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { avatars } from '@/data';
import { Reveal, useStagger } from '@/motion';
import { useApp } from '@/store';
import { colors } from '@/theme';
import { Avatar, Card, Field, HeroGlow, PrimaryButton, SecondaryButton, Sheet, TopBar, Toggle, Txt } from '@/ui';

export default function Settings() {
  const st = useApp();
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState(st.name);
  const [confirm, setConfirm] = useState(false);
  const r = useStagger(4);
  const set = (k: keyof typeof st.settings) => (v: boolean) => st.set({ settings: { ...st.settings, [k]: v } });
  const Row = ({ icon: I, label, right, onPress, i }: { icon: LucideIcon; label: string; right?: React.ReactNode; onPress?: () => void; i: number }) => (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderTopWidth: i ? StyleSheet.hairlineWidth : 0, borderColor: colors.border }}>
      <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' }}>
        <I size={18} color={colors.primary} />
      </View>
      <Txt style={{ flex: 1 }}>{label}</Txt>
      {right ?? <ChevronRight size={18} color={colors.textMuted} />}
    </Pressable>
  );
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <HeroGlow />
      <TopBar title="Settings" />
      <Animated.ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 16 }}>
        <Reveal p={r[0]!}>
          <Card onPress={() => setEdit(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Avatar source={avatars.emma} size={60} />
            <View style={{ flex: 1 }}>
              <Txt v="bodyLg">{st.name} Richardson</Txt>
              <Txt v="small" color={colors.textMuted}>{st.email || 'emma@pulsefit.app'}</Txt>
            </View>
            <Txt v="small" color={colors.primary}>Edit</Txt>
          </Card>
        </Reveal>
        <Reveal p={r[1]!}>
          <Card style={{ padding: 4 }}>
            <Row i={0} icon={Target} label="Goals & targets" onPress={() => router.push('/goals')} />
            <Row i={1} icon={Ruler} label="Metric units" right={<Toggle value={st.settings.metric} onChange={set('metric')} />} />
            <Row i={2} icon={Smartphone} label="Connected devices" />
          </Card>
        </Reveal>
        <Reveal p={r[2]!}>
          <Card style={{ padding: 4 }}>
            <Row i={0} icon={Bell} label="Push notifications" right={<Toggle value={st.settings.push} onChange={set('push')} />} />
            <Row i={1} icon={Bell} label="Workout reminders" right={<Toggle value={st.settings.reminders} onChange={set('reminders')} />} />
            <Row i={2} icon={Vibrate} label="Haptics" right={<Toggle value={st.settings.haptics} onChange={set('haptics')} />} />
          </Card>
        </Reveal>
        <Reveal p={r[3]!}>
          <Card style={{ padding: 4 }}>
            <Row i={0} icon={Lock} label="Change password" onPress={() => router.push('/forgot')} />
            <Row i={1} icon={Shield} label="Privacy" />
            <Row i={2} icon={CircleHelp} label="Help & support" />
            <Row i={3} icon={LogOut} label="Log out" right={<View />} onPress={() => setConfirm(true)} />
          </Card>
          <Txt v="caption" color={colors.textDim} style={{ textAlign: 'center', marginTop: 16 }}>PulseFit 1.0.0</Txt>
        </Reveal>
      </Animated.ScrollView>
      <Sheet open={edit} onClose={() => setEdit(false)} title="Edit profile">
        <Field value={name} onChangeText={setName} placeholder="Name" />
        <PrimaryButton title="Save" style={{ marginTop: 16 }} onPress={() => (st.set({ name: name.trim() || st.name }), setEdit(false))} />
      </Sheet>
      <Sheet open={confirm} onClose={() => setConfirm(false)} title="Log out?">
        <Txt color={colors.textMuted} style={{ marginBottom: 20 }}>Your progress is saved on this device.</Txt>
        <PrimaryButton title="Log out" onPress={() => (setConfirm(false), st.signOut(), router.replace('/login'))} />
        <SecondaryButton title="Cancel" style={{ marginTop: 12 }} onPress={() => setConfirm(false)} />
      </Sheet>
    </View>
  );
}
