const prisma = require("../../config/prisma");

async function obtenerResumen(usuarioId) {
  const [ingresos, gastos, aportes, inversiones] = await Promise.all([
    prisma.ingreso.aggregate({ where: { usuarioId }, _sum: { monto: true } }),
    prisma.gasto.aggregate({ where: { usuarioId }, _sum: { monto: true } }),
    prisma.aporteAhorro.aggregate({ where: { usuarioId }, _sum: { monto: true } }),
    prisma.inversion.aggregate({
      where: { usuarioId },
      _sum: { montoInvertido: true, valorActual: true },
    }),
  ]);

  const totalIngresos = Number(ingresos._sum.monto || 0);
  const totalGastos = Number(gastos._sum.monto || 0);
  const totalAportes = Number(aportes._sum.monto || 0);
  const capitalInvertido = Number(inversiones._sum.montoInvertido || 0);
  const valorInversiones = Number(inversiones._sum.valorActual || 0);
  const balance = totalIngresos - totalGastos;
  const disponible = Math.max(balance - totalAportes - capitalInvertido, 0);

  return {
    ingresos: totalIngresos,
    gastos: totalGastos,
    balance,
    aportes: totalAportes,
    capitalInvertido,
    valorInversiones,
    disponible,
    capitalReal: disponible + totalAportes + valorInversiones,
  };
}

module.exports = { obtenerResumen };
