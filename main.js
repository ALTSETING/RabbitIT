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
    if (target) {
      e.preventDefault();
      smoothScrollTo(target);
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

// Форми: просто показуємо повідомлення (поки без бекенду)
function handleForm(formId, successId) {
  const form = document.getElementById(formId);
  const success = document.getElementById(successId);

  if (!form || !success) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const name = formData.get("name") || "Учень";

    success.textContent = `Дякуємо, ${name}! Заявка відправлена. Ми зв’яжемося з тобою найближчим часом.`;
    form.reset();

    // Невелика анімація прозорості
    success.style.opacity = "0";
    success.style.transition = "opacity 0.3s ease";
    requestAnimationFrame(() => {
      success.style.opacity = "1";
    });
  });
}

document.getElementById("online-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const form = e.target;
  const data = Object.fromEntries(new FormData(form));
  const success = document.getElementById("online-success");

  try {
    const res = await fetch("/api/online", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      success.textContent =
        "Дякуємо! Онлайн-заявка відправлена. Ми звʼяжемося з вами найближчим часом.";
      form.reset();
    } else {
      success.textContent = "Помилка відправки. Спробуйте ще раз.";
    }
  } catch (err) {
    success.textContent = "Помилка зʼєднання з сервером.";
  }
});
