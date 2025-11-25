// ==================== VARIABLES GLOBALES ====================
let conversationHistory = [];
let isTyping = false;

const systemContext = `Eres un asistente de salud profesional, empático y confiable. Tu objetivo es proporcionar información médica precisa, clara y basada en evidencia científica.

SIEMPRE:
- Proporciona información basada en estudios y conocimiento médico actualizado.
- Usa lenguaje claro, accesible y comprensible.
- Sé empático y demuestra comprensión hacia las preocupaciones de salud.
- Recuerda consultar con profesionales de salud cuando sea necesario.
- Identifica emergencias y recomienda atención médica inmediata cuando corresponda.
- Explica conceptos médicos de forma simple.
- Proporciona información sobre síntomas, enfermedades, medicamentos, prevención y estilos de vida saludables.
- Responde SIEMPRE en español, con tono cálido y humano.

IMPORTANTE:
- NO eres un médico y tus respuestas son informativas, no diagnósticos médicos.
- En síntomas graves, SIEMPRE recomienda atención médica urgente.
- Si detectas emergencia, indica llamar al 123 inmediatamente.`;

// ==================== NAVEGACIÓN ====================
const navbar = document.getElementById('navbar');
const mobileToggle = document.getElementById('mobileToggle');
const navMenu = document.getElementById('navMenu');

// Scroll effect
window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
});

// Mobile menu
if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
}

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => navMenu.classList.remove('active'));
});

// ==================== SMOOTH SCROLL ====================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 80;
            window.scrollTo({ top: offsetTop, behavior: 'smooth' });
        }
    });
});

// ==================== ANIMACIONES ====================
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
    });
});

document.querySelectorAll('.service-card, .step').forEach(el => observer.observe(el));

// ==================== CHAT ====================

// Auto-resize textarea
function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
}

// Enter para enviar
function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// Pregunta rápida
function sendQuickQuestion(text) {
    const input = document.getElementById('userInput');
    input.value = text;
    sendMessage();
}

// Limpiar chat
function clearChat() {
    if (!confirm('¿Seguro que quieres limpiar el chat?')) return;

    conversationHistory = [];

    document.getElementById('chatMessages').innerHTML = `
        <div class="message assistant">
            <div class="message-avatar">🤖</div>
            <div class="message-content">
                <div class="message-text">
                    ¡Hola! 👋 Soy DigiCare Twin. Puedo ayudarte con síntomas, medicamentos, prevención y dudas de salud.
                </div>
                <div class="message-time">Ahora</div>
            </div>
        </div>`;
}

// Hora actual
function getCurrentTime() {
    return new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

// Agregar mensaje al chat
function addMessage(text, sender) {
    const chat = document.getElementById('chatMessages');

    const msg = document.createElement('div');
    msg.className = `message ${sender}`;

    msg.innerHTML = `
        <div class="message-avatar">${sender === 'user' ? '👤' : '🤖'}</div>
        <div class="message-content">
            <div class="message-text">${text}</div>
            <div class="message-time">${getCurrentTime()}</div>
        </div>
    `;

    chat.appendChild(msg);
    chat.scrollTop = chat.scrollHeight;
}

// Typing indicator
function toggleTypingIndicator(show) {
    document.getElementById('typingIndicator').classList.toggle('active', show);
}

// ========================================================
// RESPUESTAS PREDETERMINADAS (IA FALSA)
// ========================================================
const respuestasIA = [
    // SALUDO
    { keywords: ["hola", "buenas", "hey"], respuesta: "¡Hola! 👋 ¿En qué puedo ayudarte hoy con tu salud?" },

    // EMOCIONES
    { keywords: ["triste", "mal", "deprimido"], respuesta: "Lamento que te sientas así 💛. Si quieres hablar, estoy aquí para escucharte." },
    { keywords: ["ansiedad", "nervioso", "estresado"], respuesta: "La ansiedad puede ser difícil. Respira profundo. ¿Qué crees que te la está causando?" },

    // SÍNTOMAS COMUNES
    { keywords: ["fiebre"], respuesta: "La fiebre indica infección o inflamación. ¿Qué temperatura tienes actualmente?" },
    { keywords: ["tos", "gripe"], respuesta: "La mayoría de las gripas son virales. ¿Tienes congestión, dolor de garganta o dolor corporal?" },
    { keywords: ["dolor de cabeza"], respuesta: "¿Dónde sientes el dolor? ¿En la frente, sienes o parte trasera de la cabeza?" },
    { keywords: ["mareo"], respuesta: "El mareo puede venir de deshidratación. ¿Has tomado agua hoy?" },
    { keywords: ["náusea", "vómito"], respuesta: "Toma sorbos pequeños de agua. Si vomitas varias veces, consulta atención médica." },

    // DOLORES
    { keywords: ["dolor de espalda"], respuesta: "¿Es dolor bajo, medio o alto? ¿Empezó después de cargar algo o mala postura?" },
    { keywords: ["dolor de pierna"], respuesta: "Puede ser muscular o de circulación. ¿Fue después de caminar o ejercicio?" },

    // EMERGENCIAS
    { keywords: ["dolor de pecho"], respuesta: "⚠️ Si el dolor es fuerte o se irradia al brazo, llama al 123 de inmediato." },
    { keywords: ["no puedo respirar"], respuesta: "⚠️ Dificultad al respirar es una emergencia. Busca ayuda y llama al 123." },

    // MEDICAMENTOS
    { keywords: ["ibuprofeno"], respuesta: "El ibuprofeno ayuda con inflamación. ¿Qué tipo de dolor tienes?" },
    { keywords: ["acetaminofen"], respuesta: "Ayuda con fiebre y dolor leve. No excedas la dosis diaria recomendada." },

    // NUTRICIÓN
    { keywords: ["dieta", "alimentación"], respuesta: "Una dieta equilibrada incluye verduras, proteína y agua. ¿Quieres una guía según tu objetivo?" },

    // AGRADECIMIENTO
    { keywords: ["gracias"], respuesta: "¡Con gusto! 💙 ¿Hay algo más en lo que pueda ayudarte?" },

    // RESPUESTA DEFAULT
    { keywords: [], respuesta: "Te escucho 💛. Cuéntame más para poder ayudarte mejor." }
];

function obtenerRespuesta(texto) {
    const msg = texto.toLowerCase().trim();

    for (const r of respuestasIA) {
        if (r.keywords.some(k => msg.includes(k))) {
            return r.respuesta;
        }
    }

    return "Te escucho 💛. Cuéntame un poco más.";
}

// ========================================================
// ENVÍO DEL MENSAJE
// ========================================================
async function sendMessage() {
    const input = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const message = input.value.trim();

    if (!message || isTyping) return;

    addMessage(message, "user");
    input.value = "";
    input.style.height = "auto";

    isTyping = true;
    sendBtn.disabled = true;
    input.disabled = true;
    toggleTypingIndicator(true);

    conversationHistory.push({ role: "user", content: message });

    const respuesta = obtenerRespuesta(message);

    setTimeout(() => {
        toggleTypingIndicator(false);
        addMessage(respuesta, "assistant");

        conversationHistory.push({
            role: "assistant",
            content: respuesta
        });

        isTyping = false;
        sendBtn.disabled = false;
        input.disabled = false;
        input.focus();
    }, 500);
}

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log("DigiCare Twin cargado correctamente");
    const userInput = document.getElementById('userInput');
    if (userInput) userInput.focus();
});
