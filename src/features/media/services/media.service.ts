import { randomUUID } from 'expo-crypto';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { launchImageLibraryAsync } from 'expo-image-picker';

import { env } from '@/lib/env';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';

import {
  IMAGE_BUCKET,
  IMAGE_MAX_SIDE,
  JPEG_QUALITY,
  MAX_UPLOAD_BYTES,
  UPLOAD_CONTENT_TYPE,
  type ImageKind,
} from '../constants';
import { buildImagePath } from '../utils/image-path';
import { MediaError } from '../utils/media-error';
import { buildPublicImageUrl } from '../utils/public-image-url';

/**
 * Choosing, shrinking and uploading store pictures. The bucket's access rules (see the
 * `catalog_images` migration) are the real gate: only a store's owner can write inside
 * `stores/<their store id>/`, and only small JPEG/PNG/WebP files are accepted. Everything here is
 * about making the files small and the errors understandable.
 */

/** The public address of a stored picture, or null when there is none. */
export function publicImageUrl(path: string | null): string | null {
  return buildPublicImageUrl(env.supabaseUrl, path);
}

/**
 * Opens the phone's photo library and returns the chosen picture's local address, or null if the
 * person backed out. The system picker is used, so no storage permission has to be requested.
 */
export async function pickImageFromLibrary(kind: ImageKind): Promise<string | null> {
  const result = await launchImageLibraryAsync({
    mediaTypes: ['images'],
    // Square crop for logos and product photos. A cover keeps the photo's own shape.
    allowsEditing: kind !== 'cover',
    aspect: [1, 1],
    // Full quality here: we compress once, ourselves, after choosing the size.
    quality: 1,
  });

  if (result.canceled) return null;
  const asset = result.assets[0];
  return asset ? asset.uri : null;
}

/** Shrinks a picture to the size its use needs and re-encodes it as JPEG. Returns the new local file. */
async function shrinkToJpeg(localUri: string, kind: ImageKind): Promise<string> {
  const maxSide = IMAGE_MAX_SIDE[kind];
  try {
    // `maxWidth`/`maxHeight` downsample while decoding, so a 12 MP photo is never held in memory
    // at full size, and a picture that is already small is not enlarged.
    const rendered = await ImageManipulator.manipulate(localUri, {
      maxWidth: maxSide,
      maxHeight: maxSide,
    }).renderAsync();
    const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: JPEG_QUALITY });
    return saved.uri;
  } catch (error) {
    logger.warn('Could not prepare picture', { reason: String(error) });
    throw new MediaError('unreadable');
  }
}

export interface UploadStoreImageInput {
  storeId: number;
  kind: ImageKind;
  /** The local address returned by `pickImageFromLibrary`. */
  localUri: string;
}

/** Uploads a picture to the store's folder and returns its path (to be saved on the store or product). */
export async function uploadStoreImage({
  storeId,
  kind,
  localUri,
}: UploadStoreImageInput): Promise<string> {
  const preparedUri = await shrinkToJpeg(localUri, kind);

  let bytes: ArrayBuffer;
  try {
    // `fetch` reads local files on phones and blob addresses on web, so one code path serves both.
    bytes = await (await fetch(preparedUri)).arrayBuffer();
  } catch (error) {
    logger.warn('Could not read prepared picture', { reason: String(error) });
    throw new MediaError('unreadable');
  }
  if (bytes.byteLength > MAX_UPLOAD_BYTES) throw new MediaError('too_large');

  const path = buildImagePath(storeId, kind, randomUUID());
  const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, bytes, {
    contentType: UPLOAD_CONTENT_TYPE,
    // Every upload has a fresh name, so there is never anything to overwrite.
    upsert: false,
  });

  if (error) {
    logger.warn('Picture upload failed', { reason: error.message });
    throw new MediaError('upload_failed');
  }
  return path;
}

/**
 * Deletes a picture nobody uses any more. Best effort: a leftover file costs a few kilobytes and
 * is never shown, so a failure here is logged and never shown to the store owner.
 */
export async function removeStoreImage(path: string): Promise<void> {
  const { error } = await supabase.storage.from(IMAGE_BUCKET).remove([path]);
  if (error) logger.warn('Could not delete old picture', { reason: error.message });
}
