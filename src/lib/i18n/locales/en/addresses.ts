/** English strings for saved delivery addresses. */
export const addresses = {
  list: {
    emptyTitle: 'No saved addresses',
    emptyBody: 'Add the place where you want your orders delivered.',
    add: 'Add an address',
    default: 'Default',
    selected: 'Delivering here',
    select: 'Deliver here',
    forSomeone: 'For {{name}}',
    loadError: 'We could not load your addresses.',
    deleteConfirm: {
      title: 'Delete this address?',
      body: '“{{label}}” will be removed. Your past orders are not affected.',
    },
    deleteFailed: 'We could not delete the address. Please try again.',
  },
  form: {
    label: { label: 'Label', hint: 'For example Home or Office' },
    recipientName: {
      label: 'Recipient name (optional)',
      hint: 'Fill this in if the address is for someone else',
    },
    recipientPhone: { label: 'Recipient phone (optional)' },
    addressLine: { label: 'Street address', hint: 'House, street, building' },
    area: { label: 'Area (optional)', hint: 'For example F-7' },
    city: { label: 'City' },
    instructions: {
      label: 'Delivery instructions (optional)',
      hint: 'Gate colour, landmark, floor',
    },
    locationHint: 'Used to work out your delivery fee and to find stores near you.',
    isDefault: 'Make this my default address',
    save: 'Save address',
    saveFailed: 'We could not save the address. Please try again.',
  },
  validation: {
    labelRequired: 'Please give this address a name.',
    addressRequired: 'Please enter the street address.',
    cityRequired: 'Please enter the city.',
    phoneInvalid: 'Please enter a valid phone number, or leave it empty.',
    tooLong: 'This is too long (at most {{max}} characters).',
    locationRequired: 'Please set the map position.',
  },
};
