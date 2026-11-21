import { Stack } from 'expo-router';

/** Screens for people who are not signed in. */
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
