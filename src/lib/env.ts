import { z } from 'zod';

/**
 * Validated, typed access to environment variables.
 *
 * Only `EXPO_PUBLIC_*` variables may be read here: Expo inlines them into the JavaScript
 * bundle at build time, so they are visible to anyone who inspects the app. Secrets
 * (Supabase service-role key, push credentials, ...) must never be added here; they
 * belong in Supabase Edge Functions or EAS secrets.
 */

const envSchema = z.object({
  supabaseUrl: z.url('EXPO_PUBLIC_SUPABASE_URL must be a valid URL'),
  supabasePublishableKey: z.string().min(1, 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required'),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  // Each variable is read as a literal `process.env.NAME`; Expo can only inline
  // statically written accesses, not `process.env[name]` or destructuring.
  const result = envSchema.safeParse({
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabasePublishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `- ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    // Failing at startup is deliberate: a misconfigured build should never reach users.
    throw new Error(
      `Invalid environment configuration:\n${problems}\n` +
        'Copy .env.example to .env.local and fill in the values.',
    );
  }

  return result.data;
}

export const env = loadEnv();
