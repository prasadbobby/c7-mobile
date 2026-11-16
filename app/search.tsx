import { router } from 'expo-router';
import { Dumbbell, ListFilter, MessageCircle, Search as SearchIcon, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, TextInput, View, useWindowDimensions } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { useRecipes, type RecipeFilter } from '@/api/hooks';
import { pretty } from '@/api/meta';
import { ArtEmpty } from '@/badges';
import { mealArt, mealCategories, workoutArt } from '@/data';
import { CarbsIcon, FatIcon, FlameIcon, ProteinIcon } from '@/icons';
import { Reveal, ScrollReveal, useScrollY, useStagger } from '@/motion';
import { FollowRow, SaveButton } from '@/social';
import { colors, radius, type } from '@/theme';
import { Chip, ErrorState, HeroGlow, Img, MediaCard, Press, PrimaryButton, SectionHeader, Segmented, Sheet, Skeleton, StatTile, TopBar, Txt, useTopInset } from '@/ui';

const sorts = [
  { id: 'popular', label: 'Most liked' },
  { id: 'protein', label: 'Highest protein' },
  { id: 'kcal', label: 'Lowest calories' },
  { id: 'quick', label: 'Quickest' },
  { id: 'recent', label: 'Newest' },
] as const;

function useDebounced<T>(v: T, ms = 300) {
  const [d, setD] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setD(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return d;
}

export default function Search() {
  const { y, onScroll } = useScrollY();
  const { width } = useWindowDimensions();
  const top = useTopInset(70);
  const [q, setQ] = useState('');
  const dq = useDebounced(q.trim());
  const [cat, setCat] = useState<string | undefined>();
  const [sort, setSort] = useState<NonNullable<RecipeFilter['sort']>>('popular');
  const [filter, setFilter] = useState(false);
  const recipes = useRecipes({ search: dq || undefined, category: dq ? undefined : cat, sort });
  const r = useStagger(3);
  const results = recipes.data ?? [];
  const cw = (width - 52) / 2;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <HeroGlow />
      <TopBar title="Search recipes" y={y} right={<View style={{ width: 48 }} />} />
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: top, paddingBottom: 60 }}>
        <Reveal p={r[0]!} style={{ marginHorizontal: 20, marginTop: 14, gap: 14 }}>
          <View style={{ height: 60, borderRadius: radius.pill, borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 12 }}>
            <SearchIcon size={24} color={colors.text} />
            <TextInput value={q} onChangeText={setQ} placeholder="Search recipes or ingredients" accessibilityLabel="Search" placeholderTextColor={colors.textMuted} selectionColor={colors.primary} style={[type.bodyLg, { flex: 1, color: colors.text }]} returnKeyType="search" />
            {!!q && (
              <Pressable onPress={() => setQ('')} hitSlop={10} accessibilityLabel="Clear search">
                <X size={20} color={colors.textMuted} />
              </Pressable>
            )}
          </View>
        </Reveal>

        <>
            <Reveal p={r[1]!}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingHorizontal: 20, marginTop: 22 }}>
                {mealCategories.map((c) => {
                  const on = !dq && c.id === cat;
                  return (
                    <Press key={c.id} accessibilityLabel={c.label} onPress={() => (setQ(''), setCat(on ? undefined : c.id))} scaleTo={0.9} style={{ alignItems: 'center', gap: 10 }}>
                      <View style={{ padding: 4, borderRadius: 64, borderWidth: 2, borderColor: on ? colors.primary : 'transparent' }}>
                        <Img source={c.image} style={{ width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: 'rgba(255,255,255,0.85)' }} />
                      </View>
                      <Txt color={on ? colors.primary : colors.text}>{c.label}</Txt>
                    </Press>
                  );
                })}
              </ScrollView>
            </Reveal>

            <Reveal p={r[2]!} style={{ marginTop: 28 }}>
              <SectionHeader
                overline
                title={dq ? `Results for “${dq}”` : cat ? pretty(cat) : 'All recipes'}
                action={
                  <Pressable onPress={() => setFilter(true)} hitSlop={10} accessibilityLabel="Sort results">
                    <ListFilter size={22} color={colors.text} />
                  </Pressable>
                }
              />
            </Reveal>

            {recipes.error && <ErrorState error={recipes.error} onRetry={() => recipes.refetch()} />}
            {recipes.isLoading && <Skeleton height={220} style={{ margin: 20, width: undefined }} />}
            {recipes.data && results.length === 0 && <ArtEmpty art="empty-meals" title="No meals found" body="Try a different ingredient or browse a category above." />}
            {results.map((m) => (
              <ScrollReveal key={m.id} y={y} style={{ marginHorizontal: 20, marginTop: 20, paddingBottom: 20, borderBottomWidth: 1, borderColor: colors.border }}>
                <Animated.View layout={LinearTransition.duration(220)}>
                  <Press onPress={() => router.push(`/meal/${m.id}`)} scaleTo={0.98} style={{ flexDirection: 'row', gap: 16 }} accessibilityLabel={m.title}>
                    <View style={{ width: 140, height: 170, borderRadius: radius.lg, overflow: 'hidden' }}>
                      <Img source={m.imageUrl} fallback={mealArt[m.category]} style={{ width: '100%', height: '100%' }} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <Txt v="h3" style={{ flex: 1 }} numberOfLines={2}>
                          {m.title}
                        </Txt>
                        <SaveButton recipe={m} />
                      </View>
                      <Txt v="small" color={colors.textMuted} numberOfLines={3} style={{ marginTop: 6 }}>
                        {m.description}
                      </Txt>
                      <View style={{ flex: 1 }} />
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Txt v="caption" color={colors.primary}>
                          {m.minutes} MIN · {pretty(m.category).toUpperCase()}
                        </Txt>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.card, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6 }}>
                          <MessageCircle size={16} color={colors.textMuted} />
                          <Txt v="caption">{m.comments}</Txt>
                        </View>
                      </View>
                    </View>
                  </Press>
                  <View style={{ marginTop: 14 }}>
                    <FollowRow author={m.author} compact />
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
                    <StatTile compact width={0} style={{ flex: 1, padding: 12 }} icon={<FlameIcon size={24} />} label="Calories" value={m.kcal} unit="Kcal" />
                    <StatTile compact width={0} style={{ flex: 1, padding: 12 }} icon={<ProteinIcon size={24} />} label="Protein" value={m.protein} unit="g" />
                    <StatTile compact width={0} style={{ flex: 1, padding: 12 }} icon={<CarbsIcon size={24} />} label="Carbs" value={m.carbs} unit="g" />
                    <StatTile compact width={0} style={{ flex: 1, padding: 12 }} icon={<FatIcon size={24} />} label="Fat" value={m.fat} unit="g" />
                  </View>
                </Animated.View>
              </ScrollReveal>
            ))}
        </>
      </Animated.ScrollView>

      <Sheet open={filter} onClose={() => setFilter(false)} title="Sort recipes">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {sorts.map((s) => (
            <Chip key={s.id} label={s.label} active={sort === s.id} onPress={() => setSort(s.id)} />
          ))}
        </View>
        <PrimaryButton title={`Show ${results.length} meals`} style={{ marginTop: 24 }} onPress={() => setFilter(false)} />
      </Sheet>
    </View>
  );
}
