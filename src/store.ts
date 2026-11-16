import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Device-only UI state. Everything about the member (workouts, meals, challenges,
 * goals…) lives in c7-backend and is configured by coaches in FitForge.
 */
type State = {
  onboarded: boolean;
  /** Notification ids the member has opened (notifications themselves are derived server-side). */
  readNotifications: string[];
  /** AUTH_MODE=test only: the signed-in test user id. */
  testUserId: string | null;
  /** Workout in progress, so leaving the logger doesn't lose sets. */
  draft: WorkoutDraft | null;
};
export type DraftSet = { weight: string; reps: string; duration: string; done: boolean; restTimeSeconds?: number; startedAt?: string; endedAt?: string };
export type WorkoutDraft = { planId: string; assignmentId?: string; startedAt: number; restSeconds: number; sets: Record<string, DraftSet[]> };

type Actions = {
  set: (patch: Partial<State>) => void;
  markRead: (ids: string[]) => void;
};

export const useApp = create<State & Actions>()(
  persist(
    (set, get) => ({
      onboarded: false,
      readNotifications: [],
      testUserId: null,
      draft: null,
      set: (patch) => set(patch),
      markRead: (ids) => set({ readNotifications: [...new Set([...get().readNotifications, ...ids])].slice(-300) }),
    }),
    { name: 'c7-device-state', storage: createJSONStorage(() => AsyncStorage), version: 2 },
  ),
);

/** Session-scoped flags (not persisted). */
export const useSessionUi = create<{ locked: boolean; setLocked: (v: boolean) => void }>((set) => ({ locked: false, setLocked: (locked) => set({ locked }) }));
