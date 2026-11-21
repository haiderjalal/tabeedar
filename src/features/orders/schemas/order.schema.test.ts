import { describe, expect, it } from 'vitest';

import {
  parseOrderDetails,
  parseOrderEvents,
  parseOrderItems,
  parseOrderList,
  parseRiderContact,
} from './order.schema';

const listRow = {
  id: 42,
  store_id: 1,
  store_name: 'Al-Fatah Fresh Mart',
  status: 'placed',
  total: 651,
  created_at: '2026-11-20T09:05:00+00:00',
};

const detailRow = {
  id: 42,
  store_id: 1,
  store_name: 'Al-Fatah Fresh Mart',
  status: 'accepted',
  recipient_name: 'Sara Khan',
  recipient_phone: '+923001000003',
  address_line: 'House 21',
  area: 'G-8',
  city: 'Islamabad',
  instructions: null,
  notes: null,
  subtotal: 580,
  delivery_fee: 71,
  total: 651,
  distance_m: 2012,
  rider_id: null,
  created_at: '2026-11-20T09:05:00+00:00',
};

describe('order parsing', () => {
  it('converts the order list', () => {
    expect(parseOrderList([listRow])).toEqual([
      {
        id: 42,
        storeId: 1,
        storeName: 'Al-Fatah Fresh Mart',
        status: 'placed',
        total: 651,
        createdAt: '2026-11-20T09:05:00+00:00',
      },
    ]);
  });

  it('converts an order, keeping money as numbers and a missing rider as null', () => {
    const order = parseOrderDetails(detailRow);
    expect(order).toMatchObject({ subtotal: 580, deliveryFee: 71, total: 651, riderId: null });
    expect(parseOrderDetails({ ...detailRow, rider_id: 'abc' }).riderId).toBe('abc');
  });

  it('rejects an unknown status', () => {
    expect(() => parseOrderList([{ ...listRow, status: 'shipped' }])).toThrow();
    expect(() => parseOrderDetails({ ...detailRow, status: 'lost' })).toThrow();
  });

  it('rejects rows that are not orders', () => {
    expect(() => parseOrderDetails({ id: 1 })).toThrow();
    expect(() => parseOrderList([{ ...listRow, total: '651' }])).toThrow();
    expect(() => parseOrderList(null)).toThrow();
  });

  it('converts items', () => {
    expect(
      parseOrderItems([
        { id: 1, product_name: 'Fresh Milk 1L', unit_price: 290, quantity: 2, line_total: 580 },
      ]),
    ).toEqual([
      { id: 1, productName: 'Fresh Milk 1L', unitPrice: 290, quantity: 2, lineTotal: 580 },
    ]);
  });

  it('converts events and rejects an unknown event type', () => {
    const event = {
      id: 3,
      event_type: 'rider_assigned',
      status: 'ready',
      note: null,
      created_at: '2026-11-20T09:20:00+00:00',
    };
    expect(parseOrderEvents([event])[0]).toMatchObject({ type: 'rider_assigned', status: 'ready' });
    expect(() => parseOrderEvents([{ ...event, event_type: 'teleported' }])).toThrow();
  });

  it('converts rider contact details', () => {
    expect(parseRiderContact({ full_name: 'Usman', phone: '+923001000004' })).toEqual({
      name: 'Usman',
      phone: '+923001000004',
    });
    expect(parseRiderContact({ full_name: null, phone: null })).toEqual({
      name: null,
      phone: null,
    });
  });
});
