const test = require("node:test");
const assert = require("node:assert/strict");
const {
  MAX_QUESTION_LENGTH,
  sanitizeQuestion,
  validateQuestion,
} = require("../src/modules/aiTools/aiValidation");
const aiService = require("../src/modules/aiTools/aiService");
const aiController = require("../src/modules/aiTools/aiController");

test("sanitiza espacios, normaliza caracteres y elimina controles antes de procesar la pregunta", () => {
  assert.equal(
    sanitizeQuestion("  ¿Cuánto\u0000 puedo ahorrar\u000B este mes?  "),
    "¿Cuánto puedo ahorrar este mes?",
  );
});

test("rechaza preguntas vacías después de sanitizar", () => {
  assert.equal(validateQuestion(" \u0000\u000B ").valid, false);
  assert.equal(validateQuestion(" \u0000\u000B ").message, "La pregunta es obligatoria");
});

test("acepta exactamente el límite del textarea", () => {
  const validacion = validateQuestion("a".repeat(MAX_QUESTION_LENGTH));

  assert.equal(validacion.valid, true);
  assert.equal(validacion.pregunta.length, MAX_QUESTION_LENGTH);
});

test("rechaza preguntas que superan el maxlength del textarea", () => {
  const validacion = validateQuestion("a".repeat(MAX_QUESTION_LENGTH + 1));

  assert.equal(validacion.valid, false);
  assert.equal(validacion.message, "La pregunta no puede superar 2000 caracteres");
});

test("detiene entradas inválidas antes de llamar a la IA o Prisma", async () => {
  let llamadas = 0;
  const generarRespuestaOriginal = aiService.generarRespuesta;
  aiService.generarRespuesta = async () => {
    llamadas += 1;
    return {};
  };

  const response = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(value) {
      this.body = value;
      return this;
    },
  };

  try {
    await aiController.preguntar({ body: { pregunta: " \u0000\u000B " } }, response, assert.fail);
  } finally {
    aiService.generarRespuesta = generarRespuestaOriginal;
  }

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, { message: "La pregunta es obligatoria" });
  assert.equal(llamadas, 0);
});

test("detecta un gasto explícito y prepara una operación pendiente para confirmar", () => {
  const operacion = aiService.extraerOperacionExplicita(
    "Gasté 40.000 en comida",
    [{ nombre: "Comida" }, { nombre: "Transporte" }],
  );

  assert.deepEqual(operacion, {
    registrar: false,
    tipo: "gasto",
    monto: 40000,
    descripcion: "comida",
    categoria: "Comida",
    ocurridoEn: operacion.ocurridoEn,
  });
});

test("convierte una operación válida sugerida por la IA en una propuesta pendiente", () => {
  const operacion = aiService.normalizarOperacionSugerida(
    {
      registrar: false,
      tipo: "gasto",
      monto: 40000,
      descripcion: "comida",
      categoria: "Alimentación",
    },
    [{ nombre: "Alimentación" }],
  );

  assert.equal(operacion.tipo, "gasto");
  assert.equal(operacion.monto, 40000);
  assert.equal(operacion.categoria, "Alimentación");
  assert.equal(operacion.registrar, false);
});
