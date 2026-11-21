import { createContext } from 'react';

import type { AuthStatus, Profile, UserRole } from '../types';

export interface AuthUser {
  id: string;
  email: string | null;
}

export interface AuthContextValue {
  status: AuthStatus;
  /** The signed-in user, or null when signed out. */
  user: AuthUser | null;
  /** Loaded once the person is signed in; null before that and when loading failed. */
  profile: Profile | null;
  /** Shortcut for `profile.role`. Set exactly when `status` is 'ready'. */
  role: UserRole | null;
  /** Tries to load the profile again after a failure (status 'error'). */
  retryProfile: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
