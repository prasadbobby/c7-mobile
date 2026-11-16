import type { MeasurementType } from './types';

export const MEASUREMENT_META: Record<MeasurementType, { label: string; unit: string; group: 'Basics' | 'Composition' | 'Upper body' | 'Core' | 'Lower body' }> = {
  WEIGHT: { label: 'Weight', unit: 'kg', group: 'Basics' },
  HEIGHT: { label: 'Height', unit: 'cm', group: 'Basics' },
  METABOLIC_AGE: { label: 'Metabolic Age', unit: 'years', group: 'Basics' },
  BODY_FAT_PERCENTAGE: { label: 'Body Fat', unit: '%', group: 'Composition' },
  VISCERAL_FAT: { label: 'Visceral Fat', unit: 'level', group: 'Composition' },
  SKELETAL_MUSCLE_MASS: { label: 'Muscle Mass', unit: 'kg', group: 'Composition' },
  FAT_MASS: { label: 'Fat Mass', unit: 'kg', group: 'Composition' },
  NECK: { label: 'Neck', unit: 'inches', group: 'Upper body' },
  SHOULDERS: { label: 'Shoulders', unit: 'inches', group: 'Upper body' },
  CHEST: { label: 'Chest', unit: 'inches', group: 'Upper body' },
  UPPER_ARM_RIGHT: { label: 'Upper Arm (R)', unit: 'inches', group: 'Upper body' },
  UPPER_ARM_LEFT: { label: 'Upper Arm (L)', unit: 'inches', group: 'Upper body' },
  FOREARM_RIGHT: { label: 'Forearm (R)', unit: 'inches', group: 'Upper body' },
  FOREARM_LEFT: { label: 'Forearm (L)', unit: 'inches', group: 'Upper body' },
  WRIST: { label: 'Wrist', unit: 'inches', group: 'Upper body' },
  WAIST: { label: 'Waist', unit: 'inches', group: 'Core' },
  ABDOMEN: { label: 'Abdomen', unit: 'inches', group: 'Core' },
  HIPS: { label: 'Hips', unit: 'inches', group: 'Core' },
  THIGH_RIGHT: { label: 'Thigh (R)', unit: 'inches', group: 'Lower body' },
  THIGH_LEFT: { label: 'Thigh (L)', unit: 'inches', group: 'Lower body' },
  CALF_RIGHT: { label: 'Calf (R)', unit: 'inches', group: 'Lower body' },
  CALF_LEFT: { label: 'Calf (L)', unit: 'inches', group: 'Lower body' },
};

export const pretty = (s: string | null | undefined) => (s ? s.toLowerCase().replace(/_/g, ' ').replace(/(^|\s)\S/g, (m) => m.toUpperCase()) : '');
export const fullName = (a: { firstName?: string | null; lastName?: string | null } | null | undefined) => `${a?.firstName ?? ''} ${a?.lastName ?? ''}`.trim() || 'Member';
export const kg = (n: number | null | undefined) => (n == null ? '—' : `${Math.round(n * 10) / 10} kg`);
export const compact = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}m` : n >= 1e4 ? `${Math.round(n / 1e3)}k` : n.toLocaleString());
export const setLabel = (s: { weight: number | null; reps: number | null; exerciseDuration: number | null }) =>
  [s.weight ? `${s.weight} kg` : null, s.reps ? `${s.reps} reps` : null, s.exerciseDuration ? `${s.exerciseDuration}s` : null].filter(Boolean).join(' × ') || '—';
