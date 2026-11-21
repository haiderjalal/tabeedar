/** English strings for checkout. */
export const checkout = {
  deliverTo: 'Deliver to',
  change: 'Change',
  noAddress: 'Choose a delivery address to continue.',
  addAddress: 'Add an address',
  recipient: {
    title: 'Who is receiving this order?',
    forMe: 'Me',
    forSomeone: 'Someone else',
    name: { label: 'Recipient name' },
    phone: { label: 'Recipient phone' },
  },
  notes: {
    label: 'Note for the store (optional)',
    hint: 'Anything the store or the rider should know',
  },
  summary: {
    title: 'Order summary',
    subtotal: 'Subtotal',
    deliveryFee: 'Delivery fee',
    total: 'Total',
    distance: 'Delivery distance: {{distance}} {{unit}}',
    calculating: 'Calculating…',
    feeUnavailable: 'We could not work out the delivery fee. Check your connection and try again.',
    payment: 'You pay in cash when the order arrives.',
  },
  place: 'Place order',
  cartProblem: 'Some items in your cart are no longer available. Review your cart to continue.',
  reviewCart: 'Review cart',
  validation: {
    nameRequired: 'Please enter the recipient’s name.',
    phoneInvalid: 'Please enter a valid phone number.',
    tooLong: 'This is too long (at most {{max}} characters).',
  },
  errors: {
    storeUnavailable: 'This store is closed or no longer available.',
    productUnavailable: 'Some items are no longer available. Please review your cart.',
    invalidItems: 'Your cart could not be read. Please review it and try again.',
    invalidLocation: 'The delivery position looks wrong. Please check your address.',
    network: 'No connection. Check your internet and try again.',
    generic: 'We could not place your order. Please try again.',
  },
};
