import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { api } from './client';
import { today } from './dates';
import type * as T from './types';

/* ------------------------------------------------------------ queries ---- */
export const useMe = (enabled = true) => useQuery({ queryKey: ['me'], enabled, queryFn: () => api.get<T.Me>('/me') });
export const useMembership = () => useQuery({ queryKey: ['membership'], queryFn: () => api.get<{ membership: T.Membership }>('/me/membership').then((r) => r.membership) });
export const useMembershipHistory = () => useQuery({ queryKey: ['membership-history'], queryFn: () => api.get<{ membershipLogs: { id: string; changeType: string; newEndDate: string | null; changeDate: string; notes: string | null }[] }>('/me/membership-history').then((r) => r.membershipLogs) });
export const usePayments = () => useQuery({ queryKey: ['payments'], queryFn: () => api.get<T.Payments>('/me/payments') });

export const useDashboard = () => useQuery({ queryKey: ['dashboard'], queryFn: () => api.get<T.Dashboard>('/dashboard') });
export const useCharts = (range: '1W' | '1M' | '3M' | '1Y') => useQuery({ queryKey: ['charts', range], queryFn: () => api.get<{ points: T.ChartPoint[] }>(`/dashboard/charts?range=${range}`).then((r) => r.points) });
export const useRecords = () => useQuery({ queryKey: ['records'], queryFn: () => api.get<{ records: T.PersonalRecord[] }>('/dashboard/records').then((r) => r.records) });

export const useAssignments = (status: 'active' | 'all' = 'active') => useQuery({ queryKey: ['assignments', status], queryFn: () => api.get<{ assignments: T.Assignment[] }>(`/workouts/assigned?status=${status}`).then((r) => r.assignments) });
export const usePlan = (id?: string) => useQuery({ queryKey: ['plan', id], enabled: !!id, queryFn: () => api.get<{ plan: T.Plan }>(`/workouts/plans/${id}`).then((r) => r.plan) });
export const useWorkoutLogs = () =>
  useInfiniteQuery({
    queryKey: ['logs'],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.get<{ logs: T.WorkoutLogSummary[]; total: number; page: number; limit: number }>(`/workouts/logs?page=${pageParam}&limit=20`),
    getNextPageParam: (last) => (last.page * last.limit < last.total ? last.page + 1 : undefined),
  });
export const useWorkoutLog = (id?: string) => useQuery({ queryKey: ['log', id], enabled: !!id, queryFn: () => api.get<{ log: T.WorkoutLogDetail }>(`/workouts/logs/${id}`).then((r) => r.log) });

export type ExerciseFilter = { search?: string; category?: string; muscle?: string; favourites?: boolean; equipmentOwned?: boolean };
export const useExercises = (f: ExerciseFilter) =>
  useInfiniteQuery({
    queryKey: ['exercises', f],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => {
      const q = new URLSearchParams({ page: String(pageParam), limit: '20' });
      if (f.search) q.set('search', f.search);
      if (f.category) q.set('category', f.category);
      if (f.muscle) q.set('muscle', f.muscle);
      if (f.favourites) q.set('favourites', 'true');
      if (f.equipmentOwned) q.set('equipmentOwned', 'true');
      return api.get<{ exercises: T.ExerciseListItem[]; page: number; totalPages: number; total: number }>(`/exercises?${q}`);
    },
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
  });
export const useExercise = (id?: string) => useQuery({ queryKey: ['exercise', id], enabled: !!id, queryFn: () => api.get<{ exercise: T.ExerciseDetail }>(`/exercises/${id}`).then((r) => r.exercise) });
export const useExerciseHistory = (id?: string) => useQuery({ queryKey: ['exercise-history', id], enabled: !!id, queryFn: () => api.get<{ sessions: T.ExerciseSession[] }>(`/exercises/${id}/history`).then((r) => r.sessions) });

export const useSteps = () => useQuery({ queryKey: ['steps', today()], queryFn: () => api.get<T.StepsDashboard>(`/steps/dashboard?date=${today()}`) });

export const useChallenges = () => useQuery({ queryKey: ['challenges'], queryFn: () => api.get<{ challenges: T.ChallengeListItem[] }>('/challenges').then((r) => r.challenges) });
export const useChallenge = (id?: string) => useQuery({ queryKey: ['challenge', id], enabled: !!id, queryFn: () => api.get<T.ChallengeDetail>(`/challenges/${id}`) });
export const useTodayPost = (id?: string, date = today()) => useQuery({ queryKey: ['challenge-today', id, date], enabled: !!id, queryFn: () => api.get<{ post: T.ChallengePost | null }>(`/challenges/${id}/posts/today?date=${date}`).then((r) => r.post) });
export const useChallengeCalendar = (id: string | undefined, month: number, year: number) =>
  useQuery({ queryKey: ['challenge-calendar', id, month, year], enabled: !!id, queryFn: () => api.get<{ posts: { id: string; date: string; mood: string | null; energy: string | null }[] }>(`/challenges/${id}/calendar?month=${month}&year=${year}`).then((r) => r.posts) });
export const useFeed = (id?: string) =>
  useInfiniteQuery({
    queryKey: ['feed', id],
    enabled: !!id,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.get<{ posts: T.FeedPost[]; totalPages: number; currentPage: number; currentUserId: string }>(`/challenges/${id}/feed?page=${pageParam}&limit=10`),
    getNextPageParam: (last) => (last.currentPage < last.totalPages ? last.currentPage + 1 : undefined),
  });
export const useLeaderboard = (id?: string, week?: number) => useQuery({ queryKey: ['leaderboard', id, week ?? 'current'], enabled: !!id, queryFn: () => api.get<T.Leaderboard>(`/challenges/${id}/leaderboard${week ? `?week=${week}` : ''}`) });

export const useNutrition = (date = today()) => useQuery({ queryKey: ['nutrition', date], queryFn: () => api.get<T.DaySummary>(`/nutrition/summary?date=${date}`) });
export const useNutritionHistory = (days = 7) => useQuery({ queryKey: ['nutrition-history', days], queryFn: () => api.get<{ days: { date: string; kcal: number; protein: number }[]; goal: T.NutritionGoal }>(`/nutrition/history?days=${days}&to=${today()}`) });
export type RecipeFilter = { category?: string; search?: string; sort?: 'recent' | 'popular' | 'protein' | 'kcal' | 'quick'; saved?: boolean };
export const useRecipes = (f: RecipeFilter = {}) =>
  useQuery({
    queryKey: ['recipes', f],
    queryFn: () => {
      const q = new URLSearchParams({ limit: '50', sort: f.sort ?? 'recent' });
      if (f.category) q.set('category', f.category);
      if (f.search) q.set('search', f.search);
      if (f.saved) q.set('saved', 'true');
      return api.get<{ recipes: T.RecipeListItem[]; total: number }>(`/recipes?${q}`).then((r) => r.recipes);
    },
  });
export const useRecipe = (id?: string) => useQuery({ queryKey: ['recipe', id], enabled: !!id, queryFn: () => api.get<{ recipe: T.RecipeDetail }>(`/recipes/${id}`).then((r) => r.recipe) });

export const useMeasurements = () => useQuery({ queryKey: ['measurements'], queryFn: () => api.get<T.MeasurementsResponse>('/measurements') });
export const useNotifications = () => useQuery({ queryKey: ['notifications', today()], queryFn: () => api.get<{ notifications: T.Notification[] }>(`/notifications?date=${today()}`).then((r) => r.notifications), refetchInterval: 120_000 });
export const useAchievements = () => useQuery({ queryKey: ['achievements'], queryFn: () => api.get<T.Achievements>('/achievements') });
export const useStreaks = () => useQuery({ queryKey: ['streaks', today()], queryFn: () => api.get<T.Streaks>(`/streaks?date=${today()}`) });

/* ---------------------------------------------------------- mutations ---- */
function useAct<V, R>(fn: (v: V) => Promise<R>, invalidate: QueryKey[] | ((v: V, r: R) => QueryKey[])) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (r, v) => Promise.all((typeof invalidate === 'function' ? invalidate(v, r) : invalidate).map((k) => qc.invalidateQueries({ queryKey: k }))),
  });
}

export const useUpdateProfile = () => useAct((b: Partial<{ firstName: string; lastName: string; age: number | null; height: number | null; weight: number | null; dateOfBirth: string | null }>) => api.patch('/me', b), [['me']]);
export const useUpdatePreferences = () => useAct((b: Partial<{ fitnessGoal: T.FitnessGoal; experienceLevel: T.Level; completeOnboarding: boolean; pushEnabled: boolean; remindersEnabled: boolean; hapticsEnabled: boolean; metricUnits: boolean }>) => api.patch('/me/preferences', b), [['me']]);
export const useUpdateEquipment = () => useAct((equipment: string[]) => api.put('/me/equipment', { equipment }), [['me'], ['exercises']]);

export const useStartAssignment = () => useAct((id: string) => api.patch(`/workouts/assigned/${id}`, { status: 'IN_PROGRESS' }), [['assignments']]);
export type LogPayload = { workoutPlanId: string; assignmentId?: string; duration: number; totalRestTime: number; totalActiveTime: number; exercises: { exerciseId: string; trackingType: 'reps' | 'duration'; sets: (T.SetValues & { restTimeSeconds?: number | null; setStartTime?: string | null; setEndTime?: string | null })[] }[] };
export const useSaveWorkout = () =>
  useAct((b: LogPayload) => api.post<T.SavedWorkout>('/workouts/logs', b), [['assignments'], ['logs'], ['dashboard'], ['charts'], ['records'], ['streaks'], ['achievements'], ['plan'], ['exercise'], ['exercise-history']]);
export const useDeleteWorkoutLog = () => useAct((id: string) => api.del(`/workouts/logs/${id}`), [['logs'], ['dashboard'], ['charts'], ['records'], ['streaks']]);
export const useToggleFavourite = () => useAct((id: string) => api.post<{ isFavourite: boolean }>(`/exercises/${id}/favourite`), (id) => [['exercise', id], ['exercises']]);
export const useSetExerciseGoal = () => useAct((b: { exerciseId: string; goalValue: number }) => api.post('/goals', b), (b) => [['exercise', b.exerciseId]]);

export const useLogSteps = () => useAct((b: { steps: number; date: string }) => api.post<{ message: string }>('/steps/logs', b), [['steps'], ['dashboard'], ['streaks'], ['notifications'], ['achievements']]);

export const useRequestChallengeAccess = () => useAct((id: string) => api.post(`/challenges/${id}/request-access`), [['challenges']]);
export type PostInput = Partial<Pick<T.ChallengePost, 'sleepHours' | 'sleepQuality' | 'mealTracking' | 'dayDescription' | 'mood' | 'energy' | 'achievements' | 'challenges' | 'isFasting' | 'photos'>>;
export const useCreatePost = (challengeId: string) =>
  useAct((b: PostInput & { date: string }) => api.post<{ post: T.ChallengePost }>(`/challenges/${challengeId}/posts`, b), [['challenge-today'], ['challenge', challengeId], ['challenges'], ['feed', challengeId], ['challenge-calendar'], ['leaderboard'], ['streaks'], ['notifications']]);
export const useUpdatePost = (challengeId: string) => useAct((b: PostInput & { postId: string }) => { const { postId, ...rest } = b; return api.put(`/challenge-posts/${postId}`, rest); }, [['challenge-today'], ['feed', challengeId]]);
export const useDeletePost = (challengeId: string) => useAct((postId: string) => api.del(`/challenge-posts/${postId}`), [['challenge-today'], ['feed', challengeId], ['challenge', challengeId], ['challenge-calendar'], ['leaderboard']]);
export const useReactPost = (challengeId: string) => useAct((b: { postId: string; type: T.Reaction }) => api.post(`/challenge-posts/${b.postId}/reactions`, { type: b.type }), [['feed', challengeId]]);
export const useCommentPost = (challengeId: string) => useAct((b: { postId: string; content: string; parentCommentId?: string }) => api.post(`/challenge-posts/${b.postId}/comments`, { content: b.content, parentCommentId: b.parentCommentId }), [['feed', challengeId]]);
export const useDeleteComment = (challengeId: string) => useAct((id: string) => api.del(`/challenge-comments/${id}`), [['feed', challengeId]]);
export const useReactComment = (challengeId: string) => useAct((b: { commentId: string; type: T.Reaction }) => api.post(`/challenge-comments/${b.commentId}/reactions`, { type: b.type }), [['feed', challengeId]]);
export const markViewed = (postId: string) => api.post(`/challenge-posts/${postId}/views`).catch(() => {});

const nutritionKeys: QueryKey[] = [['nutrition'], ['nutrition-history'], ['achievements']];
export const useLogMeal = () => useAct((b: { date: string; slot: T.MealSlot; recipeId?: string; name?: string; kcal?: number; protein?: number; carbs?: number; fat?: number; servings?: number; photoUrl?: string }) => api.post('/nutrition/meals', b), nutritionKeys);
export const useDeleteMeal = () => useAct((id: string) => api.del(`/nutrition/meals/${id}`), nutritionKeys);
export const useWater = () => useAct((b: { date: string; deltaMl: number }) => api.post<{ waterMl: number }>('/nutrition/water', b), [['nutrition'], ['achievements']]);
export const useLikeRecipe = () => useAct((id: string) => api.post<{ liked: boolean; likes: number }>(`/recipes/${id}/like`), (id) => [['recipe', id], ['recipes']]);
export const useSaveRecipe = () => useAct((id: string) => api.post<{ saved: boolean; saves: number }>(`/recipes/${id}/save`), (id) => [['recipe', id], ['recipes']]);
export const useCommentRecipe = () => useAct((b: { id: string; content: string }) => api.post(`/recipes/${b.id}/comments`, { content: b.content }), (b) => [['recipe', b.id], ['recipes']]);
export const useDeleteRecipeComment = (recipeId: string) => useAct((id: string) => api.del(`/recipe-comments/${id}`), [['recipe', recipeId], ['recipes']]);
export const useFollow = () => useAct((userId: string) => api.post<{ following: boolean }>(`/users/${userId}/follow`), [['recipes'], ['recipe'], ['me']]);

export const useAddMeasurement = () => useAct((b: { measurementType: T.MeasurementType; value: number; unit: string; recordedDate: string; notes?: string | null }) => api.post('/measurements', b), [['measurements'], ['me'], ['dashboard'], ['bmi']]);
export const useDeleteMeasurement = () => useAct((id: string) => api.del(`/measurements/${id}`), [['measurements'], ['dashboard']]);
export const useMeasurementGoal = () => useAct((b: { measurementType: T.MeasurementType; targetValue: number; targetDate?: string | null }) => api.put('/measurements/goals', b), [['measurements']]);

/** Upload a picked image (expo-image-picker asset) → data URL stored with the post, same as FitForge. */
export async function uploadImage(asset: { uri: string; mimeType?: string | null; fileName?: string | null; base64?: string | null }) {
  const type = asset.mimeType ?? 'image/jpeg';
  if (asset.base64) return `data:${type};base64,${asset.base64}`;
  const form = new FormData();
  if (asset.uri.startsWith('blob:') || asset.uri.startsWith('data:')) {
    const blob = await (await fetch(asset.uri)).blob();
    form.append('file', blob, asset.fileName ?? 'photo.jpg');
  } else {
    form.append('file', { uri: asset.uri, name: asset.fileName ?? 'photo.jpg', type } as unknown as Blob);
  }
  return (await api.post<{ url: string }>('/uploads', form)).url;
}
