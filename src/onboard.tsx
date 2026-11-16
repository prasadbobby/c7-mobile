/** First-login kit — ported from the Lovable "first-login" screens (StepHeader, NextBar, WheelPicker, rulers, OptionCard, glyphs). */
import { router } from 'expo-router';
import { ArrowLeft, ArrowRight, X } from 'lucide-react-native';
import { useEffect, useRef, type ReactNode } from 'react';
import { ScrollView, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';
import { colors, font, shadow } from './theme';
import { haptic, Press, Txt } from './ui';

/** Condensed caps headline; wrap the highlighted words as *WORD*. */
export function Headline({ text, center, size = 44 }: { text: string; center?: boolean; size?: number }) {
  return (
    <Txt accessibilityRole="header" style={{ fontFamily: font.black, fontSize: size, lineHeight: size * 0.98, letterSpacing: -1, textTransform: 'uppercase', textAlign: center ? 'center' : 'left' }}>
      {text.split(/(\*[^*]+\*)/).map((p, i) =>
        p.startsWith('*') ? (
          <Txt key={i} color={colors.primary} style={{ fontFamily: font.black, fontSize: size, lineHeight: size * 0.98 }}>
            {p.slice(1, -1)}
          </Txt>
        ) : (
          p
        ),
      )}
    </Txt>
  );
}

function Segment({ on }: { on: boolean }) {
  const a = useAnimatedStyle(() => ({ backgroundColor: withTiming(on ? colors.primary : colors.secondary, { duration: 450 }) }));
  return <Animated.View style={[{ flex: 1, height: 5, borderRadius: 3 }, a]} />;
}

export function StepHeader({ step, total = 6, onClose }: { step?: number; total?: number; onClose?: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top + 14, paddingHorizontal: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ width: 40 }} />
        <Txt style={{ fontFamily: font.semibold, fontSize: 13, letterSpacing: 2.4 }} color={colors.textMuted}>
          {step ? (
            <>
              STEP <Txt style={{ fontFamily: font.semibold, fontSize: 13 }}>{step}</Txt> OF {total}
            </>
          ) : (
            'C7 PERSONAL FITNESS'
          )}
        </Txt>
        {onClose ? (
          <Press accessibilityLabel="Close" onPress={onClose} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} color={colors.text} />
          </Press>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>
      {!!step && (
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 16 }} accessibilityLabel={`Step ${step} of ${total}`}>
          {Array.from({ length: total }, (_, i) => (
            <Segment key={i} on={i < step} />
          ))}
        </View>
      )}
    </View>
  );
}

export function NextBar({ label = 'Next step', onNext, onBack, disabled, loading }: { label?: string; onNext: () => void; onBack?: () => void; disabled?: boolean; loading?: boolean }) {
  const insets = useSafeAreaInsets();
  const off = disabled || loading;
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 24, paddingBottom: insets.bottom + 20, backgroundColor: 'rgba(5,6,5,0.92)' }}>
      {!!onBack && (
        <Press accessibilityLabel="Go back" onPress={onBack} scaleTo={0.9} style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={20} color={colors.text} />
        </Press>
      )}
      <Press accessibilityRole="button" accessibilityLabel={label} disabled={off} onPress={onNext} hapticKind="medium" scaleTo={0.98} style={[{ flex: 1, height: 58, borderRadius: 29, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: off ? 0.45 : 1 }, off ? null : shadow.glow]}>
        <Txt style={{ fontFamily: font.bold, fontSize: 17, letterSpacing: 1.2, textTransform: 'uppercase' }} color={colors.onPrimary}>
          {loading ? 'Saving…' : label}
        </Txt>
        {!loading && <ArrowRight size={20} color={colors.onPrimary} strokeWidth={2.6} />}
      </Press>
    </View>
  );
}

const snapIndex = (e: NativeSyntheticEvent<NativeScrollEvent>, size: number, horizontal: boolean) => Math.round((horizontal ? e.nativeEvent.contentOffset.x : e.nativeEvent.contentOffset.y) / size);

/** Vertical snapping wheel (age). */
export function WheelPicker({ values, value, onChange, itemH = 64, label }: { values: number[]; value: number; onChange: (v: number) => void; itemH?: number; label: string }) {
  const ref = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const idx = Math.max(0, values.indexOf(value));
  useEffect(() => {
    const t = setTimeout(() => ref.current?.scrollTo({ y: idx * itemH, animated: false }), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const pick = (i: number) => {
    const v = values[Math.min(values.length - 1, Math.max(0, i))];
    if (v !== undefined && v !== value) {
      haptic();
      onChange(v);
    }
  };
  return (
    <View style={{ height: itemH * 5, width: 200, alignSelf: 'center' }} accessibilityRole="adjustable" accessibilityLabel={label} accessibilityValue={{ text: String(value) }}>
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: itemH * 2, height: itemH, borderTopWidth: 2, borderBottomWidth: 2, borderColor: 'rgba(198,242,27,0.7)' }} />
      <ScrollView ref={ref} showsVerticalScrollIndicator={false} snapToInterval={itemH} decelerationRate="fast" contentContainerStyle={{ paddingVertical: itemH * 2 }} scrollEventThrottle={16} onScroll={(e) => pick(snapIndex(e, itemH, false))}>
        {values.map((v, i) => {
          const d = Math.abs(i - idx);
          return (
            <Press key={`${v}-${i}`} hapticKind="none" accessibilityLabel={String(v)} onPress={() => ref.current?.scrollTo({ y: i * itemH, animated: true })} style={{ height: itemH, alignItems: 'center', justifyContent: 'center' }}>
              <Txt style={{ fontFamily: font.bold, fontSize: d === 0 ? 56 : d === 1 ? 36 : 28, lineHeight: itemH }} color={d === 0 ? colors.text : colors.textMuted}>
                <Txt style={{ opacity: d === 0 ? 1 : d === 1 ? 0.45 : 0.18, fontFamily: font.bold, fontSize: d === 0 ? 56 : d === 1 ? 36 : 28 }} color={d === 0 ? colors.text : colors.textMuted}>
                  {v}
                </Txt>
              </Txt>
            </Press>
          );
        })}
      </ScrollView>
    </View>
  );
}

/** Horizontal ruler (weight): one tick per unit, labels every 10. */
export function RulerHorizontal({ min, max, value, onChange, tick = 12, width, label }: { min: number; max: number; value: number; onChange: (v: number) => void; tick?: number; width: number; label: string }) {
  const ref = useRef<React.ComponentRef<typeof ScrollView>>(null);
  useEffect(() => {
    const t = setTimeout(() => ref.current?.scrollTo({ x: (value - min) * tick, animated: false }), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [min]);
  const count = max - min + 1;
  return (
    <View accessibilityRole="adjustable" accessibilityLabel={label} accessibilityValue={{ text: String(value) }}>
      <View pointerEvents="none" style={[{ position: 'absolute', left: width / 2 - 2, top: 0, width: 4, height: 84, borderRadius: 2, backgroundColor: colors.primary, zIndex: 2 }, shadow.glow]} />
      <ScrollView
        ref={ref}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={tick}
        decelerationRate="fast"
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingHorizontal: width / 2 }}
        onScroll={(e) => {
          const v = min + snapIndex(e, tick, true);
          if (v !== value && v >= min && v <= max) {
            haptic();
            onChange(v);
          }
        }}
      >
        <Svg width={count * tick} height={112}>
          {Array.from({ length: count }, (_, i) => {
            const v = min + i;
            const major = v % 10 === 0;
            const mid = v % 5 === 0;
            return <Rect key={v} x={i * tick - 1} y={8} width={2} height={major ? 56 : mid ? 40 : 24} rx={1} fill={major ? colors.text : colors.textMuted} fillOpacity={major || mid ? 1 : 0.5} />;
          })}
        </Svg>
        <View style={{ position: 'absolute', left: width / 2, top: 76, flexDirection: 'row' }}>
          {Array.from({ length: count }, (_, i) => min + i)
            .filter((v) => v % 10 === 0)
            .map((v, keyIdx) => (
              <Txt key={`${v}-${keyIdx}`} style={{ position: 'absolute', left: (v - min) * tick - 20, width: 40, textAlign: 'center', fontFamily: font.semibold, fontSize: 18 }} color={colors.textMuted}>
                {v}
              </Txt>
            ))}
        </View>
      </ScrollView>
    </View>
  );
}

/** Vertical ruler on the right edge (height): top = max. */
export function RulerVertical({ min, max, value, onChange, tick = 10, height = 420, label }: { min: number; max: number; value: number; onChange: (v: number) => void; tick?: number; height?: number; label: string }) {
  const ref = useRef<React.ComponentRef<typeof ScrollView>>(null);
  useEffect(() => {
    const t = setTimeout(() => ref.current?.scrollTo({ y: (max - value) * tick, animated: false }), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const count = max - min + 1;
  return (
    <ScrollView
      ref={ref}
      accessibilityLabel={label}
      style={{ height, width: 120 }}
      showsVerticalScrollIndicator={false}
      snapToInterval={tick}
      decelerationRate="fast"
      scrollEventThrottle={16}
      contentContainerStyle={{ paddingVertical: height / 2 }}
      onScroll={(e) => {
        const v = max - snapIndex(e, tick, false);
        if (v !== value && v >= min && v <= max) {
          haptic();
          onChange(v);
        }
      }}
    >
      {Array.from({ length: count }, (_, i) => {
        const v = max - i;
        const major = v % 10 === 0;
        const mid = v % 5 === 0;
        return (
          <View key={v} style={{ height: tick, justifyContent: 'flex-start' }}>
            <View style={{ position: 'absolute', right: 0, top: -1, height: 2, borderRadius: 1, width: major ? 56 : mid ? 40 : 24, backgroundColor: major ? colors.text : colors.textMuted, opacity: major || mid ? 1 : 0.5 }} />
            {!!major && (
              <Txt style={{ position: 'absolute', right: 64, top: -12, fontFamily: font.semibold, fontSize: 18 }} color={colors.textMuted}>
                {v}
              </Txt>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

export function OptionCard({ selected, onPress, icon, title, sub }: { selected: boolean; onPress: () => void; icon: (c: string) => ReactNode; title: string; sub?: string }) {
  return (
    <Press accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={title} onPress={onPress} scaleTo={0.98} style={{ flexDirection: 'row', alignItems: 'center', gap: 16, borderRadius: 28, borderWidth: 2, borderColor: selected ? colors.primary : 'transparent', backgroundColor: colors.card, padding: 16 }}>
      <View style={{ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? colors.primary : colors.secondary }}>{icon(selected ? colors.onPrimary : colors.primary)}</View>
      <View style={{ flex: 1 }}>
        <Txt style={{ fontFamily: font.bold, fontSize: 19, letterSpacing: 0.5, textTransform: 'uppercase' }}>{title}</Txt>
        {!!sub && (
          <Txt v="small" color={colors.textMuted}>
            {sub}
          </Txt>
        )}
      </View>
      <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: selected ? colors.primary : 'rgba(149,154,148,0.4)', backgroundColor: selected ? colors.primary : 'transparent' }} />
    </Press>
  );
}

const g = (d: string[], c: string) => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    {d.map((p, keyIdx) => (
      <Path key={`${p}-${keyIdx}`} d={p} />
    ))}
  </Svg>
);
export const glyphs = {
  lose: (c: string) => (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={3.5} y={4} width={17} height={16} rx={4} />
      <Path d="M8 9.5a5 5 0 0 1 8 0" />
      <Path d="M12 9.5 13.5 8" />
      <Path d="M9 15.5h6" />
    </Svg>
  ),
  tone: (c: string) => g(['M12 3c-2 2.5-2 5 0 7.5 2-2.5 2-5 0-7.5z', 'M5 11c1.5 3.5 4 5.5 7 5.5s5.5-2 7-5.5', 'M8 21l4-4.5 4 4.5'], c),
  muscle: (c: string) => g(['M4 18c0-6 2.5-11 6-13l2 2.5-2 2.5c1.5 1.5 3 2 5 1.5 2.5-.5 5 1.5 5 4.5 0 2.5-2 4-4.5 4H6a2 2 0 0 1-2-2z', 'M13 14.5c1-1 2.5-1 3.5 0'], c),
  endurance: (c: string) => g(['M2.5 12h4l2-5 3.5 10 2.5-7 1.5 2h5.5'], c),
  level: (level: 1 | 2 | 3) => (c: string) => (
    <Svg width={28} height={28} viewBox="0 0 24 24">
      {[0, 1, 2].map((i, keyIdx) => (
        <Rect key={`${i}-${keyIdx}`} x={4 + i * 6} y={16 - i * 5} width={4} height={4 + i * 5} rx={2} fill={c} fillOpacity={i < level ? 1 : 0.25} />
      ))}
    </Svg>
  ),
};

export const closeToLogin = () => router.replace('/login');
