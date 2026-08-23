'use strict';

const sessionIdPattern = /^cs_(?:test_|live_)[A-Za-z0-9]+$/;

const sendJson = (response, status, body) => {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(body));
};

const handler = async (request, response) => {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    sendJson(response, 405, { error: 'method_not_allowed' });
    return;
  }

  const sessionId = request.query?.session_id;
  if (typeof sessionId !== 'string' || !sessionIdPattern.test(sessionId)) {
    sendJson(response, 400, { error: 'invalid_session' });
    return;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error('STRIPE_SECRET_KEY is not configured');
    sendJson(response, 503, { error: 'payment_verification_unavailable' });
    return;
  }

  try {
    const stripeResponse = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
      headers: {
        Authorization: `Bearer ${secretKey}`
      }
    });

    if (!stripeResponse.ok) {
      sendJson(response, stripeResponse.status === 404 ? 404 : 502, { error: 'session_not_verified' });
      return;
    }

    const session = await stripeResponse.json();
    const isValidPaidSession =
      session.id === sessionId &&
      session.object === 'checkout.session' &&
      session.payment_status === 'paid' &&
      Number.isInteger(session.amount_total) &&
      session.amount_total >= 0 &&
      typeof session.currency === 'string' &&
      /^[a-z]{3}$/i.test(session.currency);

    if (!isValidPaidSession) {
      sendJson(response, 409, { error: 'payment_not_confirmed' });
      return;
    }

    sendJson(response, 200, {
      id: session.id,
      amount_total: session.amount_total,
      currency: session.currency.toUpperCase()
    });
  } catch (error) {
    console.error('Stripe session verification failed', error);
    sendJson(response, 502, { error: 'session_not_verified' });
  }
};

module.exports = handler;
module.exports.sessionIdPattern = sessionIdPattern;
