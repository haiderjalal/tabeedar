import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import { useAuth } from '@/features/auth/hooks/use-auth';

import { APPROVAL_CHECK_MS } from '../constants';
import { dispatchKeys } from '../query-keys';
import { getMyRider, registerAsRider } from '../services/dispatch.service';
import type { RiderAccount } from '../types';

/**
 * The signed-in rider's registration. `data` is null until they have registered. While approval is
 * pending it is re-checked every half minute, so the screen moves on the moment the owner approves.
 */
export function useMyRider(): UseQueryResult<RiderAccount | null, Error> {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: dispatchKeys.mine(userId),
    queryFn: () => (userId === null ? Promise.resolve(null) : getMyRider(userId)),
    enabled: userId !== null,
    refetchInterval: (query) =>
      query.state.data?.status === 'pending' ? APPROVAL_CHECK_MS : false,
  });
}

/** Sends the registration (status starts as pending) and puts the result straight into the cache. */
export function useRegisterRider(): UseMutationResult<RiderAccount, Error, void> {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useMutation({
    mutationFn: () => {
      if (userId === null) throw new Error('Not signed in.');
      return registerAsRider(userId);
    },
    onSuccess: (account) => {
      queryClient.setQueryData(dispatchKeys.mine(userId), account);
    },
  });
}
