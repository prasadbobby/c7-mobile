import { router } from 'expo-router';
import { ArrowUpRight } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { inr, shortDate, useInvoices, type InvoiceRow } from '@/api/gym';
import { Empty, INVOICE_TONE, Label, Numeral, Page } from '@/gymui';
import { colors, font } from '@/theme';
import { Press, Skeleton, Txt } from '@/ui';

const monthOf = (s: string) => new Date(s).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }).toUpperCase();

/** Lovable "Invoices": outstanding as the hero number, invoices grouped by month. */
export default function Invoices() {
  const q = useInvoices();
  const list = q.data?.invoices ?? [];
  const groups = list.reduce<[string, InvoiceRow[]][]>((acc, i) => {
    const m = monthOf(i.issuedAt);
    const g = acc.find(([k]) => k === m);
    if (g) g[1].push(i);
    else acc.push([m, [i]]);
    return acc;
  }, []);
  const nextDue = list.filter((i) => i.status !== 'PAID' && i.dueDate).sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))[0];
  const due = q.data?.totals.due ?? 0;
  return (
    <Page title="Invoices" error={q.error} onRetry={() => q.refetch()} onRefresh={() => q.refetch()} refreshing={q.isRefetching}>
      {!q.data ? (
        <Skeleton height={240} />
      ) : list.length === 0 ? (
        <Empty art="invoice" title="No invoices yet" body="When the studio records a payment, its invoice appears here. You can save or share each one as a PDF." />
      ) : (
        <>
          <View style={{ paddingTop: 18, paddingBottom: 30 }}>
            <Label>{due > 0 ? 'Outstanding' : 'All settled'}</Label>
            <Numeral size={52} style={{ marginTop: 8 }} color={due > 0 ? colors.text : colors.primary}>
              {inr(due)}
            </Numeral>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: due > 0 ? colors.carbs : colors.primary }} />
              <Txt v="caption" color={colors.textMuted}>
                {due > 0 ? `${nextDue?.dueDate ? `Due ${shortDate(nextDue.dueDate)} · ` : ''}Pay at the studio or by UPI` : `${inr(q.data.totals.paid)} paid to date`}
              </Txt>
            </View>
          </View>
          {groups.map(([month, items]) => (
            <View key={month} style={{ marginBottom: 26 }}>
              <Label style={{ paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border }}>{month}</Label>
              {items.map((i) => (
                <Press key={i.id} onPress={() => router.push(`/invoices/${i.id}`)} scaleTo={0.99} accessibilityLabel={`Invoice ${i.number}`} style={{ flexDirection: 'row', gap: 14, paddingTop: 14 }}>
                  <Txt style={{ fontFamily: font.regular, fontSize: 12, marginTop: 2, width: 18 }} color={colors.textMuted}>
                    {new Date(i.issuedAt).getDate().toString().padStart(2, '0')}
                  </Txt>
                  <View style={{ flex: 1 }}>
                    <Txt v="small">{i.description}</Txt>
                    <Txt style={{ fontSize: 10, marginTop: 4, letterSpacing: 0.6 }} color={colors.textMuted}>
                      {i.number}
                    </Txt>
                    <View style={{ alignSelf: 'flex-start', marginTop: 10, borderWidth: 1, borderColor: INVOICE_TONE[i.status], borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>
                      <Txt style={{ fontSize: 10 }} color={INVOICE_TONE[i.status]}>
                        {i.status}
                      </Txt>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Txt style={{ fontFamily: font.light, fontSize: 20, fontVariant: ['tabular-nums'] }}>{inr(i.total)}</Txt>
                    <ArrowUpRight size={18} color={colors.textMuted} style={{ marginTop: 16 }} />
                  </View>
                </Press>
              ))}
            </View>
          ))}
        </>
      )}
    </Page>
  );
}
