import { afterEach, describe, expect, it } from 'vitest';

import {
  BACKUP_REFRESH_MS,
  getRealtimeStatus,
  orderRefreshInterval,
  pickRefreshInterval,
  setRealtimeStatus,
} from './realtime-status';

describe('pickRefreshInterval', () => {
  it('polls at the normal fast pace until Realtime is connected', () => {
    expect(pickRefreshInterval('connecting', 10_000)).toBe(10_000);
    expect(pickRefreshInterval('down', 10_000)).toBe(10_000);
  });

  it('slows to the safety-net pace once Realtime is connected', () => {
    expect(pickRefreshInterval('connected', 10_000)).toBe(BACKUP_REFRESH_MS);
  });

  it('never polls faster than asked, even when connected', () => {
    expect(pickRefreshInterval('connected', 120_000)).toBe(120_000);
  });
});

describe('the current status', () => {
  afterEach(() => {
    setRealtimeStatus('connecting');
  });

  it('starts as connecting, so a fresh app polls fast', () => {
    expect(getRealtimeStatus()).toBe('connecting');
    expect(orderRefreshInterval(15_000)).toBe(15_000);
  });

  it('follows the connection', () => {
    setRealtimeStatus('connected');
    expect(orderRefreshInterval(15_000)).toBe(BACKUP_REFRESH_MS);
    setRealtimeStatus('down');
    expect(orderRefreshInterval(15_000)).toBe(15_000);
  });
});
