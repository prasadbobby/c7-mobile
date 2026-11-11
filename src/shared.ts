import { Droplet, Dumbbell, Footprints, Salad, type LucideIcon } from 'lucide-react-native';
import { useMemo } from 'react';
import { meals, type Challenge } from './data';
import { useApp } from './store';

export const kindIcon: Record<Challenge['kind'], LucideIcon> = { steps: Footprints, workout: Dumbbell, nutrition: Salad, hydration: Droplet };

export function useTodayMacros() {
  const log = useApp((s) => s.mealLog);
  return useMemo(() => {
    const today = new Date().toDateString();
    const items = log.filter((l) => new Date(l.at).toDateString() === today).map((l) => ({ ...l, meal: meals.find((m) => m.id === l.mealId)! }));
    const sum = (k: 'kcal' | 'protein' | 'carbs' | 'fat') => items.reduce((a, i) => a + i.meal[k], 0) + (k === 'kcal' ? 310 : k === 'protein' ? 38 : k === 'carbs' ? 36 : 14);
    return { items, kcal: sum('kcal'), protein: sum('protein'), carbs: sum('carbs'), fat: sum('fat') };
  }, [log]);
}

