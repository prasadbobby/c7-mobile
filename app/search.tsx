import { router } from 'expo-router';
import { ListFilter, MessageCircle, Search as SearchIcon, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { mealCategories, meals, people } from '@/data';
import { CarbsIcon, FatIcon, FlameIcon, ingredientIcons, ProteinIcon } from '@/icons';
import { Reveal, ScrollReveal, useScrollY, useStagger } from '@/motion';
import { SaveButton } from '@/social';
import { useApp } from '@/store';
import { colors, radius, type } from '@/theme';
import { Chip, EmptyState, HeroGlow, Img, PillButton, Press, PrimaryButton, SectionHeader, Sheet, StatTile, TopBar, Txt, useTopInset } from '@/ui';

const sorts = [
  { id: 'popular', label: 'Most liked' },
  { id: 'protein', label: 'Highest protein' },
  { id: 'kcal', label: 'Lowest calories' },
  { id: 'quick', label: 'Quickest' },
] as const;

export default function Search() {
  const st = useApp();
  const { y, onScroll } = useScrollY();
  const top = useTopInset(70);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('seafood');
  const [sort, setSort] = useState<(typeof sorts)[number]['id']>('popular');
  const [filter, setFilter] = useState(false);
  const r = useStagger(3);
  const results = meals
    .filter((m) => (q ? m.title.toLowerCase().includes(q.toLowerCase()) || m.description.toLowerCase().includes(q.toLowerCase()) : m.tag === cat))
    .sort((a, b) => (sort === 'popular' ? b.likes - a.likes : sort === 'protein' ? b.protein - a.protein : sort === 'kcal' ? a.kcal - b.kcal : a.minutes - b.minutes));

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <HeroGlow />
      <TopBar title="Search for Meal" y={y} />
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: top, paddingBottom: 60 }}>
        <Reveal p={r[0]!} style={{ marginHorizontal: 20, marginTop: 14 }}>
          <View style={{ height: 60, borderRadius: radius.pill, borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 12 }}>
            <SearchIcon size={24} color={colors.text} />
            <TextInput value={q} onChangeText={setQ} placeholder="Search" placeholderTextColor={colors.textMuted} selectionColor={colors.primary} style={[type.bodyLg, { flex: 1, color: colors.text }]} autoFocus={false} returnKeyType="search" />
            {!!q && (
              <Pressable onPress={() => setQ('')} hitSlop={10} accessibilityLabel="Clear search">
                <X size={20} color={colors.textMuted} />
              </Pressable>
            )}
          </View>
        </Reveal>

        <Reveal p={r[1]!}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingHorizontal: 20, marginTop: 22 }}>
            {mealCategories.map((c) => {
              const on = !q && c.id === cat;
              return (
                <Press key={c.id} onPress={() => (setQ(''), setCat(c.id))} scaleTo={0.9} style={{ alignItems: 'center', gap: 10 }}>
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
            title={q ? `Results for “${q}”` : 'Search Result'}
            action={
              <Pressable onPress={() => setFilter(true)} hitSlop={10} accessibilityLabel="Filter results">
                <ListFilter size={22} color={colors.text} />
              </Pressable>
            }
          />
        </Reveal>

        {results.length === 0 && <EmptyState icon={SearchIcon} title="No meals found" body="Try a different ingredient or browse a category above." />}
        {results.map((m) => {
          const author = people[m.author];
          const following = st.following.includes(m.author);
          return (
            <ScrollReveal key={m.id} y={y} style={{ marginHorizontal: 20, marginTop: 20, paddingBottom: 20, borderBottomWidth: 1, borderColor: colors.border }}>
              <Animated.View layout={LinearTransition.springify()}>
                <Press onPress={() => router.push(`/meal/${m.id}`)} scaleTo={0.98} style={{ flexDirection: 'row', gap: 16 }}>
                  <View style={{ width: 150, height: 180, borderRadius: radius.lg, overflow: 'hidden' }}>
                    <Img source={m.image} style={{ width: '100%', height: '100%' }} />
                    <View style={{ position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: -10 }}>
                      <Img source={author.avatar} style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: colors.primaryGlow, zIndex: 1 }} />
                      <PillButton title={following ? 'Following' : 'Follow'} active={following} onPress={() => st.toggle('following', m.author)} style={{ transform: [{ scale: 0.85 }] }} />
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <Txt v="h3" style={{ flex: 1 }}>
                        {m.title}
                      </Txt>
                      <SaveButton id={m.id} />
                    </View>
                    <Txt v="small" color={colors.textMuted} numberOfLines={3} style={{ marginTop: 6 }}>
                      {m.description}
                    </Txt>
                    <View style={{ flex: 1 }} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row' }}>
                        {ingredientIcons.slice(2, 6).map((f, i) => (
                          <View key={i} style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', marginLeft: i ? -6 : 0, borderWidth: 1, borderColor: colors.surface }}>
                            {f(18)}
                          </View>
                        ))}
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.card, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6 }}>
                        <MessageCircle size={16} color={colors.textMuted} fill={colors.textMuted} />
                        <Txt v="caption">{m.comments}</Txt>
                      </View>
                    </View>
                  </View>
                </Press>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
                  <StatTile compact width={0} style={{ flex: 1, padding: 12 }} icon={<FlameIcon size={24} />} label="Calories" value={m.kcal} unit="Kcal" />
                  <StatTile compact width={0} style={{ flex: 1, padding: 12 }} icon={<ProteinIcon size={24} />} label="Proteins" value={m.protein} unit="g" />
                  <StatTile compact width={0} style={{ flex: 1, padding: 12 }} icon={<CarbsIcon size={24} />} label="Carbs" value={m.carbs} unit="g" />
                  <StatTile compact width={0} style={{ flex: 1, padding: 12 }} icon={<FatIcon size={24} />} label="Fat" value={m.fat} unit="g" />
                </View>
              </Animated.View>
            </ScrollReveal>
          );
        })}
      </Animated.ScrollView>

      <Sheet open={filter} onClose={() => setFilter(false)} title="Sort & filter">
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

