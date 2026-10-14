const test = require("node:test");
const assert = require("node:assert/strict");
const {
  MAX_QUESTION_LENGTH,
  sanitizeQuestion,
  validateQuestion,
} = require("../src/modules/aiTools/aiValidation");
const aiService = require("../src/modules/aiTools/aiService");
const aiController = require("../src/modules/aiTools/aiController");
const prisma = require("../src/config/prisma");
const movementService = require("../src/modules/movimientos/movementService");
const {
  createPendingOperation,
  consumePendingOperation,
  clearPendingOperations,
} = require("../src/modules/aiTools/pendingOperations");

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

test("las propuestas son de un solo uso y no aceptan replay", () => {
  clearPendingOperations();
  const token = createPendingOperation("usuario-1", { tipo: "gasto", monto: 10 });

  assert.deepEqual(consumePendingOperation("usuario-1", token), { tipo: "gasto", monto: 10 });
  assert.equal(consumePendingOperation("usuario-1", token), null);
});

test("una propuesta no puede ser confirmada por otro usuario", () => {
  clearPendingOperations();
  const token = createPendingOperation("usuario-1", { tipo: "ingreso", monto: 50 });

  assert.equal(consumePendingOperation("usuario-2", token), null);
  assert.deepEqual(consumePendingOperation("usuario-1", token), { tipo: "ingreso", monto: 50 });
});

test("una confirmación arbitraria no crea un movimiento", async () => {
  const originalUsuario = prisma.usuario.findUnique;
  const originalCategoria = prisma.categoria.findMany;
  const originalIngreso = prisma.ingreso.findMany;
  const originalGasto = prisma.gasto.findMany;
  const originalMeta = prisma.metaAhorro.findMany;
  const originalAporte = prisma.aporteAhorro.findMany;
  const originalInversion = prisma.inversion.findMany;
  const original = movementService.crearMovimiento;
  let llamadas = 0;
  prisma.usuario.findUnique = async () => ({ id: "usuario-inexistente" });
  prisma.categoria.findMany = async () => [];
  prisma.ingreso.findMany = async () => [];
  prisma.gasto.findMany = async () => [];
  prisma.metaAhorro.findMany = async () => [];
  prisma.aporteAhorro.findMany = async () => [];
  prisma.inversion.findMany = async () => [];
  movementService.crearMovimiento = async () => {
    llamadas += 1;
    return {};
  };
  try {
    await assert.rejects(aiService.generarRespuesta("usuario-inexistente", "registra 999999", {
      confirmarOperacion: { tipo: "ingreso", monto: 999999, categoria: "Trabajo" },
    }));
    assert.equal(llamadas, 0);
  } finally {
    prisma.usuario.findUnique = originalUsuario;
    prisma.categoria.findMany = originalCategoria;
    prisma.ingreso.findMany = originalIngreso;
    prisma.gasto.findMany = originalGasto;
    prisma.metaAhorro.findMany = originalMeta;
    prisma.aporteAhorro.findMany = originalAporte;
    prisma.inversion.findMany = originalInversion;
    movementService.crearMovimiento = original;
  }
});

test("ejecuta la confirmación explícita de un gasto", async () => {
  const original = {
    usuario: prisma.usuario.findUnique,
    categoria: prisma.categoria.findMany,
    ingreso: prisma.ingreso.findMany,
    gasto: prisma.gasto.findMany,
    meta: prisma.metaAhorro.findMany,
    aporte: prisma.aporteAhorro.findMany,
    inversion: prisma.inversion.findMany,
    crearMovimiento: movementService.crearMovimiento,
  };
  let creado;

  prisma.usuario.findUnique = async () => ({ id: "usuario-prueba" });
  prisma.categoria.findMany = async () => [{ id: "categoria-1", nombre: "Alimentación" }];
  prisma.ingreso.findMany = async () => [];
  prisma.gasto.findMany = async () => [];
  prisma.metaAhorro.findMany = async () => [];
  prisma.aporteAhorro.findMany = async () => [];
  prisma.inversion.findMany = async () => [];
  movementService.crearMovimiento = async (usuarioId, data) => {
    creado = { usuarioId, data };
    return {
      ...data,
      monto: data.monto,
      ocurridoEn: new Date("2026-01-01T00:00:00.000Z"),
      categoria: { nombre: "Alimentación" },
    };
  };

  try {
    const propuesta = await aiService.generarRespuesta(
      "usuario-prueba",
      "Gasté 40.000 en alimentación",
    );
    const respuesta = await aiService.generarRespuesta("usuario-prueba", "confirmo", {
      confirmationToken: propuesta.registro.confirmationToken,
    });

    assert.equal(respuesta.registro.estado, "registrado");
    assert.equal(creado.usuarioId, "usuario-prueba");
    assert.equal(creado.data.tipo, "gasto");
    assert.equal(creado.data.monto, 40000);
  } finally {
    prisma.usuario.findUnique = original.usuario;
    prisma.categoria.findMany = original.categoria;
    prisma.ingreso.findMany = original.ingreso;
    prisma.gasto.findMany = original.gasto;
    prisma.metaAhorro.findMany = original.meta;
    prisma.aporteAhorro.findMany = original.aporte;
    prisma.inversion.findMany = original.inversion;
    movementService.crearMovimiento = original.crearMovimiento;
  }
});

test("ejecuta la confirmación explícita de un ingreso", async () => {
  const original = {
    usuario: prisma.usuario.findUnique,
    categoria: prisma.categoria.findMany,
    ingreso: prisma.ingreso.findMany,
    gasto: prisma.gasto.findMany,
    meta: prisma.metaAhorro.findMany,
    aporte: prisma.aporteAhorro.findMany,
    inversion: prisma.inversion.findMany,
    crearMovimiento: movementService.crearMovimiento,
  };
  let creado;

  prisma.usuario.findUnique = async () => ({ id: "usuario-prueba" });
  prisma.categoria.findMany = async () => [{ id: "categoria-1", nombre: "Trabajo" }];
  prisma.ingreso.findMany = async () => [];
  prisma.gasto.findMany = async () => [];
  prisma.metaAhorro.findMany = async () => [];
  prisma.aporteAhorro.findMany = async () => [];
  prisma.inversion.findMany = async () => [];
  movementService.crearMovimiento = async (usuarioId, data) => {
    creado = { usuarioId, data };
    return {
      ...data,
      ocurridoEn: new Date("2026-01-01T00:00:00.000Z"),
      categoria: { nombre: "Trabajo" },
    };
  };

  try {
    const propuesta = await aiService.generarRespuesta(
      "usuario-prueba",
      "Recibí 2.000.000 por trabajo",
    );
    const respuesta = await aiService.generarRespuesta("usuario-prueba", "confirmo", {
      confirmationToken: propuesta.registro.confirmationToken,
    });

    assert.equal(respuesta.registro.estado, "registrado");
    assert.equal(creado.data.tipo, "ingreso");
    assert.equal(creado.data.monto, 2000000);
  } finally {
    prisma.usuario.findUnique = original.usuario;
    prisma.categoria.findMany = original.categoria;
    prisma.ingreso.findMany = original.ingreso;
    prisma.gasto.findMany = original.gasto;
    prisma.metaAhorro.findMany = original.meta;
    prisma.aporteAhorro.findMany = original.aporte;
    prisma.inversion.findMany = original.inversion;
    movementService.crearMovimiento = original.crearMovimiento;
  }
});
