/** Shortest password we accept. Supabase's own minimum is lower; this is the app's rule. */
export const MIN_PASSWORD_LENGTH = 8;

/** bcrypt, which Supabase uses for passwords, ignores everything past 72 bytes. */
export const MAX_PASSWORD_LENGTH = 72;

/** Matches the length check on `profiles.full_name` in the database. */
export const MAX_NAME_LENGTH = 120;
