import { UPLOAD_EXTENSION, type ImageKind } from '../constants';

/**
 * Where a picture lives in Storage: `stores/<store id>/<kind>/<file id>.jpg`.
 *
 * The store id in the path is what the bucket's access rules check, so a store can only write
 * inside its own folder. The file id is a fresh UUID for every upload, which means a replaced
 * picture gets a new address (no stale copies in caches) and nothing can overwrite another file.
 */
export function buildImagePath(storeId: number, kind: ImageKind, fileId: string): string {
  return `stores/${storeId}/${kind}/${fileId}.${UPLOAD_EXTENSION}`;
}

/**
 * True if the path is inside the given store's folder. The same rule exists as a database check on
 * the `logo_url`, `cover_url` and `image_url` columns; checking it here gives a clear error before
 * anything is saved.
 */
export function isImagePathOfStore(path: string, storeId: number): boolean {
  return path.startsWith(`stores/${storeId}/`) && !path.includes('..');
}
