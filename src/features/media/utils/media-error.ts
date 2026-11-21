/** Why choosing or uploading a picture failed, in terms the person can act on. */
export type MediaErrorCode = 'too_large' | 'unreadable' | 'upload_failed';

/** Thrown by the media service. The code selects the message shown to the store owner. */
export class MediaError extends Error {
  readonly code: MediaErrorCode;

  constructor(code: MediaErrorCode) {
    super(code);
    this.name = 'MediaError';
    this.code = code;
  }
}

/** The key under `media.errors.*` for any error thrown while picking or uploading. */
export function toMediaErrorKey(error: unknown): MediaErrorCode {
  return error instanceof MediaError ? error.code : 'upload_failed';
}
