/**
 * Minimal structured logger.
 *
 * All app logging goes through here instead of calling `console` directly, so we can
 * later forward errors to a monitoring service (e.g. Sentry) in exactly one place.
 *
 * Never put personal data (names, phone numbers, addresses) or tokens in `context`.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogContext = Record<string, unknown>;

function log(level: LogLevel, message: string, context?: LogContext): void {
  // Debug output is development-only so production logs stay quiet.
  if (level === 'debug' && !__DEV__) return;

  const line = `[${level}] ${message}`;
  /* eslint-disable no-console -- this is the single place console is allowed */
  if (context) {
    console[level](line, context);
  } else {
    console[level](line);
  }
  /* eslint-enable no-console */
}

export const logger = {
  debug: (message: string, context?: LogContext): void => log('debug', message, context),
  info: (message: string, context?: LogContext): void => log('info', message, context),
  warn: (message: string, context?: LogContext): void => log('warn', message, context),
  error: (message: string, context?: LogContext): void => log('error', message, context),
};
