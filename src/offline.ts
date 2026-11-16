import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Video } from './api/gym';

/** Workout videos saved on this device for offline use. Metadata is kept so the list works with no signal. */
export type SavedVideo = { video: Video; uri: string; bytes: number; savedAt: string };
type S = {
  saved: Record<string, SavedVideo>;
  progress: Record<string, number>;
  setProgress: (id: string, p: number | null) => void;
  put: (v: SavedVideo) => void;
  drop: (id: string) => void;
};
export const useOffline = create<S>()(
  persist(
    (set, get) => ({
      saved: {},
      progress: {},
      setProgress: (id, p) => {
        const next = { ...get().progress };
        if (p == null) delete next[id];
        else next[id] = p;
        set({ progress: next });
      },
      put: (v) => set({ saved: { ...get().saved, [v.video.id]: v } }),
      drop: (id) => {
        const next = { ...get().saved };
        delete next[id];
        set({ saved: next });
      },
    }),
    { name: 'c7-offline-videos', storage: createJSONStorage(() => AsyncStorage), version: 1, partialize: (s) => ({ saved: s.saved }) as Partial<S> },
  ),
);

export const canDownload = Platform.OS !== 'web';

/** Downloads a video into the app's document folder (survives restarts, removed with the app). */
export async function downloadVideo(v: Video) {
  const st = useOffline.getState();
  if (!canDownload) throw new Error('Downloads work in the C7 app on your phone.');
  const FS = await import('expo-file-system/legacy');
  const dir = `${FS.documentDirectory}videos/`;
  await FS.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
  const ext = v.videoUrl.split('?')[0]!.split('.').pop()?.slice(0, 4) || 'mp4';
  const target = `${dir}${v.id}.${ext}`;
  const free = await FS.getFreeDiskStorageAsync().catch(() => Number.MAX_SAFE_INTEGER);
  if (v.sizeBytes && free < v.sizeBytes * 1.2) throw new Error('Not enough free space on your phone for this video.');
  st.setProgress(v.id, 0);
  try {
    const job = FS.createDownloadResumable(v.videoUrl, target, {}, (p) => {
      if (p.totalBytesExpectedToWrite > 0) useOffline.getState().setProgress(v.id, p.totalBytesWritten / p.totalBytesExpectedToWrite);
    });
    const r = await job.downloadAsync();
    if (!r || r.status >= 400) throw new Error('The video couldn’t be downloaded. Try again on Wi-Fi.');
    const info = await FS.getInfoAsync(r.uri);
    useOffline.getState().put({ video: v, uri: r.uri, bytes: info.exists ? (info.size ?? 0) : 0, savedAt: new Date().toISOString() });
  } catch (e) {
    await FS.deleteAsync(target, { idempotent: true }).catch(() => {});
    throw e instanceof Error ? e : new Error('Download failed');
  } finally {
    useOffline.getState().setProgress(v.id, null);
  }
}

export async function removeDownload(id: string) {
  const s = useOffline.getState().saved[id];
  if (s && canDownload) {
    const FS = await import('expo-file-system/legacy');
    await FS.deleteAsync(s.uri, { idempotent: true }).catch(() => {});
  }
  useOffline.getState().drop(id);
}

/** A saved copy is stale when the coach replaced the video after it was downloaded. */
export const isStale = (s: SavedVideo, latest?: Video) => !!latest && latest.updatedAt !== s.video.updatedAt;
