import { router } from 'expo-router';
import { Bookmark } from 'lucide-react-native';
import { View, useWindowDimensions } from 'react-native';
import Animated from 'react-native-reanimated';
import { meals, workouts } from '@/data';
import { Reveal, useStagger } from '@/motion';
import { useApp } from '@/store';
import { colors } from '@/theme';
import { EmptyState, HeroGlow, MediaCard, PrimaryButton, SectionHeader, TopBar } from '@/ui';

export default function Saved() {
  const saved = useApp((s) => s.saved);
  const { width } = useWindowDimensions();
  const w = workouts.filter((x) => saved.includes(x.id));
  const m = meals.filter((x) => saved.includes(x.id));
  const r = useStagger(w.length + m.length + 1);
  const cw = (width - 52) / 2;
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <HeroGlow />
      <TopBar title="Saved" />
      <Animated.ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {w.length + m.length === 0 && <EmptyState icon={Bookmark} title="Nothing saved yet" body="Tap the bookmark on any workout or recipe to keep it here." action={<PrimaryButton title="Find recipes" onPress={() => router.push('/search')} style={{ alignSelf: 'stretch', marginTop: 12 }} />} />}
        {[{ title: 'Workouts', items: w.map((x) => ({ id: x.id, image: x.image, title: x.title, minutes: x.minutes, to: `/exercise/${x.id}` })) }, { title: 'Recipes', items: m.map((x) => ({ id: x.id, image: x.image, title: x.title, minutes: x.minutes, to: `/meal/${x.id}` })) }]
          .filter((g) => g.items.length)
          .map((g, gi) => (
            <View key={g.title} style={{ marginTop: 16 }}>
              <SectionHeader title={g.title} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20, marginTop: 12 }}>
                {g.items.map((it, k) => (
                  <Reveal key={it.id} p={r[gi * w.length + k + 1] ?? r[0]!} scale={0.9}>
                    <MediaCard image={it.image} title={it.title} minutes={it.minutes} width={cw} onPress={() => router.push(it.to as never)} />
                  </Reveal>
                ))}
              </View>
            </View>
          ))}
      </Animated.ScrollView>
    </View>
  );
}
