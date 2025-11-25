// ==================== VARIABLES GLOBALES ====================
let conversationHistory = [];
let isTyping = false;

const systemContext = `Eres un asistente de salud profesional, empático y confiable. Tu objetivo es proporcionar información médica precisa, clara y basada en evidencia científica.

SIEMPRE:
- Proporciona información basada en estudios y conocimiento médico actualizado
- Usa un lenguaje claro, accesible y comprensible
- Sé empático y muestra comprensión hacia las preocupaciones de salud
- Recuerda a los usuarios consultar con profesionales de salud cuando sea necesario
- Identifica emergencias y sugiere atención médica inmediata cuando corresponda
- Explica conceptos médicos de forma simple
- Proporciona información sobre síntomas, enfermedades, medicamentos, prevención y estilos de vida saludables
- Responde SIEMPRE en español de manera natural y amigable

IMPORTANTE: 
- NO eres un médico y tus respuestas son informativas, no diagnósticos médicos
- Ante síntomas graves, SIEMPRE recomienda buscar atención médica inmediata
- Si detectas una emergencia (dolor de pecho, dificultad para respirar, sangrado severo, etc.), indica que llamen al 123 inmediatamente`;

// ==================== NAVEGACIÓN ====================
const navbar = document.getElementById('navbar');
const mobileToggle = document.getElementById('mobileToggle');
const navMenu = document.getElementById('navMenu');

// Scroll effect en navbar
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Mobile menu toggle
if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
}

// Cerrar menu al hacer click en un link
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
    });
});

// ==================== SMOOTH SCROLL ====================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// ==================== ANIMACIONES DE SCROLL ====================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Observar elementos
document.querySelectorAll('.service-card, .step').forEach(el => {
    observer.observe(el);
});

// ==================== FUNCIONES DEL CHAT ====================

// Auto-resize del textarea
function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
}

// Manejar Enter para enviar
function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// Enviar pregunta rápida
function sendQuickQuestion(question) {
    const input = document.getElementById('userInput');
    input.value = question;
    sendMessage();
}

// Limpiar chat
function clearChat() {
    if (confirm('¿Estás seguro de que quieres limpiar toda la conversación?')) {
        conversationHistory = [];
        const messagesDiv = document.getElementById('chatMessages');
        messagesDiv.innerHTML = `
            <div class="message assistant">
                <div class="message-avatar">🤖</div>
                <div class="message-content">
                    <div class="message-text">
                        ¡Hola! 👋 Soy tu asistente de salud inteligente. Estoy aquí para ayudarte con información sobre:
                        <br><br>
                        • Síntomas y condiciones médicas<br>
                        • Medicamentos y tratamientos<br>
                        • Nutrición y vida saludable<br>
                        • Prevención de enfermedades<br>
                        <br>
                        ¿En qué puedo ayudarte hoy?
                    </div>
                    <div class="message-time">Ahora</div>
                </div>
            </div>
        `;
    }
}

// Obtener hora actual
function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

// Agregar mensaje al chat
function addMessage(text, sender) {
    const messagesDiv = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = sender === 'user' ? '👤' : '🤖';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    textDiv.textContent = text;
    
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = getCurrentTime();
    
    contentDiv.appendChild(textDiv);
    contentDiv.appendChild(timeDiv);
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Mostrar/ocultar indicador de escritura
function toggleTypingIndicator(show) {
    const indicator = document.getElementById('typingIndicator');
    if (show) {
        indicator.classList.add('active');
    } else {
        indicator.classList.remove('active');
    }
    const messagesDiv = document.getElementById('chatMessages');
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Enviar mensaje
async function sendMessage() {
    const input = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const message = input.value.trim();
    
    if (!message || isTyping) return;

    // Agregar mensaje del usuario
    addMessage(message, 'user');
    input.value = '';
    input.style.height = 'auto';

    // Deshabilitar input
    isTyping = true;
    sendBtn.disabled = true;
    input.disabled = true;
    toggleTypingIndicator(true);

    // Agregar al historial
    conversationHistory.push({
        role: 'user',
        content: message
    });

    try {
        // Llamar a la función de Netlify
        const response = await fetch('/.netlify/functions/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: conversationHistory,
                systemContext: systemContext
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Error al procesar la solicitud');
        }

        const data = await response.json();
        const assistantMessage = data.message;

        // Agregar respuesta al historial
        conversationHistory.push({
            role: 'assistant',
            content: assistantMessage
        });

        // Simular delay de escritura para efecto más natural
        setTimeout(() => {
            toggleTypingIndicator(false);
            addMessage(assistantMessage, 'assistant');
        }, 500);

    } catch (error) {
        console.error('Error:', error);
        toggleTypingIndicator(false);
        addMessage('Lo siento, hubo un error al procesar tu consulta. Por favor intenta de nuevo en un momento. Si el problema persiste, verifica que la aplicación esté correctamente configurada.', 'assistant');
    } finally {
        // Rehabilitar input
        setTimeout(() => {
            isTyping = false;
            sendBtn.disabled = false;
            input.disabled = false;
            input.focus();
        }, 500);
    }
}

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🏥 MediAI cargado correctamente');
    
    // Focus automático en el input del chat
    const userInput = document.getElementById('userInput');
    if (userInput) {
        userInput.focus();
    }

    // Agregar efecto de hover en las tarjetas de servicio
    document.querySelectorAll('.service-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Animación de números en stats
    const stats = document.querySelectorAll('.stat-number');
    stats.forEach(stat => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animation = 'countUp 1s ease-out';
                }
            });
        });
        observer.observe(stat);
    });
});

// ==================== EASTER EGG ====================
let clickCount = 0;
document.querySelector('.logo')?.addEventListener('click', () => {
    clickCount++;
    if (clickCount === 5) {
        console.log('!Desarrollado con ❤️');
        clickCount = 0;
    }
});