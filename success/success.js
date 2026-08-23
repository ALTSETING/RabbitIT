(function () {
  'use strict';

  const title = document.querySelector('[data-success-title]');
  const eyebrow = document.querySelector('[data-success-eyebrow]');
  const copy = document.querySelector('[data-success-copy]');
  const mark = document.querySelector('[data-success-mark]');
  const payment = document.querySelector('[data-success-payment]');
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('session_id');

  const showError = () => {
    mark.className = 'success-mark is-error';
    eyebrow.textContent = 'Платіж не підтверджено';
    title.textContent = 'Не вдалося перевірити оплату';
    copy.textContent = 'Перевірте посилання або зверніться до служби підтримки. Подію Purchase не надіслано.';
  };

  const hasTracked = (id) => {
    try {
      return window.localStorage.getItem(`rabbit-meta-purchase:${id}`) === 'tracked';
    } catch (error) {
      return false;
    }
  };

  const reserveTracking = (id) => {
    try {
      window.localStorage.setItem(`rabbit-meta-purchase:${id}`, 'tracked');
      return true;
    } catch (error) {
      // Meta also deduplicates the stable Stripe session eventID when storage is unavailable.
      return true;
    }
  };

  const verifyPayment = async () => {
    if (!sessionId) {
      showError();
      return;
    }

    try {
      const response = await fetch(`/api/checkout-session?session_id=${encodeURIComponent(sessionId)}`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store'
      });
      if (!response.ok) throw new Error('Payment was not confirmed');

      const session = await response.json();
      if (
        session.id !== sessionId ||
        !Number.isInteger(session.amount_total) ||
        !/^[A-Z]{3}$/.test(session.currency)
      ) throw new Error('Invalid server response');

      if (!hasTracked(session.id) && typeof window.fbq === 'function' && reserveTracking(session.id)) {
        window.fbq('track', 'Purchase', {
          value: session.amount_total / 100,
          currency: session.currency
        }, { eventID: session.id });
      }

      mark.className = 'success-mark is-success';
      eyebrow.textContent = 'Оплата успішна';
      title.textContent = 'Дякуємо за довіру!';
      copy.textContent = 'Ваш платіж підтверджено. Найближчим часом ви отримаєте деталі навчання.';
      payment.textContent = `Сплачено: ${(session.amount_total / 100).toLocaleString('uk-UA', { minimumFractionDigits: 2 })} ${session.currency}`;
      payment.hidden = false;
    } catch (error) {
      showError();
    }
  };

  verifyPayment();
}());
