import { router } from 'expo-router';
import { View, useWindowDimensions } from 'react-native';
import Animated from 'react-native-reanimated';
import { useExercises, useRecipes } from '@/api/hooks';
import { ArtEmpty } from '@/badges';
import { mealArt, workoutArt } from '@/data';
import { Reveal, useStagger } from '@/motion';
import { colors } from '@/theme';
import { HeroGlow, MediaCard, PrimaryButton, SectionHeader, Skeleton, TopBar } from '@/ui';

export default function Saved() {
  const recipes = useRecipes({ saved: true });
  const fav = useExercises({ favourites: true });
  const { width } = useWindowDimensions();
  const ex = fav.data?.pages.flatMap((p) => p.exercises) ?? [];
  const m = recipes.data ?? [];
  const r = useStagger(ex.length + m.length + 1, {}, [ex.length, m.length]);
  const cw = (width - 52) / 2;
  const loading = recipes.isLoading || fav.isLoading;
  const groups = [
    { title: 'Favourite exercises', items: ex.map((x) => ({ id: x.id, image: x.image, fallback: workoutArt(x.category, x.id), title: x.name, minutes: undefined as number | undefined, to: `/exercise/${x.id}` })) },
    { title: 'Saved recipes', items: m.map((x) => ({ id: x.id, image: x.imageUrl, fallback: mealArt[x.category]!, title: x.title, minutes: x.minutes, to: `/meal/${x.id}` })) },
  ].filter((g) => g.items.length);
  let k = 0;
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <HeroGlow />
      <TopBar title="Saved" right={<View style={{ width: 48 }} />} />
      <Animated.ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {loading && <Skeleton height={200} style={{ margin: 20, width: undefined }} />}
        {!loading && groups.length === 0 && <ArtEmpty art="empty-meals" title="Nothing saved yet" body="Save recipes with the bookmark and favourite exercises with the heart to keep them here." action={<PrimaryButton title="Find recipes" onPress={() => router.push('/search')} style={{ alignSelf: 'stretch', marginTop: 12 }} />} />}
        {groups.map((g) => (
          <View key={g.title} style={{ marginTop: 16 }}>
            <SectionHeader title={g.title} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20, marginTop: 12 }}>
              {g.items.map((it) => (
                <Reveal key={it.id} p={r[++k] ?? r[0]!} scale={0.9}>
                  <MediaCard image={it.image} fallback={it.fallback} title={it.title} minutes={it.minutes} width={cw} onPress={() => router.push(it.to as never)} />
                </Reveal>
              ))}
            </View>
          </View>
        ))}
      </Animated.ScrollView>
    </View>
  );
}
