import { router, useLocalSearchParams } from 'expo-router';
import { ArrowRight, Check, Mail, Phone } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, StyleSheet, TextInput, View } from 'react-native';
import { errorMessage } from '@/api/client';
import { durationLabel, inr, useEnquire, usePackage } from '@/api/gym';
import { Dock, Label, Page } from '@/gymui';
import { colors, font } from '@/theme';
import { FadeBottom, Field, Img, Press, PrimaryButton, Sheet, Skeleton, Txt } from '@/ui';

const HERO = require('../../assets/c7/onboarding/onboarding-lift.jpg');
const STATUS = { NEW: 'Request sent — the studio will call you', CONTACTED: 'The studio has contacted you', CONVERTED: 'You joined this package', CLOSED: 'Request closed' } as const;

/** Lovable "Package detail": photo hero with price, numbered "what's included" ledger, docked request. */
export default function PackageDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = usePackage(id);
  const enquire = useEnquire();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const p = q.data?.package;
  const enquiry = q.data?.enquiry;
  const included = p ? [...p.features, ...(p.features.length ? [] : [p.mode === 'ONLINE' ? 'Coaching in the C7 app' : 'Coached sessions at the studio'])] : [];

  const submit = async () => {
    setError(null);
    const digits = phone.replace(/\D/g, '');
    if (digits && !/^[6-9]\d{9}$/.test(digits)) return setError('Enter a 10-digit mobile number, or leave it empty.');
    try {
      await enquire.mutateAsync({ packageId: id!, phone: digits ? `+91 ${digits}` : undefined, message: message.trim() || undefined });
      setSent(true);
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <Page title="The package" error={q.error} onRetry={() => q.refetch()}>
        {!p ? (
          <Skeleton height={360} />
        ) : (
          <View style={{ paddingBottom: 90 }}>
            <View style={{ height: 340, marginHorizontal: -20, marginTop: 4 }}>
              <Img source={p.imageUrl ?? undefined} fallback={HERO} style={StyleSheet.absoluteFill} />
              <FadeBottom />
              <View style={{ position: 'absolute', left: 20, right: 20, bottom: 16 }}>
                <Label color={colors.primary}>
                  {p.mode === 'ONLINE' ? 'Online' : 'At the studio'} / {p.durationDays} days
                </Label>
                <Txt style={{ fontFamily: font.light, fontSize: 30, lineHeight: 36, marginTop: 6 }}>{p.name}</Txt>
                <Txt style={{ fontFamily: font.light, fontSize: 54, lineHeight: 58, marginTop: 14, fontVariant: ['tabular-nums'], letterSpacing: -1 }}>{inr(p.offerPrice ?? p.price)}</Txt>
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
                  {p.offerPrice != null && p.offerPrice < p.price ? (
                    <>
                      <Txt v="small" color={colors.textMuted} style={{ textDecorationLine: 'line-through' }}>
                        {inr(p.price)}
                      </Txt>
                      <Txt v="small" color={colors.primary}>
                        Save {inr(p.price - p.offerPrice)}
                      </Txt>
                    </>
                  ) : (
                    <Txt v="small" color={colors.textMuted}>
                      {durationLabel(p.durationDays)} · ≈ {inr(p.perMonth)}/month
                    </Txt>
                  )}
                </View>
              </View>
            </View>

            {!!p.description && <Txt style={{ marginTop: 22 }}>{p.description}</Txt>}
            <Label style={{ marginTop: 24 }}>What’s included</Label>
            {included.map((item, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 15, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border }}>
                <Txt style={{ fontSize: 10, width: 18 }} color={colors.textMuted}>
                  {String(i + 1).padStart(2, '0')}
                </Txt>
                <Txt v="small" style={{ flex: 1 }}>
                  {item}
                </Txt>
                <Check size={16} color={colors.primary} />
              </View>
            ))}
            {!!enquiry && (
              <View style={{ marginTop: 20, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                <View style={{ width: 2, height: 22, backgroundColor: colors.primary }} />
                <Txt v="small">{STATUS[enquiry.status]}</Txt>
              </View>
            )}
            {(!!q.data?.contact.phone || !!q.data?.contact.email) && (
              <View style={{ marginTop: 24, gap: 6 }}>
                <Label>Talk to the studio</Label>
                {!!q.data?.contact.phone && (
                  <Press onPress={() => Linking.openURL(`tel:${q.data!.contact.phone}`)} style={{ flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 8 }} accessibilityLabel={`Call ${q.data.contact.phone}`}>
                    <Phone size={16} color={colors.primary} />
                    <Txt v="small">{q.data.contact.phone}</Txt>
                  </Press>
                )}
                {!!q.data?.contact.email && (
                  <Press onPress={() => Linking.openURL(`mailto:${q.data!.contact.email}`)} style={{ flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 8 }} accessibilityLabel={`Email ${q.data.contact.email}`}>
                    <Mail size={16} color={colors.primary} />
                    <Txt v="small">{q.data.contact.email}</Txt>
                  </Press>
                )}
              </View>
            )}
          </View>
        )}
      </Page>

      {!!p && (
        <Dock>
          {enquiry && enquiry.status !== 'CLOSED' ? (
            <PrimaryButton title="Back to packages" onPress={() => router.back()} />
          ) : (
            <PrimaryButton title="Request this package" icon={ArrowRight} onPress={() => (setSent(false), setOpen(true))} />
          )}
        </Dock>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title={sent ? 'Request sent' : 'Let’s get you started'}>
        {sent ? (
          <View style={{ gap: 12 }}>
            <Check size={36} color={colors.primary} />
            <Txt v="bodyLg">Your interest is noted.</Txt>
            <Txt v="small" color={colors.textMuted}>
              The studio will call you to confirm timings and payment. Your full C7 app unlocks once you’re enrolled.
            </Txt>
            <PrimaryButton title="Done" onPress={() => setOpen(false)} style={{ marginTop: 6 }} />
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            <Txt v="small" color={colors.textMuted}>
              {p?.name} · {p ? inr(p.offerPrice ?? p.price) : ''}
            </Txt>
            <Label>Phone number</Label>
            <View style={{ flexDirection: 'row', alignItems: 'center', height: 56, borderRadius: 28, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 18 }}>
              <Txt color={colors.textMuted} style={{ marginRight: 10 }}>
                +91
              </Txt>
              <TextInput value={phone} onChangeText={(t) => (setPhone(t.replace(/\D/g, '').slice(0, 10)), setError(null))} keyboardType="phone-pad" placeholder="98765 43210" placeholderTextColor={colors.textDim} accessibilityLabel="Phone number" style={{ flex: 1, color: colors.text, fontFamily: font.regular, fontSize: 16 }} />
            </View>
            <Field placeholder="Anything we should know? (optional)" value={message} onChangeText={setMessage} multiline accessibilityLabel="Message" />
            {!!error && (
              <Txt v="small" color={colors.danger} accessibilityRole="alert">
                {error}
              </Txt>
            )}
            <PrimaryButton title="Confirm interest" icon={ArrowRight} onPress={submit} loading={enquire.isPending} />
          </View>
        )}
      </Sheet>
    </View>
  );
}
