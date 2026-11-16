import { CalendarPlus, CircleDollarSign, PauseCircle, Plus, RefreshCw, Snowflake } from 'lucide-react-native';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { shortDate } from '@/api/dates';
import { useMembership, useMembershipHistory, usePayments } from '@/api/hooks';
import { pretty } from '@/api/meta';
import { Reveal, useCountUp, useStagger } from '@/motion';
import { colors, font, radius } from '@/theme';
import { Card, ErrorState, HeroGlow, LimeGradient, Ring, SectionHeader, Skeleton, TopBar, Txt } from '@/ui';
import { useQueryClient } from '@tanstack/react-query';

const inr = (n: number | null | undefined) => (n == null ? '—' : `₹${Math.round(n).toLocaleString('en-IN')}`);
const DAY = 86400000;
const histIcon: Record<string, typeof CalendarPlus> = { EXTENSION: CalendarPlus, RENEWAL: RefreshCw, PAUSE: PauseCircle, RESUME: RefreshCw, FREEZE: Snowflake };

/** Membership & payments — mirrors FitForge's membership + payment pages (configured by the gym in the admin dashboard). */
export default function Membership() {
  const ms = useMembership();
  const pay = usePayments();
  const qc = useQueryClient();
  const r = useStagger(4, { stagger: 0.08 });
  const m = ms.data;
  const status: { label: string; tone: string } = !m?.hasValidMembership
    ? { label: 'No plan', tone: colors.textMuted }
    : m.status === 'PAUSED'
      ? { label: 'Paused', tone: colors.protein }
      : m.isExpired || m.status === 'EXPIRED'
        ? { label: 'Expired', tone: colors.danger }
        : m.daysRemaining <= 7
          ? { label: 'Expiring soon', tone: colors.carbs }
          : { label: 'Active', tone: colors.primary };
  const total = m?.startDate && m.endDate ? Math.max(1, Math.round((new Date(m.endDate).getTime() - new Date(m.startDate).getTime()) / DAY)) : 1;
  const left = useCountUp(m?.daysRemaining ?? 0, { delay: 0.3 });
  const info = pay.data?.paymentInfo;
  const dueIn = info?.nextPaymentDue ? Math.ceil((new Date(info.nextPaymentDue).getTime() - Date.now()) / DAY) : null;
  const dueSoon = (info?.remainingAmount ?? 0) > 0 && dueIn != null && dueIn <= 3;

  if (ms.error) return <View style={{ flex: 1, backgroundColor: colors.surface }}><TopBar title="Membership" right={<View style={{ width: 48 }} />} /><ErrorState error={ms.error} onRetry={() => qc.invalidateQueries({ queryKey: ['membership'] })} /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <HeroGlow />
      <TopBar title="Membership" right={<View style={{ width: 48 }} />} />
      <Animated.ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <Reveal p={r[0]!}>
          {!m ? (
            <Skeleton height={220} />
          ) : (
            <Card style={{ padding: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View>
                  <Txt v="caption" color={colors.textMuted}>
                    Current plan
                  </Txt>
                  <Txt v="bodyLg" style={{ marginTop: 4 }}>
                    {m.duration ? `${m.duration}-day membership${m.duration >= 28 ? ` · ${Math.round((m.duration / 30) * 10) / 10} months` : ''}` : 'Membership'}
                  </Txt>
                </View>
                <View style={{ borderWidth: 1.5, borderColor: status.tone, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 5 }}>
                  <Txt v="caption" color={status.tone}>
                    {status.label}
                  </Txt>
                </View>
              </View>
              {m.hasValidMembership ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 20 }}>
                  <Ring value={m.daysRemaining / total} size={128} stroke={11} color={status.tone}>
                    <Txt style={{ fontFamily: font.light, fontSize: 38, lineHeight: 44 }}>{left}</Txt>
                    <Txt v="caption" color={colors.textMuted}>
                      days left
                    </Txt>
                  </Ring>
                  <View style={{ gap: 10 }}>
                    <View>
                      <Txt v="caption" color={colors.textMuted}>
                        Start
                      </Txt>
                      <Txt>{shortDate(m.startDate)}</Txt>
                    </View>
                    <View style={{ width: 1, height: 14, backgroundColor: colors.border }} />
                    <View>
                      <Txt v="caption" color={colors.textMuted}>
                        End
                      </Txt>
                      <Txt>{shortDate(m.endDate)}</Txt>
                    </View>
                  </View>
                </View>
              ) : (
                <Txt color={colors.textMuted} style={{ marginTop: 14 }}>
                  No membership on file yet. The front desk will set it up in the C7 dashboard.
                </Txt>
              )}
              {!!m.pausedFrom && (
                <View style={{ marginTop: 18, borderWidth: 1, borderColor: 'rgba(22,179,235,0.4)', borderRadius: radius.lg, padding: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <PauseCircle size={16} color={colors.protein} />
                    <Txt v="small" color={colors.protein}>
                      Paused{m.pauseReason ? ` · ${m.pauseReason}` : ''}
                    </Txt>
                  </View>
                  <Txt v="small" color={colors.textMuted} style={{ marginTop: 4 }}>
                    {shortDate(m.pausedFrom)} → {shortDate(m.pausedUntil)}. Days resume automatically.
                  </Txt>
                </View>
              )}
              {!!m.notes && (
                <Txt v="small" color={colors.textMuted} style={{ marginTop: 14 }}>
                  {m.notes}
                </Txt>
              )}
            </Card>
          )}
        </Reveal>

        {!!m?.upcoming && (
          <Reveal p={r[1]!} style={{ marginTop: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: radius.xl, backgroundColor: colors.card, borderWidth: 1, borderColor: 'rgba(198,242,27,0.4)' }}>
              <LimeGradient style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={20} color={colors.onPrimary} />
              </LimeGradient>
              <View style={{ flex: 1 }}>
                <Txt>Upcoming extension{m.upcoming.duration ? ` · +${m.upcoming.duration} days` : ''}</Txt>
                <Txt v="small" color={colors.textMuted}>
                  {shortDate(m.upcoming.startDate)} → {shortDate(m.upcoming.endDate)}
                </Txt>
              </View>
            </View>
          </Reveal>
        )}

        <Reveal p={r[2]!} style={{ marginTop: 24 }}>
          <SectionHeader title="Payments" style={{ paddingHorizontal: 0, marginBottom: 12 }} />
          {pay.error ? (
            <ErrorState error={pay.error} onRetry={() => pay.refetch()} style={{ margin: 0 }} />
          ) : !pay.data ? (
            <Skeleton height={90} />
          ) : (
            <>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Tile label="Package" value={inr(info?.discountedPrice ?? info?.packagePrice)} />
                <Tile label="Paid" value={inr(info?.totalAmountPaid)} tone={colors.primary} />
                <Tile label="Balance due" value={inr(info?.remainingAmount ?? 0)} sub={info?.nextPaymentDue && (info.remainingAmount ?? 0) > 0 ? `Due ${new Date(info.nextPaymentDue).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}` : undefined} danger={dueSoon} />
              </View>
              {pay.data.paymentLogs.length > 0 ? (
                <Card style={{ marginTop: 12, paddingVertical: 4 }}>
                  {pay.data.paymentLogs.map((p, i) => (
                    <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderTopWidth: i ? 1 : 0, borderColor: colors.border }}>
                      <View>
                        <Txt style={{ fontFamily: font.light, fontSize: 20 }}>{inr(p.amount)}</Txt>
                        <Txt v="caption" color={colors.textMuted}>
                          {shortDate(p.paymentDate)} · {p.recordedByName}
                        </Txt>
                      </View>
                      {!!p.paymentMethod && (
                        <View style={{ backgroundColor: colors.secondary, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 }}>
                          <Txt v="caption">{p.paymentMethod.toUpperCase()}</Txt>
                        </View>
                      )}
                    </View>
                  ))}
                </Card>
              ) : (
                <Card style={{ marginTop: 12, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                  <CircleDollarSign size={18} color={colors.textMuted} />
                  <Txt color={colors.textMuted}>No payments recorded yet.</Txt>
                </Card>
              )}
              {!!info?.paymentNotes && (
                <Txt v="small" color={colors.textMuted} style={{ marginTop: 10 }}>
                  {info.paymentNotes}
                </Txt>
              )}
            </>
          )}
        </Reveal>

        <History r={r[3]!} />
      </Animated.ScrollView>
    </View>
  );
}

function History({ r }: { r: ReturnType<typeof useStagger>[number] }) {
  const { data } = useMembershipHistory();
  if (!data?.length) return null;
  return (
    <Reveal p={r} style={{ marginTop: 24 }}>
      <SectionHeader title="Membership history" style={{ paddingHorizontal: 0, marginBottom: 14 }} />
      <View style={{ marginLeft: 18, borderLeftWidth: 1, borderColor: colors.border }}>
        {data.map((h) => {
          const I = histIcon[h.changeType] ?? CalendarPlus;
          return (
            <View key={h.id} style={{ paddingLeft: 30, paddingBottom: 22 }}>
              <View style={{ position: 'absolute', left: -18, top: 0, width: 36, height: 36, borderRadius: 18, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
                <I size={16} color={h.changeType === 'PAUSE' ? colors.protein : colors.primary} />
              </View>
              <Txt>{pretty(h.changeType)}</Txt>
              {!!h.notes && (
                <Txt v="small" color={colors.textMuted}>
                  {h.notes}
                </Txt>
              )}
              <Txt v="caption" color={colors.textMuted}>
                {shortDate(h.changeDate)}
                {h.newEndDate ? ` · ends ${shortDate(h.newEndDate)}` : ''}
              </Txt>
            </View>
          );
        })}
      </View>
    </Reveal>
  );
}

function Tile({ label, value, sub, danger, tone }: { label: string; value: string; sub?: string; danger?: boolean; tone?: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, padding: 12, borderWidth: danger ? 1 : 0, borderColor: 'rgba(233,67,45,0.6)' }}>
      <Txt v="caption" color={colors.textMuted}>
        {label}
      </Txt>
      <Txt numberOfLines={1} adjustsFontSizeToFit style={{ marginTop: 4, fontFamily: font.medium }} color={danger ? colors.danger : tone ?? colors.text}>
        {value}
      </Txt>
      {!!sub && (
        <Txt v="caption" color={danger ? colors.danger : colors.textMuted}>
          {sub}
        </Txt>
      )}
    </View>
  );
}

