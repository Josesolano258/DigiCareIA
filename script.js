// ==================== VARIABLES GLOBALES ====================
let conversationHistory = [];
let isTyping = false;

const systemContext = `Eres un asistente de salud profesional, empático y confiable. Tu objetivo es proporcionar información médica precisa, clara y basada en evidencia científica.

SIEMPRE:
- Proporcion información basada en estudios y conocimiento médico actualizado
- Usa lenguaje claro, accesible y comprensible
- Sé empático y demuestra comprensión hacia las preocupaciones de salud
- Recuerda consultar con profesionales de salud cuando sea necesario
- Identifica emergencias y recomienda atención médica inmediata cuando corresponda
- Explica conceptos médicos de forma simple
- Proporciona información sobre síntomas, enfermedades, medicamentos, prevención y estilos de vida saludables
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

// Auto-resize
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

// Agregar mensaje
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
// IA FALSA – RESPUESTAS PREDETERMINADAS
// ========================================================

const respuestasIA = [
    { keywords: ["hola", "buenas", "hey"], respuesta: "¡Hola! 👋 Soy DigiCare Twin, tu asistente de salud. ¿Cómo puedo ayudarte hoy?" },

    { keywords: ["triste", "mal", "deprimido"], respuesta: "Siento que te sientas así 💛. Tu bienestar emocional importa. Si quieres hablar, estoy aquí para escucharte." },

    { keywords: ["ansiedad", "nervioso"], respuesta: "La ansiedad puede sentirse abrumadora. Respira profundo conmigo. ¿Qué crees que desencadenó la sensación?" },

    { keywords: ["fiebre", "temperatura"], respuesta: "La fiebre suele ser una respuesta del cuerpo. Mantente hidratado y monitorea los grados. ¿Sabes cuánto tienes?" },

    { keywords: ["tos", "gripe", "gripa"], respuesta: "La mayoría de gripes son virales. Descansa, hidrátate y evita cambios bruscos de clima. ¿Tienes dolor de garganta?" },

    { keywords: ["mareo", "mareado"], respuesta: "El mareo puede deberse a deshidratación, presión baja o ansiedad. ¿Cuándo empezó?" },

    // EMERGENCIAS
    { keywords: ["dolor de pecho", "pecho"], respuesta: "⚠️ El dolor de pecho puede ser grave. Si es fuerte o se irradia, llama al 123 inmediatamente." },

    { keywords: ["no puedo respirar", "dificultad para respirar"], respuesta: "⚠️ Dificultad respiratoria es una emergencia. Llama al 123 ahora mismo." },

    { keywords: ["sangre", "sangrado"], respuesta: "Si el sangrado no se detiene en 10 minutos o es abundante, busca atención urgente." },

    // Nutrición
    { keywords: ["alimentación", "dieta"], respuesta: "Una buena alimentación es clave. ¿Quieres perder, mantener o ganar peso?" },

    // Medicamentos
    { keywords: ["ibuprofeno", "acetaminofen", "medicamento"], respuesta: "Dime qué síntoma tienes y te doy información general sobre el medicamento." },

    { keywords: ["gracias"], respuesta: "¡Con gusto! 💙 Estoy para ayudarte cuando lo necesites." }
];

function obtenerRespuesta(texto) {
    const msg = texto.toLowerCase();

    for (const r of respuestasIA) {
        if (r.keywords.some(k => msg.includes(k))) {
            return r.respuesta;
        }
    }

    return "Te entiendo 💛. Si me das un poco más de detalle, podré ayudarte mejor.";
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

    // Guardar historial
    conversationHistory.push({ role: "user", content: message });

    // IA FALSA — respuesta inmediata
    const respuesta = obtenerRespuesta(message);

    setTimeout(() => {
        toggleTypingIndicator(false);
        addMessage(respuesta, "assistant");

        conversationHistory.push({
            role: "assistant",
            content: respuesta
        });

        // Rehabilitar
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



const toggle = document.querySelector('.mobile-toggle');
const menu = document.querySelector('.nav-menu');

toggle.addEventListener('click', () => {
    menu.classList.toggle('active');
});