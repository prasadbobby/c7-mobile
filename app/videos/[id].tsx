import { useLocalSearchParams } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Download, Trash2 } from 'lucide-react-native';
import { View } from 'react-native';
import { fileSize, mmss, useVideo } from '@/api/gym';
import { Page, Tag } from '@/gymui';
import { canDownload, downloadVideo, isStale, removeDownload, useOffline } from '@/offline';
import { colors, radius } from '@/theme';
import { PrimaryButton, SecondaryButton, Skeleton, toast, Txt } from '@/ui';

function Player({ uri, loop }: { uri: string; loop: boolean }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = loop;
  });
  return <VideoView player={player} style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: radius.md, backgroundColor: '#000' }} nativeControls contentFit="contain" allowsPictureInPicture />;
}

export default function VideoDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const saved = useOffline((s) => (id ? s.saved[id] : undefined));
  const progress = useOffline((s) => (id ? s.progress[id] : undefined));
  const q = useVideo(id);
  // Offline: fall back to the copy saved on this phone.
  const v = q.data?.video ?? saved?.video;
  const stale = !!saved && isStale(saved, q.data?.video);
  const uri = saved && !stale ? saved.uri : v?.videoUrl;

  return (
    <Page title="Video" error={!v ? q.error : undefined} onRetry={() => q.refetch()}>
      {!v || !uri ? (
        <Skeleton height={240} />
      ) : (
        <View style={{ gap: 16 }}>
          <Player key={uri} uri={uri} loop={v.isAnimated} />
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <Tag label={v.category} />
              {v.isAnimated && <Tag label="Animated demo" tone={colors.protein} />}
              {!!saved && !stale && <Tag label="On this phone" tone={colors.primary} />}
            </View>
            <Txt v="h2">{v.title}</Txt>
            <Txt v="small" color={colors.textMuted}>
              {v.durationSec ? mmss(v.durationSec) : ''}
              {v.sizeBytes ? ` · ${fileSize(v.sizeBytes)}` : ''}
            </Txt>
            {!!v.description && <Txt color={colors.text}>{v.description}</Txt>}
          </View>
          {canDownload &&
            (saved && !stale ? (
              <SecondaryButton title="Remove download" leading={<Trash2 size={16} color={colors.text} />} onPress={() => removeDownload(v.id).then(() => toast.ok('Removed from this phone'))} />
            ) : (
              <PrimaryButton
                title={progress != null ? `Downloading ${Math.round(progress * 100)}%` : stale ? 'Download the new version' : 'Download for offline'}
                icon={Download}
                loading={progress != null}
                onPress={() => downloadVideo(v).then(() => toast.ok('Saved for offline')).catch(toast.error)}
              />
            ))}
        </View>
      )}
    </Page>
  );
}
