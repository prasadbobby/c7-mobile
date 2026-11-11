import type { ImageSourcePropType } from 'react-native';

const img = {
  avatarEmma: require('../assets/images/avatar-emma.jpg'),
  avatarRegina: require('../assets/images/avatar-regina.jpg'),
  avatarAlex: require('../assets/images/avatar-alex.jpg'),
  avatarMethew: require('../assets/images/avatar-methew.jpg'),
  profileEmma: require('../assets/images/profile-emma.jpg'),
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

export const avatars = { emma: img.avatarEmma, regina: img.avatarRegina, alex: img.avatarAlex, methew: img.avatarMethew };

export type Category = 'warmup' | 'cardio' | 'strength';
export type Workout = {
  id: string; title: string; subtitle: string; minutes: number; category: Category; image: ImageSourcePropType;
  description: string; kcal: number; level: 'Beginner' | 'Intermediate' | 'Advanced';
  steps: { name: string; seconds: number; reps?: string }[];
};

export const workouts: Workout[] = [
  { id: 'concentration-curl', title: 'Concentration Curl', subtitle: 'Seated Dumbbell', minutes: 15, category: 'strength', image: img.wCurl, kcal: 120, level: 'Intermediate',
    description: 'Sit on a bench, lean forward, and rest your elbow against your inner thigh. Curl the dumbbell in a controlled motion, focusing on squeezing the bicep at the top. Avoid swinging and lower slowly to full extension.',
    steps: [{ name: 'Warm-up curls', seconds: 45, reps: '15 reps' }, { name: 'Left arm', seconds: 40, reps: '12 reps' }, { name: 'Rest', seconds: 20 }, { name: 'Right arm', seconds: 40, reps: '12 reps' }, { name: 'Drop set', seconds: 45, reps: 'to failure' }] },
  { id: 'stretch-flow', title: 'Stretch & Flow', subtitle: 'Mobility', minutes: 15, category: 'warmup', image: img.wStretch, kcal: 60, level: 'Beginner',
    description: 'A gentle flow of dynamic stretches that opens hips, shoulders and spine. Breathe deeply and move with control between each pose.',
    steps: [{ name: "World's greatest stretch", seconds: 40 }, { name: 'Cat-cow', seconds: 30 }, { name: 'Hip openers', seconds: 40 }, { name: 'Thoracic twist', seconds: 30 }] },
  { id: 'partner-power', title: 'Partner Power', subtitle: 'Bodyweight', minutes: 10, category: 'cardio', image: img.wPartner, kcal: 140, level: 'Intermediate',
    description: 'Team up for synchronized squats, lunges and high-fives. Keep the pace high and motivate each other through every round.',
    steps: [{ name: 'High-five squats', seconds: 40 }, { name: 'Mirror lunges', seconds: 40 }, { name: 'Rest', seconds: 20 }, { name: 'Plank claps', seconds: 30 }] },
  { id: 'core-blast', title: 'Core Blast', subtitle: 'Medicine Ball', minutes: 15, category: 'strength', image: img.wCore, kcal: 160, level: 'Advanced',
    description: 'Overhead slams, Russian twists and dead bugs to fire up your core. Brace your abs and keep your back neutral.',
    steps: [{ name: 'Ball slams', seconds: 40, reps: '15 reps' }, { name: 'Russian twists', seconds: 40 }, { name: 'Rest', seconds: 20 }, { name: 'Dead bugs', seconds: 40 }] },
  { id: 'tempo-run', title: 'Tempo Run', subtitle: 'Treadmill', minutes: 20, category: 'cardio', image: img.wRun, kcal: 240, level: 'Intermediate',
    description: 'Steady run at a comfortably hard pace. Warm up 3 minutes, hold tempo, and cool down gradually.',
    steps: [{ name: 'Easy jog', seconds: 60 }, { name: 'Tempo pace', seconds: 120 }, { name: 'Cool down', seconds: 60 }] },
];

export type Meal = {
  id: string; title: string; tag: string; image: ImageSourcePropType; kcal: number; protein: number; carbs: number; fat: number;
  likes: number; comments: number; description: string; author: 'regina' | 'alex' | 'methew'; minutes: number;
  ingredients: string[]; steps: string[];
};

export const meals: Meal[] = [
  { id: 'power-bowl', title: 'Power-packed Bowl', tag: 'high-protein', image: img.mBowl, kcal: 520, protein: 42, carbs: 48, fat: 18, likes: 90, comments: 12, author: 'regina', minutes: 20,
    description: 'Power-packed bowl: quinoa, avocado, grilled protein, and greens with a zesty lime dressing.',
    ingredients: ['1 cup cooked quinoa', '150g grilled chicken', '½ avocado', 'Cherry tomatoes', 'Baby spinach', 'Lime & olive oil'],
    steps: ['Cook quinoa and let it cool slightly.', 'Grill the chicken 6 min per side, then slice.', 'Assemble greens, quinoa and toppings.', 'Whisk lime, oil and salt; drizzle and serve.'] },
  { id: 'thai-seafood', title: 'Spicy Thai Seafood Medley', tag: 'seafood', image: img.mSeafood, kcal: 430, protein: 42, carbs: 12, fat: 27.5, likes: 64, comments: 12, author: 'regina', minutes: 25,
    description: 'A fiery mix of shrimp, mussels, squid, and fresh veggies sautéed in Thai chili garlic sauce.',
    ingredients: ['200g shrimp', '150g mussels', '100g squid rings', '2 Thai chilies', '3 garlic cloves', 'Bell peppers, basil'],
    steps: ['Smash garlic and chilies into a paste.', 'Sear squid and shrimp on high heat.', 'Add mussels, cover until opened.', 'Toss with peppers, sauce and basil.'] },
  { id: 'lemon-salmon', title: 'Lemon-Herb Butter Salmon', tag: 'seafood', image: img.mSalmon, kcal: 480, protein: 38, carbs: 6, fat: 30, likes: 120, comments: 8, author: 'alex', minutes: 18,
    description: 'A pan-seared salmon steak bathed in zesty lemon-herb butter with crisp asparagus.',
    ingredients: ['Salmon fillet', '1 tbsp butter', 'Lemon', 'Dill & parsley', 'Asparagus'],
    steps: ['Pat salmon dry, season well.', 'Sear skin-side down 4 min.', 'Flip, baste with lemon-herb butter.', 'Serve over blistered asparagus.'] },
  { id: 'chickpea-salad', title: 'Chickpea Garden Salad', tag: 'vegetarian', image: img.mVeg, kcal: 360, protein: 16, carbs: 44, fat: 12, likes: 51, comments: 4, author: 'methew', minutes: 10,
    description: 'Chickpeas, tomatoes, cucumber and feta tossed with olive oil and herbs.',
    ingredients: ['1 can chickpeas', 'Tomatoes', 'Cucumber', 'Feta', 'Olive oil', 'Fresh herbs'],
    steps: ['Rinse chickpeas.', 'Dice veg.', 'Toss everything with oil, salt and herbs.'] },
  { id: 'salmon-noodles', title: 'Salmon Noodle Bowl', tag: 'high-protein', image: img.mProtein, kcal: 610, protein: 46, carbs: 58, fat: 20, likes: 77, comments: 9, author: 'alex', minutes: 22,
    description: 'Glazed salmon over sesame noodles with broccoli and carrots.',
    ingredients: ['Salmon', 'Soba noodles', 'Broccoli', 'Carrot', 'Soy-honey glaze', 'Sesame'],
    steps: ['Boil noodles.', 'Glaze and bake salmon 12 min.', 'Steam veg.', 'Assemble and garnish with sesame.'] },
  { id: 'keto-plate', title: 'Keto Breakfast Plate', tag: 'keto', image: img.mKeto, kcal: 540, protein: 24, carbs: 8, fat: 44, likes: 88, comments: 15, author: 'methew', minutes: 12,
    description: 'Sunny egg, crispy bacon, avocado and roasted cherry tomatoes.',
    ingredients: ['2 eggs', '3 bacon strips', '½ avocado', 'Cherry tomatoes'],
    steps: ['Crisp bacon.', 'Fry eggs in the fat.', 'Roast tomatoes, plate with avocado.'] },
  { id: 'seafood-platter', title: 'Oyster & Crab Platter', tag: 'seafood', image: img.mPlatter, kcal: 390, protein: 40, carbs: 10, fat: 14, likes: 43, comments: 3, author: 'regina', minutes: 15,
    description: 'Fresh oysters and king crab with cocktail sauce and lemon.',
    ingredients: ['6 oysters', 'King crab legs', 'Cocktail sauce', 'Lemon', 'Crushed ice'],
    steps: ['Shuck oysters.', 'Crack crab legs.', 'Serve over ice with sauce.'] },
  { id: 'berry-yogurt', title: 'Berry Yogurt Bowl', tag: 'vegetarian', image: img.mYogurt, kcal: 290, protein: 18, carbs: 36, fat: 8, likes: 69, comments: 6, author: 'regina', minutes: 5,
    description: 'Greek yogurt with mixed berries, nuts and chia seeds.',
    ingredients: ['Greek yogurt', 'Mixed berries', 'Walnuts', 'Chia seeds', 'Honey'],
    steps: ['Spoon yogurt into a bowl.', 'Top with berries, nuts and chia.', 'Drizzle honey.'] },
];

export const mealCategories = [
  { id: 'vegetarian', label: 'Vegetarian', image: img.mVeg },
  { id: 'seafood', label: 'Seafood', image: img.mPlatter },
  { id: 'high-protein', label: 'High-protein', image: img.mProtein },
  { id: 'keto', label: 'Keto', image: img.mKeto },
];

export const people = {
  regina: { name: 'Regina Fly', avatar: img.avatarRegina, followers: '12k' },
  alex: { name: 'Alex Freedman', avatar: img.avatarAlex, followers: '8.4k' },
  methew: { name: 'Methew Apostol', avatar: img.avatarMethew, followers: '5.1k' },
};

export const leaderboard = {
  workout: [
    { name: 'Regina Fly', avatar: img.avatarRegina, value: '2,3m' },
    { name: 'Alex Freedman', avatar: img.avatarAlex, value: '1,8m' },
    { name: 'Methew Apostol', avatar: img.avatarMethew, value: '1,2m' },
    { name: 'Sara Kim', avatar: img.avatarEmma, value: '1,1m' },
  ],
  cooking: [
    { name: 'Alex Freedman', avatar: img.avatarAlex, value: '842' },
    { name: 'Regina Fly', avatar: img.avatarRegina, value: '790' },
    { name: 'Methew Apostol', avatar: img.avatarMethew, value: '655' },
    { name: 'Sara Kim', avatar: img.avatarEmma, value: '512' },
  ],
};

export const activity = [
  { id: 'walk', title: 'Walking', time: 'Today at 12:43pm', value: 7890, unit: '/steps', tone: 'lime' as const },
  { id: 'workout', title: 'Workout', time: 'Yesterday at 8:00pm', value: 72, unit: '/min', tone: 'danger' as const },
  { id: 'cycle', title: 'Cycling', time: 'Mon at 7:10am', value: 12, unit: '/km', tone: 'deep' as const },
];

export const notifications = [
  { id: 'n1', kind: 'streak', title: '3 day streak!', body: 'You still need 819 steps to complete your day.', time: '2m', unread: true },
  { id: 'n2', kind: 'challenge', title: 'New challenge unlocked', body: '2 Weeks of Energy is waiting for you.', time: '1h', unread: true },
  { id: 'n3', kind: 'social', title: 'Regina Fly liked your bowl', body: 'Power-packed bowl now has 90 likes.', time: '3h', unread: false },
  { id: 'n4', kind: 'rank', title: 'You climbed to #32', body: 'Up 6 places on the workout leaderboard.', time: 'Yesterday', unread: false },
  { id: 'n5', kind: 'meal', title: 'Protein goal hit', body: '98g of 120g — nice work on lunch.', time: 'Yesterday', unread: false },
];

export const weekSteps = [6200, 8400, 5100, 9800, 7890, 11200, 4300];
export const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export type Challenge = {
  id: string; title: string; subtitle: string; days: number; image: ImageSourcePropType; participants: number;
  reward: string; kind: 'steps' | 'workout' | 'nutrition' | 'hydration'; daily: string; featured?: boolean;
};

export const challenges: Challenge[] = [
  { id: 'two-weeks-energy', title: 'New Challenge', subtitle: '2 Weeks of Energy', days: 14, image: img.wPartner, participants: 2840, reward: 'Energy Badge + 500 XP', kind: 'workout', daily: 'One 15-min workout a day', featured: true },
  { id: 'step-it-up', title: 'Step It Up', subtitle: '10k steps for 7 days', days: 7, image: img.wRun, participants: 5120, reward: 'Pathfinder Badge', kind: 'steps', daily: 'Hit 10,000 steps' },
  { id: 'hydration-hero', title: 'Hydration Hero', subtitle: '2L water, 10 days', days: 10, image: img.mYogurt, participants: 1980, reward: 'Wave Badge', kind: 'hydration', daily: 'Drink 2 litres' },
  { id: 'protein-power', title: 'Protein Power', subtitle: 'Hit protein 21 days', days: 21, image: img.mProtein, participants: 1204, reward: 'Iron Plate Badge', kind: 'nutrition', daily: 'Reach your protein goal' },
  { id: 'core-30', title: 'Core 30', subtitle: '30 days of core', days: 30, image: img.wCore, participants: 3310, reward: 'Steel Core Badge + 1000 XP', kind: 'workout', daily: '10 min core session' },
];

export const achievements = [
  { id: 'a1', title: 'Early Bird', body: '5 workouts before 8am', earned: true, tone: '#C6F21B' },
  { id: 'a2', title: '7-Day Streak', body: 'Moved every day for a week', earned: true, tone: '#F05A28' },
  { id: 'a3', title: 'Chef', body: 'Shared 10 recipes', earned: true, tone: '#E99B2A' },
  { id: 'a4', title: 'Marathoner', body: 'Ran 42km total', earned: false, tone: '#16B3EB' },
  { id: 'a5', title: 'Iron Will', body: '100 strength sessions', earned: false, tone: '#955BE3' },
  { id: 'a6', title: 'Hydrated', body: '30 days of 2L water', earned: false, tone: '#00977C' },
];

export const programs = [
  { id: 'lean-8', title: 'Lean in 8 Weeks', weeks: 8, perWeek: 4, image: img.wCore, level: 'Intermediate', workouts: ['core-blast', 'tempo-run', 'partner-power', 'stretch-flow'] },
  { id: 'arm-day', title: 'Sculpted Arms', weeks: 4, perWeek: 3, image: img.wCurl, level: 'Beginner', workouts: ['concentration-curl', 'core-blast', 'stretch-flow'] },
  { id: 'run-5k', title: 'Couch to 5K', weeks: 6, perWeek: 3, image: img.wRun, level: 'Beginner', workouts: ['tempo-run', 'stretch-flow'] },
];

export const feed = [
  { id: 'f1', who: 'regina' as const, mealId: 'power-bowl', time: '2h' },
  { id: 'f2', who: 'alex' as const, mealId: 'lemon-salmon', time: '5h' },
  { id: 'f3', who: 'methew' as const, mealId: 'keto-plate', time: '1d' },
];
