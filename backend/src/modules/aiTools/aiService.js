const prisma = require("../../config/prisma");
const { consultarGemini } = require("../../services/aiServices");

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

  const ocurridoEn = operacion.ocurridoEn ? new Date(`${operacion.ocurridoEn}T00:00:00.000Z`) : new Date();
  if (Number.isNaN(ocurridoEn.getTime())) {
    return { estado: "pendiente", mensaje: "No registré el movimiento porque la fecha no es válida." };
  }

  const model = operacion.tipo === "ingreso" ? prisma.ingreso : prisma.gasto;
  const movimiento = await model.create({
    data: {
      usuarioId,
      categoriaId: categoria.id,
      monto: operacion.monto,
      descripcion: operacion.descripcion.slice(0, 500),
      ocurridoEn,
    },
    include: { categoria: { select: { nombre: true } } },
  });

  return {
    estado: "registrado",
    tipo: operacion.tipo,
    id: movimiento.id,
    monto: Number(movimiento.monto),
    descripcion: movimiento.descripcion,
    categoria: movimiento.categoria.nombre,
    ocurridoEn: movimiento.ocurridoEn.toISOString().slice(0, 10),
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

  const respuesta = await consultarGemini({ pregunta, contexto });
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
