import { router } from 'expo-router';
import { ArrowLeft, Bike, Dumbbell, Flame, HeartPulse, Minus, Plus, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ease, svTo, useTimeline } from '@/motion';
import { useApp, type Goal } from '@/store';
import { colors, font, radius } from '@/theme';
import { Bar, Card, IconButton, Press, PrimaryButton, Txt } from '@/ui';

const goals: { id: Goal; title: string; body: string; icon: LucideIcon }[] = [
  { id: 'lose', title: 'Lose weight', body: 'Burn fat with cardio + calorie tracking', icon: Flame },
  { id: 'tone', title: 'Get toned', body: 'Mix of strength and mobility', icon: HeartPulse },
  { id: 'muscle', title: 'Build muscle', body: 'Progressive strength, high protein', icon: Dumbbell },
  { id: 'endurance', title: 'Endurance', body: 'Run, ride and go longer', icon: Bike },
];
const levels = ['Beginner', 'Intermediate', 'Advanced'] as const;

export default function Goals() {
  const insets = useSafeAreaInsets();
  const st = useApp();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<Goal>(st.goal);
  const [level, setLevel] = useState<(typeof levels)[number]>(st.level);
  const [m, setM] = useState({ age: st.age, weightKg: st.weightKg, heightCm: st.heightCm, stepGoal: st.stepGoal });

  const enter = useSharedValue(0);
  useTimeline((tl) => {
    enter.value = 0;
    tl.add(svTo(enter, 1, { duration: 0.55, ease: ease.out }));
  }, [step]);
  const enterA = useAnimatedStyle(() => ({ opacity: enter.value, transform: [{ translateX: (1 - enter.value) * 40 }] }));

  const next = () => {
    if (step < 2) return setStep(step + 1);
    st.set({ goal, level, ...m, kcalGoal: goal === 'lose' ? 1600 : goal === 'muscle' ? 2300 : 1900, signedIn: true });
    router.replace('/home');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, paddingTop: insets.top + 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20 }}>
        <IconButton icon={ArrowLeft} label="Back" tint={colors.card} onPress={() => (step ? setStep(step - 1) : router.back())} />
        <View style={{ flex: 1 }}>
          <Bar value={(step + 1) / 3} />
        </View>
        <Txt v="small" color={colors.textMuted}>
          {step + 1}/3
        </Txt>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }}>
        <Animated.View style={enterA}>
          <Txt v="h1" style={{ marginTop: 20 }}>
            {['What’s your main goal?', 'How fit are you today?', 'Tell us about you'][step]}
          </Txt>
          <Txt color={colors.textMuted} style={{ marginTop: 8, marginBottom: 28 }}>
            {['We’ll tailor workouts, challenges and nutrition to it.', 'Be honest — we’ll ramp up as you progress.', 'Used to calculate calories and daily targets.'][step]}
          </Txt>
          {step === 0 &&
            goals.map((g) => (
              <Card key={g.id} onPress={() => setGoal(g.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12, borderWidth: 2, borderColor: goal === g.id ? colors.primary : 'transparent' }}>
                <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: goal === g.id ? colors.primary : colors.secondary, alignItems: 'center', justifyContent: 'center' }}>
                  <g.icon size={24} color={goal === g.id ? colors.onPrimary : colors.text} strokeWidth={1.8} />
                </View>
                <View style={{ flex: 1 }}>
                  <Txt v="bodyLg">{g.title}</Txt>
                  <Txt v="small" color={colors.textMuted}>
                    {g.body}
                  </Txt>
                </View>
              </Card>
            ))}
          {step === 1 && (
            <View style={{ gap: 12 }}>
              {levels.map((l, k) => (
                <Card key={l} onPress={() => setLevel(l)} style={{ borderWidth: 2, borderColor: level === l ? colors.primary : 'transparent', paddingVertical: 22 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Txt v="h3" color={level === l ? colors.primary : colors.text}>
                      {l}
                    </Txt>
                    <View style={{ flexDirection: 'row', gap: 4, alignItems: 'flex-end' }}>
                      {[0, 1, 2].map((b) => (
                        <View key={b} style={{ width: 8, height: 10 + b * 8, borderRadius: 4, backgroundColor: b <= k ? colors.primary : colors.muted }} />
                      ))}
                    </View>
                  </View>
                  <Txt v="small" color={colors.textMuted} style={{ marginTop: 6 }}>
                    {['New to training or coming back after a break', 'Working out 2–3 times a week', 'Training hard 4+ times a week'][k]}
                  </Txt>
                </Card>
              ))}
            </View>
          )}
          {step === 2 && (
            <View style={{ gap: 12 }}>
              <Stepper label="Age" unit="y.o." value={m.age} step={1} onChange={(age) => setM({ ...m, age })} />
              <Stepper label="Weight" unit="kg" value={m.weightKg} step={0.5} onChange={(weightKg) => setM({ ...m, weightKg })} />
              <Stepper label="Height" unit="cm" value={m.heightCm} step={1} onChange={(heightCm) => setM({ ...m, heightCm })} />
              <Stepper label="Daily steps goal" unit="" value={m.stepGoal} step={500} onChange={(stepGoal) => setM({ ...m, stepGoal })} />
            </View>
          )}
        </Animated.View>
      </ScrollView>
      <View style={{ position: 'absolute', left: 20, right: 20, bottom: insets.bottom + 20 }}>
        <PrimaryButton title={step < 2 ? 'Continue' : 'Start my plan'} onPress={next} />
      </View>
    </View>
  );
}

function Stepper({ label, unit, value, step, onChange }: { label: string; unit: string; value: number; step: number; onChange: (v: number) => void }) {
  return (
    <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ flex: 1 }}>
        <Txt v="small" color={colors.textMuted}>
          {label}
        </Txt>
        <Txt style={{ fontFamily: font.light, fontSize: 28, lineHeight: 34 }}>
          {value.toLocaleString()}
          <Txt v="small"> {unit}</Txt>
        </Txt>
      </View>
      {[Minus, Plus].map((I, k) => (
        <Press key={k} onPress={() => onChange(Math.max(0, +(value + (k ? step : -step)).toFixed(1)))} scaleTo={0.85} style={{ width: 46, height: 46, borderRadius: radius.pill, marginLeft: 10, backgroundColor: k ? colors.primary : colors.secondary, alignItems: 'center', justifyContent: 'center' }}>
          <I size={20} color={k ? colors.onPrimary : colors.text} />
        </Press>
      ))}
    </Card>
  );
}
