import { Flag, Minus, Plus, Trash2 } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { ProgressLine } from '@/charts';
import { shortDate, today } from '@/api/dates';
import { useAddMeasurement, useDeleteMeasurement, useMe, useMeasurementGoal, useMeasurements } from '@/api/hooks';
import { MEASUREMENT_META } from '@/api/meta';
import { MEASUREMENTS, type MeasurementType } from '@/api/types';
import { Reveal, useStagger } from '@/motion';
import { colors, font, radius } from '@/theme';
import { Card, Chip, ErrorState, Field, HeroGlow, IconButton, Press, PrimaryButton, Sheet, Skeleton, toast, TopBar, Txt } from '@/ui';

const GROUPS = ['Composition', 'Upper body', 'Core', 'Lower body'] as const;

export default function Body() {
  const me = useMe();
  const q = useMeasurements();
  const add = useAddMeasurement();
  const del = useDeleteMeasurement();
  const goal = useMeasurementGoal();
  const [type, setType] = useState<MeasurementType | null>(null);
  const [value, setValue] = useState('');
  const [goalFor, setGoalFor] = useState<MeasurementType | null>(null);
  const [goalValue, setGoalValue] = useState('');
  const [detail, setDetail] = useState<MeasurementType | null>(null);
  const r = useStagger(3);

  const latest = q.data?.latest ?? {};
  const weights = useMemo(() => (q.data?.measurements ?? []).filter((m) => m.measurementType === 'WEIGHT').slice(0, 8).reverse(), [q.data]);
  const weight = latest.WEIGHT?.value ?? me.data?.user.weight ?? null;
  const height = latest.HEIGHT?.value ?? me.data?.user.height ?? null;
  const bmi = weight && height ? weight / (height / 100) ** 2 : null;
  const first = weights[0]?.value;
  const wGoal = q.data?.goals.find((g) => g.measurementType === 'WEIGHT');
  const pts = weights.map((w) => w.value);

  const open = (t: MeasurementType) => {
    setValue(latest[t] ? String(latest[t]!.value) : '');
    setType(t);
  };
  const step = (d: number) => setValue(String(Math.max(0, Math.round(((Number(value) || 0) + d) * 10) / 10)));

  if (q.error) return <View style={{ flex: 1, backgroundColor: colors.surface }}><TopBar title="Body & Measurements" right={<View style={{ width: 48 }} />} /><ErrorState error={q.error} onRetry={() => q.refetch()} /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <HeroGlow />
      <TopBar title="Body & Measurements" right={<View style={{ width: 48 }} />} />
      <Animated.ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120, gap: 12 }}>
        <Reveal p={r[0]!}>
          {q.isLoading ? (
            <Skeleton height={260} />
          ) : (
            <Card style={{ padding: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Txt v="small" color={colors.textMuted}>
                  Current weight
                </Txt>
                <Press onPress={() => (setGoalValue(wGoal ? String(wGoal.targetValue) : ''), setGoalFor('WEIGHT'))} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} accessibilityLabel="Set weight goal">
                  <Flag size={16} color={colors.primary} />
                  <Txt v="small" color={colors.primary}>
                    {wGoal ? `Goal ${wGoal.targetValue}kg` : 'Set goal'}
                  </Txt>
                </Press>
              </View>
              <Txt style={{ fontFamily: font.light, fontSize: 44, lineHeight: 54, color: colors.primary }}>{weight != null ? `${weight}kg` : '—'}</Txt>
              <Txt v="small" color={colors.textMuted}>
                {first != null && weight != null && weights.length > 1 ? `${(weight - first > 0 ? '+' : '') + (weight - first).toFixed(1)}kg since ${shortDate(weights[0]!.recordedDate)}` : 'Log your weight regularly to see your trend'}
              </Txt>
              {pts.length >= 2 && (
                <ProgressLine points={pts} labels={weights.map((w) => new Date(w.recordedDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }))} min={Math.floor(Math.min(...pts)) - 2} max={Math.ceil(Math.max(...pts)) + 2} ticks={[]} marker={false} />
              )}
            </Card>
          )}
        </Reveal>
        <Reveal p={r[1]!} style={{ flexDirection: 'row', gap: 12 }}>
          {[
            { l: 'BMI', v: bmi ? bmi.toFixed(1) : '—', s: !bmi ? 'Add height' : bmi < 18.5 ? 'Under' : bmi < 25 ? 'Healthy' : bmi < 30 ? 'Over' : 'High', t: 'HEIGHT' as const },
            { l: 'Body fat', v: latest.BODY_FAT_PERCENTAGE ? `${latest.BODY_FAT_PERCENTAGE.value}%` : '—', s: 'Tap to log', t: 'BODY_FAT_PERCENTAGE' as const },
            { l: 'Height', v: height ? `${height}` : '—', s: 'cm', t: 'HEIGHT' as const },
          ].map((x) => (
            <Card key={x.l} onPress={() => open(x.t)} style={{ flex: 1, gap: 4 }}>
              <Txt v="caption" color={colors.textMuted}>
                {x.l}
              </Txt>
              <Txt style={{ fontFamily: font.light, fontSize: 24 }}>{x.v}</Txt>
              <Txt v="caption" color={colors.primary}>
                {x.s}
              </Txt>
            </Card>
          ))}
        </Reveal>
        <Reveal p={r[2]!}>
          {GROUPS.map((g, keyIdx) => (
            <View key={`${g}-${keyIdx}`}>
              <Txt v="h3" style={{ marginTop: 18, marginBottom: 4 }}>
                {g}
              </Txt>
              {MEASUREMENTS.filter((t) => MEASUREMENT_META[t].group === g).map((t, keyIdx) => {
                const m = latest[t];
                return (
                  <Card key={`${t}-${keyIdx}`} onPress={() => (m ? setDetail(t) : open(t))} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingVertical: 14 }}>
                    <Txt>{MEASUREMENT_META[t].label}</Txt>
                    <Txt color={m ? colors.text : colors.textMuted}>{m ? `${m.value} ${m.unit}` : 'Add'}</Txt>
                  </Card>
                );
              })}
            </View>
          ))}
        </Reveal>
      </Animated.ScrollView>
      <View style={{ position: 'absolute', left: 20, right: 20, bottom: 30 }}>
        <PrimaryButton title="Log weight" icon={Plus} onPress={() => open('WEIGHT')} />
      </View>

      <Sheet open={!!type} onClose={() => setType(null)} title={type ? `Log ${MEASUREMENT_META[type].label.toLowerCase()}` : ''}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginVertical: 10 }}>
          <Press accessibilityLabel="Decrease" onPress={() => step(-0.1)} scaleTo={0.85} style={{ width: 56, height: 56, borderRadius: radius.pill, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' }}>
            <Minus size={22} color={colors.text} />
          </Press>
          <Field value={value} onChangeText={(t) => setValue(t.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" placeholder="0" accessibilityLabel="Value" style={{ width: 150 }} />
          <Press accessibilityLabel="Increase" onPress={() => step(0.1)} scaleTo={0.85} style={{ width: 56, height: 56, borderRadius: radius.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={22} color={colors.onPrimary} />
          </Press>
        </View>
        <Txt v="small" color={colors.textMuted} style={{ textAlign: 'center' }}>
          {type ? MEASUREMENT_META[type].unit : ''} · recorded for today
        </Txt>
        <PrimaryButton
          title="Save"
          style={{ marginTop: 20 }}
          loading={add.isPending}
          disabled={!(Number(value) > 0)}
          onPress={() => type && add.mutate({ measurementType: type, value: Number(value), unit: MEASUREMENT_META[type].unit, recordedDate: today() }, { onSuccess: () => (setType(null), toast.ok('Saved')), onError: toast.error })}
        />
      </Sheet>

      <Sheet open={!!detail} onClose={() => setDetail(null)} title={detail ? MEASUREMENT_META[detail].label : ''}>
        <ScrollView style={{ maxHeight: 300 }}>
          {(q.data?.measurements ?? [])
            .filter((m) => m.measurementType === detail)
            .map((m) => (
              <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 12 }}>
                <Txt style={{ flex: 1 }}>{shortDate(m.recordedDate)}</Txt>
                <Txt>
                  {m.value} {m.unit}
                </Txt>
                <IconButton icon={Trash2} label="Delete entry" size={36} tint={colors.secondary} onPress={() => del.mutate(m.id, { onError: toast.error })} />
              </View>
            ))}
        </ScrollView>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
          <Chip label="Add new" onPress={() => { const t = detail!; setDetail(null); open(t); }} />
          <Chip label="Set goal" onPress={() => { const t = detail!; setDetail(null); setGoalValue(String(q.data?.goals.find((g) => g.measurementType === t)?.targetValue ?? '')); setGoalFor(t); }} />
        </View>
      </Sheet>

      <Sheet open={!!goalFor} onClose={() => setGoalFor(null)} title={goalFor ? `${MEASUREMENT_META[goalFor].label} goal` : ''}>
        <Field value={goalValue} onChangeText={(t) => setGoalValue(t.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" placeholder={`Target (${goalFor ? MEASUREMENT_META[goalFor].unit : ''})`} accessibilityLabel="Target" />
        <PrimaryButton
          title="Save goal"
          style={{ marginTop: 16 }}
          loading={goal.isPending}
          disabled={!(Number(goalValue) > 0)}
          onPress={() => goalFor && goal.mutate({ measurementType: goalFor, targetValue: Number(goalValue) }, { onSuccess: () => (setGoalFor(null), toast.ok('Goal saved')), onError: toast.error })}
        />
      </Sheet>
    </View>
  );
}
