import { Redirect } from 'expo-router';

/** Unknown paths (e.g. when the web build is hosted under a sub-path) fall back to the app start. */
export default function NotFound() {
  return <Redirect href="/" />;
}
