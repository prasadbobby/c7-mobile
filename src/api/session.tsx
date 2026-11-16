import { ClerkProvider, useAuth } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform, View } from 'react-native';
import { useApp, useSessionUi } from '../store';
import { ApiError, configureApi } from './client';

export const AUTH_MODE: 'clerk' | 'test' = process.env.EXPO_PUBLIC_AUTH_MODE === 'test' ? 'test' : 'clerk';
const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (n, e) => n < 2 && (!(e instanceof ApiError) || e.status === 0 || e.status === 401 || e.status >= 500),
    },
  },
});

type Session = { ready: boolean; signedIn: boolean; signOut: () => Promise<void> };
const Ctx = createContext<Session>({ ready: false, signedIn: false, signOut: async () => {} });
export const useSession = () => useContext(Ctx);

/** Children mount only once the session is known, so no request ever goes out without its token. */
function Provide({ value, children }: { value: Session; children: ReactNode }) {
  return <Ctx.Provider value={value}>{value.ready ? children : <View style={{ flex: 1, backgroundColor: '#050605' }} />}</Ctx.Provider>;
}

function ClerkBridge({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, getToken, signOut } = useAuth();
  // Configure during render (not in an effect) so the very first queries already carry the token.
  configureApi({ getToken: () => getToken(), onLocked: () => useSessionUi.getState().setLocked(true) });
  const value = useMemo<Session>(
    () => ({
      ready: isLoaded,
      signedIn: !!isSignedIn,
      signOut: async () => {
        await signOut();
        queryClient.clear();
        useSessionUi.getState().setLocked(false);
      },
    }),
    [isLoaded, isSignedIn, signOut],
  );
  return <Provide value={value}>{children}</Provide>;
}

/** Test mode: signs in as a seeded test user (backend AUTH_MODE=test). Never used in production builds. */
function TestBridge({ children }: { children: ReactNode }) {
  const testUserId = useApp((s) => s.testUserId);
  const [hydrated, setHydrated] = useState(useApp.persist.hasHydrated());
  useEffect(() => useApp.persist.onFinishHydration(() => setHydrated(true)), []);
  configureApi({ getToken: async () => (useApp.getState().testUserId ? `test_${useApp.getState().testUserId}` : null), onLocked: () => useSessionUi.getState().setLocked(true) });
  const value = useMemo<Session>(
    () => ({
      ready: hydrated,
      signedIn: !!testUserId,
      signOut: async () => {
        useApp.getState().set({ testUserId: null, draft: null });
        queryClient.clear();
        useSessionUi.getState().setLocked(false);
      },
    }),
    [hydrated, testUserId],
  );
  return <Provide value={value}>{children}</Provide>;
}

export function AppProviders({ children }: { children: ReactNode }) {
  const inner = <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  if (AUTH_MODE === 'test') return <TestBridge>{inner}</TestBridge>;
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} tokenCache={Platform.OS === 'web' ? undefined : tokenCache}>
      <ClerkBridge>{inner}</ClerkBridge>
    </ClerkProvider>
  );
}
