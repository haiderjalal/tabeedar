/**
 * Reads the EAS project id from the app's `extra` configuration (`extra.eas.projectId` in app.json,
 * written by `eas init`). Expo needs it to hand out a push token for this app. Returns null when it
 * is not set up yet; the app then skips push registration instead of guessing.
 */
export function readProjectId(extra: unknown): string | null {
  if (typeof extra !== 'object' || extra === null) return null;
  const eas = (extra as Record<string, unknown>).eas;
  if (typeof eas !== 'object' || eas === null) return null;
  const projectId = (eas as Record<string, unknown>).projectId;
  return typeof projectId === 'string' && projectId.trim() !== '' ? projectId : null;
}
