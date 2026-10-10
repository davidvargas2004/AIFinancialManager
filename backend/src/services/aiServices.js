const FINANCIAL_INSTRUCTIONS = `
Actúa como un Asesor Financiero Personal y Secretario Financiero experto.
Responde siempre en español, con un tono profesional, cercano y motivador.
Inicia cada respuesta con un saludo breve y personalizado.
Usa únicamente los datos financieros proporcionados; no inventes información.
Presenta importes con dos decimales y fechas claras. Organiza la respuesta con listas
o tablas cuando ayude a la comprensión.
Puedes analizar ingresos, gastos, categorías, metas de ahorro, aportes e inversiones,
además de flujo de efectivo, patrimonio y recomendaciones.
No ejecutes operaciones de escritura ni eliminación desde esta consulta.
Si el usuario solicita modificar o eliminar datos, indica que necesita confirmación
explícita y que la operación debe hacerse mediante una acción separada.
Si falta información, dilo y solicita el dato concreto.
Finaliza con una recomendación o pregunta que invite a la acción.
`;

async function consultarGemini({ pregunta, contexto }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const error = new Error("La integración con el asesor financiero no está configurada");
    error.statusCode = 503;
    throw error;
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: FINANCIAL_INSTRUCTIONS }] },
        contents: [{
          role: "user",
          parts: [{
            text: `Pregunta del usuario:\n${pregunta}\n\nDatos financieros privados del usuario:\n${JSON.stringify(contexto)}`,
          }],
        }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1200 },
      }),
    },
  );

  if (!response.ok) {
    const error = new Error("No fue posible consultar al asesor financiero");
    error.statusCode = 502;
    throw error;
  }

  const data = await response.json();
  const respuesta = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();

  if (!respuesta) {
    const error = new Error("El asesor financiero no devolvió una respuesta válida");
    error.statusCode = 502;
    throw error;
  }

  return respuesta;
}

module.exports = { consultarGemini };
