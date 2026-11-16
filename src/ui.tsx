/**
 * PulseFit component kit. Every screen is assembled from these pieces so the
 * design system (tokens in theme.ts) stays consistent across the app.
 */
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Image, type ImageProps } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { BellRing, Check, ChevronLeft, EllipsisVertical, Eye, EyeOff, Flame, Timer, type LucideIcon } from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import {
  Dimensions,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ImageSourcePropType,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
  useWindowDimensions,
} from 'react-native';
import Animated, { Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { ease, svTo, useHeaderFade } from './motion';
import { colors, font, gradients, radius, shadow, type } from './theme';

/* ----------------------------------------------------------------- basics -- */

type Variant = keyof typeof type;
/**
 * Responsive type: the design is drawn at 390pt wide. Small phones (320–375) scale text down a
 * little and large phones up a little, so every screen keeps the same proportions and nothing wraps
 * or clips differently. Clamped so text stays readable.
 */
const TYPE_SCALE = Math.min(1.08, Math.max(0.84, Dimensions.get('window').width / 390));
export const rs = (n: number) => Math.round(n * TYPE_SCALE);
function scaled(style: StyleProp<TextStyle>): TextStyle {
  const f = StyleSheet.flatten(style) ?? {};
  return { ...f, ...(f.fontSize ? { fontSize: rs(f.fontSize) } : null), ...(f.lineHeight ? { lineHeight: rs(f.lineHeight) } : null) };
}
export function Txt({ v = 'body', color = colors.text, style, ...p }: TextProps & { v?: Variant; color?: string }) {
  return <Text maxFontSizeMultiplier={1.3} {...p} style={scaled([type[v] as TextStyle, { color }, style])} />;
}

/** Strings/numbers can't sit directly in a <View> (RN-web: "Unexpected text node"). Wrap them in Txt. */
export const asNode = (x: ReactNode): ReactNode => (typeof x === 'string' || typeof x === 'number' ? (x === '' ? null : <Txt>{x}</Txt>) : x);

export function Icon({ as: C, size = 22, color = colors.text, strokeWidth = 1.8 }: { as: LucideIcon; size?: number; color?: string; strokeWidth?: number }) {
  return <C size={size} color={color} strokeWidth={strokeWidth} />;
}

let hapticsOn = true;
/** Synced from the member's saved preference (Settings → Haptics). */
export const setHapticsEnabled = (v: boolean) => {
  hapticsOn = v;
};
export function haptic(kind: 'light' | 'medium' | 'success' = 'light') {
  if (Platform.OS === 'web' || !hapticsOn) return;
  try {
    if (kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else Haptics.impactAsync(kind === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
  } catch {}
}

const APressable = Animated.createAnimatedComponent(Pressable);

/** Pressable with spring scale-down + haptic tick — the base of every tappable. */
export function Press({
  children,
  style,
  scaleTo = 0.96,
  onPress,
  hapticKind = 'light',
  ...p
}: PressableProps & { style?: StyleProp<ViewStyle>; scaleTo?: number; children?: ReactNode; hapticKind?: 'light' | 'medium' | 'success' | 'none' }) {
  const s = useSharedValue(1);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <APressable
      {...p}
      onPressIn={(e) => {
        s.value = withTiming(scaleTo, { duration: 90, easing: Easing.out(Easing.quad) });
        p.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        s.value = withTiming(1, { duration: 160, easing: Easing.out(Easing.quad) });
        p.onPressOut?.(e);
      }}
      onPress={(e) => {
        if (hapticKind !== 'none') haptic(hapticKind);
        onPress?.(e);
      }}
      style={[style, a]}
    >
      {children}
    </APressable>
  );
}

export type Source = ImageSourcePropType | string | null | undefined;
/** Remote URLs (FitForge uploads, data URLs) or bundled assets, with a bundled fallback. */
export const src = (s: Source, fallback?: ImageSourcePropType): ImageProps['source'] =>
  (typeof s === 'string' ? (s ? { uri: s } : fallback) : (s ?? fallback)) as ImageProps['source'];

export function Img({ source, fallback, style, ...p }: Omit<ImageProps, 'source'> & { source: Source; fallback?: ImageSourcePropType }) {
  return <Image source={src(source, fallback)} contentFit="cover" transition={250} style={[{ backgroundColor: colors.secondary }, style as object]} {...p} />;
}

/* ------------------------------------------------------------ backgrounds -- */

/**
 * The signature hero glow — a broad green wash from the top-left third that fades out by mid-screen,
 * matched to the Lovable screens. Drawn in a stretched 100×100 viewBox with a userSpace circle so it
 * becomes an ellipse sized to the screen identically on iOS, Android and web (web ignores rx/ry).
 * `height` / `intensity` are kept for older call sites.
 */
export function HeroGlow(_: { height?: number; intensity?: number }) {
  const { height } = useWindowDimensions();
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { height: Math.max(height, 700) }]}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <RadialGradient id="hero" gradientUnits="userSpaceOnUse" cx="30" cy="0" fx="30" fy="0" r="82">
            <Stop offset="0" stopColor="#21471D" stopOpacity={1} />
            <Stop offset="0.35" stopColor="#142A13" stopOpacity={1} />
            <Stop offset="0.7" stopColor="#070D07" stopOpacity={1} />
            <Stop offset="1" stopColor={colors.surface} stopOpacity={1} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#hero)" />
      </Svg>
    </View>
  );
}

export function LimeGradient({ style, children, horizontal = true, soft }: { style?: StyleProp<ViewStyle>; children?: ReactNode; horizontal?: boolean; soft?: boolean }) {
  return (
    <LinearGradient colors={soft ? gradients.limeSoft : gradients.lime} start={{ x: 0, y: 0.5 }} end={horizontal ? { x: 1, y: 0.5 } : { x: 0.5, y: 1 }} style={style}>
      {children}
    </LinearGradient>
  );
}

export function FadeBottom({ style }: { style?: StyleProp<ViewStyle> }) {
  return <LinearGradient pointerEvents="none" colors={gradients.fade} locations={[0.35, 0.7, 1]} style={[StyleSheet.absoluteFill, style]} />;
}

/* ----------------------------------------------------------------- layout -- */

export const TAB_BAR_SPACE = 130;

/** Full-screen shell: surface background + hero glow + safe-area top. */
export function Screen({ children, glow = true, style }: { children: ReactNode; glow?: boolean; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ flex: 1, backgroundColor: colors.surface }, style]}>
      {!!glow && <HeroGlow />}
      {children}
    </View>
  );
}

export function useTopInset(extra = 8) {
  return useSafeAreaInsets().top + extra;
}

/* ---------------------------------------------------------------- buttons -- */

export function IconButton({ icon, onPress, label, badge, style, size = 48, tint = 'rgba(5,6,5,0.78)' }: { icon: LucideIcon | ReactNode; onPress?: () => void; label: string; badge?: boolean; style?: StyleProp<ViewStyle>; size?: number; tint?: string }) {
  const IconC = icon as LucideIcon;
  const isComp = typeof icon === 'function' || (typeof icon === 'object' && icon !== null && '$$typeof' in (icon as object) && !('props' in (icon as object)));
  return (
    <Press accessibilityRole="button" accessibilityLabel={label} onPress={onPress} scaleTo={0.88} style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: tint, alignItems: 'center', justifyContent: 'center' }, style]}>
      {isComp ? <IconC size={size * 0.44} color={colors.text} strokeWidth={1.8} /> : (icon as ReactNode)}
      {!!badge && <PulseDot style={{ position: 'absolute', top: size * 0.2, right: size * 0.22 }} />}
    </Press>
  );
}

export function PulseDot({ style, color = colors.danger }: { style?: StyleProp<ViewStyle>; color?: string }) {
  const s = useSharedValue(1);
  useEffect(() => {
    s.value = 1; // static dot — no pulsing
  }, [s]);
  const halo = useAnimatedStyle(() => ({ transform: [{ scale: s.value }], opacity: 2 - s.value }));
  return (
    <View style={[{ width: 9, height: 9 }, style]}>
      <Animated.View style={[{ position: 'absolute', inset: -3, borderRadius: 9, backgroundColor: color, opacity: 0.4 }, halo]} />
      <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: color }} />
    </View>
  );
}

export function PrimaryButton({ title, onPress, style, icon, disabled, loading }: { title: string; onPress?: () => void; style?: StyleProp<ViewStyle>; icon?: LucideIcon; disabled?: boolean; loading?: boolean }) {
  if (loading) title = 'Please wait…';
  disabled = disabled || loading;
  return (
    <Press disabled={disabled} accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} onPress={onPress} hapticKind="medium" style={[{ height: 58, borderRadius: radius.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, opacity: disabled ? 0.45 : 1 }, shadow.glow, style]}>
      {!!icon && <Icon as={icon} color={colors.onPrimary} size={20} strokeWidth={2.2} />}
      <Txt v="bodyLg" color={colors.onPrimary} style={{ fontFamily: font.medium }}>
        {title}
      </Txt>
    </Press>
  );
}

export function SecondaryButton({ title, onPress, style, leading, disabled }: { title: string; onPress?: () => void; style?: StyleProp<ViewStyle>; leading?: ReactNode; disabled?: boolean }) {
  return (
    <Press onPress={onPress} disabled={disabled} accessibilityRole="button" style={[{ opacity: disabled ? 0.5 : 1 }, { height: 58, borderRadius: radius.pill, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 }, style]}>
      {asNode(leading)}
      <Txt color={colors.textMuted}>{title}</Txt>
    </Press>
  );
}

/** Lime pill used for small CTAs like Follow / START. */
export function PillButton({ title, onPress, active, tone = 'lime', style }: { title: string; onPress?: () => void; active?: boolean; tone?: 'lime' | 'cream' | 'dark'; style?: StyleProp<ViewStyle> }) {
  const bg = active ? colors.secondary : tone === 'cream' ? colors.cream : tone === 'dark' ? colors.card : undefined;
  const fg = active ? colors.text : tone === 'dark' ? colors.text : colors.onPrimary;
  const inner = (
    <Txt v="small" color={fg} style={{ fontFamily: font.semibold }}>
      {title}
    </Txt>
  );
  return (
    <Press onPress={onPress} scaleTo={0.9} style={[{ borderRadius: radius.pill, overflow: 'hidden' }, shadow.card, style]}>
      {bg ? <View style={{ backgroundColor: bg, paddingHorizontal: 18, paddingVertical: 11 }}>{inner}</View> : <LimeGradient soft style={{ paddingHorizontal: 18, paddingVertical: 11 }}>{inner}</LimeGradient>}
    </Press>
  );
}

/* ----------------------------------------------------------------- header -- */

export function BackButton({ onPress }: { onPress?: () => void }) {
  return <IconButton icon={ChevronLeft} label="Go back" onPress={onPress ?? (() => (router.canGoBack() ? router.back() : router.replace('/home')))} />;
}

/**
 * Centered-title top bar (Search for Meal / Leaderboard). When `y` is passed it
 * gets a blurred backdrop that fades in on scroll.
 */
export function TopBar({ title, right, y, onBack, back = true }: { title?: string; right?: ReactNode; y?: SharedValue<number>; onBack?: () => void; back?: boolean }) {
  const top = useTopInset();
  const fade = useHeaderFade(y ?? ({ value: 0 } as SharedValue<number>), 30, 90);
  return (
    <View style={{ position: y ? 'absolute' : 'relative', top: 0, left: 0, right: 0, zIndex: 20, paddingTop: top, paddingHorizontal: 20, paddingBottom: 10 }}>
      {!!y && (
        <Animated.View style={[StyleSheet.absoluteFill, fade]}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(5,6,5,0.55)', borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border }]} />
        </Animated.View>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {back ? <BackButton onPress={onBack} /> : <View style={{ width: 48 }} />}
        {title ? <Txt v="h3">{title}</Txt> : <View />}
        {right ?? <IconButton icon={EllipsisVertical} label="More options" />}
      </View>
    </View>
  );
}

export function Avatar({ source, name, size = 56, ring = true, ringColor = colors.primaryGlow, badge }: { source: Source; name?: string; size?: number; ring?: boolean; ringColor?: string; badge?: ReactNode }) {
  const empty = !source || (typeof source === 'string' && !source);
  const initials = (name ?? '').split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  return (
    <View>
      {empty ? (
        <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: ring ? 2 : 0, borderColor: ringColor, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' }}>
          <Txt style={{ fontFamily: font.semibold, fontSize: size * 0.36 }} color={colors.primary}>
            {initials || '•'}
          </Txt>
        </View>
      ) : (
        <Img source={source} style={{ width: size, height: size, borderRadius: size / 2, borderWidth: ring ? 2 : 0, borderColor: ringColor }} />
      )}
      {!!badge && <View style={{ position: 'absolute', right: -4, bottom: -4 }}>{asNode(badge)}</View>}
    </View>
  );
}

export function RankBadge({ n, light }: { n: number | string; light?: boolean }) {
  return (
    <View style={{ minWidth: 24, height: 24, paddingHorizontal: 4, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: light ? colors.surface : colors.primary, borderWidth: 2, borderColor: colors.card }}>
      <Txt v="caption" color={light ? colors.text : colors.onPrimary} style={{ fontFamily: font.semibold }}>
        {n}
      </Txt>
    </View>
  );
}

/** "Hello Emma 👋 / Get ready" header with notification + streak buttons. */
export function Greeting({ name, avatar, unread, subtitle = 'Get ready' }: { name: string; avatar: Source; unread?: boolean; subtitle?: string }) {
  const top = useTopInset(12);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: top }}>
      <Press onPress={() => router.push('/profile')} scaleTo={0.9}>
        <Avatar source={avatar} name={name} size={56} ringColor="rgba(198,242,27,0.45)" />
      </Press>
      <View style={{ flex: 1 }}>
        <Txt v="bodyLg">Hello {name} 👋</Txt>
        <Txt v="small" color={colors.textMuted}>
          {subtitle}
        </Txt>
      </View>
      <IconButton icon={BellRing} label="Notifications" badge={unread} onPress={() => router.push('/notifications')} />
      <IconButton icon={Flame} label="Streak" onPress={() => router.push('/streak')} />
    </View>
  );
}

export function SectionHeader({ title, action, overline, style }: { title: string; action?: ReactNode; overline?: boolean; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 }, style]}>
      <Txt v={overline ? 'overline' : 'h3'} color={overline ? colors.textMuted : colors.text}>
        {title}
      </Txt>
      {asNode(action)}
    </View>
  );
}

/* ------------------------------------------------------------- selection -- */

/** Pill chip: outlined lime when active (Warm Up), dark fill when not. */
export function Chip({ label, icon, active, onPress, style }: { label: string; icon?: LucideIcon | ReactNode; active?: boolean; onPress?: () => void; style?: StyleProp<ViewStyle> }) {
  const IconC = icon as LucideIcon;
  return (
    <Press onPress={onPress} scaleTo={0.93} style={[{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, height: 50, borderRadius: radius.pill, borderWidth: 2, borderColor: active ? colors.primary : 'transparent', backgroundColor: active ? 'rgba(198,242,27,0.06)' : colors.card }, style]}>
      {typeof icon === 'function' || (icon && typeof icon === 'object' && !('props' in (icon as object))) ? <IconC size={20} color={active ? colors.primary : colors.text} strokeWidth={1.8} /> : (icon as ReactNode)}
      <Txt color={active ? colors.primary : colors.text}>{label}</Txt>
    </Press>
  );
}

/** Two/three-way segmented control with a sliding lime-outlined thumb. */
export function Segmented<T extends string>({ options, value, onChange }: { options: { id: T; label: string; icon?: LucideIcon }[]; value: T; onChange: (v: T) => void }) {
  const [w, setW] = useState(0);
  const idx = Math.max(0, options.findIndex((o) => o.id === value));
  const x = useSharedValue(0);
  useEffect(() => {
    const t = svTo(x, idx, { duration: 0.45, ease: ease.pop });
    return () => {
      t.kill();
    };
  }, [idx, x]);
  const seg = w / options.length;
  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: x.value * seg }] }));
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ flexDirection: 'row', backgroundColor: colors.secondary, borderRadius: radius.pill, padding: 4 }}>
      {w > 0 && <Animated.View style={[{ position: 'absolute', top: 4, bottom: 4, left: 4, width: seg - 8 + 4 / options.length, borderRadius: radius.pill, borderWidth: 2, borderColor: colors.primary, backgroundColor: 'rgba(198,242,27,0.06)' }, thumb]} />}
      {options.map((o) => (
        <Pressable key={o.id} onPress={() => (haptic(), onChange(o.id))} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 6 }}>
          {!!o.icon && (
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}>
              <o.icon size={18} color={o.id === value ? colors.primary : colors.text} strokeWidth={1.8} />
            </View>
          )}
          <Txt color={o.id === value ? colors.primary : colors.text} style={{ flex: o.icon ? undefined : 1, textAlign: o.icon ? 'left' : 'center', paddingVertical: o.icon ? 0 : 8 }}>
            {o.label}
          </Txt>
        </Pressable>
      ))}
    </View>
  );
}

export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode }) {
  return (
    <Pressable onPress={() => (haptic(), onChange(!checked))} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: checked ? colors.primary : colors.textMuted, backgroundColor: checked ? colors.primary : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
        {!!checked && <Check size={14} color={colors.onPrimary} strokeWidth={3} />}
      </View>
      {asNode(label)}
    </Pressable>
  );
}

export function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const x = useSharedValue(value ? 1 : 0);
  useEffect(() => {
    x.value = withTiming(value ? 1 : 0, { duration: 200, easing: Easing.out(Easing.cubic) });
  }, [value, x]);
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: x.value * 22 }] }));
  const track = useAnimatedStyle(() => ({ backgroundColor: x.value > 0.5 ? colors.primary : colors.muted }));
  return (
    <Pressable onPress={() => (haptic(), onChange(!value))} accessibilityRole="switch" accessibilityState={{ checked: value }}>
      <Animated.View style={[{ width: 52, height: 30, borderRadius: 15, padding: 3 }, track]}>
        <Animated.View style={[{ width: 24, height: 24, borderRadius: 12, backgroundColor: value ? colors.onPrimary : colors.text }, knob]} />
      </Animated.View>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ input -- */

export function Field({ secure, style, ...p }: TextInputProps & { secure?: boolean }) {
  const [hidden, setHidden] = useState(!!secure);
  const [focus, setFocus] = useState(false);
  return (
    <View style={[{ height: 58, borderRadius: radius.pill, backgroundColor: colors.card, borderWidth: 1.5, borderColor: focus ? colors.primary : 'transparent', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24 }, style as StyleProp<ViewStyle>]}>
      <TextInput
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.primary}
        secureTextEntry={hidden}
        onFocus={(e) => (setFocus(true), p.onFocus?.(e))}
        onBlur={(e) => (setFocus(false), p.onBlur?.(e))}
        {...p}
        style={[type.bodyLg, { flex: 1, color: colors.text }, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : null]}
      />
      {!!secure && (
        <Pressable onPress={() => setHidden(!hidden)} hitSlop={10} accessibilityLabel={hidden ? 'Show password' : 'Hide password'}>
          {hidden ? <Eye size={20} color={colors.textMuted} /> : <EyeOff size={20} color={colors.textMuted} />}
        </Pressable>
      )}
    </View>
  );
}

/* ------------------------------------------------------------------ cards -- */

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  const s = [{ backgroundColor: colors.card, borderRadius: radius.xl, padding: 16 }, style];
  return onPress ? (
    <Press onPress={onPress} scaleTo={0.97} style={s}>
      {children}
    </Press>
  ) : (
    <View style={s}>{children}</View>
  );
}

/** Macro tile (Calories / Proteins / Carbs / Fat). */
export function StatTile({ icon, label, value, unit, sub, width = 140, style, compact }: { icon: ReactNode; label: string; value: string | number; unit?: string; sub?: string; width?: number; style?: StyleProp<ViewStyle>; compact?: boolean }) {
  return (
    <View style={[{ width, backgroundColor: colors.card, borderRadius: radius.lg, padding: 16 }, style]}>
      <View style={{ height: 30, marginBottom: compact ? 12 : 18 }}>{asNode(icon)}</View>
      <Txt v="small" color={colors.textMuted} numberOfLines={1}>
        {label}
      </Txt>
      <Txt numberOfLines={1} adjustsFontSizeToFit style={{ marginTop: 6, fontFamily: font.light, fontSize: compact ? 19 : 26, lineHeight: compact ? 24 : 32 }}>
        {value}
        <Txt v={compact ? 'caption' : 'small'} style={{ fontFamily: font.light }}>
          {unit}
        </Txt>
      </Txt>
      {!!sub && (
        <Txt v="caption" color={colors.textMuted}>
          {sub}
        </Txt>
      )}
    </View>
  );
}

/** Activity row: ringed round icon, title/time, big light number. */
export function ActivityRow({ icon, tone, title, time, value, unit, onPress, light }: { icon: LucideIcon | ReactNode; tone: 'lime' | 'danger' | 'deep'; title: string; time: string; value: string | number; unit: string; onPress?: () => void; light?: boolean }) {
  const IconC = icon as LucideIcon;
  const fill = tone === 'danger' ? colors.danger : tone === 'deep' ? colors.deep : undefined;
  const isComp = typeof icon === 'function' || (icon && typeof icon === 'object' && !('props' in (icon as object)));
  const glyph = isComp ? <IconC size={24} color={tone === 'lime' ? colors.onPrimary : colors.text} strokeWidth={2} /> : (icon as ReactNode);
  return (
    <Card onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 16, borderRadius: radius.xl, backgroundColor: light ? colors.secondary : colors.card }}>
      <View style={{ padding: 4, borderRadius: 40, borderWidth: 2, borderColor: 'rgba(198,242,27,0.4)', borderStyle: 'dashed' }}>
        {fill ? (
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: fill, alignItems: 'center', justifyContent: 'center' }}>{asNode(glyph)}</View>
        ) : (
          <LimeGradient horizontal={false} style={{ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' }}>
            {glyph}
          </LimeGradient>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Txt v="bodyLg">{title}</Txt>
        <Txt v="small" color={colors.textMuted}>
          {time}
        </Txt>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Txt v="stat">{value}</Txt>
        <Txt v="caption" color={colors.textMuted}>
          {unit}
        </Txt>
      </View>
    </Card>
  );
}

/** Image card for workouts (title + duration over a bottom fade). */
export function MediaCard({ image, fallback, title, minutes, onPress, width = 160, height = 184, badge }: { image: Source; fallback?: ImageSourcePropType; title: string; minutes?: number; onPress?: () => void; width?: number | `${number}%`; height?: number; badge?: string }) {
  return (
    <Press onPress={onPress} scaleTo={0.95} style={{ width, height, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.card }}>
      <Img source={image} fallback={fallback} style={StyleSheet.absoluteFill} />
      <FadeBottom />
      {!!badge && (
        <View style={{ position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(5,6,5,0.6)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill }}>
          <Txt v="caption" color={colors.primary}>
            {badge}
          </Txt>
        </View>
      )}
      <View style={{ position: 'absolute', left: 12, right: 12, bottom: 12 }}>
        <Txt v="body" style={{ fontFamily: font.medium }} numberOfLines={1}>
          {title}
        </Txt>
        {minutes != null && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <Timer size={12} color={colors.textMuted} />
            <Txt v="caption" color={colors.textMuted}>
              {minutes} min
            </Txt>
          </View>
        )}
      </View>
    </Press>
  );
}

export function InfoPill({ icon, label, style }: { icon?: LucideIcon; label: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.card, borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 12 }, style]}>
      {!!icon && <Icon as={icon} size={18} />}
      <Txt v="body">{label}</Txt>
    </View>
  );
}

/* --------------------------------------------------------------- progress -- */

const ACircle = Animated.createAnimatedComponent(Circle);

/** Animated ring. GSAP tweens progress 0 → value on mount/change. */
export function Ring({ value, size = 120, stroke = 10, color = colors.primary, track = colors.muted, children, delay = 0, duration = 1.4, linear }: { value: number; size?: number; stroke?: number; color?: string; track?: string; children?: ReactNode; delay?: number; duration?: number; linear?: boolean }) {
  const p = useSharedValue(0);
  useEffect(() => {
    const t = svTo(p, Math.min(1, Math.max(0, value)), { duration, delay, ease: linear ? 'none' : ease.expo });
    return () => {
      t.kill();
    };
  }, [value, delay, duration, linear, p]);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const props = useAnimatedProps(() => ({ strokeDashoffset: c * (1 - p.value) }));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <ACircle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={`${c} ${c}`} animatedProps={props} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </Svg>
      {children}
    </View>
  );
}

export function Bar({ value, color = colors.primary, height = 8, delay = 0 }: { value: number; color?: string; height?: number; delay?: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    const t = svTo(p, Math.min(1, value), { duration: 1, delay, ease: ease.out });
    return () => {
      t.kill();
    };
  }, [value, delay, p]);
  const a = useAnimatedStyle(() => ({ width: `${p.value * 100}%` }));
  return (
    <View style={{ height, borderRadius: height, backgroundColor: colors.muted, overflow: 'hidden' }}>
      <Animated.View style={[{ height, borderRadius: height, backgroundColor: color }, a]} />
    </View>
  );
}

/* ------------------------------------------------------------ bottom sheet -- */

/** Spring bottom sheet (modern modal pattern) with a dimmed, blurred scrim. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const y = useSharedValue(600);
  const [mounted, setMounted] = useState(open);
  useEffect(() => {
    if (open) {
      setMounted(true);
      y.value = 600;
      y.value = withTiming(0, { duration: 280, easing: Easing.out(Easing.cubic) });
    } else if (mounted) {
      const t = svTo(y, 600, { duration: 0.3, ease: 'power2.in', onComplete: () => setMounted(false) });
      return () => {
        t.kill();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const panel = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const scrim = useAnimatedStyle(() => ({ opacity: 1 - y.value / 600 }));
  if (!mounted) return null;
  return (
    <Modal transparent visible onRequestClose={onClose} statusBarTranslucent animationType="none">
      <Animated.View style={[StyleSheet.absoluteFill, scrim]}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)' }]} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.card, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 20, paddingTop: 10, paddingBottom: insets.bottom + 20, borderTopWidth: 1, borderColor: colors.border }, panel]}>
        <View style={{ alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.muted, marginBottom: 16 }} />
        {!!title && (
          <Txt v="h3" style={{ marginBottom: 16 }}>
            {title}
          </Txt>
        )}
        {children}
      </Animated.View>
    </Modal>
  );
}

export function Divider({ label }: { label?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 40 }}>
      <LinearGradient colors={['transparent', colors.muted]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, height: 1 }} />
      {!!label && <Txt color={colors.textMuted}>{label}</Txt>}
      <LinearGradient colors={[colors.muted, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, height: 1 }} />
    </View>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: LucideIcon; title: string; body: string; action?: ReactNode }) {
  return (
    <View style={{ alignItems: 'center', padding: 32, gap: 10 }}>
      <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
        <Icon as={icon} size={30} color={colors.primary} />
      </View>
      <Txt v="h3">{title}</Txt>
      <Txt color={colors.textMuted} style={{ textAlign: 'center' }}>
        {body}
      </Txt>
      {asNode(action)}
    </View>
  );
}

export const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  px: { paddingHorizontal: 20 },
});

/* ------------------------------------------------------- data states -- */

/** Shimmering placeholder block used while server data loads. */
export function Skeleton({ height = 80, width = '100%', radius: r = radius.lg, style }: { height?: number; width?: number | `${number}%`; radius?: number; style?: StyleProp<ViewStyle> }) {
  const o = useSharedValue(0.45);
  useEffect(() => {
    o.value = withRepeat(withSequence(withTiming(0.9, { duration: 700 }), withTiming(0.45, { duration: 700 })), -1);
  }, [o]);
  const a = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View accessibilityLabel="Loading" style={[{ height, width, borderRadius: r, backgroundColor: colors.card }, a, style]} />;
}

/** Error card with retry — every screen shows this instead of silently failing. */
export function ErrorState({ error, onRetry, style }: { error: unknown; onRetry?: () => void; style?: StyleProp<ViewStyle> }) {
  const msg = error instanceof Error ? error.message : 'Something went wrong';
  return (
    <View style={[{ margin: 20, padding: 20, borderRadius: radius.xl, backgroundColor: colors.card, borderWidth: 1, borderColor: 'rgba(233,67,45,0.35)', gap: 12 }, style]}>
      <Txt v="bodyLg">Couldn’t load this</Txt>
      <Txt v="small" color={colors.textMuted}>
        {msg}
      </Txt>
      {!!onRetry && <PillButton title="TRY AGAIN" onPress={onRetry} style={{ alignSelf: 'flex-start' }} />}
    </View>
  );
}

/* ------------------------------------------------------------- toast -- */

type ToastT = { id: number; text: string; tone: 'ok' | 'error' };
let pushToast: (t: ToastT) => void = () => {};
let toastId = 0;
export const toast = {
  ok: (text: string) => pushToast({ id: ++toastId, text, tone: 'ok' }),
  error: (e: unknown) => pushToast({ id: ++toastId, text: e instanceof Error ? e.message : String(e), tone: 'error' }),
};

/** Mounted once in the root layout. */
export function Toaster() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<ToastT[]>([]);
  useEffect(() => {
    pushToast = (t) => {
      setItems((l) => [...l.slice(-2), t]);
      if (t.tone === 'ok') haptic('success');
      setTimeout(() => setItems((l) => l.filter((x) => x.id !== t.id)), t.tone === 'error' ? 4500 : 2600);
    };
    return () => {
      pushToast = () => {};
    };
  }, []);
  if (!items.length) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: insets.top + 8, left: 16, right: 16, gap: 8, zIndex: 1000 }}>
      {items.map((t) => (
        <View key={t.id} accessibilityRole="alert" style={[{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: radius.lg, backgroundColor: t.tone === 'ok' ? colors.primary : colors.danger }, shadow.card]}>
          <Txt v="body" color={t.tone === 'ok' ? colors.onPrimary : '#fff'} style={{ flex: 1, fontFamily: font.medium }}>
            {t.text}
          </Txt>
        </View>
      ))}
    </View>
  );
}
