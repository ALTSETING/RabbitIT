'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const script = fs.readFileSync('success/success.js', 'utf8');

const runPage = async ({ search, storage, fetch, events }) => {
  const elements = new Map();
  const document = {
    querySelector(selector) {
      if (!elements.has(selector)) {
        elements.set(selector, { className: '', textContent: '', hidden: true });
      }
      return elements.get(selector);
    }
  };
  const window = {
    location: { search },
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value)
    },
    fbq: (...args) => events.push(args)
  };

  vm.runInNewContext(script, { window, document, URLSearchParams, fetch, Error });
  await new Promise((resolve) => setImmediate(resolve));
  return elements;
};

test('does not call the API or Meta without a session id', async () => {
  let apiCalled = false;
  const events = [];
  const elements = await runPage({
    search: '', storage: new Map(), events,
    fetch: async () => { apiCalled = true; }
  });

  assert.equal(apiCalled, false);
  assert.equal(events.length, 0);
  assert.equal(elements.get('[data-success-eyebrow]').textContent, 'Платіж не підтверджено');
});

test('tracks verified Stripe values once across page refreshes', async () => {
  const storage = new Map();
  const events = [];
  const fetch = async () => ({
    ok: true,
    json: async () => ({ id: 'cs_live_paid123', amount_total: 13000, currency: 'PLN' })
  });

  await runPage({ search: '?session_id=cs_live_paid123', storage, fetch, events });
  await runPage({ search: '?session_id=cs_live_paid123', storage, fetch, events });

  assert.equal(events.length, 1);
  assert.equal(events[0][1], 'Purchase');
  assert.equal(events[0][2].value, 130);
  assert.equal(events[0][2].currency, 'PLN');
  assert.equal(events[0][3].eventID, 'cs_live_paid123');
});
