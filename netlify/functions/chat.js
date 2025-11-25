import Anthropic from "@anthropic-ai/sdk";

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const { messages, systemContext } = body;

    if (!messages || !Array.isArray(messages)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Formato inválido: falta 'messages'." })
      };
    }

    // Convertir historial al formato que Anthropic SÍ acepta
    const formattedMessages = messages.map(m => ({
      role: m.role,          // "user" o "assistant"
      content: m.content
    }));

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const response = await client.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 500,
      system: systemContext,   // <<--- AQUÍ se coloca ahora
      messages: formattedMessages
    });

    const reply = response.content[0].text;

    return {
      statusCode: 200,
      body: JSON.stringify({ message: reply })
    };

  } catch (error) {
    console.error("ERROR FUNCION:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
// End of file: netlify/functions/chat.js


