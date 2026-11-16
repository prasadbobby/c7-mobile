import * as ImagePicker from 'expo-image-picker';
import { ArrowLeftRight, Camera, Plus, Trash2, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { errorMessage } from '@/api/client';
import { today } from '@/api/dates';
import { shortDate, useAddProgressPhoto, useDeleteProgressPhoto, useProgressPhotos, type Pose, type ProgressPhoto } from '@/api/gym';
import { uploadImage } from '@/api/hooks';
import { Empty, Headline, Label, Numeral, Page, Tabs } from '@/gymui';
import { colors, font, radius } from '@/theme';
import { Field, IconButton, Img, PrimaryButton, SecondaryButton, Sheet, Skeleton, toast, Txt } from '@/ui';

const POSES: { id: Pose; label: string }[] = [
  { id: 'FRONT', label: 'Front' },
  { id: 'SIDE', label: 'Side' },
  { id: 'BACK', label: 'Back' },
];

/** Private progress photos with a side-by-side compare. Same pose, same light, every few weeks. */
export default function Photos() {
  const q = useProgressPhotos();
  const add = useAddProgressPhoto();
  const del = useDeleteProgressPhoto();
  const { width } = useWindowDimensions();
  const [pose, setPose] = useState<Pose>('FRONT');
  const [picked, setPicked] = useState<string[]>([]);
  const [draft, setDraft] = useState<{ uri: string; dataUrl: string } | null>(null);
  const [draftPose, setDraftPose] = useState<Pose>('FRONT');
  const [weight, setWeight] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [viewing, setViewing] = useState<ProgressPhoto | null>(null);

  const photos = useMemo(() => (q.data?.photos ?? []).filter((p) => p.pose === pose), [q.data, pose]);
  const col = Math.floor((Math.min(width, 520) - 40 - 10) / 2);
  const pair = picked.map((id) => q.data?.photos.find((p) => p.id === id)).filter(Boolean) as ProgressPhoto[];
  const [a, b] = [...pair].sort((x, y) => x.takenAt.localeCompare(y.takenAt));

  const choose = async (camera: boolean) => {
    setErr(null);
    if (camera && Platform.OS !== 'web') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return setErr('Allow camera access in Settings to take a photo, or pick one from your library.');
    }
    const fn = camera && Platform.OS !== 'web' ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
    const r = await fn({ mediaTypes: ['images'], quality: 0.7, base64: true, allowsEditing: true, aspect: [3, 4] });
    if (r.canceled || !r.assets[0]) return;
    try {
      setDraft({ uri: r.assets[0].uri, dataUrl: await uploadImage(r.assets[0]) });
      setDraftPose(pose);
    } catch (e) {
      setErr(errorMessage(e));
    }
  };
  const save = async () => {
    if (!draft) return;
    const w = weight ? Number(weight.replace(',', '.')) : undefined;
    if (w !== undefined && !(w >= 20 && w <= 350)) return setErr('Weight should be between 20 and 350 kg, or leave it empty.');
    try {
      await add.mutateAsync({ imageUrl: draft.dataUrl, pose: draftPose, takenAt: today(), weight: w });
      setPose(draftPose);
      setDraft(null);
      setWeight('');
      toast.ok('Photo saved');
    } catch (e) {
      setErr(errorMessage(e));
    }
  };
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p.slice(-1), id]));

  // Compare = the two picked photos, or the first and latest of this pose.
  const chrono = [...photos].sort((x, y) => x.takenAt.localeCompare(y.takenAt));
  const before = a ?? chrono[0];
  const after = b ?? (chrono.length > 1 ? chrono[chrono.length - 1] : undefined);
  const daysApart = before && after ? Math.round((new Date(after.takenAt).getTime() - new Date(before.takenAt).getTime()) / 86400000) : 0;

  return (
    <Page title="Progress photos" error={q.error} onRetry={() => q.refetch()} onRefresh={() => q.refetch()} refreshing={q.isRefetching} right={<IconButton icon={Plus} label="Add photo" tint={colors.card} onPress={() => choose(false)} />}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: 14 }}>
        <Headline lead="Same you." tail="Stronger story." tone="lime" size={30} />
        <View style={{ alignItems: 'flex-end' }}>
          <Numeral size={44}>{daysApart}</Numeral>
          <Label style={{ marginTop: 4 }}>Days apart</Label>
        </View>
      </View>

      {before && after ? (
        <View style={{ marginTop: 18 }}>
          <Compare before={before} after={after} />
          {before.weight != null && after.weight != null && (
            <Txt v="caption" color={colors.textMuted} style={{ marginTop: 8 }}>
              {before.weight} kg → {after.weight} kg ({after.weight - before.weight > 0 ? '+' : ''}
              {(after.weight - before.weight).toFixed(1)} kg)
            </Txt>
          )}
        </View>
      ) : null}

      <View style={{ marginTop: 18 }}>
        <Tabs value={pose} onChange={(v) => (setPose(v), setPicked([]))} options={POSES} />
      </View>

      {!q.data ? (
        <Skeleton height={260} style={{ marginTop: 16 }} />
      ) : photos.length === 0 ? (
        <Empty
          art="progressPhotos"
          title={`No ${pose.toLowerCase()} photos yet`}
          body="Take one in the same spot and light every few weeks. Only you can see them."
          action={
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {Platform.OS !== 'web' && <PrimaryButton title="Take photo" icon={Camera} onPress={() => choose(true)} />}
              <SecondaryButton title="Choose from library" onPress={() => choose(false)} />
            </View>
          }
        />
      ) : (
        <View style={{ marginTop: 22, gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Label>Photo journal</Label>
            <Label>{String(photos.length).padStart(2, '0')} check-ins</Label>
          </View>
          {photos.length === 1 && <Txt v="caption" color={colors.textMuted}>Add another {pose.toLowerCase()} photo later to compare.</Txt>}
          {photos.length > 2 && <Txt v="caption" color={colors.textMuted}>{picked.length < 2 ? 'Tap two photos to compare them.' : 'Comparing your two picks.'}</Txt>}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {chrono.map((p) => {
              const on = picked.includes(p.id);
              return (
                <Pressable key={p.id} onPress={() => toggle(p.id)} onLongPress={() => setViewing(p)} accessibilityLabel={`Photo from ${shortDate(p.takenAt)}${on ? ', selected' : ''}`} style={{ width: col }}>
                  <Img source={p.imageUrl} style={{ width: col, height: col * 1.25, borderRadius: 12, borderWidth: on ? 2 : 0, borderColor: colors.primary }} />
                  <Txt v="caption" style={{ marginTop: 6 }}>{shortDate(p.takenAt)}</Txt>
                  <Label style={{ fontSize: 10, marginTop: 2 }} color={on ? colors.primary : colors.textMuted}>
                    {`Day ${String(Math.round((new Date(p.takenAt).getTime() - new Date(chrono[0]!.takenAt).getTime()) / 86400000) + 1).padStart(2, '0')}${p.weight ? ` · ${p.weight} kg` : ''}`}
                  </Label>
                </Pressable>
              );
            })}
          </View>
          {!!err && <Txt v="small" color={colors.danger}>{err}</Txt>}
          <Txt v="caption" color={colors.textDim}>Long-press a photo to view or delete it.</Txt>
        </View>
      )}

      <Sheet open={!!draft} onClose={() => setDraft(null)} title="Save photo">
        {!!draft && (
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', gap: 14 }}>
              <Img source={draft.uri} style={{ width: 96, height: 128, borderRadius: 10 }} />
              <View style={{ flex: 1, gap: 10 }}>
                <Tabs value={draftPose} onChange={setDraftPose} options={POSES} />
                <Field placeholder="Weight today (kg, optional)" keyboardType="decimal-pad" value={weight} onChangeText={setWeight} accessibilityLabel="Weight today" />
              </View>
            </View>
            {!!err && <Txt v="small" color={colors.danger}>{err}</Txt>}
            <PrimaryButton title="Save" onPress={save} loading={add.isPending} />
          </View>
        )}
      </Sheet>

      <Sheet open={!!viewing} onClose={() => setViewing(null)} title={viewing ? shortDate(viewing.takenAt) : ''}>
        {!!viewing && (
          <View style={{ gap: 12 }}>
            <Img source={viewing.imageUrl} style={{ width: '100%', aspectRatio: 0.75, borderRadius: radius.md }} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <SecondaryButton title="Close" leading={<X size={16} color={colors.text} />} onPress={() => setViewing(null)} style={{ flex: 1 }} />
              <SecondaryButton title="Delete" leading={<Trash2 size={16} color={colors.danger} />} onPress={() => del.mutateAsync(viewing.id).then(() => (setViewing(null), setPicked((p) => p.filter((x) => x !== viewing.id)), toast.ok('Photo deleted'))).catch(toast.error)} style={{ flex: 1 }} />
            </View>
          </View>
        )}
      </Sheet>
    </Page>
  );
}

/** Before/after split: drag anywhere on the photo to move the lime divider. */
function Compare({ before, after }: { before: ProgressPhoto; after: ProgressPhoto }) {
  const [w, setW] = useState(0);
  const split = useSharedValue(0.5);
  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      if (w) split.value = Math.min(1, Math.max(0, e.x / w));
    })
    .onUpdate((e) => {
      if (w) split.value = Math.min(1, Math.max(0, e.x / w));
    });
  const clip = useAnimatedStyle(() => ({ width: `${split.value * 100}%` }));
  const line = useAnimatedStyle(() => ({ left: `${split.value * 100}%` }));
  const d = (p: ProgressPhoto) => new Date(p.takenAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }).toUpperCase();
  const chip = (t: string, right?: boolean) => (
    <View style={[{ position: 'absolute', bottom: 12, backgroundColor: 'rgba(5,6,5,0.8)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }, right ? { right: 12 } : { left: 12 }]}>
      <Txt style={{ fontSize: 10 }}>{t}</Txt>
    </View>
  );
  return (
    <GestureDetector gesture={pan}>
      <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ aspectRatio: 4 / 5, borderRadius: 24, overflow: 'hidden', backgroundColor: colors.card }} accessibilityLabel="Before and after comparison, drag to compare">
        <Img source={after.imageUrl} style={StyleSheet.absoluteFill} />
        <Animated.View style={[{ position: 'absolute', top: 0, bottom: 0, left: 0, overflow: 'hidden' }, clip]}>
          <Img source={before.imageUrl} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: w || 1 }} />
        </Animated.View>
        {chip(d(before))}
        {chip(d(after), true)}
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, bottom: 0, width: 2, marginLeft: -1, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, line]}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeftRight size={18} color={colors.onPrimary} />
          </View>
        </Animated.View>
      </View>
    </GestureDetector>
  );
}
