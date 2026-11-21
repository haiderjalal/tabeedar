export interface OrderSignatureInput {
  storeId: number | null;
  lines: { productId: number; quantity: number }[];
  addressId: number | null;
  recipientName: string;
  recipientPhone: string;
  notes: string;
}

/**
 * A short fingerprint of everything that defines the order. While it stays the same, pressing
 * "Place order" again after a bad connection reuses the same idempotency key, so the database can
 * recognise a repeat and return the first order instead of creating a second one. If the customer
 * changes anything, the fingerprint changes and a fresh key is used.
 */
export function buildOrderSignature(input: OrderSignatureInput): string {
  const lines = [...input.lines]
    .sort((a, b) => a.productId - b.productId)
    .map((line) => `${line.productId}x${line.quantity}`)
    .join(',');
  return JSON.stringify([
    input.storeId,
    lines,
    input.addressId,
    input.recipientName.trim(),
    input.recipientPhone.trim(),
    input.notes.trim(),
  ]);
}
