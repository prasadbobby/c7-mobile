import { useLocalSearchParams } from 'expo-router';
import { Gauge, Info, Timer } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Parallax, Reveal, useScrollY, useStagger } from '@/motion';
import { referenceWorkouts } from '@/reference';
import { colors } from '@/theme';
import { BackButton, Card, FadeBottom, Img, InfoPill, Txt, HeroGlow } from '@/ui';

const HERO = 420;

/** Read-only reference routine (Home chips). Actual workouts come from the coach. */
export default function Reference() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const w = referenceWorkouts.find((x) => x.id === id) ?? referenceWorkouts[0]!;
  const insets = useSafeAreaInsets();
  const { y, onScroll } = useScrollY();
  const r = useStagger(3, { delay: 0.1 });
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}><HeroGlow />
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <View style={{ height: HERO, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, overflow: 'hidden' }}>
          <Parallax y={y} height={HERO} style={StyleSheet.absoluteFill}>
            <Img source={w.image} style={StyleSheet.absoluteFill} />
          </Parallax>
          <FadeBottom />
          <View style={{ position: 'absolute', left: 20, right: 20, bottom: 22 }}>
            <Txt v="overline" color={colors.primary}>
              Reference · {w.subtitle}
            </Txt>
            <Txt v="h1" style={{ marginTop: 6 }}>
              {w.title}
            </Txt>
          </View>
        </View>
        <View style={{ position: 'absolute', top: insets.top + 8, left: 20 }}>
          <BackButton />
        </View>
        <View style={{ paddingHorizontal: 20, paddingTop: 20, gap: 16 }}>
          <Reveal p={r[0]!} style={{ flexDirection: 'row', gap: 10 }}>
            <InfoPill icon={Timer} label={`${w.minutes} min`} />
            <InfoPill icon={Gauge} label={w.level} />
          </Reveal>
          <Reveal p={r[1]!}>
            <Txt color={colors.textMuted} style={{ lineHeight: 26 }}>
              {w.description}
            </Txt>
          </Reveal>
          <Reveal p={r[2]!} style={{ gap: 10 }}>
            <Txt v="h3">How it flows</Txt>
            {w.steps.map((s, k) => (
              <Card key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: s.name === 'Rest' ? colors.secondary : 'rgba(198,242,27,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                  <Txt v="small" color={s.name === 'Rest' ? colors.textMuted : colors.primary}>
                    {k + 1}
                  </Txt>
                </View>
                <Txt style={{ flex: 1 }}>{s.name}</Txt>
                <Txt v="small" color={colors.textMuted}>
                  {s.reps ?? `${s.seconds}s`}
                </Txt>
              </Card>
            ))}
            <Card style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 6 }}>
              <Info size={18} color={colors.textMuted} />
              <Txt v="small" color={colors.textMuted} style={{ flex: 1 }}>
                This is a reference routine. Your workouts to log are the ones your coach assigns — they appear on Home and in the Workout tab.
              </Txt>
            </Card>
          </Reveal>
        </View>
      </Animated.ScrollView>
    </View>
  );
}
