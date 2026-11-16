import { isClerkAPIResponseError, useClerk, useSSO } from '@clerk/expo';
// The create → prepare → attempt → setActive flow below is Clerk's Core 2 API; Core 3 SDKs keep it under /legacy.
import { useSignIn, useSignUp } from '@clerk/expo/legacy';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { ArrowLeft } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Reveal, useStagger } from './motion';
import { colors, font } from './theme';
import { IconButton, Txt } from './ui';

WebBrowser.maybeCompleteAuthSession();

export function AuthShell({ title, sub, children, footer }: { title: string; sub: string; children: React.ReactNode; footer: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const r = useStagger(3, { stagger: 0.1 });
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24, paddingHorizontal: 24, flexGrow: 1 }}>
        <IconButton icon={ArrowLeft} label="Go back" tint={colors.card} onPress={() => (router.canGoBack() ? router.back() : router.replace('/login'))} />
        <Reveal p={r[0]!}>
          <Txt v="h1" style={{ textAlign: 'center', marginTop: 48, fontFamily: font.semibold }}>
            {title}
          </Txt>
          <Txt color={colors.textMuted} style={{ textAlign: 'center', marginTop: 12, marginBottom: 32 }}>
            {sub}
          </Txt>
        </Reveal>
        <Reveal p={r[1]!} style={{ gap: 14 }}>
          {children}
        </Reveal>
        <View style={{ flex: 1 }} />
        <Reveal p={r[2]!}>{footer}</Reveal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export const INVITE_ONLY = 'C7 is invite-only. Ask your coach or the front desk to invite this email, then accept the invite and sign in here.';
/** Thrown when an email has no C7 account yet — the screen then offers to create one (guest). */
export class NeedsSignUp extends Error {
  constructor() {
    super('NEEDS_SIGN_UP');
  }
}
export const SIGNUPS_CLOSED = 'New sign-ups are closed right now. Ask the C7 front desk to invite this email.';

/** Human message for Clerk errors (no raw codes on screen). */
export function authError(e: unknown): string {
  if (isClerkAPIResponseError(e)) {
    const err = e.errors[0];
    switch (err?.code) {
      case 'not_allowed_access':
      case 'sign_up_restricted_waitlist':
      case 'sign_up_mode_restricted':
      case 'sign_up_restricted':
        return SIGNUPS_CLOSED;
      case 'form_identifier_not_found':
      case 'external_account_not_found':
        return INVITE_ONLY;
      case 'form_identifier_exists':
        return 'That email already has an account. Go back and sign in instead.';
      case 'form_code_incorrect':
        return 'That code isn’t right. Check the latest email and try again.';
      case 'verification_expired':
        return 'That code expired. Tap “Resend code” for a new one.';
      case 'too_many_requests':
        return 'Too many attempts. Wait a minute and try again.';
      default:
        return err?.longMessage || err?.message || 'Sign-in failed. Please try again.';
    }
  }
  return e instanceof Error ? e.message : 'Sign-in failed. Please try again.';
}

/** Email one-time-code sign-in (Clerk email_code), with sign-up for new emails (they join as guests). */
export function useEmailCode() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { signUp, setActive: setActiveSignUp } = useSignUp();
  const mode = useRef<'in' | 'up'>('in');
  return {
    isLoaded,
    async signUp(email: string, firstName: string, lastName: string) {
      if (!signUp) throw new Error('Still loading, try again');
      mode.current = 'up';
      await signUp.create({ emailAddress: email.trim().toLowerCase(), firstName: firstName.trim(), lastName: lastName.trim() || undefined });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      return 'signup';
    },
    async send(email: string) {
      if (!signIn) throw new Error('Still loading, try again');
      mode.current = 'in';
      let si;
      try {
        si = await signIn.create({ identifier: email.trim().toLowerCase() });
      } catch (e) {
        if (isClerkAPIResponseError(e) && e.errors[0]?.code === 'form_identifier_not_found') throw new NeedsSignUp();
        throw e;
      }
      const factor = si.supportedFirstFactors?.find((f) => f.strategy === 'email_code') as { emailAddressId: string } | undefined;
      if (!factor) throw new Error('Email codes aren’t enabled for this account. Use Google instead.');
      await signIn.prepareFirstFactor({ strategy: 'email_code', emailAddressId: factor.emailAddressId });
      return factor.emailAddressId;
    },
    async resend(emailAddressId: string) {
      if (emailAddressId === 'signup') return void (await signUp!.prepareEmailAddressVerification({ strategy: 'email_code' }));
      await signIn!.prepareFirstFactor({ strategy: 'email_code', emailAddressId });
    },
    async verify(code: string) {
      if (mode.current === 'up' || signUp?.status === 'missing_requirements' || signUp?.unverifiedFields?.includes('email_address')) {
        const r = await signUp!.attemptEmailAddressVerification({ code });
        if (r.status !== 'complete' || !r.createdSessionId) throw new Error('We couldn’t finish creating your account. Try again in a minute.');
        await setActiveSignUp!({ session: r.createdSessionId });
        return;
      }
      const r = await signIn!.attemptFirstFactor({ strategy: 'email_code', code });
      if (r.status !== 'complete' || !r.createdSessionId) throw new Error('Additional verification is required. Sign in on the web once, then try again.');
      await setActive!({ session: r.createdSessionId });
    },
  };
}

/** Google sign-in. Native: in-app browser SSO. Web: full-page redirect back to /sso-callback. */
export function useGoogle() {
  const { startSSOFlow } = useSSO();
  const { signIn } = useSignIn();
  return async () => {
    if (Platform.OS === 'web') {
      await signIn!.authenticateWithRedirect({ strategy: 'oauth_google', redirectUrl: `${window.location.origin}/sso-callback`, redirectUrlComplete: `${window.location.origin}/` });
      return false;
    }
    const { createdSessionId, setActive, signUp } = await startSSOFlow({ strategy: 'oauth_google', redirectUrl: Linking.createURL('sso-callback') });
    if (createdSessionId) {
      await setActive!({ session: createdSessionId });
      return true;
    }
    // A Google account with no C7 account becomes a guest; an incomplete sign-up means sign-ups are closed.
    if (signUp && signUp.status !== 'complete') throw new Error(SIGNUPS_CLOSED);
    return false;
  };
}

/** Web only: finishes the Google redirect. */
export function SsoCallbackHandler() {
  const clerk = useClerk();
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    clerk
      .handleRedirectCallback({ signInFallbackRedirectUrl: '/', signUpFallbackRedirectUrl: '/' }, async (to) => router.replace(to.startsWith('/') ? (to as '/') : '/'))
      .catch((e) => setError(authError(e)));
  }, [clerk]);
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }}>
      <Txt v="h3">{error ? 'Couldn’t sign you in' : 'Signing you in…'}</Txt>
      {!!error && (
        <Txt color={colors.textMuted} style={{ textAlign: 'center' }} onPress={() => router.replace('/login')}>
          {error} Tap to go back.
        </Txt>
      )}
    </View>
  );
}
