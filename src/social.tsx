/** Cooking-community post card — shared by Meals feed, Search results and Meal detail. */
import { router } from 'expo-router';
import { Bookmark, EllipsisVertical, Heart, MessageCircle } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { avatars, meals, people } from './data';
import { ingredientIcons } from './icons';
import { useApp } from './store';
import { colors, radius } from './theme';
import { Avatar, haptic, Img, PillButton, Press, Txt } from './ui';

export function FollowRow({ who, compact }: { who: keyof typeof people; compact?: boolean }) {
  const st = useApp();
  const p = people[who];
  const following = st.following.includes(who);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <Avatar source={p.avatar} size={compact ? 44 : 58} />
      <View style={{ flex: 1 }}>
        <Txt v="bodyLg">{p.name}</Txt>
        <Txt v="small" color={colors.textMuted}>
          {p.followers} Followers
        </Txt>
      </View>
      <PillButton title={following ? 'Following' : 'Follow'} active={following} onPress={() => st.toggle('following', who)} />
      {!compact && <EllipsisVertical size={22} color={colors.text} />}
    </View>
  );
}

export function IngredientBar({ size = 30 }: { size?: number }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-around', backgroundColor: 'rgba(5,6,5,0.72)', borderRadius: radius.pill, paddingVertical: 10, paddingHorizontal: 8 }}>
      {ingredientIcons.map((f, i) => (
        <View key={i}>{f(size)}</View>
      ))}
    </View>
  );
}

export function LikeButton({ id, count }: { id: string; count: number }) {
  const st = useApp();
  const liked = st.liked.includes(id);
  const s = useSharedValue(1);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Press
      onPress={() => {
        s.value = withSequence(withSpring(1.4, { damping: 6, stiffness: 400 }), withSpring(1));
        haptic(liked ? 'light' : 'success');
        st.toggle('liked', id);
      }}
      hapticKind="none"
      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderRadius: radius.pill, paddingLeft: 14, paddingRight: 6, paddingVertical: 6 }}
    >
      <Animated.View style={a}>
        <Heart size={24} color={colors.danger} fill={liked ? colors.danger : colors.danger} fillOpacity={liked ? 1 : 0.85} />
      </Animated.View>
      <Txt v="small">{count + (liked ? 1 : 0)} Likes</Txt>
      <View style={{ flexDirection: 'row' }}>
        {[avatars.alex, avatars.regina, avatars.methew].map((a2, i) => (
          <Img key={i} source={a2} style={{ width: 26, height: 26, borderRadius: 13, marginLeft: i ? -10 : 0, borderWidth: 2, borderColor: colors.card }} />
        ))}
      </View>
    </Press>
  );
}

export function SaveButton({ id }: { id: string }) {
  const st = useApp();
  const saved = st.saved.includes(id);
  return (
    <Press accessibilityLabel="Save" onPress={() => st.toggle('saved', id)} scaleTo={0.85} style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
      <Bookmark size={22} color={saved ? colors.primary : colors.text} fill={saved ? colors.primary : colors.textMuted} />
    </Press>
  );
}

export function PostCard({ mealId, who }: { mealId: string; who: keyof typeof people }) {
  const m = meals.find((x) => x.id === mealId)!;
  return (
    <View style={{ gap: 14 }}>
      <FollowRow who={who} />
      <Press onPress={() => router.push(`/meal/${m.id}`)} scaleTo={0.98} style={{ height: 220, borderRadius: radius.xl, overflow: 'hidden' }}>
        <Img source={m.image} style={StyleSheet.absoluteFill} />
        <View style={{ position: 'absolute', left: 14, right: 14, bottom: 14 }}>
          <IngredientBar />
        </View>
      </Press>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <LikeButton id={m.id} count={m.likes} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.card, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 10 }}>
          <MessageCircle size={20} color={colors.textMuted} fill={colors.textMuted} />
          <Txt v="small">{m.comments}</Txt>
        </View>
        <View style={{ flex: 1 }} />
        <SaveButton id={m.id} />
      </View>
      <Txt v="body" color={colors.text} numberOfLines={1}>
        {m.description}
      </Txt>
    </View>
  );
}
