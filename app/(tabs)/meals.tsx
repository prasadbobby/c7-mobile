import { router } from 'expo-router';
import { Minus, Plus, Search } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { avatars, feed, meals } from '@/data';
import { CarbsIcon, FatIcon, FlameIcon, ProteinIcon, WaterIcon } from '@/icons';
import { Reveal, ScrollReveal, useCountUp, useScrollY, useStagger } from '@/motion';
import { PostCard } from '@/social';
import { useTodayMacros } from '@/shared';
import { useApp, type MealLog } from '@/store';
import { colors, font, radius } from '@/theme';
import { Bar, Card, Greeting, Img, IconButton, Press, PrimaryButton, Screen, SectionHeader, Sheet, StatTile, TAB_BAR_SPACE, Txt } from '@/ui';

const slots: MealLog['slot'][] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export default function Meals() {
  const st = useApp();
  const { y, onScroll } = useScrollY();
  const t = useTodayMacros();
  const tiles = useStagger(4, { stagger: 0.08, delay: 0.15 });
  const head = useStagger(2);
  const kcal = useCountUp(t.kcal);
  const [sheet, setSheet] = useState<MealLog['slot'] | null>(null);

  return (
    <Screen>
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }}>
        <Reveal p={head[0]!}>
          <Greeting name={st.name} avatar={avatars.emma} />
        </Reveal>
        <Reveal p={head[1]!}>
          <Txt v="h2" style={{ paddingHorizontal: 20, marginTop: 30 }}>
            Your Daily Nutrition
          </Txt>
        </Reveal>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 20, marginTop: 18 }}>
          <Reveal p={tiles[0]!} x={30} y={0}>
            <StatTile icon={<FlameIcon />} label="Calories" value={kcal} unit="Kcal" sub="/ 230 burned" />
          </Reveal>
          <Reveal p={tiles[1]!} x={30} y={0}>
            <StatTile icon={<ProteinIcon />} label="Proteins" value={t.protein} unit="g" sub={`/ ${t.protein * 4} kcal`} />
          </Reveal>
          <Reveal p={tiles[2]!} x={30} y={0}>
            <StatTile icon={<CarbsIcon />} label="Carbs" value={t.carbs} unit="g" sub={`/ ${t.carbs * 4} kcal`} />
          </Reveal>
          <Reveal p={tiles[3]!} x={30} y={0}>
            <StatTile icon={<FatIcon />} label="Fat" value={t.fat} unit="g" sub={`/ ${t.fat * 9} kcal`} />
          </Reveal>
        </ScrollView>

        {/* Goal bar + water */}
        <ScrollReveal y={y} style={{ flexDirection: 'row', gap: 12, marginHorizontal: 20, marginTop: 14 }}>
          <Card style={{ flex: 1.4, gap: 10 }}>
            <Txt v="small" color={colors.textMuted}>
              Daily goal
            </Txt>
            <Txt style={{ fontFamily: font.light, fontSize: 24 }}>
              {Math.max(0, st.kcalGoal - t.kcal)}
              <Txt v="small" color={colors.textMuted}>
                {' '}
                kcal left
              </Txt>
            </Txt>
            <Bar value={t.kcal / st.kcalGoal} />
          </Card>
          <Card style={{ flex: 1, gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <WaterIcon size={22} />
              <Txt v="small" color={colors.textMuted}>
                {(st.waterMl / 1000).toFixed(2)}L
              </Txt>
            </View>
            <Bar value={st.waterMl / 2000} color={colors.protein} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              <IconButton icon={Minus} label="Remove water" size={36} tint={colors.secondary} onPress={() => st.addWater(-250)} />
              <IconButton icon={Plus} label="Add 250ml water" size={36} tint={colors.secondary} onPress={() => st.addWater(250)} />
            </View>
          </Card>
        </ScrollReveal>

        {/* Today's meals */}
        <ScrollReveal y={y} style={{ marginTop: 28 }}>
          <SectionHeader title="Today’s Meals" />
        </ScrollReveal>
        {slots.map((slot) => {
          const items = t.items.filter((i) => i.slot === slot);
          return (
            <ScrollReveal key={slot} y={y} style={{ marginHorizontal: 20, marginTop: 10 }}>
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 }} onPress={() => (items[0] ? router.push(`/meal/${items[0].meal.id}`) : setSheet(slot))}>
                {items[0] ? (
                  <Img source={items[0].meal.image} style={{ width: 52, height: 52, borderRadius: 26 }} />
                ) : (
                  <View style={{ width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.muted, alignItems: 'center', justifyContent: 'center' }}>
                    <Plus size={20} color={colors.textMuted} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Txt>{slot}</Txt>
                  <Txt v="small" color={colors.textMuted} numberOfLines={1}>
                    {items.length ? items.map((i) => i.meal.title).join(', ') : 'Tap to log a meal'}
                  </Txt>
                </View>
                <Txt v="small" color={items.length ? colors.text : colors.textDim}>
                  {items.reduce((a, i) => a + i.meal.kcal, 0) || '—'} kcal
                </Txt>
                <Pressable onPress={() => setSheet(slot)} accessibilityLabel={`Add to ${slot}`} hitSlop={8} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={18} color={colors.onPrimary} strokeWidth={2.4} />
                </Pressable>
              </Card>
            </ScrollReveal>
          );
        })}

        {/* Community */}
        <ScrollReveal y={y} style={{ marginTop: 32 }}>
          <SectionHeader title="Cooking community" action={<IconButton icon={Search} label="Search meals" tint="transparent" onPress={() => router.push('/search')} />} />
        </ScrollReveal>
        {feed.map((f) => (
          <ScrollReveal key={f.id} y={y} style={{ marginHorizontal: 20, marginTop: 14, marginBottom: 18 }}>
            <PostCard mealId={f.mealId} who={f.who} />
          </ScrollReveal>
        ))}
      </Animated.ScrollView>

      <Sheet open={!!sheet} onClose={() => setSheet(null)} title={`Log ${sheet ?? ''}`}>
        <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
          {meals.map((m) => (
            <Press key={m.id} onPress={() => (st.logMeal(m.id, sheet!), setSheet(null))} scaleTo={0.98} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10 }}>
              <Img source={m.image} style={{ width: 48, height: 48, borderRadius: radius.sm }} />
              <View style={{ flex: 1 }}>
                <Txt>{m.title}</Txt>
                <Txt v="small" color={colors.textMuted}>
                  {m.kcal} kcal · P {m.protein}g · C {m.carbs}g · F {m.fat}g
                </Txt>
              </View>
              <Plus size={20} color={colors.primary} />
            </Press>
          ))}
        </ScrollView>
        <PrimaryButton title="Search all meals" icon={Search} style={{ marginTop: 14 }} onPress={() => (setSheet(null), router.push('/search'))} />
      </Sheet>
    </Screen>
  );
}
