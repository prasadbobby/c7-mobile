import type { ImageSourcePropType } from 'react-native';

/** Bundled artwork. Real content comes from c7-backend; these are only fallbacks and auth art. */
const img = {
  onboarding: require('../assets/images/onboarding-woman.jpg'),
  loginIllustration: require('../assets/images/login-illustration.png'),
  wStretch: require('../assets/images/workout-stretch.jpg'),
  wPartner: require('../assets/images/workout-partner.jpg'),
  wCore: require('../assets/images/workout-core.jpg'),
  wRun: require('../assets/images/workout-run.jpg'),
  wCurl: require('../assets/images/workout-curl.jpg'),
  mBowl: require('../assets/images/meal-bowl.jpg'),
  mSeafood: require('../assets/images/meal-seafood.jpg'),
  mSalmon: require('../assets/images/meal-salmon.jpg'),
  mVeg: require('../assets/images/meal-vegetarian.jpg'),
  mProtein: require('../assets/images/meal-protein.jpg'),
  mKeto: require('../assets/images/meal-keto.jpg'),
  mPlatter: require('../assets/images/meal-platter.jpg'),
  mYogurt: require('../assets/images/meal-yogurt.jpg'),
} satisfies Record<string, ImageSourcePropType>;
export const images = img;

const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

/** Stable artwork for a workout plan / exercise without a photo, chosen by its training type or category. */
export function workoutArt(key: string | null | undefined, seed = ''): ImageSourcePropType {
  const k = (key ?? '').toLowerCase();
  if (/cardio|run|endurance|plyo/.test(k)) return img.wRun;
  if (/stretch|mobility|flex|warm|yoga|recovery/.test(k)) return img.wStretch;
  if (/functional|hiit|circuit|cross/.test(k)) return img.wPartner;
  if (/core|ab/.test(k)) return img.wCore;
  if (/strength|power|hypertrophy|body ?building|olympic|strongman/.test(k)) return [img.wCurl, img.wCore][hash(seed) % 2]!;
  return [img.wCurl, img.wCore, img.wPartner, img.wRun, img.wStretch][hash(seed + k) % 5]!;
}

export const mealArt: Record<string, ImageSourcePropType> = {
  vegetarian: img.mVeg, seafood: img.mSeafood, 'high-protein': img.mProtein, keto: img.mKeto,
  vegan: img.mBowl, breakfast: img.mYogurt, snack: img.mYogurt, other: img.mPlatter,
};
export const mealCategories = [
  { id: 'vegetarian', label: 'Vegetarian', image: img.mVeg },
  { id: 'seafood', label: 'Seafood', image: img.mPlatter },
  { id: 'high-protein', label: 'High-protein', image: img.mProtein },
  { id: 'keto', label: 'Keto', image: img.mKeto },
  { id: 'vegan', label: 'Vegan', image: img.mBowl },
  { id: 'breakfast', label: 'Breakfast', image: img.mYogurt },
] as const;

export const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
