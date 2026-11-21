/**
 * English strings for notifications on the phone. The text of the notifications themselves is written
 * by the sender (supabase/functions/_shared/push-messages.ts), in the language the phone reports.
 */
export const notifications = {
  // Shown in the phone's own notification settings for the app.
  channelName: 'Order updates',
  off: {
    title: 'Notifications are off',
    body: 'Turn them on in your phone settings, so you hear about orders as they happen even when the app is closed.',
    action: 'Open settings',
  },
};
