import { describe, expect, it } from 'vitest';

import {
  parseDeliveryItems,
  parseDeliveryList,
  parseDeliveryOrder,
  parseOffers,
  parsePickupStore,
  parseRiderAccount,
} from './dispatch.schema';

describe('parseRiderAccount', () => {
  it('reads a pending rider that has never been online', () => {
    expect(
      parseRiderAccount({ status: 'pending', is_online: false, latitude: null, longitude: null }),
    ).toEqual({ status: 'pending', isOnline: false, latitude: null, longitude: null });
  });

  it('refuses a status the database does not have', () => {
    expect(() =>
      parseRiderAccount({ status: 'banned', is_online: false, latitude: null, longitude: null }),
    ).toThrow();
  });
});

describe('parseOffers', () => {
  const row = {
    order_id: 7,
    status: 'ready',
    store_id: 1,
    store_name: 'Ali Traders',
    pickup_address: 'Shop 4, Market Road',
    pickup_latitude: 33.68,
    pickup_longitude: 73.04,
    dropoff_area: 'F-7',
    dropoff_city: 'Islamabad',
    rider_to_store_m: 2200,
    store_to_dropoff_m: 2300,
    delivery_fee: 81,
    total: 661,
    created_at: '2026-11-20T10:00:00Z',
  };

  it('turns rows into offers, ignoring columns the app does not use', () => {
    expect(parseOffers([row])).toEqual([
      {
        orderId: 7,
        status: 'ready',
        storeName: 'Ali Traders',
        pickupAddress: 'Shop 4, Market Road',
        pickupLatitude: 33.68,
        pickupLongitude: 73.04,
        dropoffArea: 'F-7',
        dropoffCity: 'Islamabad',
        riderToStoreM: 2200,
        storeToDropoffM: 2300,
        deliveryFee: 81,
        total: 661,
        createdAt: '2026-11-20T10:00:00Z',
      },
    ]);
  });

  it('accepts an offer without a drop-off area', () => {
    expect(parseOffers([{ ...row, dropoff_area: null }])[0]?.dropoffArea).toBeNull();
  });

  it('refuses an unknown order status', () => {
    expect(() => parseOffers([{ ...row, status: 'shipped' }])).toThrow();
  });
});

describe('delivery rows', () => {
  it('reads the rider list', () => {
    expect(
      parseDeliveryList([
        {
          id: 3,
          status: 'picked_up',
          store_name: 'Ali Traders',
          area: null,
          city: 'Islamabad',
          delivery_fee: 71,
          total: 651,
          created_at: '2026-11-20T10:00:00Z',
        },
      ]),
    ).toEqual([
      {
        id: 3,
        status: 'picked_up',
        storeName: 'Ali Traders',
        dropoffArea: null,
        dropoffCity: 'Islamabad',
        deliveryFee: 71,
        total: 651,
        createdAt: '2026-11-20T10:00:00Z',
      },
    ]);
  });

  it('reads the order, its items and the pickup store', () => {
    const order = parseDeliveryOrder({
      id: 3,
      store_id: 1,
      store_name: 'Ali Traders',
      status: 'ready',
      recipient_name: 'Mum',
      recipient_phone: '+923001234500',
      address_line: 'House 9',
      area: 'F-7',
      city: 'Islamabad',
      instructions: null,
      notes: 'Ring twice',
      latitude: 33.7,
      longitude: 73.05,
      subtotal: 580,
      delivery_fee: 71,
      total: 651,
      created_at: '2026-11-20T10:00:00Z',
    });
    expect(order.recipientName).toBe('Mum');
    expect(order.total).toBe(651);
    expect(parseDeliveryItems([{ id: 1, product_name: 'Milk', quantity: 2 }])).toEqual([
      { id: 1, productName: 'Milk', quantity: 2 },
    ]);
    expect(
      parsePickupStore({
        name: 'Ali Traders',
        phone: null,
        address_line: 'Shop 4',
        area: null,
        city: 'Islamabad',
        latitude: 33.68,
        longitude: 73.04,
      }).addressLine,
    ).toBe('Shop 4');
  });
});
