/* script.js - frontend (chat + STT + TTS + animación avatar) */

/* ====== CONFIG ====== */
// Path del asset avatar (el path que subiste). En deploy lo mapearás a URL público.
const AVATAR_SRC = "./avatar.png"; 

// IDs del HTML
const chatMessages = document.getElementById("chatMessages");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const typingIndicator = document.getElementById("typingIndicator");

// Construir la caja del avatar arriba del chat (si no existe)
function ensureAvatarElement() {
  let avatarEl = document.getElementById("aiAvatarImg");
  if (!avatarEl) {
    const header = document.querySelector(".chat-header");
    if (!header) return;
    const img = document.createElement("img");
    img.id = "aiAvatarImg";
    img.src = AVATAR_SRC;
    img.alt = "Avatar MediAI";
    img.style.width = "72px";
    img.style.height = "72px";
    img.style.borderRadius = "12px";
    img.style.objectFit = "cover";
    img.style.boxShadow = "0 6px 18px rgba(0,0,0,0.12)";
    header.insertBefore(img, header.firstChild);
  }
}
ensureAvatarElement();

/* ====== UTIL: mostrar mensajes ====== */
function addMessage({ role = "assistant", text }) {
  const wrapper = document.createElement("div");
  wrapper.classList.add("message");
  wrapper.classList.add(role === "user" ? "user" : "assistant");

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.innerText = role === "user" ? "🫵" : "🤖";

  const content = document.createElement("div");
  content.className = "message-content";

  const bubble = document.createElement("div");
  bubble.className = "message-text";
  bubble.innerText = text;

  const time = document.createElement("div");
  time.className = "message-time";
  time.innerText = new Date().toLocaleTimeString();

  content.appendChild(bubble);
  content.appendChild(time);

  wrapper.appendChild(avatar);
  wrapper.appendChild(content);

  chatMessages.appendChild(wrapper);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

/* ====== LLAMADA al backend y reproducción audio ====== */
async function callChatAPI(text) {
  try {
    toggleTyping(true);
    const res = await fetch("/.netlify/functions/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });

    const data = await res.json(); 

  } catch (err) {
    toggleTyping(false);
    console.error(err);
    addMessage({ role: "assistant", text: "Ocurrió un error al contactar al servicio." });
  }
}

function toggleTyping(on) {
  if (!typingIndicator) return;
  if (on) typingIndicator.classList.add("active");
  else typingIndicator.classList.remove("active");
}

/* ====== Reproducir base64 audio y animar boca del avatar ====== */
async function playBase64AudioAndAnimate(base64) {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: "audio/wav" });
  const url = URL.createObjectURL(blob);

  // Crear audio element
  const audio = new Audio(url);
  audio.crossOrigin = "anonymous";

  // Animación: togglear clase .speaking en avatar mientras suena
  const aiAvatarImg = document.getElementById("aiAvatarImg");
  const avatarFace = aiAvatarImg || document.querySelector(".ai-avatar, .chat-avatar-small, #aiAvatarImg");

  function startSpeaking() {
    if (avatarFace) avatarFace.classList.add("speaking");
    // mientras tanto: pulso de boca (simple)
    mouthInterval = setInterval(() => {
      document.documentElement.style.setProperty("--mouth-open", Math.random() * 1.0 + "");
      if (avatarFace) avatarFace.style.transform = `translateY(${Math.random()*1.5}px)`;
    }, 120);
  }

  function stopSpeaking() {
    if (avatarFace) avatarFace.classList.remove("speaking");
    clearInterval(mouthInterval);
    if (avatarFace) avatarFace.style.transform = "";
  }

  let mouthInterval;
  audio.addEventListener("play", startSpeaking);
  audio.addEventListener("ended", stopSpeaking);
  audio.addEventListener("pause", stopSpeaking);

  // Reproducir
  await audio.play();
}

/* ====== Enviar mensaje (botón o enter) ====== */
async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;
  addMessage({ role: "user", text });
  userInput.value = "";
  await callChatAPI(text);
}

/* ====== Quick questions ====== */
function sendQuickQuestion(text) {
  userInput.value = text;
  sendMessage();
}

/* ====== Bind evento boton y Enter ====== */
if (sendBtn) sendBtn.addEventListener("click", sendMessage);
function handleKeyDown(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}
window.handleKeyDown = handleKeyDown; // el HTML ya llama a handleKeyDown

/* ====== Auto-resize textarea ====== */
function autoResize(el) {
  el.style.height = "auto";
  el.style.height = (el.scrollHeight) + "px";
}
window.autoResize = autoResize;

/* ====== SPEECH-TO-TEXT (microfono) ====== */
let recognition;
function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn("SpeechRecognition no disponible en este navegador.");
    return;
  }
  recognition = new SpeechRecognition();
  recognition.lang = "es-CO";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    userInput.value = transcript;
    sendMessage();
  };

  recognition.onerror = (err) => {
    console.error("STT error:", err);
  };
}

initSpeechRecognition();

/* ====== Botón de micrófono (si quieres añadir uno visual) ====== */
window.startListening = function() {
  if (!recognition) return alert("Tu navegador no soporta reconocimiento de voz.");
  recognition.start();
}

/* ====== Export quick functions global (tu HTML usa sendQuickQuestion) ====== */
window.sendQuickQuestion = sendQuickQuestion;
window.sendMessage = sendMessage;
