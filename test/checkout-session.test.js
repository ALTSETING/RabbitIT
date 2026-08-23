'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const handler = require('../api/checkout-session');

const makeResponse = () => ({
  headers: {},
  setHeader(name, value) { this.headers[name] = value; },
  end(body) { this.body = JSON.parse(body); }
});

const originalFetch = global.fetch;
const originalKey = process.env.STRIPE_SECRET_KEY;

test.afterEach(() => {
  global.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.STRIPE_SECRET_KEY;
  else process.env.STRIPE_SECRET_KEY = originalKey;
});

test('rejects a missing or malformed session id without contacting Stripe', async () => {
  let called = false;
  global.fetch = async () => { called = true; };
  const response = makeResponse();

  await handler({ method: 'GET', query: { session_id: 'not-a-session' } }, response);

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, { error: 'invalid_session' });
  assert.equal(called, false);
});

test('does not confirm an unpaid Stripe session', async () => {
  process.env.STRIPE_SECRET_KEY = 'sk_test_server_only';
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      id: 'cs_test_unpaid123', object: 'checkout.session', payment_status: 'unpaid',
      amount_total: 3500, currency: 'usd'
    })
  });
  const response = makeResponse();

  await handler({ method: 'GET', query: { session_id: 'cs_test_unpaid123' } }, response);

  assert.equal(response.statusCode, 409);
  assert.deepEqual(response.body, { error: 'payment_not_confirmed' });
});

test('returns only Stripe amount and currency for a genuine paid session', async () => {
  process.env.STRIPE_SECRET_KEY = 'sk_test_server_only';
  global.fetch = async (url, options) => {
    assert.match(url, /cs_test_paid123$/);
    assert.equal(options.headers.Authorization, 'Bearer sk_test_server_only');
    return {
      ok: true,
      json: async () => ({
        id: 'cs_test_paid123', object: 'checkout.session', payment_status: 'paid',
        amount_total: 2200000, currency: 'uah', customer_email: 'private@example.com'
      })
    };
  };
  const response = makeResponse();

  await handler({ method: 'GET', query: { session_id: 'cs_test_paid123' } }, response);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, { id: 'cs_test_paid123', amount_total: 2200000, currency: 'UAH' });
  assert.equal(response.headers['Cache-Control'], 'no-store');
});
