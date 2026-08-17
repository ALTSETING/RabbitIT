const revealElements = document.querySelectorAll('.reveal');
const counters = document.querySelectorAll('.counter');
const hero = document.querySelector('.hero');

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  },
  { threshold: 0.15 }
);

revealElements.forEach((el) => observer.observe(el));

const animateCounter = (el) => {
  const target = Number(el.dataset.target);
  const duration = 1800;
  let start = 0;
  const stepTime = Math.max(Math.floor(duration / target), 20);

  const update = () => {
    start += Math.ceil(target / (duration / stepTime));
    if (start >= target) {
      el.textContent = target + (target >= 100 ? '+' : '');
    } else {
      el.textContent = start;
      window.requestAnimationFrame(update);
    }
  };

  update();
};

const counterObserver = new IntersectionObserver(
  (entries, observerInstance) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observerInstance.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.35 }
);

counters.forEach((counter) => counterObserver.observe(counter));

const viewButtons = document.querySelectorAll('[data-view-target]');
const views = document.querySelectorAll('[data-view]');
const transitionLayer = document.querySelector('.page-transition');
let activeView = 'home';
let viewIsChanging = false;

const activateView = (target, anchor = null) => {
  if (viewIsChanging || (target === activeView && !anchor)) return;
  viewIsChanging = true;
  const currentView = document.querySelector(`[data-view="${activeView}"]`);
  const nextView = document.querySelector(`[data-view="${target}"]`);

  currentView.classList.add('is-leaving');
  transitionLayer.classList.remove('is-revealing');
  transitionLayer.classList.add('is-active');
  if ('vibrate' in navigator) navigator.vibrate([18, 35, 18]);

  window.setTimeout(() => {
    currentView.hidden = true;
    currentView.classList.remove('is-active', 'is-leaving');
    nextView.hidden = false;
    nextView.classList.add('is-active', 'is-entering');
    activeView = target;

    viewButtons.forEach((button) => {
      const isActive = button.dataset.viewTarget === target;
      button.classList.toggle('is-active', isActive);
      if (isActive) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });

    window.scrollTo({ top: 0, behavior: 'instant' });
    transitionLayer.classList.add('is-revealing');

    window.setTimeout(() => {
      transitionLayer.classList.remove('is-active', 'is-revealing');
      nextView.classList.remove('is-entering');
      viewIsChanging = false;
      if (anchor) document.querySelector(anchor)?.scrollIntoView({ behavior: 'smooth' });
    }, 480);
  }, 420);
};

viewButtons.forEach((button) => {
  button.addEventListener('click', () => activateView(button.dataset.viewTarget));
});

document.querySelectorAll('[data-catalog-link]').forEach((button) => {
  button.addEventListener('click', () => activateView('courses'));
});
document.querySelector('[data-catalog-back]').addEventListener('click', () => activateView('home', '#courses'));

const checkout = document.querySelector('[data-checkout]');
const checkoutSheet = checkout?.querySelector('.checkout-sheet');
const checkoutOpenButtons = [...document.querySelectorAll('[data-checkout-open]')];
const checkoutPayButton = checkout?.querySelector('[data-checkout-pay]');
const checkoutPayLabel = checkout?.querySelector('[data-checkout-pay-label]');
const checkoutNote = checkout?.querySelector('[data-checkout-note]');
const checkoutCourse = checkout?.querySelector('[data-checkout-course]');
const currencyOptions = checkout ? [...checkout.querySelectorAll('[data-currency]')] : [];
let lastCheckoutTrigger = null;
let selectedCurrency = null;

const checkoutCourses = {
  foundation: {
    name: 'Sales Foundation',
    prices: {
      PLN: { value: '130', display: '130 zł' },
      UAH: { value: '1560', display: '1 560 грн' },
      USD: { value: '35', display: '35 $' }
    }
  },
  pro: {
    name: 'Sales Pro',
    prices: {
      PLN: { value: '1800', display: '1 800 zł' },
      UAH: { value: '22000', display: '22 000 грн' },
      USD: { value: '500', display: '500 $' }
    }
  },
  leadership: {
    name: 'Sales Leadership',
    prices: {
      PLN: { value: '2700', display: '2 700 zł' },
      UAH: { value: '33000', display: '33 000 грн' },
      USD: { value: '750', display: '750 $' }
    }
  }
};

const closeCheckout = () => {
  if (!checkout?.classList.contains('is-open')) return;
  checkout.classList.remove('is-open');
  checkout.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('checkout-open');
  window.setTimeout(() => lastCheckoutTrigger?.focus(), 450);
};

const openCheckout = (trigger) => {
  if (!checkout) return;
  const course = checkoutCourses[trigger.dataset.checkoutOpen];
  if (!course) return;
  lastCheckoutTrigger = trigger;
  selectedCurrency = null;
  checkoutCourse.textContent = course.name;
  currencyOptions.forEach((option) => {
    const price = course.prices[option.dataset.currency];
    option.dataset.price = price.value;
    option.dataset.displayPrice = price.display;
    option.dataset.paymentUrl = trigger.dataset[`payment${option.dataset.currency.toLowerCase()}`] || '';
    option.classList.remove('is-selected');
    option.setAttribute('aria-checked', 'false');
    option.querySelector('strong').innerHTML = price.display.replace(/\s([^\s]+)$/, ' <em>$1</em>');
  });
  checkoutPayButton.disabled = true;
  checkoutPayLabel.textContent = 'Оберіть валюту';
  checkoutNote.classList.remove('is-error');
  checkoutNote.textContent = 'Безпечна оплата · Доступ до курсу одразу після оплати';
  checkout.classList.add('is-open');
  checkout.setAttribute('aria-hidden', 'false');
  document.body.classList.add('checkout-open');
  window.requestAnimationFrame(() => checkoutSheet?.querySelector('.checkout-close')?.focus());
};

checkoutOpenButtons.forEach((button) => {
  button.addEventListener('click', () => openCheckout(button));
});
checkout?.querySelectorAll('[data-checkout-close]').forEach((button) => {
  button.addEventListener('click', closeCheckout);
});

currencyOptions.forEach((option) => {
  option.addEventListener('click', () => {
    selectedCurrency = option;
    currencyOptions.forEach((item) => {
      const isSelected = item === option;
      item.classList.toggle('is-selected', isSelected);
      item.setAttribute('aria-checked', String(isSelected));
    });
    checkoutPayButton.disabled = false;
    checkoutPayLabel.textContent = `Оплатити ${option.dataset.displayPrice}`;
    checkoutNote.classList.remove('is-error');
    checkoutNote.textContent = 'Безпечна оплата · Доступ до курсу одразу після оплати';
    if ('vibrate' in navigator) navigator.vibrate(18);
  });
});

checkoutPayButton?.addEventListener('click', () => {
  if (!selectedCurrency) return;
  const paymentUrl = selectedCurrency.dataset.paymentUrl;
  if (paymentUrl) {
    window.location.assign(paymentUrl);
    return;
  }
  checkoutNote.classList.add('is-error');
  checkoutNote.textContent = 'Додайте платіжне посилання для цієї валюти в data-payment-url.';
});

document.addEventListener('keydown', (event) => {
  if (!checkout?.classList.contains('is-open')) return;
  if (event.key === 'Escape') closeCheckout();
  if (event.key === 'Tab') {
    const focusable = [...checkoutSheet.querySelectorAll('button:not(:disabled), a[href]')];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

document.querySelector('[data-home-link]').addEventListener('click', (event) => {
  event.preventDefault();
  activateView('home', '#hero');
});

document.querySelectorAll('.nav-links a').forEach((link) => {
  link.addEventListener('click', (event) => {
    if (activeView === 'home') return;
    event.preventDefault();
    activateView('home', link.getAttribute('href'));
  });
});

document.querySelectorAll('[data-carousel]').forEach((carousel) => {
  const track = carousel.querySelector('.carousel-track');
  const previousButton = carousel.querySelector('.carousel-button-prev');
  const nextButton = carousel.querySelector('.carousel-button-next');
  const originalCards = [...track.children];
  const cardCount = originalCards.length;
  let currentIndex = cardCount;
  let isMoving = false;
  let touchStartX = 0;

  const makeClone = (card) => {
    const clone = card.cloneNode(true);
    clone.classList.remove('reveal', 'delay-1', 'delay-2', 'delay-3');
    clone.setAttribute('aria-hidden', 'true');
    clone.querySelectorAll('a, button').forEach((element) => {
      element.tabIndex = -1;
    });
    return clone;
  };

  [...originalCards].reverse().forEach((card) => track.prepend(makeClone(card)));
  originalCards.forEach((card) => track.append(makeClone(card)));

  const getStep = () => {
    const card = track.querySelector('article');
    const gap = parseFloat(window.getComputedStyle(track).gap) || 0;
    return card.getBoundingClientRect().width + gap;
  };

  const setPosition = (animate = false) => {
    track.classList.toggle('is-moving', animate);
    track.style.transform = `translateX(${-currentIndex * getStep()}px)`;
  };

  const vibrate = () => {
    if ('vibrate' in navigator) navigator.vibrate(25);
  };

  const move = (direction) => {
    if (isMoving) return;
    isMoving = true;
    currentIndex += direction;
    vibrate();
    setPosition(true);
  };

  track.addEventListener('transitionend', () => {
    if (currentIndex >= cardCount * 2) currentIndex = cardCount;
    if (currentIndex < cardCount) currentIndex = cardCount * 2 - 1;
    setPosition(false);
    isMoving = false;
  });

  previousButton.addEventListener('click', () => move(-1));
  nextButton.addEventListener('click', () => move(1));

  track.addEventListener('touchstart', (event) => {
    touchStartX = event.changedTouches[0].clientX;
  }, { passive: true });

  track.addEventListener('touchend', (event) => {
    const distance = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(distance) > 40) move(distance > 0 ? -1 : 1);
  }, { passive: true });

  window.addEventListener('resize', () => setPosition(false));
  setPosition(false);
});

window.addEventListener('mousemove', (event) => {
  const { innerWidth, innerHeight } = window;
  const ratioX = (event.clientX / innerWidth - 0.5) * 2;
  const ratioY = (event.clientY / innerHeight - 0.5) * 2;
  const shapes = document.querySelectorAll('.shape');

  shapes.forEach((shape, index) => {
    const speed = (index + 1) * 4;
    shape.style.transform = `translate(${ratioX * speed}px, ${ratioY * speed}px)`;
  });
});
