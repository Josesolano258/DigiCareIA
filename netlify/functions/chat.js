// netlify/functions/chat.js
const fetch = globalThis.fetch; // usar fetch nativo de node

export async function handler(event) {
  try {
    const { message } = JSON.parse(event.body || "{}");

    if (!message) {
      return { statusCode: 400, body: JSON.stringify({ error: "No message provided" }) };
    }

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing OPENAI_API_KEY" })
      };
    }

    // ---- 1) Pedir TEXTO ----
    const textResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Eres una enfermera profesional, cálida y empática." },
          { role: "user", content: message }
        ]
      })
    });

    if (!textResp.ok) {
      return { statusCode: 500, body: await textResp.text() };
    }

    const json = await textResp.json();
    const replyText = json?.choices?.[0]?.message?.content || "Aquí tienes tu respuesta.";

    // ---- 2) Pedir AUDIO ----
    const ttsResp = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice: "alloy",
        input: replyText
      })
    });

    if (!ttsResp.ok) {
      return { statusCode: 500, body: await ttsResp.text() };
    }

    const audioBinary = await ttsResp.arrayBuffer();
    const audioBase64 = Buffer.from(audioBinary).toString("base64");

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
      body: JSON.stringify({ error: err.message })
    };
  }
}
