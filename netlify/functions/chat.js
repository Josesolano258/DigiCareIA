exports.handler = async (event, context) => {
  // Headers para CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Manejar preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Solo permitir POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método no permitido' })
    };
  }

  try {
    // Parsear el body
    const { messages, systemContext } = JSON.parse(event.body);

    // Validar que tenemos los datos necesarios
    if (!messages || !Array.isArray(messages)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Formato de mensajes inválido' })
      };
    }

    // Validar que tenemos la API key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY no está configurada');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Configuración del servidor incompleta. Contacta al administrador.' })
      };
    }

    // Llamar a la API de Anthropic
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: systemContext,
        messages: messages
      })
    });

    // Verificar respuesta de Anthropic
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error de Anthropic API:', response.status, errorText);
      
      let errorMessage = 'Error al comunicarse con la IA';
      if (response.status === 401) {
        errorMessage = 'API Key inválida. Contacta al administrador.';
      } else if (response.status === 429) {
        errorMessage = 'Límite de solicitudes alcanzado. Intenta en unos minutos.';
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    // Validar que tenemos contenido
    if (!data.content || !data.content[0] || !data.content[0].text) {
      throw new Error('Respuesta inválida de la IA');
    }

    const assistantMessage = data.content[0].text;

    // Retornar respuesta exitosa
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: assistantMessage,
        success: true
      })
    };

  } catch (error) {
    console.error('Error en función chat:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Error al procesar la solicitud',
        success: false
      })
    };
  }
};