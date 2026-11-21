import * as Location from 'expo-location';

import { logger } from '@/lib/logger';

import type { Coordinates } from '../utils/coordinates';

/** What happened when we tried to find the phone's position. */
export type CurrentPositionResult =
  { status: 'ok'; coordinates: Coordinates } | { status: 'denied' } | { status: 'unavailable' };

/**
 * Asks for permission (the first time) and reads the phone's current position. Never throws:
 * every failure becomes a status the screen can explain.
 */
export async function getCurrentPosition(): Promise<CurrentPositionResult> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== Location.PermissionStatus.GRANTED) return { status: 'denied' };

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      status: 'ok',
      coordinates: { latitude: position.coords.latitude, longitude: position.coords.longitude },
    };
  } catch (error) {
    logger.warn('Could not read the current position', {
      message: error instanceof Error ? error.message : 'unknown',
    });
    return { status: 'unavailable' };
  }
}
