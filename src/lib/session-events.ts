/**
 * Small signals about the person's session, so features that keep things tied to the signed-in person
 * can react without the auth feature having to know they exist.
 *
 *  - "signed out": wipe data kept on the device (the cart, the chosen address).
 *  - "before sign out": do work that needs the person still signed in (forget this phone's push token,
 *    which the database only lets the signed-in owner remove).
 */
const signedOutListeners = new Set<() => void>();

/** Calls `listener` whenever someone signs out. Returns a function that stops listening. */
export function onSignedOut(listener: () => void): () => void {
  signedOutListeners.add(listener);
  return () => {
    signedOutListeners.delete(listener);
  };
}

/** Called by the auth provider when the session ends. */
export function emitSignedOut(): void {
  signedOutListeners.forEach((listener) => listener());
}

type BeforeSignOutHandler = () => Promise<void>;

const beforeSignOutHandlers = new Set<BeforeSignOutHandler>();

/** Runs `handler` just before sign-out, while the person is still signed in. Returns a stop function. */
export function onBeforeSignOut(handler: BeforeSignOutHandler): () => void {
  beforeSignOutHandlers.add(handler);
  return () => {
    beforeSignOutHandlers.delete(handler);
  };
}

/** Never hold up signing out for longer than this, whatever the handlers are doing (offline, slow). */
export const BEFORE_SIGN_OUT_TIMEOUT_MS = 3000;

/**
 * Called by the sign-out action. Waits for every handler, but gives up after a few seconds and
 * ignores a handler that fails: signing out must always work, even with no connection.
 */
export async function runBeforeSignOut(): Promise<void> {
  if (beforeSignOutHandlers.size === 0) return;

  const everything = Promise.allSettled([...beforeSignOutHandlers].map((handler) => handler()));
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, BEFORE_SIGN_OUT_TIMEOUT_MS);
  });
  try {
    await Promise.race([everything, timeout]);
  } finally {
    clearTimeout(timer);
  }
}
