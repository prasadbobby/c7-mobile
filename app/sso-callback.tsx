import { Redirect } from 'expo-router';
import { Platform } from 'react-native';
import { AUTH_MODE } from '@/api/session';
import { SsoCallbackHandler } from '@/auth';

/** Google sign-in returns here. Native: the in-app browser already finished; web: complete the redirect. */
export default function SsoCallback() {
  if (Platform.OS === 'web' && AUTH_MODE === 'clerk') return <SsoCallbackHandler />;
  return <Redirect href="/" />;
}
