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

  return consultarGemini({ pregunta, contexto });
}

module.exports = { generarRespuesta };
