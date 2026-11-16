/** 90-day challenge pieces: daily check-in form, community feed, month calendar. Design ported from the Lovable C7 screens. */
import * as ImagePicker from 'expo-image-picker';
import { BicepsFlexed, ChevronLeft, ChevronRight, Flame, HandHeart, Heart, ImagePlus, MessageCircle, Moon, PartyPopper, Pencil, Pin, SendHorizontal, ShieldCheck, ThumbsUp, Trash2, X, type LucideIcon } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';
import { relative, today } from './api/dates';
import { markViewed, uploadImage, useChallengeCalendar, useCommentPost, useCreatePost, useDeleteComment, useDeletePost, useFeed, useMe, useReactPost, useTodayPost, useUpdatePost, type PostInput } from './api/hooks';
import { fullName } from './api/meta';
import { ENERGY, MOOD, REACTIONS, SLEEP, type ChallengePost, type FeedComment, type FeedPost, type Reaction } from './api/types';
import { ArtEmpty } from './badges';
import { EnergyIcon, MoodIcon, energyLabels, moodLabels, sleepLabels } from './moods';
import { colors, font, radius, type } from './theme';
import { Avatar, Card, Chip, IconButton, Img, PrimaryButton, Press, SecondaryButton, Segmented, Sheet, Skeleton, toast, Toggle, Txt } from './ui';

/* ------------------------------------------------------------ check-in ---- */

const TEXTS = [
  ['mealTracking', 'Meals today', 'Breakfast, lunch, dinner, snacks…'],
  ['dayDescription', 'How was your day', 'Training, work, how you felt…'],
  ['achievements', 'Wins', 'What went well?'],
  ['challenges', 'Struggles', 'What was hard?'],
] as const;
type Form = { sleepHours: number; sleepQuality: (typeof SLEEP)[number]; mood: number; energy: number; isFasting: boolean; mealTracking: string; dayDescription: string; achievements: string; challenges: string; photos: string[] };
const blank: Form = { sleepHours: 7, sleepQuality: 'GOOD', mood: 4, energy: 3, isFasting: false, mealTracking: '', dayDescription: '', achievements: '', challenges: '', photos: [] };
const fromPost = (p: ChallengePost): Form => ({
  sleepHours: p.sleepHours ?? 7,
  sleepQuality: p.sleepQuality ?? 'GOOD',
  mood: p.mood ? MOOD.indexOf(p.mood) : 4,
  energy: p.energy ? ENERGY.indexOf(p.energy) : 3,
  isFasting: p.isFasting,
  mealTracking: p.mealTracking ?? '',
  dayDescription: p.dayDescription ?? '',
  achievements: p.achievements ?? '',
  challenges: p.challenges ?? '',
  photos: p.photos ?? [],
});
const toInput = (f: Form): PostInput => ({
  sleepHours: f.sleepHours,
  sleepQuality: f.sleepQuality,
  mood: MOOD[f.mood],
  energy: ENERGY[f.energy],
  isFasting: f.isFasting,
  mealTracking: f.mealTracking.trim() || null,
  dayDescription: f.dayDescription.trim() || null,
  achievements: f.achievements.trim() || null,
  challenges: f.challenges.trim() || null,
  photos: f.photos,
});

function PickerRow({ count, value, onChange, Icon, labels }: { count: number; value: number; onChange: (n: number) => void; Icon: typeof MoodIcon; labels: string[] }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {Array.from({ length: count }, (_, i) => {
        const on = value === i;
        return (
          <Press key={i} accessibilityLabel={labels[i]} accessibilityState={{ selected: on }} onPress={() => onChange(i)} scaleTo={0.92} style={{ flex: 1, alignItems: 'center', gap: 4, paddingVertical: 10, borderRadius: 20, borderWidth: 2, borderColor: on ? colors.primary : 'transparent', backgroundColor: on ? 'transparent' : colors.secondary }}>
            <Icon level={i} size={24} color={on ? colors.primary : colors.textMuted} />
            <Txt style={{ fontSize: 10 }} color={on ? colors.primary : colors.textMuted} numberOfLines={1}>
              {labels[i]}
            </Txt>
          </Press>
        );
      })}
    </View>
  );
}

function TextArea({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string; onChange: (s: string) => void }) {
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ gap: 8 }}>
      <Txt v="small" color={colors.textMuted}>
        {label}
      </Txt>
      <TextInput
        multiline
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        accessibilityLabel={label}
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.primary}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={[type.body, { minHeight: 88, color: colors.text, backgroundColor: colors.card, borderRadius: 24, padding: 16, textAlignVertical: 'top', borderWidth: 1.5, borderColor: focus ? colors.primary : 'transparent' }]}
      />
    </View>
  );
}

export function CheckIn({ challengeId, dayNumber }: { challengeId: string; dayNumber: number }) {
  const date = today();
  const q = useTodayPost(challengeId, date);
  const create = useCreatePost(challengeId);
  const update = useUpdatePost(challengeId);
  const del = useDeletePost(challengeId);
  const [editing, setEditing] = useState(false);
  const [f, setF] = useState<Form>(blank);
  const [uploading, setUploading] = useState(false);
  const post = q.data;
  useEffect(() => {
    if (post) setF(fromPost(post));
  }, [post]);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));

  const addPhotos = async () => {
    if (f.photos.length >= 10) return;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: 10 - f.photos.length, quality: 0.7, base64: true });
    if (res.canceled) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const a of res.assets) {
        if ((a.fileSize ?? 0) > 5 * 1024 * 1024) {
          toast.error('Each photo must be under 5MB');
          continue;
        }
        urls.push(await uploadImage(a));
      }
      setF((p) => ({ ...p, photos: [...p.photos, ...urls].slice(0, 10) }));
    } catch (e) {
      toast.error(e);
    } finally {
      setUploading(false);
    }
  };

  const submit = () => {
    const body = toInput(f);
    if (post) update.mutate({ postId: post.id, ...body }, { onSuccess: () => (setEditing(false), toast.ok('Check-in updated')), onError: toast.error });
    else create.mutate({ ...body, date }, { onSuccess: () => toast.ok(`Day ${dayNumber} posted 🔥`), onError: toast.error });
  };

  if (q.isLoading) return <Skeleton height={300} style={{ marginHorizontal: 20 }} />;

  if (post && !editing)
    return (
      <Animated.View entering={FadeInDown.duration(380)} style={{ marginHorizontal: 20 }}>
        <Card style={{ padding: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ backgroundColor: 'rgba(198,242,27,0.12)', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 }}>
              <Txt v="caption" color={colors.primary}>
                POSTED · {relative(post.createdAt).toUpperCase()}
              </Txt>
            </View>
            <Press onPress={() => setEditing(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: 'rgba(198,242,27,0.7)', borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8 }} accessibilityLabel="Edit check-in">
              <Pencil size={14} color={colors.primary} />
              <Txt v="small" color={colors.primary}>
                Edit
              </Txt>
            </Press>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
            <Mini icon={<MoodIcon level={f.mood} color={colors.primary} />} label={moodLabels[f.mood]!} />
            <Mini icon={<EnergyIcon level={f.energy} color={colors.primary} />} label={energyLabels[f.energy]!} />
            <Mini icon={<Moon size={24} color={colors.protein} />} label={`${f.sleepHours}h · ${sleepLabels[SLEEP.indexOf(f.sleepQuality)]}`} tone={colors.protein} />
          </View>
          {TEXTS.map(([k, l]) =>
            f[k] ? (
              <View key={k} style={{ marginTop: 14 }}>
                <Txt v="caption" color={colors.textMuted}>
                  {l}
                </Txt>
                <Txt v="small">{f[k]}</Txt>
              </View>
            ) : null,
          )}
          {f.isFasting && (
            <Txt v="small" color={colors.primary} style={{ marginTop: 14 }}>
              Fasting day ✓
            </Txt>
          )}
          {f.photos.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
              {f.photos.map((p, i) => (
                <Img key={i} source={p} style={{ width: 70, height: 70, borderRadius: 14 }} />
              ))}
            </View>
          )}
        </Card>
        <Txt v="small" color={colors.danger} style={{ textAlign: 'center', marginTop: 16 }} onPress={() => del.mutate(post.id, { onSuccess: () => (setF(blank), toast.ok('Check-in deleted')), onError: toast.error })}>
          Delete today’s check-in
        </Txt>
      </Animated.View>
    );

  return (
    <View style={{ paddingHorizontal: 20, gap: 16 }}>
      <Card style={{ gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Moon size={20} color={colors.protein} />
            <Txt>Sleep</Txt>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <IconButton icon={<Txt>−</Txt>} label="Less sleep" size={40} tint={colors.secondary} onPress={() => set('sleepHours', Math.max(0, f.sleepHours - 0.5))} />
            <Txt style={{ fontFamily: font.light, fontSize: 22, minWidth: 48, textAlign: 'center' }} accessibilityLabel="Sleep hours">
              {f.sleepHours}h
            </Txt>
            <IconButton icon={<Txt color={colors.onPrimary}>+</Txt>} label="More sleep" size={40} tint={colors.primary} onPress={() => set('sleepHours', Math.min(14, f.sleepHours + 0.5))} />
          </View>
        </View>
        <Segmented value={f.sleepQuality} onChange={(v) => set('sleepQuality', v)} options={SLEEP.map((s, i) => ({ id: s, label: sleepLabels[i]! }))} />
      </Card>
      <Card style={{ gap: 12 }}>
        <Txt>Mood</Txt>
        <PickerRow count={6} value={f.mood} onChange={(v) => set('mood', v)} Icon={MoodIcon} labels={moodLabels} />
      </Card>
      <Card style={{ gap: 12 }}>
        <Txt>Energy</Txt>
        <PickerRow count={5} value={f.energy} onChange={(v) => set('energy', v)} Icon={EnergyIcon} labels={energyLabels} />
      </Card>
      <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Txt>Fasting today</Txt>
          <Txt v="caption" color={colors.textMuted}>
            Intermittent fast completed
          </Txt>
        </View>
        <Toggle value={f.isFasting} onChange={(v) => set('isFasting', v)} />
      </Card>
      {TEXTS.map(([k, l, ph]) => (
        <TextArea key={k} label={l} value={f[k]} placeholder={ph} onChange={(v) => set(k, v)} />
      ))}
      <View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Txt v="small" color={colors.textMuted}>
            Progress photos
          </Txt>
          <Txt v="small" color={colors.textMuted}>
            {f.photos.length}/10
          </Txt>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {f.photos.length < 10 && (
            <Press onPress={addPhotos} disabled={uploading} accessibilityLabel="Add progress photos" style={{ width: 74, height: 74, borderRadius: 14, borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(198,242,27,0.6)', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              <ImagePlus size={20} color={colors.primary} />
              <Txt style={{ fontSize: 10 }} color={colors.primary}>
                {uploading ? 'Uploading' : 'Add'}
              </Txt>
            </Press>
          )}
          {f.photos.map((p, i) => (
            <Animated.View key={p.slice(-24) + i} entering={FadeIn.duration(220)}>
              <Img source={p} style={{ width: 74, height: 74, borderRadius: 14 }} />
              <Pressable accessibilityLabel="Remove photo" onPress={() => set('photos', f.photos.filter((_, j) => j !== i))} style={{ position: 'absolute', right: -6, top: -6, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
                <X size={14} color={colors.text} />
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </View>
      <PrimaryButton title={post ? 'Save changes' : 'Post check-in'} loading={create.isPending || update.isPending || uploading} onPress={submit} />
      {!!post && <SecondaryButton title="Cancel" onPress={() => (setF(fromPost(post)), setEditing(false))} />}
    </View>
  );
}

function Mini({ icon, label, tone = colors.primary }: { icon: React.ReactNode; label: string; tone?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 4, backgroundColor: colors.secondary, borderRadius: 20, padding: 12 }}>
      {icon}
      <Txt v="caption" color={tone} numberOfLines={1}>
        {label}
      </Txt>
    </View>
  );
}

/* ---------------------------------------------------------------- feed ---- */

const rIcon: Record<Reaction, LucideIcon> = { LIKE: ThumbsUp, LOVE: Heart, SUPPORT: HandHeart, STRONG: BicepsFlexed, FIRE: Flame, CLAP: PartyPopper };
const rName: Record<Reaction, string> = { LIKE: 'Like', LOVE: 'Love', SUPPORT: 'Support', STRONG: 'Strong', FIRE: 'Fire', CLAP: 'Clap' };

function dayOf(post: { date: string }, start: string) {
  return Math.max(1, Math.floor((new Date(post.date.slice(0, 10)).getTime() - new Date(start.slice(0, 10)).getTime()) / 86400000) + 1);
}

export function Feed({ challengeId, startDate }: { challengeId: string; startDate: string }) {
  const q = useFeed(challengeId);
  const me = useMe();
  const react = useReactPost(challengeId);
  const comment = useCommentPost(challengeId);
  const [open, setOpen] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<FeedComment | null>(null);
  const [text, setText] = useState('');
  const posts = q.data?.pages.flatMap((p) => p.posts) ?? [];
  const target = posts.find((p) => p.id === open);

  useEffect(() => {
    if (open) markViewed(open);
  }, [open]);

  const send = () => {
    if (!target || !text.trim()) return;
    comment.mutate({ postId: target.id, content: text.trim(), parentCommentId: replyTo?.id }, { onSuccess: () => (setText(''), setReplyTo(null)), onError: toast.error });
  };

  if (q.isLoading) return <Skeleton height={320} style={{ marginHorizontal: 20 }} />;
  if (!posts.length) return <ArtEmpty art="empty-feed" title="No check-ins yet" body="Be the first to post today — your group sees it here." />;

  return (
    <View style={{ paddingHorizontal: 20, gap: 14 }}>
      {posts.map((p) => (
        <PostCard key={p.id} post={p} day={dayOf(p, startDate)} meId={me.data?.user.id} open={open === p.id} onOpen={() => (setOpen(open === p.id ? null : p.id), setReplyTo(null))} onReact={(r) => react.mutate({ postId: p.id, type: r }, { onError: toast.error })} onReply={(c) => (setOpen(p.id), setReplyTo(c))} challengeId={challengeId} />
      ))}
      {q.hasNextPage && <SecondaryButton title={q.isFetchingNextPage ? 'Loading…' : 'Load more'} onPress={() => q.fetchNextPage()} />}
      <Sheet open={!!target} onClose={() => (setOpen(null), setReplyTo(null))} title={target ? `Comment on ${target.author.firstName}’s Day ${dayOf(target, startDate)}` : ''}>
        {!!replyTo && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Txt v="small" color={colors.textMuted} style={{ flex: 1 }} numberOfLines={1}>
              Replying to {replyTo.author.firstName}: “{replyTo.content}”
            </Txt>
            <Pressable onPress={() => setReplyTo(null)} accessibilityLabel="Cancel reply">
              <X size={16} color={colors.textMuted} />
            </Pressable>
          </View>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Write a comment…"
            accessibilityLabel="Write a comment"
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.primary}
            onSubmitEditing={send}
            style={[type.body, { flex: 1, height: 50, borderRadius: radius.pill, backgroundColor: colors.secondary, paddingHorizontal: 18, color: colors.text }]}
          />
          <Press accessibilityLabel="Send comment" disabled={!text.trim() || comment.isPending} onPress={send} style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', opacity: text.trim() ? 1 : 0.4 }}>
            <SendHorizontal size={20} color={colors.onPrimary} />
          </Press>
        </View>
      </Sheet>
    </View>
  );
}

function PostCard({ post, day, meId, open, onOpen, onReact, onReply, challengeId }: { post: FeedPost; day: number; meId?: string; open: boolean; onOpen: () => void; onReact: (r: Reaction) => void; onReply: (c: FeedComment) => void; challengeId: string }) {
  const { width } = useWindowDimensions();
  const delComment = useDeleteComment(challengeId);
  const name = fullName(post.author);
  const sections = TEXTS.map(([k, l]) => [l, post[k]] as const).filter(([, v]) => !!v);
  const [showAll, setShowAll] = useState(false);
  return (
    <Animated.View entering={FadeInDown.duration(350)} layout={LinearTransition.duration(220)}>
      <Card style={{ padding: 18 }}>
        {post.isPinned && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 }}>
            <Pin size={13} color={colors.primary} />
            <Txt v="caption" color={colors.primary}>
              Pinned by coach
            </Txt>
          </View>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Avatar source={post.author.imageUrl} name={name} size={44} ring={false} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Txt numberOfLines={1} style={{ fontFamily: font.medium, flexShrink: 1 }}>
                {name}
              </Txt>
              {post.author.isAdmin && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(198,242,27,0.12)', borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 }}>
                  <ShieldCheck size={11} color={colors.primary} />
                  <Txt style={{ fontSize: 10 }} color={colors.primary}>
                    Coach
                  </Txt>
                </View>
              )}
            </View>
            <Txt v="caption" color={colors.textMuted}>
              {relative(post.createdAt)} ago{post.viewCount ? ` · ${post.viewCount} views` : ''}
            </Txt>
          </View>
          <View style={{ backgroundColor: colors.secondary, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 }}>
            <Txt v="caption">Day {day}</Txt>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
          {!!post.mood && <StatPill icon={<MoodIcon level={MOOD.indexOf(post.mood)} size={16} color={colors.primary} />} label={moodLabels[MOOD.indexOf(post.mood)]!} />}
          {!!post.energy && <StatPill icon={<EnergyIcon level={ENERGY.indexOf(post.energy)} size={16} color={colors.primary} />} label={energyLabels[ENERGY.indexOf(post.energy)]!} />}
          {post.sleepHours != null && <StatPill icon={<Moon size={15} color={colors.protein} />} label={`${post.sleepHours}h`} tone={colors.protein} />}
          {post.isFasting && <StatPill label="Fasting" />}
        </View>
        {(showAll ? sections : sections.slice(0, 2)).map(([l, v]) => (
          <View key={l} style={{ marginTop: 10 }}>
            <Txt v="caption" color={colors.textMuted}>
              {l}
            </Txt>
            <Txt v="small" style={{ lineHeight: 20 }}>
              {v}
            </Txt>
          </View>
        ))}
        {sections.length > 2 && (
          <Txt v="small" color={colors.primary} style={{ marginTop: 6 }} onPress={() => setShowAll(!showAll)}>
            {showAll ? 'Show less' : 'Read more'}
          </Txt>
        )}
        {post.photos.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={width * 0.62 + 8} decelerationRate="fast" style={{ marginHorizontal: -18, marginTop: 14 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 18 }}>
            {post.photos.map((p, i) => (
              <Img key={i} source={p} accessibilityLabel={`Check-in photo ${i + 1}`} style={{ width: width * 0.62, aspectRatio: 4 / 5, borderRadius: 24 }} />
            ))}
          </ScrollView>
        )}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -18, marginTop: 14 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 18 }}>
          {REACTIONS.map((r, keyIdx) => {
            const I = rIcon[r];
            const on = post.userReaction?.type === r;
            return (
              <Press key={`${r}-${keyIdx}`} accessibilityLabel={`${rName[r]} reaction`} accessibilityState={{ selected: on }} onPress={() => onReact(r)} scaleTo={0.88} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: on ? colors.primary : colors.border, backgroundColor: on ? 'rgba(198,242,27,0.1)' : 'transparent', paddingHorizontal: 12, paddingVertical: 7 }}>
                <I size={16} color={on ? colors.primary : colors.textMuted} fill={on && (r === 'LOVE' || r === 'FIRE') ? colors.primary : 'transparent'} />
                <Txt v="caption" color={on ? colors.primary : colors.textMuted}>
                  {post.reactionCounts[r] ?? 0}
                </Txt>
              </Press>
            );
          })}
        </ScrollView>
        <Press onPress={onOpen} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }} accessibilityLabel={`${post.commentCount} comments`}>
          <MessageCircle size={16} color={colors.textMuted} />
          <Txt v="small" color={colors.textMuted}>
            {post.commentCount} comment{post.commentCount === 1 ? '' : 's'} · Reply
          </Txt>
        </Press>
        {post.comments.length > 0 && (
          <View style={{ marginTop: 6 }}>
            {post.comments.slice(0, open ? undefined : 2).map((c) => (
              <CommentItem key={c.id} c={c} meId={meId} onReply={onReply} onDelete={(id) => delComment.mutate(id, { onError: toast.error })} />
            ))}
          </View>
        )}
      </Card>
    </Animated.View>
  );
}

function StatPill({ icon, label, tone = colors.primary }: { icon?: React.ReactNode; label: string; tone?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.secondary, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6 }}>
      {icon}
      <Txt v="caption" color={tone}>
        {label}
      </Txt>
    </View>
  );
}

function CommentItem({ c, depth = 0, meId, onReply, onDelete }: { c: FeedComment; depth?: number; meId?: string; onReply: (c: FeedComment) => void; onDelete: (id: string) => void }) {
  const name = fullName(c.author);
  return (
    <View style={depth ? { marginLeft: 40, borderLeftWidth: 1, borderColor: colors.border, paddingLeft: 10 } : undefined}>
      <View style={{ flexDirection: 'row', gap: 10, paddingVertical: 6 }}>
        <Avatar source={c.author.imageUrl} name={name} size={32} ring={false} />
        <View style={{ flex: 1, backgroundColor: colors.secondary, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Txt v="caption" style={{ fontFamily: font.medium }}>
              {name}
            </Txt>
            {c.author.isAdmin && <ShieldCheck size={12} color={colors.primary} />}
            <Txt v="caption" color={colors.textMuted}>
              · {relative(c.createdAt)}
            </Txt>
          </View>
          <Txt v="small" style={{ marginTop: 2 }}>
            {c.content}
          </Txt>
          <View style={{ flexDirection: 'row', gap: 14, marginTop: 6 }}>
            {depth === 0 && (
              <Txt v="caption" color={colors.primary} onPress={() => onReply(c)}>
                Reply
              </Txt>
            )}
            {c.author.userId === meId && (
              <Pressable onPress={() => onDelete(c.id)} accessibilityLabel="Delete comment" hitSlop={6}>
                <Trash2 size={13} color={colors.textMuted} />
              </Pressable>
            )}
          </View>
        </View>
      </View>
      {c.replies?.map((r) => (
        <CommentItem key={r.id} c={r} depth={depth + 1} meId={meId} onReply={onReply} onDelete={onDelete} />
      ))}
    </View>
  );
}

/* ------------------------------------------------------------ calendar ---- */

export function ChallengeCalendar({ challengeId, startDate, endDate }: { challengeId: string; startDate: string; endDate: string }) {
  const now = new Date();
  const [cursor, setCursor] = useState({ m: now.getMonth() + 1, y: now.getFullYear() });
  const q = useChallengeCalendar(challengeId, cursor.m, cursor.y);
  const days = useMemo(() => {
    const first = new Date(cursor.y, cursor.m - 1, 1);
    const n = new Date(cursor.y, cursor.m, 0).getDate();
    return { lead: first.getDay(), n };
  }, [cursor]);
  const posted = new Set((q.data ?? []).map((p) => Number(p.date.slice(8, 10))));
  const t = today();
  const label = new Date(cursor.y, cursor.m - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const shift = (d: number) => setCursor(({ m, y }) => {
    const x = new Date(y, m - 1 + d, 1);
    return { m: x.getMonth() + 1, y: x.getFullYear() };
  });
  const ymdOf = (d: number) => `${cursor.y}-${String(cursor.m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return (
    <Card style={{ padding: 18 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <IconButton icon={ChevronLeft} label="Previous month" size={38} tint={colors.secondary} onPress={() => shift(-1)} />
        <Txt v="bodyLg">{label}</Txt>
        <IconButton icon={ChevronRight} label="Next month" size={38} tint={colors.secondary} onPress={() => shift(1)} />
      </View>
      <View style={{ flexDirection: 'row' }}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <Txt key={i} v="caption" color={colors.textMuted} style={{ flex: 1, textAlign: 'center' }}>
            {d}
          </Txt>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
        {Array.from({ length: days.lead }, (_, i) => (
          <View key={`l${i}`} style={{ width: `${100 / 7}%`, height: 42 }} />
        ))}
        {Array.from({ length: days.n }, (_, i) => {
          const d = i + 1;
          const k = ymdOf(d);
          const inRange = k >= startDate.slice(0, 10) && k <= endDate.slice(0, 10);
          const isToday = k === t;
          const done = posted.has(d);
          const future = k > t;
          return (
            <View key={d} style={{ width: `${100 / 7}%`, height: 42, alignItems: 'center', justifyContent: 'center' }}>
              <View accessibilityLabel={`${k}${done ? ' checked in' : ''}`} style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: done ? colors.primary : 'transparent', borderWidth: isToday && !done ? 1.5 : done ? 0 : inRange && !future ? 1 : 0, borderColor: isToday ? colors.primary : colors.border, opacity: future || !inRange ? 0.35 : 1 }}>
                <Txt v="small" color={done ? colors.onPrimary : colors.text}>
                  {d}
                </Txt>
              </View>
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
        <Legend dot={colors.primary} label="Checked in" />
        <Legend ring={colors.border} label="Missed" />
        <Legend ring={colors.primary} label="Today" />
      </View>
    </Card>
  );
}

function Legend({ dot, ring, label }: { dot?: string; ring?: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: dot ?? 'transparent', borderWidth: ring ? 1.5 : 0, borderColor: ring }} />
      <Txt v="caption" color={colors.textMuted}>
        {label}
      </Txt>
    </View>
  );
}


