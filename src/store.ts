import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Goal = 'lose' | 'tone' | 'muscle' | 'endurance';
export type Log = { id: string; workoutId: string; at: number; minutes: number; kcal: number };
export type MealLog = { id: string; mealId: string; at: number; slot: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' };

type State = {
  onboarded: boolean;
  signedIn: boolean;
  name: string;
  email: string;
  goal: Goal;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  weightKg: number;
  heightCm: number;
  age: number;
  stepGoal: number;
  kcalGoal: number;
  waterMl: number;
  following: string[];
  saved: string[];
  liked: string[];
  joinedChallenges: string[];
  challengeProgress: Record<string, number>;
  workoutLog: Log[];
  mealLog: MealLog[];
  weightLog: { at: number; kg: number }[];
  settings: { push: boolean; haptics: boolean; metric: boolean; reminders: boolean };
};

type Actions = {
  set: (patch: Partial<State>) => void;
  toggle: (key: 'following' | 'saved' | 'liked', id: string) => void;
  joinChallenge: (id: string) => void;
  checkInChallenge: (id: string) => void;
  logWorkout: (workoutId: string, minutes: number, kcal: number) => void;
  logMeal: (mealId: string, slot: MealLog['slot']) => void;
  addWater: (ml: number) => void;
  logWeight: (kg: number) => void;
  signOut: () => void;
};

const day = 86_400_000;
const now = Date.now();

const initial: State = {
  onboarded: false,
  signedIn: false,
  name: 'Emma',
  email: '',
  goal: 'tone',
  level: 'Intermediate',
  weightKg: 49,
  heightCm: 168,
  age: 34,
  stepGoal: 10000,
  kcalGoal: 1800,
  waterMl: 1250,
  following: [],
  saved: [],
  liked: [],
  joinedChallenges: ['hydration-hero'],
  challengeProgress: { 'hydration-hero': 4 },
  workoutLog: [
    { id: 'l1', workoutId: 'concentration-curl', at: now - day, minutes: 15, kcal: 120 },
    { id: 'l2', workoutId: 'tempo-run', at: now - 2 * day, minutes: 20, kcal: 240 },
    { id: 'l3', workoutId: 'core-blast', at: now - 4 * day, minutes: 15, kcal: 160 },
  ],
  mealLog: [
    { id: 'm1', mealId: 'berry-yogurt', at: now, slot: 'Breakfast' },
    { id: 'm2', mealId: 'power-bowl', at: now, slot: 'Lunch' },
  ],
  weightLog: [52, 51.4, 51, 50.6, 50.1, 49.6, 49].map((kg, i) => ({ at: now - (6 - i) * 7 * day, kg })),
  settings: { push: true, haptics: true, metric: true, reminders: true },
};

export const useApp = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...initial,
      set: (patch) => set(patch),
      toggle: (key, id) => {
        const list = get()[key];
        set({ [key]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id] } as Partial<State>);
      },
      joinChallenge: (id) => {
        const { joinedChallenges, challengeProgress } = get();
        if (joinedChallenges.includes(id)) return;
        set({ joinedChallenges: [...joinedChallenges, id], challengeProgress: { ...challengeProgress, [id]: 0 } });
      },
      checkInChallenge: (id) => {
        const p = get().challengeProgress;
        set({ challengeProgress: { ...p, [id]: (p[id] ?? 0) + 1 } });
      },
      logWorkout: (workoutId, minutes, kcal) =>
        set({ workoutLog: [{ id: String(Date.now()), workoutId, at: Date.now(), minutes, kcal }, ...get().workoutLog] }),
      logMeal: (mealId, slot) => set({ mealLog: [...get().mealLog, { id: String(Date.now()), mealId, at: Date.now(), slot }] }),
      addWater: (ml) => set({ waterMl: Math.max(0, get().waterMl + ml) }),
      logWeight: (kg) => set({ weightKg: kg, weightLog: [...get().weightLog, { at: Date.now(), kg }] }),
      signOut: () => set({ signedIn: false }),
    }),
    { name: 'pulsefit-state', storage: createJSONStorage(() => AsyncStorage), version: 1 },
  ),
);
