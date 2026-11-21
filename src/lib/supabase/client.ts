import 'react-native-url-polyfill/auto';
// Installs a synchronous `localStorage` backed by SQLite. We use it for the auth session
// because the session JSON is larger than the 2 KB value limit of expo-secure-store.
import 'expo-sqlite/localStorage/install';

import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import { env } from '@/lib/env';

/**
 * The single Supabase client for the whole app.
 *
 * Import it only from service modules (`features/<name>/services`), never from screens,
 * so data access stays in one layer. In Phase 1 this becomes `createClient<Database>`
 * once the generated database types exist.
 */
export const supabase = createClient(env.supabaseUrl, env.supabasePublishableKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    // React Native has no browser URL to parse a session from.
    detectSessionInUrl: false,
  },
});

// Token refresh uses timers, which the OS suspends in the background. Pausing it while
// the app is inactive and resuming on foreground is Supabase's recommended setup for RN.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    void supabase.auth.startAutoRefresh();
  } else {
    void supabase.auth.stopAutoRefresh();
  }
});
