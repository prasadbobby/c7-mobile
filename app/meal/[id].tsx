import { router, useLocalSearchParams } from 'expo-router';
import { Check, Clock, Flame, Plus, Share2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Share, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { meals } from '@/data';
import { CarbsIcon, FatIcon, FlameIcon, ProteinIcon } from '@/icons';
import { Parallax, Reveal, ScrollReveal, useScrollY, useStagger } from '@/motion';
import { FollowRow, IngredientBar, LikeButton, SaveButton } from '@/social';
import { useApp, type MealLog } from '@/store';
import { colors } from '@/theme';
import { BackButton, Card, Chip, FadeBottom, haptic, IconButton, Img, InfoPill, PrimaryButton, Ring, Segmented, Sheet, Txt } from '@/ui';

const HERO = 400;

export default function MealDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const m = meals.find((x) => x.id === id) ?? meals[0]!;
  const insets = useSafeAreaInsets();
  const st = useApp();
  const { y, onScroll } = useScrollY();
  const [tab, setTab] = useState<'ingredients' | 'steps'>('ingredients');
  const [done, setDone] = useState<number[]>([]);
  const [servings, setServings] = useState(1);
  const [logOpen, setLogOpen] = useState(false);
  const r = useStagger(3, { delay: 0.15 });
  const totalKcalFromMacros = m.protein * 4 + m.carbs * 4 + m.fat * 9;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}>
        <View style={{ height: HERO, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, overflow: 'hidden' }}>
          <Parallax y={y} height={HERO} style={StyleSheet.absoluteFill}>
            <Img source={m.image} style={StyleSheet.absoluteFill} />
          </Parallax>
          <FadeBottom />
          <View style={{ position: 'absolute', left: 20, right: 20, bottom: 20 }}>
            <IngredientBar />
          </View>
        </View>
        <View style={{ position: 'absolute', top: insets.top + 8, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between' }}>
          <BackButton />
          <IconButton icon={Share2} label="Share" onPress={() => Share.share({ message: `${m.title} on PulseFit` })} />
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 22 }}>
          <Reveal p={r[0]!}>
            <Txt v="h1">{m.title}</Txt>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <InfoPill icon={Clock} label={`${m.minutes} min`} />
              <InfoPill icon={Flame} label={`${m.kcal * servings} kcal`} />
              <View style={{ flex: 1 }} />
              <SaveButton id={m.id} />
            </View>
            <Txt color={colors.textMuted} style={{ marginTop: 16, lineHeight: 24 }}>
              {m.description}
            </Txt>
          </Reveal>

          {/* Macro donut */}
          <Reveal p={r[1]!} style={{ marginTop: 22 }}>
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 18, padding: 18 }}>
              <Ring value={(m.protein * 4) / totalKcalFromMacros} size={110} stroke={10} color={colors.protein} track={colors.muted}>
                <Ring value={(m.carbs * 4) / totalKcalFromMacros} size={84} stroke={10} color={colors.carbs} track={colors.muted} delay={0.1}>
                  <Ring value={(m.fat * 9) / totalKcalFromMacros} size={58} stroke={10} color={colors.fat} track={colors.muted} delay={0.2} />
                </Ring>
              </Ring>
              <View style={{ flex: 1, gap: 10 }}>
                {[
                  { i: <FlameIcon size={20} />, l: 'Calories', v: `${m.kcal * servings} Kcal` },
                  { i: <ProteinIcon size={20} />, l: 'Proteins', v: `${m.protein * servings}g` },
                  { i: <CarbsIcon size={20} />, l: 'Carbs', v: `${m.carbs * servings}g` },
                  { i: <FatIcon size={20} />, l: 'Fat', v: `${m.fat * servings}g` },
                ].map((x) => (
                  <View key={x.l} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    {x.i}
                    <Txt v="small" color={colors.textMuted} style={{ flex: 1 }}>
                      {x.l}
                    </Txt>
                    <Txt v="small">{x.v}</Txt>
                  </View>
                ))}
              </View>
            </Card>
          </Reveal>

          <Reveal p={r[2]!} style={{ marginTop: 22 }}>
            <FollowRow who={m.author} compact />
            <View style={{ flexDirection: 'row', marginTop: 16 }}>
              <LikeButton id={m.id} count={m.likes} />
            </View>
          </Reveal>

          <ScrollReveal y={y} offset={HERO} style={{ marginTop: 26 }}>
            <Segmented
              value={tab}
              onChange={setTab}
              options={[
                { id: 'ingredients', label: 'Ingredients' },
                { id: 'steps', label: 'Steps' },
              ]}
            />
            {tab === 'ingredients' ? (
              <View style={{ marginTop: 14, gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Txt color={colors.textMuted}>Servings</Txt>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {[1, 2, 3, 4].map((n) => (
                      <Chip key={n} label={String(n)} active={servings === n} onPress={() => setServings(n)} style={{ height: 40, paddingHorizontal: 14 }} />
                    ))}
                  </View>
                </View>
                {m.ingredients.map((ing) => (
                  <Card key={ing} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }} />
                    <Txt style={{ flex: 1 }}>{servings > 1 ? `${servings}× ${ing}` : ing}</Txt>
                  </Card>
                ))}
              </View>
            ) : (
              <View style={{ marginTop: 14, gap: 10 }}>
                {m.steps.map((s, k) => {
                  const on = done.includes(k);
                  return (
                    <Pressable key={k} onPress={() => (haptic(), setDone(on ? done.filter((d) => d !== k) : [...done, k]))}>
                      <Card style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start', opacity: on ? 0.55 : 1 }}>
                        <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: on ? colors.primary : colors.secondary, alignItems: 'center', justifyContent: 'center' }}>
                          {on ? <Check size={16} color={colors.onPrimary} strokeWidth={3} /> : <Txt v="small">{k + 1}</Txt>}
                        </View>
                        <Txt style={{ flex: 1, textDecorationLine: on ? 'line-through' : 'none' }}>{s}</Txt>
                      </Card>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </ScrollReveal>
        </View>
      </Animated.ScrollView>

      <View style={{ position: 'absolute', left: 20, right: 20, bottom: insets.bottom + 16 }}>
        <PrimaryButton title="Add to today’s meals" icon={Plus} onPress={() => setLogOpen(true)} />
      </View>
      <Sheet open={logOpen} onClose={() => setLogOpen(false)} title="Which meal?">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {(['Breakfast', 'Lunch', 'Dinner', 'Snack'] as MealLog['slot'][]).map((s) => (
            <Chip
              key={s}
              label={s}
              onPress={() => {
                st.logMeal(m.id, s);
                haptic('success');
                setLogOpen(false);
                router.navigate('/meals');
              }}
            />
          ))}
        </View>
        <Txt v="small" color={colors.textMuted} style={{ marginTop: 18 }}>
          Adds {m.kcal * servings} kcal · {m.protein * servings}g protein to today.
        </Txt>
      </Sheet>
    </View>
  );
}

