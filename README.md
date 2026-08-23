# Rabbit Academy

## Stripe і Meta Pixel

Усі дев'ять Stripe Payment Links підключені в `app.js`: по одному для USD, PLN та
UAH для кожного з трьох курсів. Перед переходом до Stripe браузер надсилає
`InitiateCheckout` із вибраними сумою та валютою.

Після оплати Stripe перенаправляє покупця на:

```text
https://rabbit.academy/success?session_id={CHECKOUT_SESSION_ID}
```

Сторінка `/success` не довіряє параметрам із браузера. Вона звертається до
`/api/checkout-session`, а сервер отримує Checkout Session безпосередньо зі Stripe.
`Purchase` надсилається тільки коли Stripe повернув `payment_status: "paid"`;
`value` та `currency` також беруться лише із серверної відповіді Stripe.

### Environment variable

На production-хостингу потрібно додати серверну змінну:

```text
STRIPE_SECRET_KEY=sk_live_...
```

Ключ не можна додавати до HTML, клієнтського JavaScript, `.env` у Git або налаштувань
збірки, які публікуються у браузері. API реалізований як Vercel Serverless Function.

### Перевірка

```bash
npm test
```

Після деплою:

1. Відкрити **Meta Events Manager → Data sources → Pixel → Test Events**.
2. На `https://rabbit.academy` обрати курс і валюту — має з'явитися `InitiateCheckout`.
3. Завершити тестову оплату. На `/success` має з'явитися підтвердження, а в Meta — один
   `Purchase` з фактичними `value`, `currency` та `eventID`, рівним Stripe Session ID.
4. Оновити `/success`: повторний `Purchase` з'явитися не повинен.
5. Відкрити `/success` без ID, із вигаданим ID та з неоплаченою сесією: `Purchase`
   надсилатися не повинен.
