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

function construirContexto({ categorias, ingresos, gastos, metasAhorro, aportesAhorro, inversiones }) {
  const nombresMetas = new Map(metasAhorro.map((meta) => [meta.id, meta.nombre]));
  const movimiento = (item) => {
    const dato = serialize(item);
    return {
      monto: Number(dato.monto || 0),
      descripcion: dato.descripcion || "",
      fecha: dato.ocurridoEn,
      categoria: dato.categoria?.nombre || "",
    };
  };

  return {
    categorias: categorias.map(({ nombre }) => ({ nombre })),
    ingresos: ingresos.map(movimiento),
    gastos: gastos.map(movimiento),
    metasAhorro: metasAhorro.map((meta) => {
      const dato = serialize(meta);
      return {
        nombre: dato.nombre,
        objetivo: Number(dato.montoObjetivo || 0),
        fechaObjetivo: dato.fechaObjetivo,
        estado: dato.estado,
      };
    }),
    aportesAhorro: aportesAhorro.map((aporte) => {
      const dato = serialize(aporte);
      return {
        meta: nombresMetas.get(dato.metaId) || "Meta de ahorro",
        monto: Number(dato.monto || 0),
        descripcion: dato.descripcion || "",
        fecha: dato.ocurridoEn,
      };
    }),
    inversiones: inversiones.map((inversion) => {
      const dato = serialize(inversion);
      return {
        nombre: dato.nombre,
        tipo: dato.tipo,
        capitalInicial: Number(dato.montoInvertido || 0),
        valorActual: Number(dato.valorActual || 0),
        estado: dato.estado,
        fechaInicio: dato.fechaInicio,
      };
    }),
  };
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
  const esGasto = /\b(me gaste|gaste|pague|pague|compre|inverti|gasto|gastado)\b/.test(texto);
  const esIngreso = /\b(recibi|me pagaron|gane|ingreso|cobre|salario|sueldo|trabajo extra)\b/.test(texto);
  if ((!esGasto && !esIngreso) || (esGasto && esIngreso)) return null;

  const monto = extraerMonto(texto);
  if (!Number.isFinite(monto) || monto <= 0) return null;

  const categoriaPreferida = esGasto && /\b(cine|pelicula|peliculas|teatro|concierto|juego)\b/.test(texto)
    ? "Entretenimiento"
    : esIngreso && /\b(salario|sueldo|nomina|trabajo extra)\b/.test(texto)
      ? "Trabajo"
      : "";
  const categoria = categorias.find((item) =>
    normalizarTexto(item.nombre) === normalizarTexto(categoriaPreferida))
    || categorias
      .filter((item) => normalizarTexto(item.nombre).length >= 3)
      .sort((a, b) => normalizarTexto(b.nombre).length - normalizarTexto(a.nombre).length)
      .find((item) => texto.includes(normalizarTexto(item.nombre)));
  if (!categoria) return null;

  const descripcion = texto
    .replace(/\b(me gaste|gaste|pague|compre|inverti|gasto|gastado|recibi|me pagaron|gane|ingreso|cobre|salario|sueldo|trabajo extra)\b/gi, "")
    .replace(/\b\d+(?:[.,]\d+)?\s*millones?\b/gi, "")
    .replace(/\b\d[\d.,]*\b/g, "")
    .replace(/\s+/g, " ")
    .replace(/^\s*(en|por|de)\s+/i, "")
    .trim();

  return {
    registrar: false,
    tipo: esIngreso ? "ingreso" : "gasto",
    monto,
    descripcion: descripcion || (esIngreso ? "Ingreso registrado" : "Gasto registrado"),
    categoria: categoria.nombre,
    ocurridoEn: fechaActual(),
  };
}

function normalizarOperacionSugerida(operacion, categorias) {
  if (!operacion || operacion.registrar || !["ingreso", "gasto"].includes(operacion.tipo)) return null;

  const monto = Number(operacion.monto);
  const categoria = categorias.find((item) =>
    normalizarTexto(item.nombre) === normalizarTexto(operacion.categoria));
  const descripcion = typeof operacion.descripcion === "string" ? operacion.descripcion.trim() : "";
  if (!Number.isFinite(monto) || monto <= 0 || monto > 999999999999 || !categoria || !descripcion) return null;

  return {
    registrar: false,
    tipo: operacion.tipo,
    monto,
    descripcion: descripcion.slice(0, 500),
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
    monto: Number(movimiento.monto),
    descripcion: movimiento.descripcion,
    categoria: movimiento.categoria.nombre,
    ocurridoEn: new Date(movimiento.ocurridoEn).toISOString().slice(0, 10),
  };
}

async function generarRespuesta(usuarioId, pregunta, { confirmarOperacion = null } = {}) {
  const [usuario, categorias, ingresos, gastos, metasAhorro, aportesAhorro, inversiones] = await Promise.all([
    prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true },
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

  const contexto = construirContexto({
    categorias,
    ingresos,
    gastos,
    metasAhorro,
    aportesAhorro,
    inversiones,
  });

  const operacionExplicita = extraerOperacionExplicita(pregunta, categorias);
  if (confirmarOperacion) {
    const operacionConfirmada = operacionExplicita || normalizarOperacionSugerida(confirmarOperacion, categorias);
    const coincide = operacionConfirmada
      && confirmarOperacion.tipo === operacionConfirmada.tipo
      && Number(confirmarOperacion.monto) === operacionConfirmada.monto
      && normalizarTexto(confirmarOperacion.categoria) === normalizarTexto(operacionConfirmada.categoria)
      && normalizarTexto(confirmarOperacion.descripcion) === normalizarTexto(operacionConfirmada.descripcion);
    if (!coincide) {
      return {
        ...crearRespuestaFallback(pregunta, operacionExplicita || {
          tipo: "gasto", monto: 0, descripcion: "", categoria: "", registrar: false,
        }),
        registro: { estado: "pendiente", mensaje: "La confirmación no coincide con una operación explícita válida." },
      };
    }

    const registro = await registrarOperacion(usuarioId, {
      operacion: { ...operacionConfirmada, registrar: true },
    }, categorias);
    return {
      ...crearRespuestaFallback(pregunta, operacionConfirmada),
      registro: { ...registro, id: undefined },
      observaciones: [`Movimiento registrado tras confirmación explícita: ${registro.tipo} de ${registro.monto.toFixed(2)} en ${registro.categoria}.`],
    };
  }

  let respuesta;
  try {
    const resultadoGemini = await consultarGemini({
      pregunta,
      contexto,
    });
    respuesta = resultadoGemini.respuesta;
  } catch (error) {
    if (!operacionExplicita) throw error;
    respuesta = crearRespuestaFallback(pregunta, operacionExplicita);
  }
  const operacionSugerida = operacionExplicita || normalizarOperacionSugerida(respuesta.operacion, categorias);
  if (operacionSugerida) {
    respuesta.operacion = operacionSugerida;
    respuesta.registro = {
      estado: "pendiente",
      tipo: operacionSugerida.tipo,
      monto: operacionSugerida.monto,
      descripcion: operacionSugerida.descripcion,
      categoria: operacionSugerida.categoria,
      mensaje: "Revisa la operación y confírmala para registrarla.",
    };
  }
  return respuesta;
}

module.exports = { generarRespuesta, extraerOperacionExplicita, normalizarOperacionSugerida };
