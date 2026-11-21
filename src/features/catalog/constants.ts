/** Maximum lengths. They match the check constraints on `categories` and `products`. */
export const MAX_CATEGORY_NAME_LENGTH = 80;
export const MAX_PRODUCT_NAME_LENGTH = 120;
export const MAX_PRODUCT_DESCRIPTION_LENGTH = 1000;

/**
 * The highest price accepted, in rupees. A technical guard against a slipped finger (an extra
 * zero, a pasted number), not a business rule; the database column itself could hold far more.
 */
export const MAX_PRICE = 10_000_000;
