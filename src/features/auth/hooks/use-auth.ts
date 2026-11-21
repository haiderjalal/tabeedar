import { useContext } from 'react';

import { AuthContext, type AuthContextValue } from '../context/auth-context';

/** Who is signed in, their profile and role. Must be used inside `AuthProvider`. */
export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (value === null) {
    throw new Error('useAuth must be used inside <AuthProvider>.');
  }
  return value;
}
