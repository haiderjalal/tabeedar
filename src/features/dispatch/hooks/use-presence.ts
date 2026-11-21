import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/features/auth/hooks/use-auth';
import {
  useCurrentLocation,
  type LocationProblem,
} from '@/features/location/hooks/use-current-location';
import { getCurrentPosition } from '@/features/location/services/location.service';

import { PRESENCE_PING_MS } from '../constants';
import { dispatchKeys } from '../query-keys';
import { setPresence, type PresenceInput } from '../services/dispatch.service';
import type { RiderAccount } from '../types';

import { useMyRider } from './use-my-rider';

/** Reports presence, then updates the cached account and re-reads the offers. */
export function useSetPresence(): UseMutationResult<void, Error, PresenceInput> {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useMutation({
    mutationFn: setPresence,
    onSuccess: (_result, { isOnline, coordinates }) => {
      queryClient.setQueryData<RiderAccount | null>(dispatchKeys.mine(userId), (current) =>
        current
          ? {
              ...current,
              isOnline,
              latitude: coordinates?.latitude ?? current.latitude,
              longitude: coordinates?.longitude ?? current.longitude,
            }
          : current,
      );
      void queryClient.invalidateQueries({ queryKey: dispatchKeys.offers });
    },
    onError: () => {
      // The usual reason is that the account changed (suspended): re-read it so the area follows.
      void queryClient.invalidateQueries({ queryKey: dispatchKeys.mine(userId) });
    },
  });
}

interface PresenceSwitch {
  isOnline: boolean;
  /** Goes online (reading the phone's position first) or offline. */
  setOnline: (next: boolean) => Promise<void>;
  /** True while the position is being read or the change is being saved. */
  isBusy: boolean;
  /** Why the position could not be read, when that is what went wrong. */
  locationProblem: LocationProblem;
  /** The error from saving the change, if it failed. */
  error: Error | null;
}

/** The online/offline switch: everything the switch needs, so the screen only draws it. */
export function usePresenceSwitch(): PresenceSwitch {
  const rider = useMyRider();
  const presence = useSetPresence();
  const { locate, isLocating, problem } = useCurrentLocation();

  async function setOnline(next: boolean): Promise<void> {
    if (!next) {
      presence.mutate({ isOnline: false, coordinates: null });
      return;
    }
    const coordinates = await locate();
    if (coordinates) presence.mutate({ isOnline: true, coordinates });
  }

  return {
    isOnline: rider.data?.isOnline ?? false,
    setOnline,
    isBusy: isLocating || presence.isPending,
    locationProblem: problem,
    error: presence.isError ? presence.error : null,
  };
}

/**
 * While the rider is online and the app is open, sends their position about once a minute (and once
 * straight away, because the saved position may be old). Nothing is sent from the background: the
 * owner chose "only while the app is open", so offers pause if the rider leaves the app.
 */
export function usePresenceHeartbeat(): void {
  const rider = useMyRider();
  const { mutate } = useSetPresence();
  const isOnline = rider.data?.isOnline ?? false;
  // The latest `mutate` without re-creating the timer every render.
  const mutateRef = useRef(mutate);
  useEffect(() => {
    mutateRef.current = mutate;
  }, [mutate]);

  useEffect(() => {
    if (!isOnline) return;
    let cancelled = false;

    async function ping(): Promise<void> {
      if (AppState.currentState !== 'active') return;
      const result = await getCurrentPosition();
      if (cancelled || result.status !== 'ok') return;
      mutateRef.current({ isOnline: true, coordinates: result.coordinates });
    }

    void ping();
    const timer = setInterval(() => void ping(), PRESENCE_PING_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [isOnline]);
}
