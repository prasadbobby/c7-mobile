/** Thin fetch client for c7-backend. The session layer injects the token getter. */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
  }
}

type TokenGetter = () => Promise<string | null>;
type Config = { getToken: TokenGetter; onLocked: () => void; onUnauthorized: () => void };
/**
 * Kept on globalThis: in dev, Metro's lazy route bundles can evaluate this module more
 * than once, and every copy must see the token getter the session layer installed.
 */
const g = globalThis as unknown as { __c7api?: Config };
const cfg = (): Config => (g.__c7api ??= { getToken: async () => null, onLocked: () => {}, onUnauthorized: () => {} });

export function configureApi(opts: { getToken: TokenGetter; onLocked?: () => void; onUnauthorized?: () => void }) {
  const c = cfg();
  c.getToken = opts.getToken;
  if (opts.onLocked) c.onLocked = opts.onLocked;
  if (opts.onUnauthorized) c.onUnauthorized = opts.onUnauthorized;
}

let accessTimer: ReturnType<typeof setTimeout> | null = null;
function accessChanged() {
  if (accessTimer) return;
  accessTimer = setTimeout(async () => {
    accessTimer = null;
    const { queryClient } = await import('./session');
    await queryClient.invalidateQueries({ queryKey: ['me'] });
    const { router } = await import('expo-router');
    router.replace('/');
  }, 50);
}

export async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = await cfg().getToken();
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  let res: Response;
  try {
    res = await fetch(`${API_URL}/v1${path}`, {
      method,
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body && !isForm ? { 'Content-Type': 'application/json' } : {}) },
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('You’re offline or the server can’t be reached. Check your connection and try again.', 0, 'NETWORK');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 423 && data.code !== 'MEMBERSHIP_EXPIRED') cfg().onLocked();
    // Package ended / not a member: refresh the profile so the app gate moves to the renew / packages screen.
    if (data.code === 'MEMBERSHIP_EXPIRED' || data.code === 'MEMBERS_ONLY') accessChanged();
    if (res.status === 401) cfg().onUnauthorized();
    throw new ApiError(data.error ?? `Request failed (${res.status})`, res.status, data.code);
  }
  return data as T;
}

export const api = {
  get: <T>(p: string) => request<T>('GET', p),
  post: <T>(p: string, b?: unknown) => request<T>('POST', p, b ?? {}),
  put: <T>(p: string, b?: unknown) => request<T>('PUT', p, b ?? {}),
  patch: <T>(p: string, b?: unknown) => request<T>('PATCH', p, b ?? {}),
  del: <T>(p: string) => request<T>('DELETE', p),
};

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong');
