import { Flame, Snowflake } from 'lucide-react-native';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { FlameIcon } from '@/icons';
import { Reveal, useCountUp, useStagger } from '@/motion';
import { colors, font, radius } from '@/theme';
import { Card, HeroGlow, PrimaryButton, TopBar, Txt } from '@/ui';
import { router } from 'expo-router';

const month = Array.from({ length: 30 }, (_, i) => (i < 26 ? (i % 9 === 4 ? 'freeze' : i % 7 === 6 ? 'miss' : 'hit') : 'future'));

export default function Streak() {
  const days = useCountUp(4, { duration: 1.5 });
  const best = useCountUp(21, { delay: 0.3 });
  const r = useStagger(4, { stagger: 0.1 });
  const flicker = useSharedValue(1);
  useEffect(() => {
    flicker.value = withRepeat(withSequence(withTiming(1.08, { duration: 500 }), withTiming(0.96, { duration: 400 }), withTiming(1, { duration: 300 })), -1);
  }, [flicker]);
  const flameA = useAnimatedStyle(() => ({ transform: [{ scale: flicker.value }, { rotate: `${(flicker.value - 1) * 30}deg` }] }));
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <HeroGlow />
      <TopBar title="Streak" />
      <View style={{ paddingHorizontal: 20 }}>
        <Reveal p={r[0]!} scale={0.6} style={{ alignItems: 'center', marginTop: 24 }}>
          <Animated.View style={flameA}>
            <FlameIcon size={130} />
          </Animated.View>
          <Txt style={{ fontFamily: font.light, fontSize: 72, lineHeight: 80, marginTop: 8 }}>{days}</Txt>
          <Txt v="h3">day streak</Txt>
          <Txt color={colors.textMuted} style={{ marginTop: 6 }}>
            Best: {best} days · 2 freezes left
          </Txt>
        </Reveal>
        <Reveal p={r[1]!} style={{ marginTop: 28 }}>
          <Card style={{ padding: 18 }}>
            <Txt v="h3" style={{ marginBottom: 14 }}>
              November
            </Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {month.map((s, i) => (
                <View key={i} style={{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: s === 'hit' ? colors.primary : s === 'freeze' ? 'rgba(22,179,235,0.2)' : colors.secondary, opacity: s === 'future' ? 0.4 : 1 }}>
                  {s === 'freeze' ? <Snowflake size={16} color={colors.protein} /> : s === 'hit' ? <Flame size={16} color={colors.onPrimary} /> : <Txt v="caption" color={colors.textMuted}>{i + 1}</Txt>}
                </View>
              ))}
            </View>
          </Card>
        </Reveal>
        <Reveal p={r[2]!} style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
          {[{ l: 'This week', v: '5/7' }, { l: 'Freezes', v: '2' }, { l: 'XP earned', v: '1,240' }].map((x) => (
            <Card key={x.l} style={{ flex: 1, borderRadius: radius.lg }}>
              <Txt v="caption" color={colors.textMuted}>{x.l}</Txt>
              <Txt style={{ fontFamily: font.light, fontSize: 22, marginTop: 4 }}>{x.v}</Txt>
            </Card>
          ))}
        </Reveal>
        <Reveal p={r[3]!} style={{ marginTop: 24 }}>
          <PrimaryButton title="Keep it alive — quick workout" onPress={() => router.push('/session/partner-power')} />
        </Reveal>
      </View>
    </View>
  );
}
