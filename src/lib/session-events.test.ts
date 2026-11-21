import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  BEFORE_SIGN_OUT_TIMEOUT_MS,
  emitSignedOut,
  onBeforeSignOut,
  onSignedOut,
  runBeforeSignOut,
} from './session-events';

describe('session events', () => {
  it('tells every listener when someone signs out', () => {
    const first = vi.fn();
    const second = vi.fn();
    const stopFirst = onSignedOut(first);
    const stopSecond = onSignedOut(second);

    emitSignedOut();
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);

    stopFirst();
    stopSecond();
  });

  it('stops calling a listener that unsubscribed', () => {
    const listener = vi.fn();
    const stop = onSignedOut(listener);
    stop();

    emitSignedOut();
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('before sign out', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('waits for every handler to finish', async () => {
    let finished = false;
    const stop = onBeforeSignOut(async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      finished = true;
    });

    const done = runBeforeSignOut();
    await vi.advanceTimersByTimeAsync(500);
    await done;
    expect(finished).toBe(true);
    stop();
  });

  it('carries on when a handler fails', async () => {
    const stopFailing = onBeforeSignOut(async () => {
      throw new Error('offline');
    });
    const working = vi.fn(async () => undefined);
    const stopWorking = onBeforeSignOut(working);

    await expect(runBeforeSignOut()).resolves.toBeUndefined();
    expect(working).toHaveBeenCalledTimes(1);
    stopFailing();
    stopWorking();
  });

  it('never holds sign-out up for longer than the limit', async () => {
    const stop = onBeforeSignOut(() => new Promise<void>(() => undefined));

    let returned = false;
    const done = runBeforeSignOut().then(() => {
      returned = true;
    });
    await vi.advanceTimersByTimeAsync(BEFORE_SIGN_OUT_TIMEOUT_MS - 1);
    expect(returned).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await done;
    expect(returned).toBe(true);
    stop();
  });

  it('stops calling a handler that unsubscribed', async () => {
    const handler = vi.fn(async () => undefined);
    onBeforeSignOut(handler)();

    await runBeforeSignOut();
    expect(handler).not.toHaveBeenCalled();
  });
});
