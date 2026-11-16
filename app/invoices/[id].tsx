import { useLocalSearchParams } from 'expo-router';
import { Share2 } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { inr, shortDate, useInvoice } from '@/api/gym';
import { Dock, Page } from '@/gymui';
import { shareInvoice } from '@/invoicePdf';
import { colors, font } from '@/theme';
import { PrimaryButton, Skeleton, toast, Txt } from '@/ui';

const PAPER = '#F3F0E6';
const INK = '#141613';
const FADED = '#7A7A70';
const STAMP: Record<string, string> = { PAID: '#3E7D0A', PARTIAL: '#B45309', DUE: '#B42318', VOID: '#7A7A70' };

const L = ({ children, style }: { children: React.ReactNode; style?: object }) => (
  <Txt style={[{ fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase' }, style]} color={FADED}>
    {children}
  </Txt>
);
const Row = ({ k, v, strong }: { k: string; v: string; strong?: boolean }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 }}>
    <Txt v="small" color={INK}>
      {k}
    </Txt>
    <Txt color={INK} style={{ fontVariant: ['tabular-nums'], fontFamily: strong ? font.light : font.regular, fontSize: strong ? 20 : 13 }}>
      {v}
    </Txt>
  </View>
);

/** Torn bottom edge of the paper receipt. */
function Zigzag({ width }: { width: number }) {
  const n = Math.max(8, Math.round(width / 16));
  const w = width / n;
  let d = `M0 0 `;
  for (let i = 0; i < n; i++) d += `L${i * w + w / 2} 10 L${(i + 1) * w} 0 `;
  d += 'Z';
  return (
    <Svg width={width} height={10}>
      <Path d={d} fill={PAPER} />
    </Svg>
  );
}

/** Lovable "Invoice detail": a real paper receipt with a stamp, shared as a PDF. */
export default function InvoiceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = useInvoice(id);
  const [busy, setBusy] = useState(false);
  const [w, setW] = useState(0);
  const i = q.data?.invoice;
  const share = async () => {
    if (!i) return;
    setBusy(true);
    try {
      await shareInvoice(i);
    } catch (e) {
      toast.error(e);
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <Page title="Invoice" error={q.error} onRetry={() => q.refetch()}>
        {!i ? (
          <Skeleton height={460} />
        ) : (
          <View style={{ paddingBottom: 100, marginTop: 10 }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
            <View style={{ backgroundColor: PAPER, borderTopLeftRadius: 6, borderTopRightRadius: 6, paddingHorizontal: 22, paddingTop: 24, paddingBottom: 26 }}>
              <L>{i.gym.name}</L>
              <Txt style={{ fontFamily: font.light, fontSize: 28, lineHeight: 34, marginTop: 6 }} color={INK}>
                Payment receipt
              </Txt>
              <Txt style={{ fontSize: 12, marginTop: 14, letterSpacing: 1 }} color={INK}>
                {i.number}
              </Txt>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(20,22,19,0.2)' }}>
                <Txt style={{ fontSize: 11 }} color={INK}>
                  {shortDate(i.issuedAt)}
                  {i.dueDate && i.status !== 'PAID' ? ` · due ${shortDate(i.dueDate)}` : ''}
                </Txt>
                <Txt style={{ fontSize: 11 }} color={INK}>
                  IST · INR
                </Txt>
              </View>
              <L style={{ marginTop: 18 }}>Billed to</L>
              <Txt v="small" color={INK} style={{ marginTop: 4 }}>
                {i.billTo.name}
              </Txt>
              {!!i.billTo.memberId && (
                <Txt style={{ fontSize: 11, marginTop: 2 }} color={FADED}>
                  Member {i.billTo.memberId}
                </Txt>
              )}
              <View style={{ marginTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(20,22,19,0.3)' }}>
                <Txt v="small" color={INK}>
                  {i.description}
                </Txt>
                {!!i.periodStart && (
                  <Txt style={{ fontSize: 11, marginTop: 3 }} color={FADED}>
                    {shortDate(i.periodStart)} – {i.periodEnd ? shortDate(i.periodEnd) : '—'}
                  </Txt>
                )}
                <Txt style={{ textAlign: 'right', fontFamily: font.light, fontSize: 22, marginTop: 8 }} color={INK}>
                  {inr(i.subtotal)}
                </Txt>
              </View>
              <View style={{ marginTop: 10 }}>
                {!!i.discount && <Row k="Discount" v={`− ${inr(i.discount)}`} />}
                {!!i.taxPercent && <Row k={`GST ${i.taxPercent}%`} v={inr(i.taxAmount)} />}
                <Row k="Total" v={inr(i.total)} />
                <Row k={`Received${i.paymentMethod ? ` · ${i.paymentMethod}` : ''}`} v={inr(i.amountPaid)} />
                <View style={{ borderTopWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(20,22,19,0.2)', marginTop: 6, paddingTop: 6 }}>
                  <Row k="Balance due" v={inr(i.balance)} strong />
                </View>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22 }}>
                <Txt style={{ fontSize: 10, lineHeight: 14 }} color={FADED}>
                  {i.gym.name}
                  {i.gym.gstin ? `\nGSTIN ${i.gym.gstin}` : ''}
                </Txt>
                <View style={{ transform: [{ rotate: '-8deg' }], borderWidth: 2, borderColor: STAMP[i.status], paddingHorizontal: 12, paddingVertical: 4 }} accessibilityLabel={`Status ${i.status}`}>
                  <Txt style={{ fontFamily: font.semibold, fontSize: 18, letterSpacing: 2 }} color={STAMP[i.status]}>
                    {i.status}
                  </Txt>
                </View>
              </View>
              {!!i.notes && (
                <Txt style={{ fontSize: 11, marginTop: 14 }} color={FADED}>
                  {i.notes}
                </Txt>
              )}
            </View>
            {w > 0 && <Zigzag width={w} />}
            {i.balance > 0 && (
              <Txt v="small" color={colors.textMuted} style={{ marginTop: 16 }}>
                Pay the balance at the front desk or by UPI. This receipt updates as soon as the studio records it.
              </Txt>
            )}
          </View>
        )}
      </Page>
      {!!i && (
        <Dock>
          <PrimaryButton title={busy ? 'Preparing PDF…' : 'Share PDF receipt'} icon={Share2} onPress={share} loading={busy} />
        </Dock>
      )}
    </View>
  );
}
