import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { errorMessage } from '@/api/client';
import { today } from '@/api/dates';
import { useBmi, type BmiCategoryKey } from '@/api/gym';
import { useAddMeasurement } from '@/api/hooks';
import { Label, Numeral, Page } from '@/gymui';
import { colors, font, radius } from '@/theme';
import { PrimaryButton, SecondaryButton, Skeleton, toast, Txt } from '@/ui';

/** Asian-Indian adult cut-offs (WHO expert consultation) — same as the backend. */
const BANDS: { key: BmiCategoryKey; label: string; from: number; to: number; tone: string }[] = [
  { key: 'UNDER', label: 'Under', from: 14, to: 18.5, tone: colors.protein },
  { key: 'HEALTHY', label: 'Healthy', from: 18.5, to: 23, tone: colors.primary },
  { key: 'OVER', label: 'Over', from: 23, to: 25, tone: colors.carbs },
  { key: 'OBESE1', label: 'Obese I', from: 25, to: 30, tone: colors.calories },
  { key: 'OBESE2', label: 'Obese II', from: 30, to: 40, tone: colors.danger },
];
export const calcBmi = (w: number, h: number) => Math.round((w / (h / 100) ** 2) * 10) / 10;
export const bandOf = (bmi: number) => BANDS.find((b) => bmi < b.to) ?? BANDS[BANDS.length - 1]!;

/** Semicircle gauge: Under / Healthy / Over / Obese bands, needle on the BMI (scale 15–40). */
function Gauge({ bmi }: { bmi: number | null }) {
  const cx = 170, cy = 157, r = 142;
  const at = (v: number) => Math.PI * (1 - Math.max(0, Math.min(1, (v - 15) / 25)));
  const pt = (v: number, rr = r) => [cx + rr * Math.cos(at(v)), cy - rr * Math.sin(at(v))] as const;
  const arc = (from: number, to: number) => {
    const [x1, y1] = pt(from + 0.25);
    const [x2, y2] = pt(to - 0.25);
    return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
  };
  const segs: [number, number, string][] = [[15, 18.5, colors.protein], [18.5, 23, colors.primary], [23, 25, colors.carbs], [25, 40, colors.danger]];
  const [nx, ny] = pt(bmi ?? 15, 108);
  return (
    <Svg viewBox="0 0 340 185" width="100%" height={185} accessibilityLabel={bmi ? `BMI gauge at ${bmi}` : 'BMI gauge'}>
      {segs.map(([a, b, c]) => (
        <Path key={`${a}`} d={arc(a, b)} stroke={c} strokeWidth={18} fill="none" opacity={bmi && bmi >= a && bmi < b ? 1 : 0.35} />
      ))}
      {bmi != null && <Line x1={cx} y1={cy} x2={nx} y2={ny} stroke={colors.text} strokeWidth={2} />}
      <Circle cx={cx} cy={cy} r={5} fill={colors.text} />
      <SvgText x={cx} y={182} textAnchor="middle" fill={colors.textMuted} fontSize={10} fontFamily={font.regular}>
        15 — 40 kg/m²
      </SvgText>
    </Svg>
  );
}

const Input = ({ label, value, onChange, a11y }: { label: string; value: string; onChange: (v: string) => void; a11y: string }) => (
  <View style={{ flex: 1 }}>
    <Label>{label}</Label>
    <TextInput value={value} onChangeText={onChange} keyboardType="decimal-pad" accessibilityLabel={a11y} style={{ marginTop: 6, color: colors.text, fontFamily: font.light, fontSize: 30, paddingBottom: 8, borderBottomWidth: 1, borderColor: colors.border, fontVariant: ['tabular-nums'] }} />
  </View>
);

/** Lovable "BMI": number + band, gauge, healthy range, inline calculator, month bars, next check-up. */
export default function BmiScreen() {
  const q = useBmi();
  const add = useAddMeasurement();
  const d = q.data;
  const [w, setW] = useState('');
  const [h, setH] = useState('');
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (d) {
      if (d.weight && !w) setW(String(d.weight));
      if (d.height && !h) setH(String(d.height));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d]);
  const wn = Number(w.replace(',', '.'));
  const hn = Number(h.replace(',', '.'));
  const valid = wn >= 20 && wn <= 350 && hn >= 100 && hn <= 250;
  const live = valid ? calcBmi(wn, hn) : null;
  const shown = live ?? d?.bmi ?? null;
  const band = shown != null ? bandOf(shown) : null;
  const changed = valid && (wn !== d?.weight || hn !== d?.height);
  const healthy = valid ? { min: Math.round(18.5 * (hn / 100) ** 2 * 10) / 10, max: Math.round(22.9 * (hn / 100) ** 2 * 10) / 10 } : d?.healthyWeight;
  const hist = d?.history ?? [];
  const delta = hist.length >= 2 && hist[0]!.bmi != null && hist.at(-1)!.bmi != null ? Math.round((hist.at(-1)!.bmi! - hist[0]!.bmi!) * 10) / 10 : null;

  const save = async () => {
    setErr(null);
    if (!valid) return setErr('Enter weight between 20–350 kg and height between 100–250 cm.');
    try {
      if (hn !== d?.height) await add.mutateAsync({ measurementType: 'HEIGHT', value: hn, unit: 'cm', recordedDate: today() });
      if (wn !== d?.weight) await add.mutateAsync({ measurementType: 'WEIGHT', value: wn, unit: 'kg', recordedDate: today() });
      toast.ok('Weigh-in saved');
    } catch (e) {
      setErr(errorMessage(e));
    }
  };

  return (
    <Page title="Body mass index" error={q.error} onRetry={() => q.refetch()} onRefresh={() => q.refetch()} refreshing={q.isRefetching}>
      {!d ? (
        <Skeleton height={360} />
      ) : (
        <View style={{ paddingTop: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <Label>{live != null && changed ? 'Calculated BMI' : 'Your BMI'}</Label>
              <Numeral size={64} style={{ marginTop: 4 }} accessibilityLabel={shown != null ? `BMI ${shown.toFixed(1)}` : 'BMI not set'}>
                {shown != null ? shown.toFixed(1) : '—'}
              </Numeral>
            </View>
            <View style={{ marginTop: 34, borderWidth: 1, borderColor: band?.tone ?? colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
              <Txt v="caption" color={band?.tone ?? colors.textMuted}>
                {band ? (band.label === 'Under' ? 'Underweight' : band.label === 'Over' ? 'Overweight' : band.label) : 'Enter values'}
              </Txt>
            </View>
          </View>
          <View style={{ marginTop: 16 }}>
            <Gauge bmi={shown} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {['Under', 'Healthy', 'Over', 'Obese'].map((b, keyIdx) => (
              <Txt key={`${b}-${keyIdx}`} style={{ fontSize: 10 }} color={band && (band.label.startsWith(b) || (b === 'Obese' && band.label.startsWith('Obese'))) ? colors.text : colors.textMuted}>
                {b}
              </Txt>
            ))}
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 22, paddingVertical: 16, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border }}>
            <Label>Healthy weight range</Label>
            <Txt style={{ fontFamily: font.light, fontSize: 20, fontVariant: ['tabular-nums'] }}>
              {healthy ? `${healthy.min}–${healthy.max}` : '—'}
              <Txt v="caption" color={colors.textMuted}>
                {' '}
                kg
              </Txt>
            </Txt>
          </View>

          <View style={{ flexDirection: 'row', gap: 18, marginTop: 22 }}>
            <Input label="Weight / kg" value={w} onChange={(t) => (setW(t), setErr(null))} a11y="Weight in kg" />
            <Input label="Height / cm" value={h} onChange={(t) => (setH(t), setErr(null))} a11y="Height in cm" />
          </View>
          {!!err && (
            <Txt v="small" color={colors.danger} accessibilityRole="alert" style={{ marginTop: 10 }}>
              {err}
            </Txt>
          )}
          <View style={{ marginTop: 16 }}>{changed ? <PrimaryButton title="Save as today’s weigh-in" onPress={save} loading={add.isPending} /> : <SecondaryButton title="Up to date" disabled />}</View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 28 }}>
            <Label>The big picture</Label>
            {delta != null && (
              <Label color={delta <= 0 ? colors.primary : colors.carbs}>
                {delta > 0 ? '+' : ''}
                {delta} since {new Date(`${hist[0]!.month}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'short' })}
              </Label>
            )}
          </View>
          {hist.length < 2 ? (
            <Txt v="small" color={colors.textMuted} style={{ marginTop: 10 }}>
              Log a weigh-in each month to build your trend.
            </Txt>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12, height: 120, marginTop: 14 }} accessibilityLabel="BMI by month">
              {hist.slice(-6).map((m, i, arr) => (
                <View key={m.month} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                  <Txt style={{ fontSize: 9 }} color={colors.textMuted}>
                    {m.bmi?.toFixed(1) ?? '—'}
                  </Txt>
                  <View style={{ width: '100%', height: Math.max(6, ((m.bmi ?? 18) - 16) * 6), backgroundColor: i === arr.length - 1 ? colors.primary : colors.secondary, borderTopLeftRadius: 3, borderTopRightRadius: 3 }} />
                  <Txt style={{ fontSize: 9 }} color={colors.textMuted}>
                    {new Date(`${m.month}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()}
                  </Txt>
                </View>
              ))}
            </View>
          )}

          {!!d.checkup && (
            <View style={{ alignSelf: 'flex-start', marginTop: 22, borderWidth: 1, borderColor: d.checkup.overdue ? colors.danger : 'rgba(198,242,27,0.4)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 }}>
              <Txt style={{ fontSize: 10, letterSpacing: 0.8 }} color={d.checkup.overdue ? colors.danger : colors.primary}>
                {d.checkup.overdue ? 'CHECK-UP OVERDUE' : 'NEXT CHECK-UP'} · {new Date(d.checkup.nextDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}
                {d.checkup.setByCoach ? ' · SET BY COACH' : ''}
              </Txt>
            </View>
          )}
          {!!d.checkup?.notes && (
            <Txt v="caption" color={colors.textMuted} style={{ marginTop: 8 }}>
              Coach note: {d.checkup.notes}
            </Txt>
          )}
          <Txt style={{ fontSize: 10, lineHeight: 16, marginTop: 16 }} color={colors.textMuted}>
            BMI is a screening measure, not a diagnosis. It doesn’t separate muscle from body fat — read it with your measurements{d.bodyFat ? ` (body fat ${d.bodyFat}%)` : ''} and talk to your coach.
          </Txt>
        </View>
      )}
    </Page>
  );
}
