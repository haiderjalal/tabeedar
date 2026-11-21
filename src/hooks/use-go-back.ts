import { useRouter, type Href } from 'expo-router';

/**
 * Returns a function that goes back one screen. If there is nothing to go back to (the screen was
 * opened straight from a link, or the app was restarted on it) it goes to `fallback` instead, so
 * a person is never left stuck on a screen whose job is done.
 */
export function useGoBack(fallback: Href): () => void {
  const router = useRouter();

  return () => {
    if (router.canGoBack()) router.back();
    else router.replace(fallback);
  };
}
