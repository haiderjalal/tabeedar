/**
 * Settings for store pictures (logo, cover, product photos).
 *
 * The bucket and its limits are created by the `catalog_images` migration; the values here must
 * match it (the database refuses anything larger or of another type, whatever the app sends).
 */

/** The public Storage bucket that holds every picture. */
export const IMAGE_BUCKET = 'catalog-images';

/** The bucket's size limit. Pictures are shrunk well below this before upload. */
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

export const IMAGE_KINDS = ['logo', 'cover', 'product'] as const;
export type ImageKind = (typeof IMAGE_KINDS)[number];

/**
 * The longest side, in pixels, a picture is shrunk to before upload. Phone photos are 3000+ px and
 * several MB; a product card never shows more than ~800 px, so the rest is wasted data for every
 * customer who loads it.
 */
export const IMAGE_MAX_SIDE: Record<ImageKind, number> = {
  logo: 512,
  product: 800,
  cover: 1280,
};

/** JPEG quality (0 to 1). 0.8 is visually lossless for photos at a fraction of the size. */
export const JPEG_QUALITY = 0.8;

/** Every upload is converted to JPEG, so this is the only content type and extension used. */
export const UPLOAD_CONTENT_TYPE = 'image/jpeg';
export const UPLOAD_EXTENSION = 'jpg';
