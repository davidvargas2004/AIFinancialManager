const FINANCIAL_INSTRUCTIONS = `
Actúa como un Asesor Financiero Personal y Secretario Financiero experto.
Responde siempre en español, con un tono profesional, cercano y motivador.
Usa únicamente los datos financieros proporcionados; no inventes información.
Presenta importes con dos decimales y fechas claras.
Puedes analizar ingresos, gastos, categorías, metas de ahorro, aportes e inversiones,
además de flujo de efectivo, patrimonio y recomendaciones.
No ejecutes operaciones de escritura ni eliminación desde esta consulta.
Si el usuario solicita modificar o eliminar datos, indica que necesita confirmación
explícita y que la operación debe hacerse mediante una acción separada.
Si falta información, dilo y solicita el dato concreto.
REGLAS OBLIGATORIAS DE FORMATO:
1. Devuelve únicamente un objeto JSON válido. Tu primer carácter debe ser { y tu
   último carácter debe ser }.
2. No escribas saludos, explicaciones ni texto antes o después del objeto JSON.
3. No uses Markdown: no uses títulos con #, negritas con **, listas con guiones,
   tablas, etiquetas como "Observaciones clave" ni bloques de código.
4. No uses puntos suspensivos (...), marcadores como "...", valores pendientes ni
   texto de ejemplo. Escribe siempre el contenido real basado en los datos recibidos.
5. Usa comillas dobles para todas las claves y valores de texto. Escapa las comillas
   internas y los saltos de línea correctamente según JSON.
6. No agregues propiedades, comentarios, comas finales ni explicaciones.
7. "observaciones" siempre debe ser un arreglo JSON de textos. Si no hay observaciones,
   devuelve [].
8. Los cinco campos son obligatorios y nunca pueden estar vacíos. "operacion" debe
   incluir siempre todos sus campos, aunque registrar sea false.
9. Desarrolla completamente el análisis cuando la pregunta lo requiera. No cortes
   frases, palabras ni JSON por brevedad. Usa el espacio disponible para explicar
   cifras, fechas, causas y acciones concretas.
10. Si el usuario afirma explícitamente que recibió o gastó dinero, prepara la
    operación en "operacion" con registrar=true. Si solo pregunta, analiza o pide
    consejo, usa registrar=false.
11. Nunca inventes una categoría. Usa el nombre exacto de una categoría disponible
    en los datos financieros. Si no existe una categoría adecuada, usa categoria=""
    y registrar=false.

La respuesta debe cumplir exactamente esta estructura JSON:
{
  "saludo": "Saludo breve y personalizado.",
  "resumen": "Resumen financiero basado únicamente en los datos disponibles.",
  "observaciones": ["Observación concreta basada en los datos."],
  "recomendacion": "Recomendación concreta o pregunta que invite a la acción.",
  "operacion": {
    "registrar": false,
    "tipo": "gasto",
    "monto": 0,
    "descripcion": "",
    "categoria": "",
    "ocurridoEn": ""
  }
}

Antes de responder, comprueba internamente que el contenido se pueda interpretar con
JSON.parse. No muestres esa comprobación ni incluyas ningún texto adicional.
`;

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";
const GEMINI_MAX_OUTPUT_TOKENS = Math.min(
  Math.max(Number(process.env.GEMINI_MAX_OUTPUT_TOKENS || 3000), 1200),
  8192,
);
const GEMINI_MODELS = [...new Set([
  GEMINI_MODEL,
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite",
])];

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    saludo: { type: "STRING" },
    resumen: { type: "STRING" },
    observaciones: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
    recomendacion: { type: "STRING" },
    operacion: {
      type: "OBJECT",
      properties: {
        registrar: { type: "BOOLEAN" },
        tipo: { type: "STRING", enum: ["ingreso", "gasto"] },
        monto: { type: "NUMBER" },
        descripcion: { type: "STRING" },
        categoria: { type: "STRING" },
        ocurridoEn: { type: "STRING" },
      },
      required: ["registrar", "tipo", "monto", "descripcion", "categoria", "ocurridoEn"],
    },
  },
  required: ["saludo", "resumen", "observaciones", "recomendacion", "operacion"],
  propertyOrdering: ["saludo", "resumen", "observaciones", "recomendacion", "operacion"],
};

function crearError(message, statusCode, cause) {
  const error = new Error(message, { cause });
  error.statusCode = statusCode;
  return error;
}

function extraerObjetoJson(texto) {
  const limpio = texto.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();

  try {
    return JSON.parse(limpio);
  } catch {
    const inicio = limpio.indexOf("{");
    if (inicio < 0) return null;

    let profundidad = 0;
    let dentroDeCadena = false;
    let escapado = false;

    for (let indice = inicio; indice < limpio.length; indice += 1) {
      const caracter = limpio[indice];
      if (caracter === '"' && !escapado) dentroDeCadena = !dentroDeCadena;
      if (!dentroDeCadena) {
        if (caracter === "{") profundidad += 1;
        if (caracter === "}") profundidad -= 1;
        if (profundidad === 0) {
          try {
            return JSON.parse(limpio.slice(inicio, indice + 1));
          } catch {
            return null;
          }
        }
      }
      escapado = caracter === "\\" && !escapado;
      if (caracter !== "\\") escapado = false;
    }
  }

  return null;
}

function normalizarRespuesta(respuesta, textoOriginal) {
  const objeto = respuesta && typeof respuesta === "object" && !Array.isArray(respuesta)
    ? respuesta
    : {};
  const texto = typeof textoOriginal === "string" ? textoOriginal.trim() : "";
  const observaciones = Array.isArray(objeto.observaciones)
    ? objeto.observaciones
      .map((observacion) => typeof observacion === "string" ? observacion.trim() : "")
      .filter(Boolean)
    : [];

  return {
    saludo: typeof objeto.saludo === "string" && objeto.saludo.trim()
      ? objeto.saludo.trim()
      : "Hola, gracias por consultar a tu asesor financiero.",
    resumen: typeof objeto.resumen === "string" && objeto.resumen.trim()
      ? objeto.resumen.trim()
      : texto || "No hay información suficiente para elaborar un resumen.",
    observaciones,
    recomendacion: typeof objeto.recomendacion === "string" && objeto.recomendacion.trim()
      ? objeto.recomendacion.trim()
      : "Revisa tus movimientos y define el siguiente objetivo financiero que quieres alcanzar.",
    operacion: normalizarOperacion(objeto.operacion),
  };
}

function normalizarOperacion(operacion) {
  if (!operacion || typeof operacion !== "object" || Array.isArray(operacion)) {
    return { registrar: false, tipo: "gasto", monto: 0, descripcion: "", categoria: "", ocurridoEn: "" };
  }

  return {
    registrar: operacion.registrar === true,
    tipo: operacion.tipo === "ingreso" ? "ingreso" : "gasto",
    monto: Number.isFinite(Number(operacion.monto)) ? Number(operacion.monto) : 0,
    descripcion: typeof operacion.descripcion === "string" ? operacion.descripcion.trim() : "",
    categoria: typeof operacion.categoria === "string" ? operacion.categoria.trim() : "",
    ocurridoEn: typeof operacion.ocurridoEn === "string" ? operacion.ocurridoEn.trim() : "",
  };
}

async function consultarGemini({ pregunta, contexto }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw crearError("La integración con el asesor financiero no está configurada", 503);
  }

  try {
    let response;
    let activeModel = GEMINI_MODEL;
    let lastUpstreamMessage = "";

    for (const model of GEMINI_MODELS) {
      activeModel = model;
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: FINANCIAL_INSTRUCTIONS }] },
            contents: [{
              role: "user",
              parts: [{
                text: `RESPONDE SOLO CON JSON VÁLIDO. NO USES MARKDOWN NI TEXTO FUERA DEL JSON.
Pregunta del usuario:
${pregunta}

Datos financieros privados del usuario:
${JSON.stringify(contexto)}

Verifica que tu respuesta final sea un único objeto JSON parseable con las propiedades
saludo, resumen, observaciones, recomendacion y operacion. No uses "..." ni valores
de ejemplo. En operacion, registrar=true solo si el usuario afirmó que recibió o
gastó dinero; registrar=false para preguntas o consejos.`,
              }],
            }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
              responseMimeType: "application/json",
              responseSchema: RESPONSE_SCHEMA,
            },
          }),
        },
      );

      if (response.ok) break;

      const upstreamBody = await response.text();
      try {
        lastUpstreamMessage = JSON.parse(upstreamBody).error?.message || upstreamBody;
      } catch {
        lastUpstreamMessage = upstreamBody;
      }
      console.warn("Gemini rechazó el modelo; probando fallback", {
        model,
        status: response.status,
        message: lastUpstreamMessage.slice(0, 300),
      });
    }

    if (!response?.ok) {
      console.error("Todos los modelos de Gemini rechazaron la solicitud", {
        models: GEMINI_MODELS,
        message: lastUpstreamMessage.slice(0, 500),
      });
      throw crearError("No fue posible consultar al asesor financiero", 502);
    }

    let data;
    try {
      data = await response.json();
    } catch (error) {
      throw crearError("Gemini devolvió una respuesta HTTP inválida", 502, error);
    }

    const textoRespuesta = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();

    if (!textoRespuesta) {
      throw crearError("El asesor financiero no devolvió contenido", 502);
    }

    const respuesta = extraerObjetoJson(textoRespuesta);
    if (!respuesta) {
      console.warn("Gemini devolvió texto no estructurado; se normalizará como resumen", {
        model: activeModel,
      });
    }

    return normalizarRespuesta(respuesta, textoRespuesta);
  } catch (error) {
    if (error.statusCode) throw error;
    console.error("Error al comunicarse con Gemini", {
      models: GEMINI_MODELS,
      message: error.message,
    });
    throw crearError("No fue posible comunicarse con el asesor financiero", 502, error);
  }
}

module.exports = { consultarGemini };
