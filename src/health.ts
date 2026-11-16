import { Platform } from 'react-native';

/**
 * Phone step counter (Core Motion on iPhone). Apple Watch / Wear OS steps reach C7 through
 * Fitbit (supported today via the C7 web account) or Health Connect / HealthKit in the store build.
 */
export type StepSource = { available: boolean; reason?: string };

export async function phoneStepsAvailable(): Promise<StepSource> {
  if (Platform.OS === 'web') return { available: false, reason: 'Step counting works in the C7 app on your phone.' };
  if (Platform.OS === 'android') return { available: false, reason: 'Android phones keep steps in Health Connect — connect Fitbit below, or log steps manually.' };
  try {
    const { Pedometer } = await import('expo-sensors');
    if (!(await Pedometer.isAvailableAsync())) return { available: false, reason: 'This phone has no motion step counter.' };
    const perm = await Pedometer.requestPermissionsAsync();
    if (!perm.granted) return { available: false, reason: 'Allow Motion & Fitness access for C7 in Settings to sync steps.' };
    return { available: true };
  } catch {
    return { available: false, reason: 'Step counting isn’t available on this device.' };
  }
}

/** Steps counted by the phone since local midnight of `day` (YYYY-MM-DD), up to now or that day's end. */
export async function phoneStepsFor(day: string): Promise<number> {
  const { Pedometer } = await import('expo-sensors');
  const start = new Date(`${day}T00:00:00`);
  const end = new Date(Math.min(Date.now(), start.getTime() + 86_400_000 - 1));
  const r = await Pedometer.getStepCountAsync(start, end);
  return r.steps;
}
