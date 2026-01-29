const fab = document.getElementById("chatFab");
const box = document.getElementById("chatBox");
const closeBtn = document.getElementById("chatClose");
const form = document.getElementById("chatForm");
const input = document.getElementById("chatInput");
const messages = document.getElementById("chatMessages");

fab.onclick = () => {
  box.style.display = "flex";
};

closeBtn.onclick = () => {
  box.style.display = "none";
};

function addMessage(text, type){
  const div = document.createElement("div");
  div.className = `msg ${type}`;
  div.innerHTML = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

form.onsubmit = (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if(!text) return;

  addMessage(text, "user");
  input.value = "";

  setTimeout(() => {
    addMessage(getAnswer(text), "bot");
  }, 400);
};

function getAnswer(q){
  q = q.toLowerCase();

  if(q.includes("ціна") || q.includes("варт"))
    return "Ціни залежать від курсу та формату навчання 🙂";

  if(q.includes("курс"))
    return "Маємо HTML/CSS/JS, Python, Telegram-боти.";

  if(q.includes("запис"))
    return "Напиши імʼя, вік і формат (онлайн / офлайн).";

  return "Уточни, будь ласка, що саме тебе цікавить 👇";
}
