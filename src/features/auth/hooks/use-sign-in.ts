import { useMutation, type UseMutationResult } from '@tanstack/react-query';

import { signInWithEmail, type SignInInput } from '../services/auth.service';

/**
 * Signs in with email and password. On success there is nothing to do here: the auth provider
 * hears about the new session and the navigator moves the person to their area.
 */
export function useSignIn(): UseMutationResult<void, Error, SignInInput> {
  return useMutation({ mutationFn: signInWithEmail });
}
