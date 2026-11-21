import { useMutation, type UseMutationResult } from '@tanstack/react-query';

import { signUpWithEmail, type SignUpInput, type SignUpResult } from '../services/auth.service';

/**
 * Creates an account. If email confirmation is off the person is signed in straight away (the
 * navigator takes over); if it is on, `data.needsEmailConfirmation` is true and the screen tells
 * them to check their email.
 */
export function useSignUp(): UseMutationResult<SignUpResult, Error, SignUpInput> {
  return useMutation({ mutationFn: signUpWithEmail });
}
