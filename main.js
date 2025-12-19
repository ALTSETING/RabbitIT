// Прелоадер
window.addEventListener("load", () => {
  const preloader = document.getElementById("preloader");
  setTimeout(() => {
    preloader.style.opacity = "0";
    preloader.style.pointerEvents = "none";
    setTimeout(() => {
      preloader.remove();
    }, 400);
  }, 900);
});

// Рік у футері
document.getElementById("year").textContent = new Date().getFullYear();

// Scroll to
function smoothScrollTo(target) {
  const el = document.querySelector(target);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 70;
  window.scrollTo({
    top,
    behavior: "smooth",
  });
}

document.querySelectorAll("[data-scrollTo]").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const target = btn.getAttribute("data-scrollTo");
    if (!target) return;

    // URL → відкриваємо сторінку
    if (target.startsWith("/")) {
      window.location.href = target;
      return;
    }

    // Якір → плавний скрол
    if (target.startsWith("#")) {
      const el = document.querySelector(target);
      if (!el) return;

      e.preventDefault();
      el.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
});


// Burger + mobile nav
const burger = document.getElementById("burger");
const mobileNav = document.getElementById("mobileNav");

if (burger) {
  burger.addEventListener("click", () => {
    burger.classList.toggle("open");
    mobileNav.classList.toggle("open");
  });
}

if (mobileNav) {
  mobileNav.querySelectorAll("a, .btn").forEach((el) => {
    el.addEventListener("click", () => {
      burger.classList.remove("open");
      mobileNav.classList.remove("open");
    });
  });
}

// Scroll reveal
const revealElements = document.querySelectorAll(".reveal");
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.15,
  }
);

revealElements.forEach((el) => observer.observe(el));

// FAQ accordion
document.querySelectorAll(".faq-item").forEach((item) => {
  const btn = item.querySelector(".faq-question");
  btn.addEventListener("click", () => {
    const isOpen = item.classList.contains("open");
    document.querySelectorAll(".faq-item.open").forEach((i) => i.classList.remove("open"));
    if (!isOpen) item.classList.add("open");
  });
});

