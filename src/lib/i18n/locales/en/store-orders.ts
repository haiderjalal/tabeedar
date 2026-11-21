/** English strings for the orders a store receives. */
export const storeOrders = {
  tabs: {
    active: 'Active',
    history: 'History',
  },
  list: {
    emptyActiveTitle: 'No active orders',
    emptyActiveBody: 'New orders appear here by themselves. You do not need to refresh.',
    emptyHistoryTitle: 'No past orders yet',
    emptyHistoryBody: 'Delivered, declined and cancelled orders are kept here.',
    placedAt: 'Placed {{date}}',
    forCustomer: 'For {{name}}',
    loadError: 'We could not load your orders.',
  },
  // What each status means to the store.
  status: {
    placed: 'New order',
    accepted: 'Accepted',
    preparing: 'Being prepared',
    ready: 'Ready for pickup',
    picked_up: 'Picked up by the rider',
    delivered: 'Delivered',
    rejected: 'Declined',
    cancelled: 'Cancelled',
  },
  detail: {
    loadError: 'We could not load this order.',
    notFoundTitle: 'Order not found',
    notFoundBody: 'This order does not exist, or it belongs to another store.',
    customer: 'Customer',
    call: 'Call {{name}}',
    address: 'Delivery address',
    customerNote: 'Customer note',
    rider: 'Rider',
    riderAssigned: 'A rider accepted the delivery',
    riderWaiting: 'Riders nearby are alerted once you accept the order.',
    riderRequested: 'Waiting for a rider to accept the delivery.',
  },
  actions: {
    accepted: 'Accept order',
    rejected: 'Decline order',
    preparing: 'Start preparing',
    ready: 'Mark as ready for pickup',
    cancelled: 'Cancel order',
  },
  note: {
    label: 'Reason (optional)',
    hint: 'The customer will see this in the order history.',
    rejected: {
      title: 'Decline this order?',
      body: 'The customer is told you could not take this order.',
      confirm: 'Decline order',
    },
    cancelled: {
      title: 'Cancel this order?',
      body: 'The customer is told the order was cancelled.',
      confirm: 'Cancel order',
    },
    back: 'Go back',
  },
  errors: {
    invalidTransition:
      'This order has changed, for example the customer cancelled it. The latest status is shown.',
    orderNotFound: 'We could not find this order.',
    network: 'No connection. Check your internet and try again.',
    generic: 'Something went wrong. Please try again.',
  },
};
