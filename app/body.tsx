import { Minus, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { ProgressLine } from '@/charts';
import { Reveal, useStagger } from '@/motion';
import { useApp } from '@/store';
import { colors, font, radius } from '@/theme';
import { Card, HeroGlow, Press, PrimaryButton, Sheet, TopBar, Txt } from '@/ui';

export default function Body() {
  const st = useApp();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(st.weightKg);
  const r = useStagger(3);
  const bmi = st.weightKg / (st.heightCm / 100) ** 2;
  const start = st.weightLog[0]?.kg ?? st.weightKg;
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <HeroGlow />
      <TopBar title="Body & Weight" />
      <Animated.ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120, gap: 12 }}>
        <Reveal p={r[0]!}>
          <Card style={{ padding: 20 }}>
            <Txt v="small" color={colors.textMuted}>Current weight</Txt>
            <Txt style={{ fontFamily: font.light, fontSize: 44, lineHeight: 54, color: colors.primary }}>{st.weightKg}kg</Txt>
            <Txt v="small" color={colors.textMuted}>{(start - st.weightKg).toFixed(1)}kg since you started</Txt>
            <ProgressLine points={st.weightLog.map((w) => w.kg)} labels={st.weightLog.slice(-4).map((_, i) => ['6w', '4w', '2w', 'Now'][i]!)} min={Math.floor(Math.min(...st.weightLog.map((w) => w.kg))) - 2} max={Math.ceil(Math.max(...st.weightLog.map((w) => w.kg))) + 2} ticks={[]} marker={false} />
          </Card>
        </Reveal>
        <Reveal p={r[1]!} style={{ flexDirection: 'row', gap: 12 }}>
          {[{ l: 'BMI', v: bmi.toFixed(1), s: bmi < 18.5 ? 'Under' : bmi < 25 ? 'Healthy' : 'Over' }, { l: 'Body fat', v: '18%', s: 'Athletic' }, { l: 'Height', v: `${st.heightCm}`, s: 'cm' }].map((x) => (
            <Card key={x.l} style={{ flex: 1, gap: 4 }}>
              <Txt v="caption" color={colors.textMuted}>{x.l}</Txt>
              <Txt style={{ fontFamily: font.light, fontSize: 24 }}>{x.v}</Txt>
              <Txt v="caption" color={colors.primary}>{x.s}</Txt>
            </Card>
          ))}
        </Reveal>
        <Reveal p={r[2]!}>
          <Txt v="h3" style={{ marginTop: 12, marginBottom: 4 }}>Measurements</Txt>
          {[['Chest', 86], ['Waist', 64], ['Hips', 90], ['Arms', 27]].map(([l, v]) => (
            <Card key={l} style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingVertical: 14 }}>
              <Txt>{l}</Txt>
              <Txt color={colors.textMuted}>{v} cm</Txt>
            </Card>
          ))}
        </Reveal>
      </Animated.ScrollView>
      <View style={{ position: 'absolute', left: 20, right: 20, bottom: 30 }}>
        <PrimaryButton title="Log weight" icon={Plus} onPress={() => (setDraft(st.weightKg), setOpen(true))} />
      </View>
      <Sheet open={open} onClose={() => setOpen(false)} title="Log today’s weight">
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, marginVertical: 10 }}>
          <Press onPress={() => setDraft(+(draft - 0.1).toFixed(1))} scaleTo={0.85} style={{ width: 56, height: 56, borderRadius: radius.pill, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' }}>
            <Minus size={22} color={colors.text} />
          </Press>
          <Txt style={{ fontFamily: font.light, fontSize: 52 }}>{draft.toFixed(1)}</Txt>
          <Press onPress={() => setDraft(+(draft + 0.1).toFixed(1))} scaleTo={0.85} style={{ width: 56, height: 56, borderRadius: radius.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={22} color={colors.onPrimary} />
          </Press>
        </View>
        <PrimaryButton title="Save" style={{ marginTop: 20 }} onPress={() => (st.logWeight(draft), setOpen(false))} />
      </Sheet>
    </View>
  );
}
