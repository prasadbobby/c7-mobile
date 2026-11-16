import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { useMe, useUpdatePreferences, useUpdateProfile } from '@/api/hooks';
import type { FitnessGoal, Level } from '@/api/types';
import { SUCCESS_ART } from '@/assetkit';
import { glyphs, Headline, NextBar, OptionCard, RulerHorizontal, RulerVertical, StepHeader, WheelPicker } from '@/onboard';
import { colors, font, radius } from '@/theme';
import { Field, haptic, Segmented, toast, Txt, HeroGlow } from '@/ui';

const TOTAL = 6;
const GOALS: { id: FitnessGoal; title: string; sub: string }[] = [
  { id: 'lose', title: 'Lose weight', sub: 'Burn fat with cardio + calorie tracking' },
  { id: 'tone', title: 'Get toned', sub: 'Mix of strength and mobility' },
  { id: 'muscle', title: 'Build muscle', sub: 'Progressive strength, high protein' },
  { id: 'endurance', title: 'Endurance', sub: 'Run, ride and go longer' },
];
const LEVELS: { id: Level; sub: string }[] = [
  { id: 'Beginner', sub: 'New to training or coming back after a break' },
  { id: 'Intermediate', sub: 'Working out 2–3 times a week' },
  { id: 'Advanced', sub: 'Training hard 4+ times a week' },
];
const AGES = Array.from({ length: 70 }, (_, i) => i + 14);

/**
 * First-time setup for an invited member (also reachable from Settings → Goals).
 * Design ported from the Lovable "first-login" flow. Saves to FitForge's UserInfo + preferences.
 */
export default function Goals() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const me = useMe();
  const prefs = useUpdatePreferences();
  const profile = useUpdateProfile();
  const [step, setStep] = useState(1);
  const [name, setName] = useState({ first: '', last: '' });
  const [goal, setGoal] = useState<FitnessGoal>('tone');
  const [level, setLevel] = useState<Level>('Intermediate');
  const [age, setAge] = useState(28);
  const [kg, setKg] = useState(70);
  const [unit, setUnit] = useState<'kg' | 'lb'>('kg');
  const [cm, setCm] = useState(170);
  const firstTime = !me.data?.preferences.onboardingCompleted;

  // Prefill from the invite (Clerk names) and what the gym already has on file.
  useEffect(() => {
    const d = me.data;
    if (!d) return;
    setName({ first: d.user.firstName, last: d.user.lastName });
    if (d.preferences.fitnessGoal) setGoal(d.preferences.fitnessGoal);
    if (d.preferences.experienceLevel) setLevel(d.preferences.experienceLevel);
    if (d.user.age) setAge(d.user.age);
    if (d.user.weight) setKg(Math.round(d.user.weight));
    if (d.user.height) setCm(Math.round(d.user.height));
  }, [me.data]);

  const lb = Math.round(kg * 2.20462);
  const saving = prefs.isPending || profile.isPending;
  // canGoBack() reads navigation focus — call it after mount, not during render.
  const [canBack, setCanBack] = useState(false);
  useEffect(() => setCanBack(router.canGoBack()), []);
  const back = () => (step > 1 ? setStep(step - 1) : canBack ? router.back() : undefined);
  const next = () => {
    if (step === 1 && !name.first.trim()) return toast.error('Enter your first name');
    if (step < TOTAL) return setStep(step + 1);
    Promise.all([
      profile.mutateAsync({ firstName: name.first.trim(), lastName: name.last.trim(), age, weight: kg, height: cm }),
      prefs.mutateAsync({ fitnessGoal: goal, experienceLevel: level, completeOnboarding: true }),
    ]).then(() => {
      haptic('success');
      if (firstTime) setStep(TOTAL + 1);
      else (toast.ok('Saved'), router.back());
    }, toast.error);
  };

  const body = useMemo(() => {
    switch (step) {
      case 1:
        return (
          <View style={{ gap: 14 }}>
            <Headline text="What should we *call you?*" />
            <Txt color={colors.textMuted}>From your gym invite — change it if you like.</Txt>
            <Field placeholder="First name" value={name.first} onChangeText={(first) => setName((n) => ({ ...n, first }))} accessibilityLabel="First name" />
            <Field placeholder="Last name" value={name.last} onChangeText={(last) => setName((n) => ({ ...n, last }))} accessibilityLabel="Last name" />
          </View>
        );
      case 2:
        return (
          <View style={{ gap: 12 }}>
            <Headline text="What’s your *main goal?*" />
            <Txt color={colors.textMuted} style={{ marginBottom: 6 }}>
              Your coach sees this when planning your workouts.
            </Txt>
            {GOALS.map((g) => (
              <OptionCard key={g.id} selected={goal === g.id} onPress={() => setGoal(g.id)} icon={glyphs[g.id]} title={g.title} sub={g.sub} />
            ))}
          </View>
        );
      case 3:
        return (
          <View style={{ gap: 12 }}>
            <Headline text="How *fit* are you today?" />
            <Txt color={colors.textMuted} style={{ marginBottom: 6 }}>
              Be honest — we’ll ramp up as you progress.
            </Txt>
            {LEVELS.map((l, k) => (
              <OptionCard key={l.id} selected={level === l.id} onPress={() => setLevel(l.id)} icon={glyphs.level((k + 1) as 1 | 2 | 3)} title={l.id} sub={l.sub} />
            ))}
          </View>
        );
      case 4:
        return (
          <View style={{ gap: 18 }}>
            <Headline text="What is your *age?*" center />
            <Txt color={colors.textMuted} style={{ textAlign: 'center' }}>
              Used to tailor targets and recommendations for you.
            </Txt>
            <WheelPicker values={AGES} value={age} onChange={setAge} label="Age" />
          </View>
        );
      case 5:
        return (
          <View style={{ gap: 18 }}>
            <Headline text="What is your *weight?*" center />
            <View style={{ alignSelf: 'center', width: 180 }}>
              <Segmented value={unit} onChange={setUnit} options={[{ id: 'kg', label: 'KG' }, { id: 'lb', label: 'LB' }]} />
            </View>
            <Txt style={{ textAlign: 'center', fontFamily: font.bold, fontSize: 76, lineHeight: 86 }} accessibilityLabel="Weight value">
              {unit === 'kg' ? kg : lb}
              <Txt style={{ fontFamily: font.semibold, fontSize: 20 }}> {unit.toUpperCase()}</Txt>
            </Txt>
            <View style={{ marginHorizontal: -20 }}>
              <RulerHorizontal min={30} max={200} value={kg} onChange={setKg} width={width} label="Weight ruler" />
            </View>
          </View>
        );
      case 6:
        return (
          <View style={{ gap: 10 }}>
            <Headline text="How *tall* are you?" />
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
              <View style={{ flex: 1 }}>
                <Txt numberOfLines={1} adjustsFontSizeToFit style={{ fontFamily: font.bold, fontSize: 64, lineHeight: 74 }} accessibilityLabel="Height value">
                  {cm}
                  <Txt style={{ fontFamily: font.semibold, fontSize: 20 }}> CM</Txt>
                </Txt>
                <View style={{ height: 3, borderRadius: 2, backgroundColor: colors.primary, marginRight: -8 }} />
              </View>
              <RulerVertical min={120} max={220} value={cm} onChange={setCm} label="Height ruler" height={420} />
            </View>
          </View>
        );
      default:
        return (
          <View style={{ alignItems: 'center', gap: 14, paddingTop: 10 }}>
            <SvgXml xml={SUCCESS_ART} width={220} height={220} />
            <Headline text="You’re *all set*" center />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 6 }}>
              {[GOALS.find((g) => g.id === goal)!.title, level, `${age} yrs`, `${kg} kg`, `${cm} cm`].map((c, keyIdx) => (
                <View key={`${c}-${keyIdx}`} style={{ borderRadius: radius.pill, borderWidth: 1.5, borderColor: 'rgba(198,242,27,0.6)', paddingHorizontal: 14, paddingVertical: 8 }}>
                  <Txt v="small" color={colors.primary}>
                    {c}
                  </Txt>
                </View>
              ))}
            </View>
            <Txt style={{ textAlign: 'center', fontFamily: font.semibold, letterSpacing: 1, marginTop: 10 }} color={colors.textMuted}>
              {me.data?.user.access === 'GUEST' ? 'NEXT: PICK A C7 PACKAGE TO START' : 'YOUR COACH WILL ASSIGN YOUR FIRST WORKOUT IN C7'}
            </Txt>
          </View>
        );
    }
  }, [step, name, goal, level, age, kg, lb, unit, cm, width]);

  const done = step > TOTAL;
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}><HeroGlow />
      <StepHeader step={done ? undefined : step} total={TOTAL} onClose={firstTime ? undefined : () => router.back()} />
      <ScrollView scrollEnabled={step !== 4 && step !== 6} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingTop: 34, paddingBottom: insets.bottom + 130 }}>
        <Animated.View key={step} entering={FadeInRight.duration(320)} exiting={FadeOutLeft.duration(180)}>
          {body}
        </Animated.View>
      </ScrollView>
      {done ? (
        <NextBar label="Let’s go" onNext={() => router.replace('/')} />
      ) : (
        <NextBar label={step === TOTAL ? 'Finish' : 'Next step'} loading={saving} onNext={next} onBack={step > 1 || canBack ? back : undefined} />
      )}
    </View>
  );
}
