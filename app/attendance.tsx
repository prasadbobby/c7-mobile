import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { monthKey, useAttendance, type AttendanceStatus } from '@/api/gym';
import { Label, Numeral, Page } from '@/gymui';
import { colors, font } from '@/theme';
import { IconButton, Sheet, Skeleton, Txt } from '@/ui';

const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const STATUS: Record<AttendanceStatus, string> = { PRESENT: 'Present', ABSENT: 'Absent', LEAVE: 'On leave' };

/** Lovable "Attendance": the streak is the hero; present days are solid lime squares. */
export default function Attendance() {
  const [cursor, setCursor] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [picked, setPicked] = useState<string | null>(null);
  const month = monthKey(cursor);
  const isCurrent = month === monthKey();
  const q = useAttendance(month);
  const marks = useMemo(() => new Map((q.data?.days ?? []).map((d) => [d.date, d])), [q.data]);
  const first = (cursor.getDay() + 6) % 7; // Monday first
  const count = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const todayKey = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];
  const st = q.data?.stats;
  const label = cursor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const last = [...(q.data?.days ?? [])].reverse().find((d) => d.status === 'PRESENT');
  const pick = picked ? marks.get(picked) : undefined;

  return (
    <Page title="Attendance" error={q.error} onRetry={() => q.refetch()} onRefresh={() => q.refetch()} refreshing={q.isRefetching}>
      <View style={{ paddingTop: 14 }}>
        <Label>Keep showing up</Label>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 12, marginTop: 4 }}>
          <Numeral size={84}>{st?.streak ?? 0}</Numeral>
          <Txt style={{ fontFamily: font.light, fontSize: 18 }} color={colors.primary}>
            day streak
          </Txt>
        </View>
        <Txt v="caption" color={colors.textMuted} style={{ marginTop: 6 }}>
          {st?.totalVisits ? `${st.totalVisits} studio visits in total.` : 'The front desk marks you in each time you train at the studio.'}
        </Txt>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28 }}>
        <Txt v="small" accessibilityRole="header">
          {label}
        </Txt>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <IconButton icon={ChevronLeft} label="Previous month" tint="transparent" size={38} onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} />
          <View style={{ opacity: isCurrent ? 0.3 : 1 }} pointerEvents={isCurrent ? 'none' : 'auto'}>
            <IconButton icon={ChevronRight} label="Next month" tint="transparent" size={38} onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} />
          </View>
        </View>
      </View>

      {!q.data ? (
        <Skeleton height={300} style={{ marginTop: 12 }} />
      ) : (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, marginHorizontal: -3 }}>
            {DOW.map((d, i) => (
              <View key={`h${i}`} style={{ width: `${100 / 7}%`, alignItems: 'center', paddingBottom: 6 }}>
                <Txt style={{ fontSize: 10 }} color={colors.textMuted}>
                  {d}
                </Txt>
              </View>
            ))}
            {cells.map((n, i) => {
              if (!n) return <View key={`e${i}`} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} />;
              const key = `${month}-${String(n).padStart(2, '0')}`;
              const s = marks.get(key)?.status;
              const future = key > todayKey;
              const bg = s === 'PRESENT' ? colors.primary : future ? 'rgba(21,24,22,0.4)' : colors.secondary;
              return (
                <View key={key} style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 3 }}>
                  <Pressable onPress={() => setPicked(key)} accessibilityLabel={`${n} ${label}, ${s ? STATUS[s].toLowerCase() : future ? 'upcoming' : 'no visit'}`} style={{ flex: 1, borderRadius: 5, alignItems: 'center', justifyContent: 'center', backgroundColor: bg, borderWidth: s === 'ABSENT' || s === 'LEAVE' ? 1 : key === todayKey && !s ? 1 : 0, borderColor: s === 'ABSENT' ? colors.danger : s === 'LEAVE' ? colors.protein : colors.textMuted }}>
                    <Txt style={{ fontSize: 12, fontVariant: ['tabular-nums'] }} color={s === 'PRESENT' ? colors.onPrimary : future ? 'rgba(149,154,148,0.4)' : colors.textMuted}>
                      {n}
                    </Txt>
                  </Pressable>
                </View>
              );
            })}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
            <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: colors.primary }} />
            <Txt style={{ fontSize: 10, marginRight: 10 }} color={colors.textMuted}>
              Present
            </Txt>
            <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: colors.secondary }} />
            <Txt style={{ fontSize: 10, marginRight: 10 }} color={colors.textMuted}>
              No visit
            </Txt>
            <View style={{ width: 8, height: 8, borderRadius: 2, borderWidth: 1, borderColor: colors.protein }} />
            <Txt style={{ fontSize: 10 }} color={colors.textMuted}>
              Leave
            </Txt>
          </View>

          <View style={{ flexDirection: 'row', marginTop: 26, paddingVertical: 18, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border }}>
            <View style={{ flex: 1 }}>
              <Txt style={{ fontFamily: font.light, fontSize: 42, lineHeight: 46, fontVariant: ['tabular-nums'] }}>
                {st?.present ?? 0}
                <Txt v="small" color={colors.textMuted}>
                  {' '}
                  visits
                </Txt>
              </Txt>
              <Label style={{ marginTop: 4 }}>{isCurrent ? 'This month' : label}</Label>
            </View>
            <View style={{ flex: 1, borderLeftWidth: StyleSheet.hairlineWidth, borderColor: colors.border, paddingLeft: 22 }}>
              <Txt style={{ fontFamily: font.light, fontSize: 42, lineHeight: 46, fontVariant: ['tabular-nums'] }}>
                {st?.rate ?? 0}
                <Txt style={{ fontSize: 18 }}>%</Txt>
              </Txt>
              <Label style={{ marginTop: 4 }}>Attendance rate</Label>
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }}>
            <Label>Last check-in</Label>
            <Txt v="caption">{last ? `${new Date(`${last.date}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}${last.checkInAt ? ` · ${new Date(last.checkInAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}` : ''}` : '—'}</Txt>
          </View>
        </>
      )}

      <Sheet open={!!picked} onClose={() => setPicked(null)} title={picked ? new Date(`${picked}T12:00:00`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }) : ''}>
        <Label color={pick?.status === 'PRESENT' ? colors.primary : colors.textMuted}>{pick ? STATUS[pick.status] : picked && picked > todayKey ? 'Upcoming' : 'No check-in'}</Label>
        <Txt v="small" color={colors.textMuted} style={{ marginTop: 10 }}>
          {pick?.status === 'PRESENT' ? `Studio visit${pick.checkInAt ? ` · marked ${new Date(pick.checkInAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}` : ''}${pick.notes ? ` · ${pick.notes}` : ''}` : pick ? pick.notes ?? 'Marked by the front desk.' : picked && picked > todayKey ? 'This date is still ahead.' : 'No studio visit recorded on this date.'}
        </Txt>
      </Sheet>
    </Page>
  );
}
