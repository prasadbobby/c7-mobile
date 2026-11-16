import { router, useLocalSearchParams } from 'expo-router';
import { Check, Clock, Flame, MessageCircle, Plus, Send, Share2, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Share, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { relative, today } from '@/api/dates';
import { useCommentRecipe, useDeleteRecipeComment, useLogMeal, useRecipe } from '@/api/hooks';
import { pretty } from '@/api/meta';
import { MEAL_SLOTS } from '@/api/types';
import { mealArt } from '@/data';
import { CarbsIcon, FatIcon, FlameIcon, ProteinIcon } from '@/icons';
import { Parallax, Reveal, ScrollReveal, useScrollY, useStagger } from '@/motion';
import { FollowRow, LikeButton, MacroStrip, SaveButton } from '@/social';
import { colors } from '@/theme';
import { Avatar, BackButton, Card, Chip, ErrorState, FadeBottom, Field, haptic, IconButton, Img, InfoPill, PrimaryButton, Ring, Segmented, Sheet, Skeleton, toast, Txt, HeroGlow } from '@/ui';

const HERO = 400;

export default function MealDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = useRecipe(id);
  const log = useLogMeal();
  const comment = useCommentRecipe();
  const delComment = useDeleteRecipeComment(id);
  const [draft, setDraft] = useState('');
  const insets = useSafeAreaInsets();
  const { y, onScroll } = useScrollY();
  const [tab, setTab] = useState<'ingredients' | 'steps'>('ingredients');
  const [done, setDone] = useState<number[]>([]);
  const [servings, setServings] = useState(1);
  const [logOpen, setLogOpen] = useState(false);
  const r = useStagger(3, { delay: 0.15 });
  const m = q.data;
  if (q.error) return <View style={{ flex: 1, backgroundColor: colors.surface, paddingTop: insets.top + 60 }}><HeroGlow /><ErrorState error={q.error} onRetry={() => q.refetch()} /><View style={{ position: 'absolute', top: insets.top + 8, left: 20 }}><BackButton /></View></View>;
  if (!m) return <View style={{ flex: 1, backgroundColor: colors.surface, padding: 20, paddingTop: insets.top + 20, gap: 14 }}><HeroGlow /><Skeleton height={HERO - 60} /><Skeleton height={40} /><Skeleton height={120} /></View>;
  const totalKcalFromMacros = Math.max(1, m.protein * 4 + m.carbs * 4 + m.fat * 9);
  const x = (v: number) => Math.round(v * servings * 10) / 10;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}><HeroGlow />
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}>
        <View style={{ height: HERO, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, overflow: 'hidden' }}>
          <Parallax y={y} height={HERO} style={StyleSheet.absoluteFill}>
            <Img source={m.imageUrl} fallback={mealArt[m.category]} style={StyleSheet.absoluteFill} />
          </Parallax>
          <FadeBottom />
          <View style={{ position: 'absolute', left: 20, right: 20, bottom: 20 }}>
            <MacroStrip r={m} />
          </View>
        </View>
        <View style={{ position: 'absolute', top: insets.top + 8, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between' }}>
          <BackButton />
          <IconButton icon={Share2} label="Share" onPress={() => Share.share({ message: `${m.title} — ${m.kcal} kcal, ${m.protein}g protein. From the C7 recipe library.` })} />
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 22 }}>
          <Reveal p={r[0]!}>
            <Txt v="h1">{m.title}</Txt>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <InfoPill icon={Clock} label={`${m.minutes} min`} />
              <InfoPill icon={Flame} label={`${Math.round(m.kcal * servings)} kcal`} />
              <View style={{ flex: 1 }} />
              <SaveButton recipe={m} />
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
                  { i: <FlameIcon size={20} />, l: 'Calories', v: `${Math.round(m.kcal * servings)} Kcal` },
                  { i: <ProteinIcon size={20} />, l: 'Proteins', v: `${x(m.protein)}g` },
                  { i: <CarbsIcon size={20} />, l: 'Carbs', v: `${x(m.carbs)}g` },
                  { i: <FatIcon size={20} />, l: 'Fat', v: `${x(m.fat)}g` },
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
            <FollowRow author={m.author} compact when={m.createdAt} />
            <View style={{ flexDirection: 'row', marginTop: 16, gap: 10, alignItems: 'center' }}>
              <LikeButton recipe={m} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.card, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 }}>
                <MessageCircle size={20} color={colors.textMuted} />
                <Txt v="small">{m.comments.length}</Txt>
              </View>
              <Chip label={pretty(m.category)} style={{ height: 40 }} />
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
                    {[1, 2, 3, 4].map((n, keyIdx) => (
                      <Chip key={`${n}-${keyIdx}`} label={String(n)} active={servings === n} onPress={() => setServings(n)} style={{ height: 40, paddingHorizontal: 14 }} />
                    ))}
                  </View>
                </View>
                {m.ingredients.map((ing, keyIdx) => (
                  <Card key={`${ing}-${keyIdx}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 }}>
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

          {/* Comments */}
          <View style={{ marginTop: 28, gap: 12 }}>
            <Txt v="h3">Comments</Txt>
            {m.comments.length === 0 && <Txt color={colors.textMuted}>Be the first to share how it turned out.</Txt>}
            {m.comments.map((c) => (
              <View key={c.id} style={{ flexDirection: 'row', gap: 12 }}>
                <Avatar source={c.author.imageUrl} name={c.author.name} size={36} ring={false} />
                <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 18, padding: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Txt v="small" style={{ fontWeight: '600' }}>{c.author.name}</Txt>
                    <Txt v="caption" color={colors.textMuted}>{relative(c.createdAt)}</Txt>
                  </View>
                  <Txt v="small" style={{ marginTop: 4 }}>{c.content}</Txt>
                </View>
                {c.isMine && <IconButton icon={Trash2} label="Delete comment" size={34} tint={colors.secondary} onPress={() => delComment.mutate(c.id, { onError: toast.error })} />}
              </View>
            ))}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Field placeholder="Add a comment" value={draft} onChangeText={setDraft} style={{ flex: 1 }} accessibilityLabel="Comment" />
              <IconButton icon={Send} label="Post comment" tint={colors.primary} onPress={() => draft.trim() && comment.mutate({ id: m.id, content: draft.trim() }, { onSuccess: () => setDraft(''), onError: toast.error })} />
            </View>
          </View>
        </View>
      </Animated.ScrollView>

      <View style={{ position: 'absolute', left: 20, right: 20, bottom: insets.bottom + 16 }}>
        <PrimaryButton title="Add to today’s meals" icon={Plus} onPress={() => setLogOpen(true)} />
      </View>
      <Sheet open={logOpen} onClose={() => setLogOpen(false)} title="Which meal?">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {MEAL_SLOTS.map((s, keyIdx) => (
            <Chip
              key={`${s}-${keyIdx}`}
              label={pretty(s)}
              onPress={() =>
                log.mutate(
                  { date: today(), slot: s, recipeId: m.id, servings },
                  {
                    onSuccess: () => {
                      haptic('success');
                      setLogOpen(false);
                      toast.ok(`Added to ${pretty(s)}`);
                      router.navigate('/meals');
                    },
                    onError: toast.error,
                  },
                )
              }
            />
          ))}
        </View>
        <Txt v="small" color={colors.textMuted} style={{ marginTop: 18 }}>
          Adds {Math.round(m.kcal * servings)} kcal · {x(m.protein)}g protein to today.
        </Txt>
      </Sheet>
    </View>
  );
}

