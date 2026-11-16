import type { ImageSourcePropType } from 'react-native';
import { images } from './data';

/**
 * Reference routines shown under the Warm Up / Cardio / Strength chips on Home.
 * They're inspiration only — members' actual workouts are the ones their coach assigns in FitForge.
 */
export type RefCategory = 'warmup' | 'cardio' | 'strength';
export type RefWorkout = { id: string; title: string; subtitle: string; minutes: number; category: RefCategory; image: ImageSourcePropType; description: string; level: string; steps: { name: string; seconds: number; reps?: string }[] };

export const referenceWorkouts: RefWorkout[] = [
  { id: 'concentration-curl', title: 'Concentration Curl', subtitle: 'Seated Dumbbell', minutes: 15, category: 'strength', image: images.wCurl, level: 'Intermediate',
    description: 'Sit on a bench, lean forward, and rest your elbow against your inner thigh. Curl the dumbbell in a controlled motion, focusing on squeezing the bicep at the top. Avoid swinging and lower slowly to full extension.',
    steps: [{ name: 'Warm-up curls', seconds: 45, reps: '15 reps' }, { name: 'Left arm', seconds: 40, reps: '12 reps' }, { name: 'Rest', seconds: 20 }, { name: 'Right arm', seconds: 40, reps: '12 reps' }, { name: 'Drop set', seconds: 45, reps: 'to failure' }] },
  { id: 'stretch-flow', title: 'Stretch & Flow', subtitle: 'Mobility', minutes: 15, category: 'warmup', image: images.wStretch, level: 'Beginner',
    description: 'A gentle flow of dynamic stretches that opens hips, shoulders and spine. Breathe deeply and move with control between each pose.',
    steps: [{ name: "World's greatest stretch", seconds: 40 }, { name: 'Cat-cow', seconds: 30 }, { name: 'Hip openers', seconds: 40 }, { name: 'Thoracic twist', seconds: 30 }] },
  { id: 'partner-power', title: 'Partner Power', subtitle: 'Bodyweight', minutes: 10, category: 'cardio', image: images.wPartner, level: 'Intermediate',
    description: 'Team up for synchronized squats, lunges and high-fives. Keep the pace high and motivate each other through every round.',
    steps: [{ name: 'High-five squats', seconds: 40 }, { name: 'Mirror lunges', seconds: 40 }, { name: 'Rest', seconds: 20 }, { name: 'Plank claps', seconds: 30 }] },
  { id: 'core-blast', title: 'Core Blast', subtitle: 'Medicine Ball', minutes: 15, category: 'strength', image: images.wCore, level: 'Advanced',
    description: 'Overhead slams, Russian twists and dead bugs to fire up your core. Brace your abs and keep your back neutral.',
    steps: [{ name: 'Ball slams', seconds: 40, reps: '15 reps' }, { name: 'Russian twists', seconds: 40 }, { name: 'Rest', seconds: 20 }, { name: 'Dead bugs', seconds: 40 }] },
  { id: 'tempo-run', title: 'Tempo Run', subtitle: 'Treadmill', minutes: 20, category: 'cardio', image: images.wRun, level: 'Intermediate',
    description: 'Steady run at a comfortably hard pace. Warm up 3 minutes, hold tempo, and cool down gradually.',
    steps: [{ name: 'Easy jog', seconds: 60 }, { name: 'Tempo pace', seconds: 120 }, { name: 'Cool down', seconds: 60 }] },
];
