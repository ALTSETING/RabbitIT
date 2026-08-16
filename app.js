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

document.querySelector('[data-catalog-link]').addEventListener('click', () => activateView('courses'));
document.querySelector('[data-catalog-back]').addEventListener('click', () => activateView('home', '#courses'));

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
