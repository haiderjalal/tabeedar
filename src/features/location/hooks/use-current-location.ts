import { useState } from 'react';

import { getCurrentPosition } from '../services/location.service';
import type { Coordinates } from '../utils/coordinates';

export type LocationProblem = 'denied' | 'unavailable' | null;

interface UseCurrentLocationResult {
  /** Reads the phone's position. Resolves with it, or null if it could not be read. */
  locate: () => Promise<Coordinates | null>;
  isLocating: boolean;
  /** Why the last attempt failed, or null if it worked or has not been tried. */
  problem: LocationProblem;
}

/** The phone's current position, with a plain reason when it cannot be had. */
export function useCurrentLocation(): UseCurrentLocationResult {
  const [isLocating, setIsLocating] = useState(false);
  const [problem, setProblem] = useState<LocationProblem>(null);

  async function locate(): Promise<Coordinates | null> {
    setIsLocating(true);
    setProblem(null);
    const result = await getCurrentPosition();
    setIsLocating(false);

    if (result.status === 'ok') return result.coordinates;
    setProblem(result.status);
    return null;
  }

  return { locate, isLocating, problem };
}
