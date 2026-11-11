import { Award, Lock } from 'lucide-react-native';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { achievements } from '@/data';
import { Reveal, useStagger } from '@/motion';
import { colors, font } from '@/theme';
import { Bar, Card, HeroGlow, TopBar, Txt } from '@/ui';

export default function Achievements() {
  const r = useStagger(achievements.length + 1, { stagger: 0.07, ease: 'back.out(1.6)' });
  const earned = achievements.filter((a) => a.earned).length;
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <HeroGlow />
      <TopBar title="Achievements" />
      <Animated.ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <Reveal p={r[0]!}>
          <Card style={{ padding: 20, gap: 12 }}>
            <Txt v="small" color={colors.textMuted}>Level 7 · Pulse Runner</Txt>
            <Txt style={{ fontFamily: font.light, fontSize: 34 }}>{earned} <Txt color={colors.textMuted}>/ {achievements.length} badges</Txt></Txt>
            <Bar value={0.68} />
            <Txt v="caption" color={colors.textMuted}>760 XP to Level 8</Txt>
          </Card>
        </Reveal>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 }}>
          {achievements.map((a, k) => (
            <Reveal key={a.id} p={r[k + 1]!} scale={0.7} style={{ width: '47.5%' }}>
              <Card style={{ alignItems: 'center', gap: 10, paddingVertical: 22, opacity: a.earned ? 1 : 0.5 }}>
                <View style={{ width: 82, height: 82, borderRadius: 41, borderWidth: 3, borderColor: a.tone, alignItems: 'center', justifyContent: 'center', backgroundColor: a.tone + '18' }}>
                  {a.earned ? <Award size={38} color={a.tone} /> : <Lock size={30} color={colors.textMuted} />}
                </View>
                <Txt style={{ textAlign: 'center' }}>{a.title}</Txt>
                <Txt v="caption" color={colors.textMuted} style={{ textAlign: 'center' }}>{a.body}</Txt>
              </Card>
            </Reveal>
          ))}
        </View>
      </Animated.ScrollView>
    </View>
  );
}
