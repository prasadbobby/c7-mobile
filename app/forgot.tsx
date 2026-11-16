import { Redirect } from 'expo-router';

/** Passwords aren't used (email codes + Google), so this route forwards to the code sign-in. */
export default function Forgot() {
  return <Redirect href="/email-login" />;
}
