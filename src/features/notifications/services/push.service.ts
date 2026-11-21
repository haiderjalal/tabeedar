import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import type { LanguageCode } from '@/lib/i18n/config';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';

import { ANDROID_CHANNEL_ID } from '../constants';
import { readProjectId } from '../utils/project-id';

/**
 * Everything the app does about push notifications: asking permission, getting this phone's Expo
 * push token, and telling the database about it. Sending is done by the `send-push` Edge Function;
 * who is told what is decided in the database. Phones only: the web build has no push.
 */

export type PermissionState = 'granted' | 'denied' | 'undetermined';

/** True on Android and iPhone, where Expo can hand out a push token. */
export function isPushSupported(): boolean {
  return Platform.OS === 'android' || Platform.OS === 'ios';
}

function toPermissionState(status: Notifications.PermissionStatus): PermissionState {
  if (status === Notifications.PermissionStatus.GRANTED) return 'granted';
  if (status === Notifications.PermissionStatus.DENIED) return 'denied';
  return 'undetermined';
}

export async function getPermissionState(): Promise<PermissionState> {
  const { status } = await Notifications.getPermissionsAsync();
  return toPermissionState(status);
}

/** Asks the person (the system shows its own prompt, once). */
export async function requestPermission(): Promise<PermissionState> {
  const { status } = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: false, allowSound: true },
  });
  return toPermissionState(status);
}

/**
 * Creates the Android channel order notifications use (a no-op elsewhere). `name` is what the person
 * sees in the phone's notification settings, so it is translated. Must run before the token is saved:
 * a push for a channel that does not exist on the phone is never shown.
 */
export async function ensureNotificationChannel(name: string): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name,
    importance: AndroidImportance.HIGH,
    sound: 'default',
    enableVibrate: true,
    vibrationPattern: [0, 250, 250, 250],
    showBadge: false,
  });
}

/**
 * This phone's Expo push token, or null when it cannot be had: no EAS project set up yet, a
 * simulator, or no connection. Never throws.
 */
export async function fetchExpoPushToken(): Promise<string | null> {
  const projectId = Constants.easConfig?.projectId ?? readProjectId(Constants.expoConfig?.extra);
  if (projectId === null || projectId === undefined) {
    logger.warn('Push notifications are not set up: the app has no EAS project id');
    return null;
  }
  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data;
  } catch (error) {
    logger.warn('Could not get a push token', {
      message: error instanceof Error ? error.message : 'unknown',
    });
    return null;
  }
}

/** Tells the database this phone belongs to the signed-in person, and which language it uses. */
export async function saveDeviceToken(token: string, language: LanguageCode): Promise<void> {
  const { error } = await supabase.rpc('register_push_token', {
    p_token: token,
    p_platform: Platform.OS === 'ios' ? 'ios' : 'android',
    p_language: language,
  });
  if (error) {
    logger.warn('Could not save the push token', { code: error.code, reason: error.message });
    throw error;
  }
}

/** Stops notifying this phone for the signed-in person. Called just before they sign out. */
export async function removeDeviceToken(token: string): Promise<void> {
  const { error } = await supabase.rpc('unregister_push_token', { p_token: token });
  if (error) {
    logger.warn('Could not remove the push token', { code: error.code, reason: error.message });
    throw error;
  }
}

// The token this run of the app registered, kept so sign-out can remove exactly that one.
let registeredToken: string | null = null;

export function rememberRegisteredToken(token: string): void {
  registeredToken = token;
}

/** The registered token, forgotten once taken (it is removed from the database right after). */
export function takeRegisteredToken(): string | null {
  const token = registeredToken;
  registeredToken = null;
  return token;
}
