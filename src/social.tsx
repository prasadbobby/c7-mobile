/** Recipe-community pieces — shared by Meals feed, Search, Saved and Recipe detail. Backed by c7-backend. */
import { router } from 'expo-router';
import { Bookmark, Heart, MessageCircle } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { useFollow, useLikeRecipe, useSaveRecipe } from './api/hooks';
import { useMe } from './api/hooks';
import type { Recipe, RecipeListItem } from './api/types';
import { relative } from './api/dates';
import { mealArt } from './data';
import { colors, radius } from './theme';
import { Avatar, haptic, Img, PillButton, Press, toast, Txt } from './ui';

export function FollowRow({ author, compact, when }: { author: Recipe['author']; compact?: boolean; when?: string }) {
  const follow = useFollow();
  const me = useMe();
  const isMe = me.data?.user.id === author.userId;
  const isCoach = author.userId === 'system';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <Avatar source={author.imageUrl} name={author.name} size={compact ? 44 : 52} />
      <View style={{ flex: 1 }}>
        <Txt v="bodyLg" numberOfLines={1}>
          {author.name}
        </Txt>
        <Txt v="small" color={colors.textMuted}>
          {isCoach ? 'C7 Coaching' : when ? relative(when) : 'Member'}
        </Txt>
      </View>
      {!isMe && !isCoach && (
        <PillButton
          title={author.isFollowing ? 'Following' : 'Follow'}
          active={author.isFollowing}
          onPress={() => follow.mutate(author.userId, { onError: toast.error })}
        />
      )}
    </View>
  );
}

export function MacroStrip({ r }: { r: Pick<Recipe, 'kcal' | 'protein' | 'carbs' | 'fat'> }) {
  const items = [
    { label: 'kcal', value: r.kcal, color: colors.calories },
    { label: 'P', value: `${r.protein}g`, color: colors.protein },
    { label: 'C', value: `${r.carbs}g`, color: colors.carbs },
    { label: 'F', value: `${r.fat}g`, color: colors.fat },
  ];
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-around', backgroundColor: 'rgba(5,6,5,0.72)', borderRadius: radius.pill, paddingVertical: 10, paddingHorizontal: 8 }}>
      {items.map((i) => (
        <View key={i.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: i.color }} />
          <Txt v="small">
            {i.value} <Txt v="caption" color={colors.textMuted}>{i.label === 'kcal' ? 'kcal' : i.label}</Txt>
          </Txt>
        </View>
      ))}
    </View>
  );
}

export function LikeButton({ recipe }: { recipe: Pick<Recipe, 'id' | 'liked' | 'likes'> }) {
  const like = useLikeRecipe();
  const s = useSharedValue(1);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Press
      accessibilityLabel={recipe.liked ? 'Unlike' : 'Like'}
      onPress={() => {
        haptic(recipe.liked ? 'light' : 'success');
        like.mutate(recipe.id, { onError: toast.error });
      }}
      hapticKind="none"
      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 10 }}
    >
      <Animated.View style={a}>
        <Heart size={22} color={colors.danger} fill={recipe.liked ? colors.danger : 'transparent'} />
      </Animated.View>
      <Txt v="small">{recipe.likes} Likes</Txt>
    </Press>
  );
}

export function SaveButton({ recipe }: { recipe: Pick<Recipe, 'id' | 'saved'> }) {
  const save = useSaveRecipe();
  return (
    <Press
      accessibilityLabel={recipe.saved ? 'Remove from saved' : 'Save'}
      onPress={() => save.mutate(recipe.id, { onSuccess: (r) => r.saved && toast.ok('Saved to your collection'), onError: toast.error })}
      scaleTo={0.85}
      style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}
    >
      <Bookmark size={22} color={recipe.saved ? colors.primary : colors.text} fill={recipe.saved ? colors.primary : 'transparent'} />
    </Press>
  );
}

export function PostCard({ recipe }: { recipe: RecipeListItem }) {
  return (
    <View style={{ gap: 14 }}>
      <FollowRow author={recipe.author} when={recipe.createdAt} />
      <Press onPress={() => router.push(`/meal/${recipe.id}`)} scaleTo={0.98} style={{ height: 220, borderRadius: radius.xl, overflow: 'hidden' }} accessibilityLabel={recipe.title}>
        <Img source={recipe.imageUrl} fallback={mealArt[recipe.category]} style={StyleSheet.absoluteFill} />
        <View style={{ position: 'absolute', left: 14, right: 14, bottom: 14 }}>
          <MacroStrip r={recipe} />
        </View>
      </Press>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <LikeButton recipe={recipe} />
        <Press onPress={() => router.push(`/meal/${recipe.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.card, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 10 }}>
          <MessageCircle size={20} color={colors.textMuted} />
          <Txt v="small">{recipe.comments}</Txt>
        </Press>
        <View style={{ flex: 1 }} />
        <SaveButton recipe={recipe} />
      </View>
      <Txt v="bodyLg">{recipe.title}</Txt>
      {!!recipe.description && (
        <Txt v="body" color={colors.textMuted} numberOfLines={2} style={{ marginTop: -8 }}>
          {recipe.description}
        </Txt>
      )}
    </View>
  );
}
