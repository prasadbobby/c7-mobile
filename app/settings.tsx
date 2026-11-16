import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { Bell, ChevronRight, CircleHelp, CreditCard, Dumbbell, LogOut, Ruler, Shield, SlidersHorizontal, UserRound, Vibrate, type LucideIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useMe, useUpdateEquipment, useUpdatePreferences, useUpdateProfile } from '@/api/hooks';
import { fullName, pretty } from '@/api/meta';
import { useSession } from '@/api/session';
import { Reveal, useStagger } from '@/motion';
import { colors } from '@/theme';
import { Avatar, Card, Chip, Field, HeroGlow, PrimaryButton, SecondaryButton, setHapticsEnabled, Sheet, Skeleton, toast, TopBar, Toggle, Txt } from '@/ui';

const EQUIPMENT = ['body only', 'dumbbell', 'barbell', 'kettlebells', 'cable', 'machine', 'bands', 'medicine ball', 'exercise ball', 'e-z curl bar', 'foam roll', 'other'];

export default function Settings() {
  const me = useMe();
  const session = useSession();
  const prefs = useUpdatePreferences();
  const profile = useUpdateProfile();
  const equip = useUpdateEquipment();
  const [edit, setEdit] = useState(false);
  const [equipOpen, setEquipOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [name, setName] = useState({ first: '', last: '' });
  const [owned, setOwned] = useState<string[]>([]);
  const r = useStagger(4);
  const p = me.data?.preferences;
  const u = me.data?.user;
  useEffect(() => {
    if (u) setName({ first: u.firstName, last: u.lastName });
    if (me.data) setOwned(me.data.equipment);
  }, [me.data, u]);

  const toggle = (k: 'pushEnabled' | 'remindersEnabled' | 'hapticsEnabled' | 'metricUnits') => (v: boolean) => {
    if (k === 'hapticsEnabled') setHapticsEnabled(v);
    prefs.mutate({ [k]: v }, { onError: toast.error });
  };
  const Row = ({ icon: I, label, right, onPress, i, meta }: { icon: LucideIcon; label: string; right?: React.ReactNode; onPress?: () => void; i: number; meta?: string }) => (
    <Pressable onPress={onPress} accessibilityRole={onPress ? 'button' : undefined} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderTopWidth: i ? StyleSheet.hairlineWidth : 0, borderColor: colors.border }}>
      <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' }}>
        <I size={18} color={colors.primary} />
      </View>
      <Txt style={{ flex: 1 }}>{label}</Txt>
      {!!meta && (
        <Txt v="small" color={colors.textMuted}>
          {meta}
        </Txt>
      )}
      {right ?? <ChevronRight size={18} color={colors.textMuted} />}
    </Pressable>
  );
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <HeroGlow />
      <TopBar title="Settings" right={<View style={{ width: 48 }} />} />
      <Animated.ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 16 }}>
        <Reveal p={r[0]!}>
          {u ? (
            <Card onPress={() => setEdit(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Avatar source={u.imageUrl} name={fullName(u)} size={60} />
              <View style={{ flex: 1 }}>
                <Txt v="bodyLg">{fullName(u)}</Txt>
                <Txt v="small" color={colors.textMuted}>
                  {u.email ?? ''}
                </Txt>
              </View>
              <Txt v="small" color={colors.primary}>
                Edit
              </Txt>
            </Card>
          ) : (
            <Skeleton height={92} />
          )}
        </Reveal>
        <Reveal p={r[1]!}>
          <Card style={{ padding: 4 }}>
            <Row i={0} icon={SlidersHorizontal} label="Goals & body details" meta={p?.fitnessGoal ? pretty(p.fitnessGoal) : undefined} onPress={() => router.push('/goals')} />
            <Row i={1} icon={Dumbbell} label="My equipment" meta={me.data ? `${me.data.equipment.length} selected` : undefined} onPress={() => setEquipOpen(true)} />
            <Row i={2} icon={CreditCard} label="Membership & payments" onPress={() => router.push('/membership')} />
            <Row i={3} icon={Ruler} label="Metric units" right={<Toggle value={p?.metricUnits ?? true} onChange={toggle('metricUnits')} />} />
          </Card>
        </Reveal>
        <Reveal p={r[2]!}>
          <Card style={{ padding: 4 }}>
            <Row i={0} icon={Bell} label="Push notifications" right={<Toggle value={p?.pushEnabled ?? true} onChange={toggle('pushEnabled')} />} />
            <Row i={1} icon={Bell} label="Workout reminders" right={<Toggle value={p?.remindersEnabled ?? true} onChange={toggle('remindersEnabled')} />} />
            <Row i={2} icon={Vibrate} label="Haptics" right={<Toggle value={p?.hapticsEnabled ?? true} onChange={toggle('hapticsEnabled')} />} />
          </Card>
        </Reveal>
        <Reveal p={r[3]!}>
          <Card style={{ padding: 4 }}>
            <Row i={0} icon={UserRound} label="Member ID" meta={u?.memberId ?? '—'} right={<View />} />
            <Row i={1} icon={Shield} label="Privacy policy" onPress={() => Linking.openURL('https://c7personalfitness.com/privacy')} />
            <Row i={2} icon={CircleHelp} label="Help & support" onPress={() => Linking.openURL('mailto:support@c7personalfitness.com')} />
            <Row i={3} icon={LogOut} label="Log out" right={<View />} onPress={() => setConfirm(true)} />
          </Card>
          <Txt v="caption" color={colors.textDim} style={{ textAlign: 'center', marginTop: 16 }}>
            C7 Personal Fitness 1.0.0
          </Txt>
        </Reveal>
      </Animated.ScrollView>

      <Sheet open={edit} onClose={() => setEdit(false)} title="Edit profile">
        <View style={{ gap: 12 }}>
          <Field value={name.first} onChangeText={(first) => setName({ ...name, first })} placeholder="First name" accessibilityLabel="First name" />
          <Field value={name.last} onChangeText={(last) => setName({ ...name, last })} placeholder="Last name" accessibilityLabel="Last name" />
        </View>
        <PrimaryButton
          title="Save"
          style={{ marginTop: 16 }}
          loading={profile.isPending}
          disabled={!name.first.trim()}
          onPress={() => profile.mutate({ firstName: name.first.trim(), lastName: name.last.trim() }, { onSuccess: () => (setEdit(false), toast.ok('Profile updated')), onError: toast.error })}
        />
      </Sheet>

      <Sheet open={equipOpen} onClose={() => setEquipOpen(false)} title="Equipment you can use">
        <ScrollView style={{ maxHeight: 320 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {EQUIPMENT.map((e, keyIdx) => (
              <Chip key={`${e}-${keyIdx}`} label={pretty(e)} active={owned.includes(e)} onPress={() => setOwned(owned.includes(e) ? owned.filter((x) => x !== e) : [...owned, e])} />
            ))}
          </View>
        </ScrollView>
        <Txt v="small" color={colors.textMuted} style={{ marginTop: 12 }}>
          Used to filter the exercise library to what you can do.
        </Txt>
        <PrimaryButton title="Save equipment" style={{ marginTop: 14 }} loading={equip.isPending} onPress={() => equip.mutate(owned, { onSuccess: () => (setEquipOpen(false), toast.ok('Equipment saved')), onError: toast.error })} />
      </Sheet>

      <Sheet open={confirm} onClose={() => setConfirm(false)} title="Log out?">
        <Txt color={colors.textMuted} style={{ marginBottom: 20 }}>
          Your workouts and check-ins are saved to your C7 account.
        </Txt>
        <PrimaryButton title="Log out" onPress={() => (setConfirm(false), session.signOut().then(() => router.replace('/login')))} />
        <SecondaryButton title="Cancel" style={{ marginTop: 12 }} onPress={() => setConfirm(false)} />
      </Sheet>
    </View>
  );
}
