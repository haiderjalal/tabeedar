import { IMAGE_BUCKET } from '../constants';

/**
 * The public web address of a stored picture. The bucket is public, so this is plain string
 * building (no request, no signing): the same address works for every customer and caches well.
 *
 * `baseUrl` is the Supabase project URL. It is a parameter so this stays a pure function that can
 * be tested without the app's environment.
 */
export function buildPublicImageUrl(baseUrl: string, path: string | null): string | null {
  if (path === null || path === '') return null;
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  return `${baseUrl.replace(/\/+$/, '')}/storage/v1/object/public/${IMAGE_BUCKET}/${encodedPath}`;
}
