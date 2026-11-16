import { router } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { durationLabel, inr, usePackages, type Package, type PackageMode } from './api/gym';
import { Empty, Label, Tabs } from './gymui';
import { colors, font } from './theme';
import { ErrorState, Press, Skeleton, Txt } from './ui';

const ENQUIRY_LABEL = { NEW: 'Request sent', CONTACTED: 'Studio will call you', CONVERTED: 'Joined', CLOSED: 'Closed' } as const;

/** Lovable studio kit "ticket": price-led stub with a perforated tear line. */
export function Ticket({ p, index, width = 300 }: { p: Package; index: number; width?: number }) {
  const price = p.offerPrice ?? p.price;
  return (
    <Press onPress={() => router.push(`/packages/${p.id}`)} scaleTo={0.98} accessibilityLabel={`${p.name} package`} style={{ width, backgroundColor: colors.card, borderRadius: 24, borderWidth: p.highlight ? 1 : 0, borderColor: colors.primary }}>
      <View style={{ padding: 22 }}>
        <Label color={colors.primary}>{p.highlight ? 'Most chosen' : p.mode === 'ONLINE' ? 'Online coaching' : 'At the studio'}</Label>
        <Txt style={{ fontFamily: font.light, fontSize: 24, lineHeight: 29, marginTop: 16, maxWidth: width - 90 }} numberOfLines={2}>
          {p.name}
        </Txt>
        <Txt style={{ fontFamily: font.light, fontSize: 42, lineHeight: 46, marginTop: 22, fontVariant: ['tabular-nums'], letterSpacing: -1 }}>{inr(price)}</Txt>
        <Txt v="caption" color={colors.textMuted} style={{ marginTop: 6 }} numberOfLines={1}>
          {durationLabel(p.durationDays)}
          {p.offerPrice != null && p.offerPrice < p.price ? ` · was ${inr(p.price)}` : ''} · ≈ {inr(p.perMonth)}/mo
        </Txt>
        <Txt style={{ position: 'absolute', right: 20, top: 20, fontFamily: font.regular, fontSize: 10 }} color={colors.textMuted}>
          {String(index + 1).padStart(2, '0')}
        </Txt>
      </View>
      {/* Tear line with punched notches */}
      <View style={{ height: 0, borderTopWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(149,154,148,0.35)', marginHorizontal: 14 }} />
      <View style={{ position: 'absolute', left: -10, bottom: 46, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.surface }} />
      <View style={{ position: 'absolute', right: -10, bottom: 46, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.surface }} />
      <View style={{ height: 56, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Txt v="caption" color={p.enquiry ? colors.primary : colors.text}>
          {p.enquiry ? ENQUIRY_LABEL[p.enquiry.status] : p.features[0] ?? (p.mode === 'ONLINE' ? 'Train from anywhere' : 'Coached in person')}
        </Txt>
        <ArrowRight size={18} color={colors.primary} />
      </View>
    </Press>
  );
}

/** Packages as a horizontal ticket rail with All / At the studio / Online filter. */
export function PackageList({ heading = 'Find your fit' }: { heading?: string }) {
  const [mode, setMode] = useState<PackageMode | 'ALL'>('ALL');
  const q = usePackages(mode === 'ALL' ? undefined : mode);
  const list = q.data?.packages ?? [];
  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Label>{heading}</Label>
        {!!q.data && <Label>{String(list.length).padStart(2, '0')} packages</Label>}
      </View>
      <Tabs
        value={mode}
        onChange={setMode}
        options={[
          { id: 'ALL', label: 'All' },
          { id: 'OFFLINE', label: 'At the studio' },
          { id: 'ONLINE', label: 'Online' },
        ]}
      />
      {q.error ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !q.data ? (
        <Skeleton height={230} />
      ) : list.length === 0 ? (
        <Empty art={mode === 'ONLINE' ? 'packagesOnline' : 'packagesOffline'} title="No packages listed yet" body="The studio hasn’t published packages here. Check back soon, or visit the front desk." />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={300 + 14} decelerationRate="fast" style={{ marginHorizontal: -20 }} contentContainerStyle={{ gap: 14, paddingHorizontal: 20, paddingBottom: 4 }}>
          {list.map((p, i) => (
            <Ticket key={p.id} p={p} index={i} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

