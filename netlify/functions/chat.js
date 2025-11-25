// netlify/functions/chat.js
import fetch from "node-fetch";

export async function handler(event) {
  try {
    const { message } = JSON.parse(event.body || "{}");

    if (!message) {
      return { statusCode: 400, body: JSON.stringify({ error: "No message provided" }) };
    }

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: "Missing OPENAI_API_KEY" }) };
    }

    // ---------- 1) Pedir TEXTO a la IA ----------
    const textResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Eres una enfermera profesional, cálida, amable y empática."
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const json = await textResp.json();
    const replyText =
      json?.choices?.[0]?.message?.content || "Aquí tienes tu respuesta.";

    // ---------- 2) Pedir AUDIO basado en el texto ----------
    const ttsResp = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        input: replyText,
        voice: "alloy",
        format: "wav"
      })
    });

    const audioBuffer = await ttsResp.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString("base64");

    // ---------- 3) Respuesta final ----------
    return {
      statusCode: 200,
      body: JSON.stringify({
        reply: replyText,
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
