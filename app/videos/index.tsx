import { router } from 'expo-router';
import { Check, Download, Play, WifiOff } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { mmss, useVideos, type Video, type VideoCategory } from '@/api/gym';
import { Empty, Headline, Label, Page, Tabs } from '@/gymui';
import { canDownload, downloadVideo, isStale, useOffline } from '@/offline';
import { colors, font } from '@/theme';
import { Img, Press, Skeleton, toast, Txt } from '@/ui';

const CATS: { id: VideoCategory | 'all' | 'saved'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'warmup', label: 'Warm up' },
  { id: 'strength', label: 'Strength' },
  { id: 'cardio', label: 'Cardio' },
  { id: 'mobility', label: 'Mobility' },
  { id: 'core', label: 'Core' },
  { id: 'saved', label: 'Saved' },
];

function Ring({ p }: { p: number }) {
  return (
    <Svg width={28} height={28} viewBox="0 0 36 36" accessibilityLabel={`Downloading ${Math.round(p * 100)}%`}>
      <Circle cx={18} cy={18} r={14} fill="none" stroke={colors.secondary} strokeWidth={3} />
      <Circle cx={18} cy={18} r={14} fill="none" stroke={colors.primary} strokeWidth={3} strokeDasharray={`${p * 88} 88`} transform="rotate(-90 18 18)" />
    </Svg>
  );
}

function VideoTile({ v, i, offline }: { v: Video; i: number; offline: boolean }) {
  const saved = useOffline((s) => s.saved[v.id]);
  const progress = useOffline((s) => s.progress[v.id]);
  const stale = !!saved && isStale(saved, v);
  return (
    <View>
      <Press onPress={() => router.push(`/videos/${v.id}`)} scaleTo={0.99} accessibilityLabel={`Play ${v.title}`} style={{ aspectRatio: 16 / 9, borderRadius: 18, overflow: 'hidden', backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
        {!!v.thumbnailUrl && <Img source={v.thumbnailUrl} style={StyleSheet.absoluteFill} />}
        <Play size={30} color={colors.primary} fill={colors.primary} />
        {v.isAnimated && (
          <View style={{ position: 'absolute', left: 12, top: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, backgroundColor: 'rgba(5,6,5,0.8)', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 }}>
            <Txt style={{ fontSize: 9, letterSpacing: 0.8 }}>ANIMATED DEMO</Txt>
          </View>
        )}
        {v.durationSec > 0 && (
          <Txt v="caption" style={{ position: 'absolute', right: 14, bottom: 12, fontVariant: ['tabular-nums'] }}>
            {mmss(v.durationSec)}
          </Txt>
        )}
      </Press>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: 10, gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Label>
            {v.category} / {String(i + 1).padStart(2, '0')}
          </Label>
          <Txt style={{ fontFamily: font.light, fontSize: 16, marginTop: 4 }}>{v.title}</Txt>
          {!!stale && (
            <Txt v="caption" color={colors.carbs} style={{ marginTop: 2 }}>
              Updated by your coach — save again
            </Txt>
          )}
        </View>
        {canDownload && !offline && (
          <Press
            onPress={() => (saved && !stale) || progress != null ? undefined : downloadVideo(v).then(() => toast.ok('Saved for offline')).catch(toast.error)}
            accessibilityLabel={saved && !stale ? `Downloaded ${v.title}` : `Download ${v.title}`}
            style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
          >
            {saved && !stale ? <Check size={20} color={colors.primary} /> : progress != null ? <Ring p={progress} /> : <Download size={20} color={colors.primary} />}
          </Press>
        )}
      </View>
    </View>
  );
}

/** Lovable "Workout videos": movement library, offline strip, saved states. */
export default function Videos() {
  const [cat, setCat] = useState<(typeof CATS)[number]['id']>('all');
  const q = useVideos(cat === 'all' || cat === 'saved' ? undefined : cat);
  const saved = useOffline((s) => s.saved);
  const savedList = useMemo(() => Object.values(saved).sort((a, b) => b.savedAt.localeCompare(a.savedAt)), [saved]);
  const offline = !!q.error && savedList.length > 0;
  const list: Video[] = cat === 'saved' || offline ? savedList.map((s) => s.video) : (q.data?.videos ?? []);

  return (
    <Page title="Workout videos" error={!offline && cat !== 'saved' ? q.error : undefined} onRetry={() => q.refetch()} onRefresh={() => q.refetch()} refreshing={q.isRefetching}>
      <View style={{ paddingTop: 14 }}>
        <Label>The movement library</Label>
        <View style={{ marginTop: 10 }}>
          <Headline lead="Good form." tail="Every rep." size={36} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border }}>
        <WifiOff size={14} color={offline ? colors.carbs : colors.textMuted} />
        <Txt style={{ fontSize: 10, flex: 1 }} color={offline ? colors.carbs : colors.textMuted}>
          {offline ? 'You’re offline · showing videos saved on this phone' : canDownload ? 'Save a demo to watch without signal' : 'Offline saving works in the C7 app on iPhone and Android'}
        </Txt>
        {canDownload && (
          <Txt style={{ fontSize: 10, letterSpacing: 0.8 }} color={colors.primary}>
            {savedList.length} SAVED
          </Txt>
        )}
      </View>
      <View style={{ marginTop: 16 }}>
        <Tabs value={cat} onChange={setCat} options={CATS.filter((c) => c.id !== 'saved' || canDownload)} />
      </View>
      {!q.data && !offline && cat !== 'saved' ? (
        <Skeleton height={240} style={{ marginTop: 16 }} />
      ) : list.length === 0 ? (
        <Empty art="videosOffline" title={cat === 'saved' ? 'Nothing saved yet' : 'No videos here yet'} body={cat === 'saved' ? 'Tap the download icon on any video to keep it for the gym floor.' : 'Your coach publishes form videos and animated demos here.'} />
      ) : (
        <View style={{ marginTop: 18, gap: 26 }}>
          {list.map((v, i) => (
            <VideoTile key={v.id} v={v} i={i} offline={offline || cat === 'saved'} />
          ))}
        </View>
      )}
    </Page>
  );
}
