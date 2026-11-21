/** English strings for the store owner's own store: setting it up, editing it, opening and closing. */
export const shop = {
  loadError: 'We could not load your store.',
  setup: {
    title: 'Set up your store',
    intro:
      'Tell customers about your store. You can add a logo and a cover picture after you save.',
    create: 'Create my store',
  },
  form: {
    name: { label: 'Store name' },
    description: {
      label: 'Description (optional)',
      hint: 'What you sell, in a sentence or two',
    },
    phone: { label: 'Store phone (optional)' },
    addressLine: { label: 'Street address', hint: 'Shop number, street, market' },
    area: { label: 'Area (optional)', hint: 'For example F-7' },
    city: { label: 'City' },
    locationHint: 'Delivery fees and rider distances are measured from this position.',
    logo: 'Logo',
    cover: 'Cover picture',
    save: 'Save changes',
  },
  my: {
    openLabel: 'Accepting orders',
    openHint: 'Customers can only order while this is on. Turn it off when you are closed.',
    open: 'Open',
    closed: 'Closed',
    edit: 'Edit store details',
    suspendedTitle: 'Your store is suspended',
    suspendedBody: 'Customers cannot see it right now. Please contact Tabeedar support.',
  },
  validation: {
    nameRequired: 'Please enter the store name.',
    addressRequired: 'Please enter the street address.',
    cityRequired: 'Please enter the city.',
    phoneInvalid: 'Please enter a valid phone number, or leave it empty.',
    tooLong: 'This is too long (at most {{max}} characters).',
    locationRequired: 'Please set the map position.',
  },
  errors: {
    alreadyHasStore: 'This account already has a store.',
    network: 'No connection. Check your internet and try again.',
    generic: 'We could not save your store. Please try again.',
  },
};
