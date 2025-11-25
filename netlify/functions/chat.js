// netlify/functions/chat.js
import fetch from "node-fetch";

export async function handler(event) {
  try {
    const { message } = JSON.parse(event.body || "{}");
    if (!message) {
      return { statusCode: 400, body: JSON.stringify({ error: "No message" }) };
    }

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: "Missing OPENAI_API_KEY" }) };
    }

    // 1) Generar respuesta de texto con Chat Completions
    const chatResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Eres una enfermera profesional, amable y calmada. Responde con lenguaje claro y empático." },
          { role: "user", content: message }
        ],
        max_tokens: 600,
        temperature: 0.2
      })
    });

    const chatData = await chatResp.json();
    const reply = chatData?.choices?.[0]?.message?.content?.trim() || "Perdón, no pude generar la respuesta.";

    // 2) Generar TTS (audio) — usar endpoint de Speech / Audio
    // Nota: la ruta y payload pueden variar según la versión de la API. Este ejemplo usa
    // "audio/speech" estilo OpenAI TTS. Ajusta si tu cuenta requiere otro endpoint.
    const ttsResp = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice: "verse",              // voz femenina, cálida (ajústalo si cambias)
        input: reply,
        format: "wav"               // pedimos WAV para compatibilidad
      })
    });

    // Si el endpoint devuelve binary stream, transformamos a base64
    const arrayBuffer = await ttsResp.arrayBuffer();
    const audioBase64 = Buffer.from(arrayBuffer).toString("base64");

    return {
      statusCode: 200,
      body: JSON.stringify({
        reply,
        audioBase64
      })
    };

  } catch (err) {
    console.error("Function error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || "Server error" })
    };
  }
}
