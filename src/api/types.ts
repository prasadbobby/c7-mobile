export type Role = 'USER' | 'ADMIN' | 'SUPER_ADMIN';
export type FitnessGoal = 'lose' | 'tone' | 'muscle' | 'endurance';
export type Level = 'Beginner' | 'Intermediate' | 'Advanced';

export type Me = {
  user: {
    id: string; firstName: string; lastName: string; username: string; email: string | null; imageUrl: string; role: Role;
    memberId: string | null; age: number | null; height: number | null; weight: number | null; dateOfBirth: string | null;
    memberSince: string; membershipStatus: string | null; membershipEndDate: string | null;
    /** MEMBER: full app · GUEST: packages only · EXPIRED: renew to continue */
    access: 'MEMBER' | 'GUEST' | 'EXPIRED';
  };
  equipment: string[];
  preferences: { fitnessGoal: FitnessGoal | null; experienceLevel: Level | null; onboardingCompleted: boolean; pushEnabled: boolean; remindersEnabled: boolean; hapticsEnabled: boolean; metricUnits: boolean };
  social: { followers: number; following: number };
};

export type Membership = {
  startDate: string | null; endDate: string | null; duration: number | null; status: string | null; notes: string | null;
  daysRemaining: number; isExpired: boolean; isActive: boolean; hasValidMembership: boolean;
  pausedFrom: string | null; pausedUntil: string | null; pauseReason: string | null;
  upcoming: { startDate: string; endDate: string; duration: number | null } | null;
};
export type Payments = {
  paymentInfo: { packagePrice: number | null; discountedPrice: number | null; totalAmountPaid: number | null; remainingAmount: number | null; nextPaymentDue: string | null; paymentNotes: string | null };
  paymentLogs: { id: string; amount: number; paymentDate: string; paymentMethod: string | null; transactionId: string | null; notes: string | null; recordedByName: string }[];
};

export type Assignment = {
  id: string; status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'; notes: string | null; dueDate: string | null; assignedAt: string;
  assignedBy: { userId: string; name: string };
  plan: { id: string; name: string; trainingType: string | null; notes: string | null; exerciseCount: number; totalSets: number; estimatedMinutes: number; image: string | null; exercises: { name: string; sets: number; category: string }[] };
};

export type Rest = { defaultRestSeconds: number; minRestSeconds: number; maxRestSeconds: number; autoStart: boolean };
export type SetValues = { weight: number | null; reps: number | null; exerciseDuration: number | null };
export type PlanExercise = {
  id: string; exerciseId: string; name: string; category: string; equipment: string | null; image: string | null; primaryMuscles: string[];
  sets: number; reps: number | null; exerciseDuration: number | null; order: number | null; trackingType: 'reps' | 'duration'; rest: Rest;
  previous: SetValues[]; pb: SetValues | null;
};
export type Plan = {
  id: string; name: string; notes: string | null; trainingType: string | null; userId: string | null; createdAt: string;
  assignment: { id: string; status: Assignment['status'] } | null; totalSets: number; estimatedMinutes: number; exercises: PlanExercise[];
};

export type WorkoutLogSummary = { id: string; date: string; duration: number; planName: string; planId: string; exerciseCount: number; setCount: number; volume: number; totalRestTimeSeconds: number | null; totalActiveTimeSeconds: number | null };
export type WorkoutLogDetail = {
  id: string; date: string; duration: number; planName: string; planId: string; totalRestTimeSeconds: number | null; totalActiveTimeSeconds: number | null;
  exercises: { id: string; exerciseId: string; name: string; image: string | null; trackingType: string; sets: (SetValues & { id: string; order: number | null; isWarmUp: boolean })[] }[];
};
export type SavedWorkout = { workoutLog: { id: string; workoutPlanName: string; duration: number; exerciseCount: number; setCount: number; volume: number; totalRestTime: number; totalActiveTime: number }; newPBs: { exerciseId: string; weight: number; reps: number | null; exerciseDuration: number | null }[] };

export type ExerciseListItem = { id: string; name: string; category: string; level: string; equipment: string | null; force: string | null; mechanic: string | null; image: string | null; primaryMuscles: string[]; isFavourite: boolean };
export type ExerciseDetail = ExerciseListItem & {
  description: string | null; aliases: string[]; instructions: string[]; tips: string[]; secondaryMuscles: string[];
  pb: (SetValues & { date: string }) | null; goal: { id: string; goalValue: number } | null;
};
export type ExerciseSession = { logId: string; date: string; planName: string; bestWeight: number; volume: number; sets: (SetValues & { isWarmUp: boolean })[] };

export type Dashboard = {
  cards: { weeklyWorkouts: number; avgWorkoutMinutes: number; dailyStreak: number; weeklyPBs: number; activeChallenges: number; pendingAssignments: number; stepStreak: number; totalWorkouts: number };
  recentActivity: { id: string; planName: string; date: string; durationMinutes: number }[];
  latestWeight: { value: number; recordedDate: string } | null;
};
export type ChartPoint = { label: string; start: string; workouts: number; volume: number };
export type PersonalRecord = { exerciseId: string; name: string; image: string | null; weight: number; reps: number | null; exerciseDuration: number | null; createdAt: string };

export type StepLog = { date: string; actualSteps: number; targetSteps: number; isCompleted: boolean; carryOverSteps: number; excessSteps: number };
export type StepsDashboard = {
  activeGoal: { id: string; dailyTarget: number; startDate: string; endDate: string | null; notes?: string | null } | null;
  todayLog: StepLog | null; weeklyLogs: StepLog[]; monthlyLogs: StepLog[];
  stats: { totalStepsMonth: number; totalStepsWeek: number; avgStepsMonth: number; avgStepsWeek: number; completionRateMonth: number; completionRateWeek: number; completedDaysMonth: number; completedDaysWeek: number; maxStepsDay: number; currentTarget: number };
  streak: number;
  weeklyProgress: { totalWeeklyTarget: number; actualStepsThisWeek: number; targetStepsThisWeek: number; daysCompleted: number; remainingDays: number; isOnTrack: boolean } | null;
  today: string;
  fitbit: { isConnected: boolean; lastSyncAt: string | null; syncEnabled: boolean };
};

export type ChallengeStats = { totalDays: number; daysPassed: number; daysRemaining: number; completedDays: number; streak: number; totalParticipants: number; isCompleted: boolean };
export type ChallengeListItem = { id: string; title: string; description: string | null; startDate: string; endDate: string; participants: number; access: 'enabled' | 'requested' | 'none'; stats: ChallengeStats | null };
export type ChallengeDetail = { challenge: { id: string; title: string; description: string | null; startDate: string; endDate: string }; stats: ChallengeStats; rank: { rank: number; score: number; of: number } | null };
export const SLEEP = ['POOR', 'FAIR', 'GOOD', 'VERY_GOOD', 'EXCELLENT'] as const;
export const MOOD = ['VERY_LOW', 'LOW', 'NEUTRAL', 'GOOD', 'VERY_GOOD', 'EXCELLENT'] as const;
export const ENERGY = ['VERY_LOW', 'LOW', 'MODERATE', 'HIGH', 'VERY_HIGH'] as const;
export const REACTIONS = ['LIKE', 'LOVE', 'SUPPORT', 'STRONG', 'FIRE', 'CLAP'] as const;
export type Reaction = (typeof REACTIONS)[number];
export type ChallengePost = {
  id: string; userId: string; challengeId: string; date: string; sleepHours: number | null; sleepQuality: (typeof SLEEP)[number] | null; mealTracking: string | null;
  dayDescription: string | null; mood: (typeof MOOD)[number] | null; energy: (typeof ENERGY)[number] | null; achievements: string | null; challenges: string | null;
  isFasting: boolean; photos: string[]; isPinned?: boolean; createdAt: string; updatedAt: string;
};
export type Author = { userId: string; firstName: string; lastName: string; imageUrl: string; username?: string; isAdmin?: boolean };
export type FeedComment = { id: string; content: string; createdAt: string; parentCommentId: string | null; author: Author; reactionCounts: Record<string, number>; userReaction: { id: string; type: Reaction } | null; replies?: FeedComment[] };
export type FeedPost = ChallengePost & { author: Author; reactionCounts: Record<string, number>; userReaction: { id: string; type: Reaction } | null; commentCount: number; viewCount: number; comments: FeedComment[] };
export type LeaderEntry = { userId: string; firstName: string; lastName: string; imageUrl: string; score: number; totalPosts: number; consistency: number; daysElapsed: number; rank: number };
export type Leaderboard = { overall: LeaderEntry[]; weekly: LeaderEntry[]; weeks: { weekNumber: number; startDate: string; endDate: string; isCurrentWeek: boolean; isCompleted: boolean }[]; selectedWeek: number | null; me: { overall: LeaderEntry | null; weekly: LeaderEntry | null } };

export const MEAL_SLOTS = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as const;
export type MealSlot = (typeof MEAL_SLOTS)[number];
export type NutritionGoal = { kcal: number; protein: number; carbs: number; fat: number; waterMl: number; assigned: boolean; notes: string | null };
export type DaySummary = {
  date: string; goal: NutritionGoal; totals: { kcal: number; protein: number; carbs: number; fat: number }; waterMl: number; burned: number;
  meals: { id: string; slot: MealSlot; name: string; kcal: number; protein: number; carbs: number; fat: number; servings: number; recipeId: string | null; createdAt: string; imageUrl: string | null; photoUrl?: string | null }[];
};
export const RECIPE_CATEGORIES = ['vegetarian', 'seafood', 'high-protein', 'keto', 'vegan', 'breakfast', 'snack', 'other'] as const;
export type Recipe = {
  id: string; title: string; description: string | null; category: (typeof RECIPE_CATEGORIES)[number]; imageUrl: string | null; kcal: number; protein: number; carbs: number; fat: number;
  minutes: number; servings: number; ingredients: string[]; steps: string[]; tags: string[]; createdBy: string; createdAt: string;
  author: { userId: string; name: string; imageUrl: string; isFollowing: boolean }; likes: number; saves: number; liked: boolean; saved: boolean;
};
export type RecipeListItem = Recipe & { comments: number };
export type RecipeDetail = Recipe & { comments: { id: string; content: string; createdAt: string; author: { userId: string; name: string; imageUrl: string }; isMine: boolean }[] };

export const MEASUREMENTS = [
  'WEIGHT', 'BODY_FAT_PERCENTAGE', 'SKELETAL_MUSCLE_MASS', 'FAT_MASS', 'VISCERAL_FAT', 'METABOLIC_AGE', 'HEIGHT',
  'NECK', 'SHOULDERS', 'CHEST', 'UPPER_ARM_RIGHT', 'UPPER_ARM_LEFT', 'FOREARM_RIGHT', 'FOREARM_LEFT', 'WRIST',
  'WAIST', 'ABDOMEN', 'HIPS', 'THIGH_RIGHT', 'THIGH_LEFT', 'CALF_RIGHT', 'CALF_LEFT',
] as const;
export type MeasurementType = (typeof MEASUREMENTS)[number];
export type Measurement = { id: string; measurementType: MeasurementType; value: number; unit: string; recordedDate: string; notes: string | null };
export type MeasurementsResponse = { measurements: Measurement[]; latest: Partial<Record<MeasurementType, Measurement>>; goals: { id: string; measurementType: MeasurementType; targetValue: number; currentValue: number | null; targetDate: string | null }[] };

export type Notification = { id: string; kind: 'membership' | 'payment' | 'workout' | 'challenge' | 'social' | 'steps' | 'announcement' | 'checkup'; title: string; body: string; at: string; link: string };
export type Badge = { id: string; title: string; body: string; progress: number; value: number; target: number; earned: boolean };
export type Achievements = { badges: Badge[]; earned: number; total: number; xp: number; level: number; xpIntoLevel: number; xpForLevel: number };
export type Streaks = { activeStreak: number; bestStreak: number; workoutStreak: number; stepStreak: number; thisWeek: number; days: { date: string; workout: boolean; steps: boolean; checkIn: boolean }[] };
