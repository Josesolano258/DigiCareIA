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

// ========================================================
// IA FALSA – RESPUESTAS PREDETERMINADAS (MEJORADAS)
// ========================================================

const respuestasIA = [
    // SALUD GENERAL
    { keywords: ["hola", "buenas", "hey"], respuesta: "¡Hola! 👋 Soy DigiCare Twin. ¿En qué puedo ayudarte hoy con tu salud?" },
    { keywords: ["salud"], respuesta: "La salud es fundamental. ¿Quieres hablar de prevención, síntomas, medicamentos o bienestar?" },

    // EMOCIONES / SALUD MENTAL
    { keywords: ["triste", "mal", "deprimido"], respuesta: "Siento mucho que te sientas así 💛. Hablar de lo que sientes es un buen paso. ¿Quieres contarme qué pasó?" },
    { keywords: ["ansiedad", "nervioso", "estresado"], respuesta: "La ansiedad puede ser muy incómoda. Respira profundo conmigo. ¿Qué crees que provocó la sensación?" },
    { keywords: ["insomnio", "dormir"], respuesta: "Dormir mal puede afectar todo tu día. Intenta evitar pantallas 1 hora antes de dormir. ¿Desde cuándo tienes problemas de sueño?" },

    // SÍNTOMAS COMUNES
    { keywords: ["fiebre", "temperatura"], respuesta: "La fiebre es una reacción del cuerpo. Mantente hidratado, reposa y controla los grados. ¿Qué temperatura tienes?" },
    { keywords: ["tos", "gripe", "gripa"], respuesta: "La gripa suele ser viral. Reposo, agua y evitar cambios de clima ayuda. ¿Tienes dolor en la garganta o congestión?" },
    { keywords: ["mareo", "mareado"], respuesta: "El mareo puede deberse a deshidratación o presión baja. ¿Has comido y tomado agua hoy?" },
    { keywords: ["dolor de cabeza", "cefalea", "migraña"], respuesta: "El dolor de cabeza puede deberse a estrés, tensión, deshidratación o sueño. ¿Dónde sientes el dolor exactamente?" },
    { keywords: ["náusea", "vomito", "vómito"], respuesta: "Evita comidas pesadas y toma sorbos de agua. Si vomitas más de 3 veces, consulta atención médica." },

    // DOLORES
    { keywords: ["dolor de espalda"], respuesta: "El dolor de espalda suele mejorar con calor y descanso. ¿Es en la parte baja, media o alta?" },
    { keywords: ["dolor de estómago"], respuesta: "Puede ser indigestión, estrés o infección. ¿Tienes diarrea, náuseas o fiebre?" },
    { keywords: ["dolor de piernas"], respuesta: "Puede ser fatiga, mala circulación o tensión muscular. ¿Empezó después de actividad física?" },

    // EMERGENCIAS
    { keywords: ["dolor de pecho"], respuesta: "⚠️ El dolor de pecho puede ser grave. Si es fuerte, acompañado de sudor, náusea o se irradia al brazo, llama al 123 ya." },
    { keywords: ["no puedo respirar", "dificultad para respirar"], respuesta: "⚠️ Dificultad para respirar es una emergencia. Busca ayuda y llama al 123 ahora mismo." },
    { keywords: ["sangre", "sangrado"], respuesta: "Si el sangrado no para en 10 minutos o es abundante, busca atención urgente." },

    // MEDICAMENTOS
    { keywords: ["ibuprofeno"], respuesta: "El ibuprofeno reduce dolor e inflamación. Evítalo si tienes problemas gástricos. ¿Para qué síntoma lo quieres usar?" },
    { keywords: ["acetaminofen", "paracetamol"], respuesta: "El acetaminofén ayuda con la fiebre y el dolor leve. No excedas 3 g al día. ¿Qué síntomas tienes?" },
    { keywords: ["antibiótico", "antibiotico"], respuesta: "Los antibióticos SOLO sirven para infecciones bacterianas. No ayudan en gripa o virus." },

    // NUTRICIÓN
    { keywords: ["alimentación", "dieta"], respuesta: "Una alimentación balanceada incluye vegetales, proteínas, agua y actividad física. ¿Quieres bajar, subir o mantener peso?" },
    { keywords: ["agua", "hidratación"], respuesta: "La hidratación es clave. Según tu peso, deberías beber entre 1.5 y 3 litros diarios." },
    { keywords: ["vitaminas"], respuesta: "Las vitaminas principales vienen de frutas, verduras y buena alimentación. ¿Tienes alguna en específica?" },

    // PREVENCIÓN
    { keywords: ["ejercicio", "actividad"], respuesta: "El ejercicio mejora ánimo, sueño y salud general. Con 20–30 min al día es suficiente para empezar." },
    { keywords: ["higiene"], respuesta: "Lavado de manos, baño diario y cuidado dental previenen infecciones. ¿Tienes alguna duda en particular?" },

    // NIÑOS
    { keywords: ["mi hijo", "mi niña", "mi bebé"], respuesta: "El cuidado infantil requiere atención especial. ¿Qué síntoma o preocupación tiene tu pequeño?" },

    // AGRADECIMIENTOS
    { keywords: ["gracias", "te agradezco"], respuesta: "¡Con mucho gusto! 💙 Estoy aquí para ayudarte." },

    // RESPUESTA GENERAL
    { keywords: [], respuesta: "Te entiendo 💛. Cuéntame un poco más para poder darte una orientación clara." }
];

function obtenerRespuesta(texto) {
    const msg = texto.toLowerCase().trim();

    for (const r of respuestasIA) {
        if (r.keywords.some(k => msg.includes(k))) {
            return r.respuesta;
        }
    }

    return "Te escucho 💛. Cuéntame más para poder ayudarte mejor.";
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