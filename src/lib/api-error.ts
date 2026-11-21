/**
 * What we can read from an error returned by Supabase's data API (PostgREST). Database functions
 * raise short machine-readable codes such as `store_unavailable` as the error message.
 */
export interface ApiErrorInfo {
  code: string;
  message: string;
}

function readString(source: object, field: string): string {
  const value = (source as Record<string, unknown>)[field];
  return typeof value === 'string' ? value : '';
}

export function readApiError(error: unknown): ApiErrorInfo {
  if (typeof error !== 'object' || error === null) return { code: '', message: '' };
  return { code: readString(error, 'code'), message: readString(error, 'message') };
}

/**
 * True when the request never reached the server (offline, DNS, timeout). The data client reports
 * those with an empty code and the browser's or phone's own message.
 */
export function isNetworkError(error: unknown): boolean {
  const { code, message } = readApiError(error);
  return code === '' && /network|fetch|timed? ?out|connection/i.test(message);
}
