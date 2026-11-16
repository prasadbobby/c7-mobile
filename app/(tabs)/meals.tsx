import { router } from 'expo-router';
import { MessageSquareQuote, Minus, Plus, Search, Trash2, UtensilsCrossed } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { today } from '@/api/dates';
import { uploadImage, useDeleteMeal, useLogMeal, useMe, useNotifications, useNutrition, useRecipes, useWater } from '@/api/hooks';
import { MEAL_SLOTS, type MealSlot } from '@/api/types';
import { pretty } from '@/api/meta';
import { mealArt, mealCategories } from '@/data';
import { CarbsIcon, FatIcon, FlameIcon, ProteinIcon, WaterIcon } from '@/icons';
import { Reveal, ScrollReveal, useCountUp, useScrollY, useStagger } from '@/motion';
import { PostCard } from '@/social';
import { useApp } from '@/store';
import { colors, font, radius } from '@/theme';
import { Bar, Card, Chip, EmptyState, ErrorState, Field, Greeting, Img, IconButton, Press, PrimaryButton, Screen, SectionHeader, Segmented, Sheet, Skeleton, StatTile, TAB_BAR_SPACE, toast, Txt } from '@/ui';

export default function Meals() {
  const me = useMe();
  const notes = useNotifications();
  const read = useApp((s) => s.readNotifications);
  const day = useNutrition();
  const water = useWater();
  const del = useDeleteMeal();
  const [cat, setCat] = useState<string | undefined>();
  const feed = useRecipes({ category: cat, sort: 'recent' });
  const { y, onScroll } = useScrollY();
  const tiles = useStagger(4, { stagger: 0.08, delay: 0.15 });
  const head = useStagger(2);
  const t = day.data?.totals ?? { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  const g = day.data?.goal;
  const kcal = useCountUp(Math.round(t.kcal));
  const [sheet, setSheet] = useState<MealSlot | null>(null);
  const [slotView, setSlotView] = useState<MealSlot | null>(null);
  const unread = (notes.data ?? []).some((n) => !read.includes(n.id));

  const addWater = (deltaMl: number) => water.mutate({ date: today(), deltaMl }, { onError: toast.error });

  return (
    <Screen>
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }}>
        <Reveal p={head[0]!}>
          <Greeting name={me.data?.user.firstName || 'there'} avatar={me.data?.user.imageUrl} unread={unread} />
        </Reveal>
        <Reveal p={head[1]!}>
          <Txt v="h2" style={{ paddingHorizontal: 20, marginTop: 30 }}>
            Your Daily Nutrition
          </Txt>
        </Reveal>
        {day.error ? (
          <ErrorState error={day.error} onRetry={() => day.refetch()} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 20, marginTop: 18 }}>
            <Reveal p={tiles[0]!} x={30} y={0}>
              <StatTile icon={<FlameIcon />} label="Calories" value={kcal} unit="Kcal" sub={g ? `/ ${g.kcal} goal` : ' '} />
            </Reveal>
            <Reveal p={tiles[1]!} x={30} y={0}>
              <StatTile icon={<ProteinIcon />} label="Proteins" value={Math.round(t.protein)} unit="g" sub={g ? `/ ${g.protein}g goal` : ' '} />
            </Reveal>
            <Reveal p={tiles[2]!} x={30} y={0}>
              <StatTile icon={<CarbsIcon />} label="Carbs" value={Math.round(t.carbs)} unit="g" sub={g ? `/ ${g.carbs}g goal` : ' '} />
            </Reveal>
            <Reveal p={tiles[3]!} x={30} y={0}>
              <StatTile icon={<FatIcon />} label="Fat" value={Math.round(t.fat)} unit="g" sub={g ? `/ ${g.fat}g goal` : ' '} />
            </Reveal>
          </ScrollView>
        )}

        {/* Goal bar + water */}
        <ScrollReveal y={y} style={{ flexDirection: 'row', gap: 12, marginHorizontal: 20, marginTop: 14 }}>
          <Card style={{ flex: 1.4, gap: 10 }}>
            <Txt v="small" color={colors.textMuted}>
              {g?.assigned ? 'Coach goal' : 'Daily goal'}
            </Txt>
            <Txt style={{ fontFamily: font.light, fontSize: 24 }}>
              {g ? Math.max(0, Math.round(g.kcal - t.kcal)) : '—'}
              <Txt v="small" color={colors.textMuted}>
                {' '}
                kcal left
              </Txt>
            </Txt>
            <Bar value={g ? t.kcal / g.kcal : 0} />
          </Card>
          <Card style={{ flex: 1, gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <WaterIcon size={22} />
              <Txt v="small" color={colors.textMuted} accessibilityLabel="Water today">
                {((day.data?.waterMl ?? 0) / 1000).toFixed(2)}L
              </Txt>
            </View>
            <Bar value={g ? (day.data?.waterMl ?? 0) / g.waterMl : 0} color={colors.protein} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              <IconButton icon={Minus} label="Remove 250ml water" size={36} tint={colors.secondary} onPress={() => addWater(-250)} />
              <IconButton icon={Plus} label="Add 250ml water" size={36} tint={colors.secondary} onPress={() => addWater(250)} />
            </View>
          </Card>
        </ScrollReveal>

        {!!g?.notes && (
          <ScrollReveal y={y} style={{ marginHorizontal: 20, marginTop: 12 }}>
            <Card style={{ flexDirection: 'row', gap: 12 }}>
              <MessageSquareQuote size={20} color={colors.primary} />
              <Txt v="small" style={{ flex: 1 }}>
                {g.notes}
              </Txt>
            </Card>
          </ScrollReveal>
        )}

        {/* Today's meals */}
        <ScrollReveal y={y} style={{ marginTop: 28 }}>
          <SectionHeader title="Today’s Meals" />
        </ScrollReveal>
        {MEAL_SLOTS.map((slot, keyIdx) => {
          const items = (day.data?.meals ?? []).filter((i) => i.slot === slot);
          const label = pretty(slot);
          return (
            <ScrollReveal key={`${slot}-${keyIdx}`} y={y} style={{ marginHorizontal: 20, marginTop: 10 }}>
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 }} onPress={() => (items.length ? setSlotView(slot) : setSheet(slot))}>
                {items[0] ? (
                  <Img source={items[0].photoUrl ?? items[0].imageUrl} fallback={mealArt.other} style={{ width: 52, height: 52, borderRadius: 26 }} />
                ) : (
                  <View style={{ width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.muted, alignItems: 'center', justifyContent: 'center' }}>
                    <Plus size={20} color={colors.textMuted} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Txt>{label}</Txt>
                  <Txt v="small" color={colors.textMuted} numberOfLines={1}>
                    {items.length ? items.map((i) => i.name).join(', ') : 'Tap to log a meal'}
                  </Txt>
                </View>
                <Txt v="small" color={items.length ? colors.text : colors.textDim}>
                  {items.reduce((a, i) => a + i.kcal, 0) || '—'} kcal
                </Txt>
                <Pressable onPress={() => setSheet(slot)} accessibilityLabel={`Add to ${label}`} hitSlop={8} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={18} color={colors.onPrimary} strokeWidth={2.4} />
                </Pressable>
              </Card>
            </ScrollReveal>
          );
        })}

        {/* Community recipes */}
        <ScrollReveal y={y} style={{ marginTop: 32 }}>
          <SectionHeader title="Recipes" action={<IconButton icon={Search} label="Search meals" tint="transparent" onPress={() => router.push('/search')} />} />
        </ScrollReveal>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 20, marginTop: 12 }}>
          <Chip label="All" active={!cat} onPress={() => setCat(undefined)} />
          {mealCategories.map((c) => (
            <Chip key={c.id} label={c.label} active={cat === c.id} onPress={() => setCat(cat === c.id ? undefined : c.id)} />
          ))}
        </ScrollView>
        {feed.isLoading ? (
          <Skeleton height={300} style={{ marginHorizontal: 20, marginTop: 14, width: undefined }} />
        ) : feed.error ? (
          <ErrorState error={feed.error} onRetry={() => feed.refetch()} />
        ) : feed.data?.length ? (
          feed.data.map((rec) => (
            <ScrollReveal key={rec.id} y={y} style={{ marginHorizontal: 20, marginTop: 18, marginBottom: 6 }}>
              <PostCard recipe={rec} />
            </ScrollReveal>
          ))
        ) : (
          <EmptyState icon={UtensilsCrossed} title="No recipes yet" body="Your coaches add recipes in the C7 dashboard." />
        )}
      </Animated.ScrollView>

      <LogMealSheet slot={sheet} onClose={() => setSheet(null)} />

      <Sheet open={!!slotView} onClose={() => setSlotView(null)} title={slotView ? pretty(slotView) : ''}>
        {(day.data?.meals ?? [])
          .filter((m) => m.slot === slotView)
          .map((m) => (
            <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }}>
              <Press onPress={() => m.recipeId && (setSlotView(null), router.push(`/meal/${m.recipeId}`))} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Img source={m.photoUrl ?? m.imageUrl} fallback={mealArt.other} style={{ width: 44, height: 44, borderRadius: radius.sm }} />
                <View style={{ flex: 1 }}>
                  <Txt numberOfLines={1}>
                    {m.name}
                    {m.servings !== 1 ? ` ×${m.servings}` : ''}
                  </Txt>
                  <Txt v="small" color={colors.textMuted}>
                    {m.kcal} kcal · P {m.protein}g · C {m.carbs}g · F {m.fat}g
                  </Txt>
                </View>
              </Press>
              <IconButton icon={Trash2} label={`Remove ${m.name}`} size={38} tint={colors.secondary} onPress={() => del.mutate(m.id, { onSuccess: () => toast.ok('Meal removed'), onError: toast.error })} />
            </View>
          ))}
        <PrimaryButton title="Add another" icon={Plus} style={{ marginTop: 14 }} onPress={() => { const s = slotView; setSlotView(null); setSheet(s); }} />
      </Sheet>
    </Screen>
  );
}

/** Pick a coach recipe or enter a custom meal. */
function LogMealSheet({ slot, onClose }: { slot: MealSlot | null; onClose: () => void }) {
  const [mode, setMode] = useState<'recipes' | 'custom'>('recipes');
  const recipes = useRecipes({ sort: 'popular' });
  const log = useLogMeal();
  const [f, setF] = useState({ name: '', kcal: '', protein: '', carbs: '', fat: '' });
  const [photo, setPhoto] = useState<{ uri: string; dataUrl: string } | null>(null);
  const n = (s: string) => (s ? Number(s) : 0);
  const pickPhoto = async (camera: boolean) => {
    const ImagePicker = await import('expo-image-picker');
    if (camera && Platform.OS !== 'web' && !(await ImagePicker.requestCameraPermissionsAsync()).granted) return toast.error(new Error('Allow camera access in Settings to snap your meal.'));
    const r = await (camera && Platform.OS !== 'web' ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync)({ mediaTypes: ['images'], quality: 0.6, base64: true });
    if (r.canceled || !r.assets[0]) return;
    try {
      setPhoto({ uri: r.assets[0].uri, dataUrl: await uploadImage(r.assets[0]) });
    } catch (e) {
      toast.error(e);
    }
  };
  const done = () => {
    toast.ok(`Added to ${pretty(slot)}`);
    setPhoto(null);
    setF({ name: '', kcal: '', protein: '', carbs: '', fat: '' });
    onClose();
  };
  return (
    <Sheet open={!!slot} onClose={onClose} title={`Log ${pretty(slot)}`}>
      <Segmented value={mode} onChange={setMode} options={[{ id: 'recipes', label: 'Recipes' }, { id: 'custom', label: 'Custom' }]} />
      {mode === 'recipes' ? (
        <ScrollView style={{ maxHeight: 360, marginTop: 12 }} showsVerticalScrollIndicator={false}>
          {recipes.isLoading && <Skeleton height={60} />}
          {recipes.data?.length === 0 && <Txt color={colors.textMuted}>No recipes yet — use Custom.</Txt>}
          {recipes.data?.map((m) => (
            <Press key={m.id} disabled={log.isPending} onPress={() => log.mutate({ date: today(), slot: slot!, recipeId: m.id }, { onSuccess: done, onError: toast.error })} scaleTo={0.98} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10 }} accessibilityLabel={`Log ${m.title}`}>
              <Img source={m.imageUrl} fallback={mealArt[m.category]} style={{ width: 48, height: 48, borderRadius: radius.sm }} />
              <View style={{ flex: 1 }}>
                <Txt numberOfLines={1}>{m.title}</Txt>
                <Txt v="small" color={colors.textMuted}>
                  {m.kcal} kcal · P {m.protein}g · C {m.carbs}g · F {m.fat}g
                </Txt>
              </View>
              <Plus size={20} color={colors.primary} />
            </Press>
          ))}
        </ScrollView>
      ) : (
        <View style={{ gap: 10, marginTop: 12 }}>
          <Field placeholder="What did you eat?" value={f.name} onChangeText={(name) => setF({ ...f, name })} accessibilityLabel="Meal name" />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Field placeholder="kcal" keyboardType="number-pad" value={f.kcal} onChangeText={(v) => setF({ ...f, kcal: v.replace(/\D/g, '') })} style={{ flex: 1, paddingHorizontal: 18 }} accessibilityLabel="Calories" />
            <Field placeholder="Protein g" keyboardType="decimal-pad" value={f.protein} onChangeText={(v) => setF({ ...f, protein: v.replace(/[^0-9.]/g, '') })} style={{ flex: 1, paddingHorizontal: 18 }} accessibilityLabel="Protein" />
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Field placeholder="Carbs g" keyboardType="decimal-pad" value={f.carbs} onChangeText={(v) => setF({ ...f, carbs: v.replace(/[^0-9.]/g, '') })} style={{ flex: 1, paddingHorizontal: 18 }} accessibilityLabel="Carbs" />
            <Field placeholder="Fat g" keyboardType="decimal-pad" value={f.fat} onChangeText={(v) => setF({ ...f, fat: v.replace(/[^0-9.]/g, '') })} style={{ flex: 1, paddingHorizontal: 18 }} accessibilityLabel="Fat" />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {photo ? (
              <Press onPress={() => setPhoto(null)} accessibilityLabel="Remove meal photo" scaleTo={0.96}>
                <Img source={photo.uri} style={{ width: 56, height: 56, borderRadius: radius.sm }} />
              </Press>
            ) : null}
            <Txt v="small" color={colors.primary} onPress={() => pickPhoto(true)} accessibilityRole="button">
              {photo ? 'Retake photo' : Platform.OS === 'web' ? 'Add a photo' : 'Snap a photo'}
            </Txt>
            {Platform.OS !== 'web' && !photo && (
              <Txt v="small" color={colors.textMuted} onPress={() => pickPhoto(false)} accessibilityRole="button">
                or choose one
              </Txt>
            )}
          </View>
          <PrimaryButton
            title="Add meal"
            loading={log.isPending}
            disabled={!f.name.trim() || f.kcal === ''}
            onPress={() => log.mutate({ date: today(), slot: slot!, name: f.name.trim(), kcal: n(f.kcal), protein: n(f.protein), carbs: n(f.carbs), fat: n(f.fat), photoUrl: photo?.dataUrl }, { onSuccess: done, onError: toast.error })}
          />
        </View>
      )}
    </Sheet>
  );
}
