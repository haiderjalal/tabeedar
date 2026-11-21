import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * How a notification that arrives while the app is open is shown: as a banner with a sound, like
 * one that arrives when the app is closed. Without this, Expo would hide it. Runs once, when this
 * file is first imported; the web build has no push, so it is left alone there.
 */
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}
