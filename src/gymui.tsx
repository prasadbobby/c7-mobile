import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { FEATURE_ART, type FeatureArtKey } from './featureArt';
import { colors, font, radius } from './theme';
import { ErrorState, HeroGlow, Icon, Press, TopBar, Txt } from './ui';

/**
 * Building blocks for the gym-feature screens. Deliberately quiet: one accent colour,
 * left-aligned type, hairline-divided lists instead of stacks of floating cards,
 * numbers set light and tabular, no gradients or glows on data.
 */

export function Page({ title, children, right, refreshing, onRefresh, error, onRetry, glow = true, testID, back = true }: { back?: boolean; title: string; children: ReactNode; right?: ReactNode; refreshing?: boolean; onRefresh?: () => void; error?: unknown; onRetry?: () => void; glow?: boolean; testID?: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }} testID={testID}>
      {!!glow && <HeroGlow height={360} intensity={0.6} />}
      <TopBar title={title} back={back} right={right ?? <View style={{ width: 48 }} />} />
      {error ? (
        <ErrorState error={error} onRetry={onRetry} />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 72 }}
          refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} /> : undefined}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      )}
    </View>
  );
}

export function FeatureArt({ name, width = 200 }: { name: FeatureArtKey; width?: number }) {
  return <SvgXml xml={FEATURE_ART[name]} width={width} height={(width * 180) / 240} />;
}

/** Empty state with Asset Studio art — left aligned, one sentence, optional action. */
export function Empty({ art, title, body, action }: { art: FeatureArtKey; title: string; body: string; action?: ReactNode }) {
  return (
    <View style={{ paddingVertical: 28, paddingHorizontal: 12, gap: 10, alignItems: 'center' }}>
      <FeatureArt name={art} width={180} />
      <Txt v="h3" style={{ marginTop: 6, textAlign: 'center' }}>
        {title}
      </Txt>
      <Txt color={colors.textMuted} style={{ maxWidth: 320, textAlign: 'center' }}>
        {body}
      </Txt>
      {!!action && <View style={{ alignItems: 'center', alignSelf: 'stretch' }}>{action}</View>}
    </View>
  );
}

/** Small status label. Outline by default; filled only for the one state that needs attention. */
export function Tag({ label, tone = colors.textMuted, filled }: { label: string; tone?: string; filled?: boolean }) {
  return (
    <View style={{ alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: filled ? 0 : StyleSheet.hairlineWidth * 2, borderColor: tone, backgroundColor: filled ? tone : 'transparent' }}>
      <Txt style={{ fontFamily: font.medium, fontSize: 11, lineHeight: 14, letterSpacing: 0.6 }} color={filled ? colors.onPrimary : tone}>
        {label.toUpperCase()}
      </Txt>
    </View>
  );
}

/** A grouped list: rows share one surface and are separated by hairlines. */
export function Group({ children, style, label }: { children: ReactNode; style?: StyleProp<ViewStyle>; label?: string }) {
  return (
    <View style={style}>
      {!!label && (
        <Txt v="overline" color={colors.textDim} style={{ marginBottom: 10, marginTop: 4 }}>
          {label}
        </Txt>
      )}
      <View style={{ backgroundColor: colors.card, borderRadius: radius.md, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border }}>{children}</View>
    </View>
  );
}

export function Row({ title, sub, right, icon, onPress, last, label, testID }: { title: string; sub?: string; right?: ReactNode; icon?: LucideIcon; onPress?: () => void; last?: boolean; label?: string; testID?: string }) {
  const body = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth, borderColor: colors.border }}>
      {!!icon && <Icon as={icon} size={20} color={colors.textMuted} />}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt numberOfLines={1}>{title}</Txt>
        {!!sub && (
          <Txt v="small" color={colors.textMuted} numberOfLines={2} style={{ marginTop: 2 }}>
            {sub}
          </Txt>
        )}
      </View>
      {right}
      {!!onPress && <ChevronRight size={18} color={colors.textDim} />}
    </View>
  );
  return onPress ? (
    <Press onPress={onPress} scaleTo={0.99} accessibilityLabel={label ?? title} testID={testID}>
      {body}
    </Press>
  ) : (
    body
  );
}

/** Label over a light, tabular number. */
export function Figure({ label, value, unit, tone = colors.text, align = 'left' }: { label: string; value: string; unit?: string; tone?: string; align?: 'left' | 'right' }) {
  return (
    <View style={{ alignItems: align === 'right' ? 'flex-end' : 'flex-start' }}>
      <Txt v="caption" color={colors.textMuted}>
        {label}
      </Txt>
      <Txt style={{ fontFamily: font.light, fontSize: 26, lineHeight: 32, fontVariant: ['tabular-nums'], marginTop: 2 }} color={tone}>
        {value}
        {!!unit && (
          <Txt v="small" color={colors.textMuted}>
            {' '}
            {unit}
          </Txt>
        )}
      </Txt>
    </View>
  );
}

/** Horizontal rule between figures. */
export const Rule = ({ style }: { style?: StyleProp<ViewStyle> }) => <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }, style]} />;

/** Lovable studio kit: pill tabs — the active one is solid lime, the rest hairline outlines. Scrolls sideways. */
export function Tabs<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 8, paddingVertical: 4 }} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.id === value;
        return (
          <Press key={o.id} onPress={() => onChange(o.id)} scaleTo={0.97} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={o.label} style={{ height: 36, paddingHorizontal: 16, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: on ? colors.primary : colors.border, backgroundColor: on ? colors.primary : 'transparent' }}>
            <Txt v="small" color={on ? colors.onPrimary : colors.textMuted} style={{ fontFamily: on ? font.medium : font.regular }}>
              {o.label}
            </Txt>
          </Press>
        );
      })}
    </ScrollView>
  );
}

/** 11px uppercase label (the studio kit's small caps). */
export function Label({ children, color = colors.textMuted, style }: { children: ReactNode; color?: string; style?: StyleProp<TextStyle> }) {
  return (
    <Txt style={[{ fontFamily: font.regular, fontSize: 11, lineHeight: 14, letterSpacing: 0.8, textTransform: 'uppercase' }, style]} color={color}>
      {children}
    </Txt>
  );
}

/** Editorial two-line headline: first line white, second line lime or muted. Light weight. */
export function Headline({ lead, tail, tone = 'muted', size = 36 }: { lead: string; tail?: string; tone?: 'muted' | 'lime'; size?: number }) {
  return (
    <Txt style={{ fontFamily: font.light, fontSize: size, lineHeight: Math.round(size * 1.12), letterSpacing: -0.5 }} accessibilityRole="header">
      {lead}
      {!!tail && (
        <Txt style={{ fontFamily: font.light, fontSize: size, lineHeight: Math.round(size * 1.12) }} color={tone === 'lime' ? colors.primary : colors.textMuted}>
          {'\n'}
          {tail}
        </Txt>
      )}
    </Txt>
  );
}

/** Big light tabular numeral. */
export function Numeral({ children, size = 64, color = colors.text, style, accessibilityLabel }: { children: ReactNode; size?: number; color?: string; style?: StyleProp<TextStyle>; accessibilityLabel?: string }) {
  return (
    <Txt accessibilityLabel={accessibilityLabel} style={[{ fontFamily: font.light, fontSize: size, lineHeight: Math.round(size * 1.05), fontVariant: ['tabular-nums'], letterSpacing: -1 }, style]} color={color}>
      {children}
    </Txt>
  );
}

/** Fixed bottom bar for the screen's one primary action. */
export function Dock({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 14, paddingBottom: insets.bottom + 14, backgroundColor: colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border }}>{children}</View>;
}

export function NavRow({ icon, title, sub, onPress, badge, last }: { icon: LucideIcon; title: string; sub?: string; onPress: () => void; badge?: number; last?: boolean }) {
  return (
    <Row
      icon={icon}
      title={title}
      sub={sub}
      onPress={onPress}
      last={last}
      right={
        badge ? (
          <View style={{ minWidth: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
            <Txt v="caption" color={colors.onPrimary} style={{ fontFamily: font.semibold }}>
              {badge}
            </Txt>
          </View>
        ) : undefined
      }
    />
  );
}

export const INVOICE_TONE = { PAID: colors.primary, PARTIAL: colors.carbs, DUE: colors.danger, VOID: colors.textDim } as const;
