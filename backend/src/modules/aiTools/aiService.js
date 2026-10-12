const prisma = require("../../config/prisma");
const { consultarGemini, crearRespuestaFallback } = require("../../services/aiServices");
const movementService = require("../movimientos/movementService");

function serialize(value) {
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value.toNumber === "function") return value.toNumber();
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, serialize(item)]));
  }
  return value;
}

function normalizarTexto(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function fechaActual() {
  return new Date().toISOString().slice(0, 10);
}

function extraerMonto(texto) {
  const millones = texto.match(/(\d+(?:[.,]\d+)?)\s*millones?/i);
  if (millones) return Number(millones[1].replace(",", ".")) * 1000000;

  const numero = texto.match(/\b\d[\d.,]*\b/);
  if (!numero) return 0;

  const limpio = numero[0].replace(/[.,](?=\d{3}(?:\D|$))/g, "").replace(",", ".");
  return Number(limpio);
}

function extraerOperacionExplicita(pregunta, categorias) {
  const texto = normalizarTexto(pregunta);
  const esGasto = /\b(me gaste|gaste|pague|pague|compre|compre|compre|inverti|inverti|gasto)\b/.test(texto);
  const esIngreso = /\b(recibi|me pagaron|gane|ingreso|cobre|salario|trabajo extra)\b/.test(texto);
  if ((!esGasto && !esIngreso) || (esGasto && esIngreso)) return null;

  const monto = extraerMonto(texto);
  if (!Number.isFinite(monto) || monto <= 0) return null;

  const categoriaPreferida = esGasto && /\b(cine|pelicula|peliculas|teatro|concierto|juego)\b/.test(texto)
    ? "Entretenimiento"
    : esIngreso && /\b(salario|sueldo|nomina|trabajo extra)\b/.test(texto)
      ? "Trabajo"
      : "";
  const categoria = categorias.find((item) =>
    normalizarTexto(item.nombre) === normalizarTexto(categoriaPreferida));
  if (!categoria) return null;

  const descripcion = texto
    .replace(/\b(me gaste|gaste|pague|compre|inverti|gasto|recibi|me pagaron|gane|ingreso|cobre|salario|trabajo extra)\b/gi, "")
    .replace(/\b\d+(?:[.,]\d+)?\s*millones?\b/gi, "")
    .replace(/\b\d[\d.,]*\b/g, "")
    .replace(/\s+/g, " ")
    .replace(/^\s*(en|por|de)\s+/i, "")
    .trim();

  return {
    registrar: true,
    tipo: esIngreso ? "ingreso" : "gasto",
    monto,
    descripcion: descripcion || (esIngreso ? "Ingreso registrado" : "Gasto registrado"),
    categoria: categoria.nombre,
    ocurridoEn: fechaActual(),
  };
}

async function registrarOperacion(usuarioId, respuesta, categorias) {
  const operacion = respuesta.operacion;
  if (!operacion?.registrar) return null;

  if (!["ingreso", "gasto"].includes(operacion.tipo)
    || !Number.isFinite(operacion.monto)
    || operacion.monto <= 0
    || operacion.monto > 999999999999
    || !operacion.descripcion
    || !operacion.categoria) {
    return { estado: "pendiente", mensaje: "No registré el movimiento porque faltan datos válidos o una categoría exacta." };
  }

  const categoria = categorias.find((item) =>
    normalizarTexto(item.nombre) === normalizarTexto(operacion.categoria));
  if (!categoria) {
    return { estado: "pendiente", mensaje: `No registré el movimiento porque no existe la categoría "${operacion.categoria}".` };
  }

  // La fecha de registro la determina el servidor al recibir el mensaje.
  const ocurridoEn = new Date();

  const movimiento = await movementService.crearMovimiento(usuarioId, {
    tipo: operacion.tipo,
    categoriaId: categoria.id,
    monto: operacion.monto,
    descripcion: operacion.descripcion.slice(0, 500),
    ocurridoEn,
  });

  return {
    estado: "registrado",
    tipo: operacion.tipo,
    id: movimiento.id,
    monto: Number(movimiento.monto),
    descripcion: movimiento.descripcion,
    categoria: movimiento.categoria.nombre,
    ocurridoEn: new Date(movimiento.ocurridoEn).toISOString().slice(0, 10),
  };
}

async function generarRespuesta(usuarioId, pregunta) {
  const [usuario, categorias, ingresos, gastos, metasAhorro, aportesAhorro, inversiones] = await Promise.all([
    prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, email: true, nombre: true },
    }),
    prisma.categoria.findMany({
      where: { usuarioId },
      select: { id: true, nombre: true, color: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.ingreso.findMany({
      where: { usuarioId },
      include: { categoria: { select: { nombre: true } } },
      orderBy: { ocurridoEn: "desc" },
    }),
    prisma.gasto.findMany({
      where: { usuarioId },
      include: { categoria: { select: { nombre: true } } },
      orderBy: { ocurridoEn: "desc" },
    }),
    prisma.metaAhorro.findMany({
      where: { usuarioId },
      include: { aportes: true },
      orderBy: { fechaObjetivo: "asc" },
    }),
    prisma.aporteAhorro.findMany({
      where: { usuarioId },
      orderBy: { ocurridoEn: "desc" },
    }),
    prisma.inversion.findMany({
      where: { usuarioId },
      orderBy: { fechaInicio: "desc" },
    }),
  ]);

  if (!usuario) {
    const error = new Error("No se encontró el perfil financiero del usuario");
    error.statusCode = 404;
    throw error;
  }

  const contexto = serialize({
    usuario,
    categorias,
    ingresos,
    gastos,
    metasAhorro,
    aportesAhorro,
    inversiones,
  });

  const operacionExplicita = extraerOperacionExplicita(pregunta, categorias);
  let respuesta;
  try {
    respuesta = await consultarGemini({ pregunta, contexto });
  } catch (error) {
    if (!operacionExplicita) throw error;
    respuesta = crearRespuestaFallback(pregunta, operacionExplicita);
  }
  if (operacionExplicita) {
    respuesta.operacion = operacionExplicita;
  }
  const registro = await registrarOperacion(usuarioId, respuesta, categorias);
  if (registro) {
    respuesta.registro = registro;
    if (registro.estado === "registrado") {
      respuesta.observaciones = [
        ...respuesta.observaciones,
        `Movimiento registrado automáticamente: ${registro.tipo} de ${registro.monto.toFixed(2)} en ${registro.categoria}.`,
      ];
    } else {
      respuesta.observaciones = [...respuesta.observaciones, registro.mensaje];
    }
  }
  return respuesta;
}

module.exports = { generarRespuesta };
