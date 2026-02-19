// RabbitIT Tests — front-only version (JSON questions)
// Data format: /questions/{slug}.json

const TESTS = [
  { slug: "js", title: "JavaScript", minutes: 12, level: ["Junior","Middle"], questions: 12, topics: ["basics","types","dom","async"] },
  { slug: "python", title: "Python", minutes: 12, level: ["Junior","Middle"], questions: 12, topics: ["basics","lists","functions","oop"] },
  { slug: "htmlcss", title: "HTML / CSS", minutes: 10, level: ["Beginner","Junior"], questions: 12, topics: ["layout","selectors","responsive","accessibility"] },
  { slug: "logic", title: "Algorithms / Logic", minutes: 15, level: ["Beginner","Junior","Middle"], questions: 12, topics: ["logic","complexity","data-structures"] },
  { slug: "git", title: "Git + Dev basics", minutes: 8, level: ["Beginner","Junior"], questions: 12, topics: ["git","cli","workflow"] },
];

const el = (id) => document.getElementById(id);

const testGrid = el("testGrid");
const searchEl = el("search");
const levelFilterEl = el("levelFilter");

const runnerSection = el("runner");
const listSection = el("tests");
const resultSection = el("result");

const runnerTitle = el("runnerTitle");
const runnerSub = el("runnerSub");
const qCount = el("qCount");
const qBarIn = el("qBarIn");
const qText = el("qText");
const qCode = el("qCode");
const answersEl = el("answers");
const hintBox = el("hintBox");

const prevBtn = el("prevBtn");
const nextBtn = el("nextBtn");
const backToList = el("backToList");

const scoreNum = el("scoreNum");
const scoreLevel = el("scoreLevel");
const scoreDesc = el("scoreDesc");
const topicsEl = el("topics");
const resultMeta = el("resultMeta");

const retryBtn = el("retryBtn");
const chooseAnotherBtn = el("chooseAnotherBtn");

const timerPill = el("timerPill");
const timerText = el("timerText");

const modal = el("modal");
const showExamplesBtn = el("showExamples");
const closeModalBtn = el("closeModal");
const modalBg = el("modalBg");

const startFromTop = el("startFromTop");

// state
let currentTest = null;
let quiz = null; // loaded JSON
let idx = 0;
let answers = []; // user answers: for single -> number; for multi -> array of numbers
let startedAt = null;

let timer = null;
let timeLeftSec = 0;

function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

function openModal(){
  modal.classList.remove("hidden");
}
function closeModal(){
  modal.classList.add("hidden");
}

showExamplesBtn.addEventListener("click", () => openModal());
closeModalBtn.addEventListener("click", () => closeModal());
modalBg.addEventListener("click", () => closeModal());

startFromTop.addEventListener("click", () => {
  document.querySelector("#tests").scrollIntoView({ behavior: "smooth" });
});

function renderTestCards(){
  const q = (searchEl.value || "").trim().toLowerCase();
  const lf = levelFilterEl.value;

  const filtered = TESTS.filter(t => {
    const matchQ = !q || t.title.toLowerCase().includes(q) || t.slug.includes(q);
    const matchL = (lf === "all") || t.level.includes(lf);
    return matchQ && matchL;
  });

  testGrid.innerHTML = "";
  filtered.forEach(t => {
    const card = document.createElement("div");
    card.className = "card test-card";

    const head = document.createElement("div");
    head.className = "test-head";

    const left = document.createElement("div");
    left.innerHTML = `
      <div class="test-title">${t.title}</div>
      <div class="mini muted">${t.questions} питань • ~${t.minutes} хв</div>
    `;

    const right = document.createElement("div");
    right.className = "pills";
    right.innerHTML = `
      <span class="pill warn">${t.level.join(" / ")}</span>
      <span class="pill">${t.slug}</span>
    `;

    head.appendChild(left);
    head.appendChild(right);

    const mid = document.createElement("div");
    mid.className = "mini muted";
    mid.textContent = "Теми: " + t.topics.join(", ");

    const btns = document.createElement("div");
    btns.className = "q-actions";
    btns.innerHTML = `
      <button class="btn ghost" data-action="preview">Приклади</button>
      <button class="btn primary" data-action="start">Почати</button>
    `;

    btns.querySelector('[data-action="preview"]').addEventListener("click", () => openModal());
    btns.querySelector('[data-action="start"]').addEventListener("click", () => startTest(t.slug));

    card.appendChild(head);
    card.appendChild(mid);
    card.appendChild(btns);

    testGrid.appendChild(card);
  });

  if (filtered.length === 0){
    const empty = document.createElement("div");
    empty.className = "card";
    empty.innerHTML = `<div class="mini muted">Нічого не знайдено. Спробуй інший запит.</div>`;
    testGrid.appendChild(empty);
  }
}

searchEl.addEventListener("input", renderTestCards);
levelFilterEl.addEventListener("change", renderTestCards);

function showSection(which){
  // which: "list" | "runner" | "result"
  listSection.classList.toggle("hidden", which !== "list");
  runnerSection.classList.toggle("hidden", which !== "runner");
  resultSection.classList.toggle("hidden", which !== "result");

  if (which !== "runner"){
    stopTimer();
  }
}

async function loadQuiz(slug){
  const res = await fetch(`questions/${slug}.json`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Не можу завантажити questions/${slug}.json`);
  return await res.json();
}

function normalizeAnswer(a){
  if (Array.isArray(a)) return [...new Set(a)].sort((x,y)=>x-y);
  if (typeof a === "number") return a;
  return null;
}

function startTimer(minutes){
  stopTimer();
  timeLeftSec = Math.max(60, Math.round(minutes * 60));
  timerText.textContent = formatTime(timeLeftSec);
  timer = setInterval(() => {
    timeLeftSec--;
    timerText.textContent = formatTime(timeLeftSec);
    if (timeLeftSec <= 0){
      stopTimer();
      finish();
    }
  }, 1000);
}

function stopTimer(){
  if (timer){
    clearInterval(timer);
    timer = null;
  }
}

function formatTime(sec){
  sec = Math.max(0, sec|0);
  const m = Math.floor(sec/60);
  const s = sec%60;
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

async function startTest(slug){
  currentTest = TESTS.find(t => t.slug === slug);
  if (!currentTest) return;

  quiz = await loadQuiz(slug);

  // ensure counts
  const items = Array.isArray(quiz.questions) ? quiz.questions : [];
  if (items.length === 0) throw new Error("У JSON немає questions[]");

  idx = 0;
  answers = new Array(items.length).fill(null);
  startedAt = Date.now();

  runnerTitle.textContent = quiz.title || currentTest.title;
  runnerSub.textContent = `${items.length} питань • ~${currentTest.minutes} хв • ${currentTest.level.join(" / ")}`;

  showSection("runner");
  renderQuestion();

  startTimer(currentTest.minutes);
  document.querySelector("#runner").scrollIntoView({ behavior: "smooth" });
}

function renderQuestion(){
  const items = quiz.questions;
  const total = items.length;
  idx = clamp(idx, 0, total-1);

  const q = items[idx];
  qCount.textContent = `Питання ${idx+1}/${total}`;
  qBarIn.style.width = `${Math.round(((idx)/Math.max(1,total-1))*100)}%`;

  qText.textContent = q.text || "—";

  if (q.code){
    qCode.textContent = q.code;
    qCode.classList.remove("hidden");
  } else {
    qCode.textContent = "";
    qCode.classList.add("hidden");
  }

  hintBox.textContent = q.hint ? `Підказка: ${q.hint}` : "";

  // answers
  answersEl.innerHTML = "";

  const type = q.type || "single"; // single | multi
  const saved = answers[idx];

  q.options.forEach((opt, i) => {
    const row = document.createElement("label");
    row.className = "answer";

    const input = document.createElement("input");
    input.type = (type === "multi") ? "checkbox" : "radio";
    input.name = "ans";
    input.value = String(i);

    if (type === "multi" && Array.isArray(saved) && saved.includes(i)) input.checked = true;
    if (type !== "multi" && typeof saved === "number" && saved === i) input.checked = true;

    const text = document.createElement("div");
    text.className = "a-text";
    text.textContent = opt;

    row.appendChild(input);
    row.appendChild(text);

    row.addEventListener("click", (e) => {
      // allow clicking row
      if (e.target !== input) input.checked = !input.checked && type === "multi" ? true : input.checked;

      if (type === "multi"){
        const sel = [...answersEl.querySelectorAll('input[type="checkbox"]:checked')].map(x => Number(x.value));
        answers[idx] = normalizeAnswer(sel);
      } else {
        const checked = answersEl.querySelector('input[type="radio"]:checked');
        answers[idx] = checked ? Number(checked.value) : null;
      }
      updateNextLabel();
    });

    answersEl.appendChild(row);
  });

  prevBtn.disabled = idx === 0;
  updateNextLabel();
}

function updateNextLabel(){
  const total = quiz.questions.length;
  const isLast = idx === total - 1;
  nextBtn.textContent = isLast ? "Завершити" : "Далі";
}

prevBtn.addEventListener("click", () => {
  idx--;
  renderQuestion();
});

nextBtn.addEventListener("click", () => {
  const total = quiz.questions.length;
  const isLast = idx === total - 1;

  // optional: require answer
  if (answers[idx] === null || (Array.isArray(answers[idx]) && answers[idx].length === 0)){
    hintBox.textContent = "Оберіть відповідь, щоб продовжити 🙂";
    return;
  }

  if (isLast){
    finish();
  } else {
    idx++;
    renderQuestion();
  }
});

backToList.addEventListener("click", () => {
  showSection("list");
  document.querySelector("#tests").scrollIntoView({ behavior: "smooth" });
});

function sameAnswer(a, b){
  if (Array.isArray(a) && Array.isArray(b)){
    if (a.length !== b.length) return false;
    for (let i=0;i<a.length;i++) if (a[i] !== b[i]) return false;
    return true;
  }
  return a === b;
}

function grade(){
  const items = quiz.questions;
  let correct = 0;

  const topicStats = Object.create(null); // topic -> { total, correct }
  for (const q of items){
    const topics = Array.isArray(q.topics) ? q.topics : ["general"];
    topics.forEach(tp => {
      topicStats[tp] = topicStats[tp] || { total:0, correct:0 };
      topicStats[tp].total++;
    });
  }

  items.forEach((q, i) => {
    const userA = normalizeAnswer(answers[i]);
    const rightA = normalizeAnswer(q.correct);
    const ok = sameAnswer(userA, rightA);
    if (ok) correct++;

    const topics = Array.isArray(q.topics) ? q.topics : ["general"];
    topics.forEach(tp => {
      if (ok) topicStats[tp].correct++;
    });
  });

  const total = items.length;
  const pct = Math.round((correct / Math.max(1,total)) * 100);

  return { correct, total, pct, topicStats };
}

function levelFromPct(pct){
  if (pct >= 85) return { level: "Middle", desc: "Сильний результат. Можеш робити реальні задачі та брати складніші теми." };
  if (pct >= 65) return { level: "Strong Junior", desc: "Добре. Є база + треба підтягнути кілька тем, щоб вирости швидко." };
  if (pct >= 45) return { level: "Junior", desc: "Нормальний старт. Рекомендуємо закріпити базу й практикувати задачі." };
  return { level: "Beginner", desc: "Поки що база слабка — але це ок. Ми дамо простий план на 7 днів, щоб піти вгору." };
}

function finish(){
  stopTimer();

  const g = grade();
  const lvl = levelFromPct(g.pct);

  scoreNum.textContent = `${g.pct}%`;
  scoreLevel.textContent = lvl.level;
  scoreDesc.textContent = lvl.desc;

  const spentSec = Math.round((Date.now() - startedAt) / 1000);
  resultMeta.textContent = `${quiz.title || currentTest.title} • правильних ${g.correct}/${g.total} • час: ${formatTime(spentSec)}`;

  // topics breakdown
  topicsEl.innerHTML = "";
  const entries = Object.entries(g.topicStats)
    .map(([k,v]) => ({ topic:k, ...v, pct: Math.round((v.correct/Math.max(1,v.total))*100) }))
    .sort((a,b)=> b.pct - a.pct);

  entries.forEach(t => {
    const row = document.createElement("div");
    row.className = "topic";
    const badge = t.pct >= 70 ? "сильно" : (t.pct >= 45 ? "середньо" : "слабко");
    row.innerHTML = `
      <div><strong>${t.topic}</strong><div class="t-badge">${t.correct}/${t.total} • ${t.pct}%</div></div>
      <div class="pill">${badge}</div>
    `;
    topicsEl.appendChild(row);
  });

  // save last result
  const payload = {
    at: new Date().toISOString(),
    test: currentTest?.slug,
    title: quiz.title || currentTest?.title,
    pct: g.pct,
    correct: g.correct,
    total: g.total,
    level: lvl.level,
    topicStats: g.topicStats
  };
  localStorage.setItem("rabbitit_last_result", JSON.stringify(payload));

  showSection("result");
  document.querySelector("#result").scrollIntoView({ behavior: "smooth" });
}

retryBtn.addEventListener("click", () => {
  if (!currentTest) return;
  startTest(currentTest.slug);
});

chooseAnotherBtn.addEventListener("click", () => {
  showSection("list");
  document.querySelector("#tests").scrollIntoView({ behavior: "smooth" });
});

// Lead form (front-only)
const leadForm = el("leadForm");
const leadMsg = el("leadMsg");

leadForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const fd = new FormData(leadForm);
  const name = String(fd.get("name") || "").trim();
  const contact = String(fd.get("contact") || "").trim();
  const consent = fd.get("consent") === "on";

  if (!name || !contact || !consent){
    leadMsg.textContent = "Заповни поля та постав згоду ✅";
    leadMsg.className = "mini";
    return;
  }

  const last = JSON.parse(localStorage.getItem("rabbitit_last_result") || "null");
  const lead = {
    at: new Date().toISOString(),
    name, contact, consent,
    result: last
  };

  const key = "rabbitit_leads";
  const arr = JSON.parse(localStorage.getItem(key) || "[]");
  arr.push(lead);
  localStorage.setItem(key, JSON.stringify(arr));

  leadMsg.textContent = "Готово! Збережено локально. Потім підключимо API ✅";
  leadMsg.className = "mini";
  leadForm.reset();
});

// init
renderTestCards();
showSection("list");
