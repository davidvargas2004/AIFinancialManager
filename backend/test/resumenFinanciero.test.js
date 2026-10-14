const test = require("node:test");
const assert = require("node:assert/strict");

const prisma = require("../src/config/prisma");
const { obtenerResumen } = require("../src/modules/resumen-financiero/resumen.service");

test("calcula el resumen financiero una sola vez por fuente y no duplica aportes", async () => {
  const models = {
    ingreso: prisma.ingreso.aggregate,
    gasto: prisma.gasto.aggregate,
    aporteAhorro: prisma.aporteAhorro.aggregate,
    inversion: prisma.inversion.aggregate,
  };
  prisma.ingreso.aggregate = async () => ({ _sum: { monto: 5000 } });
  prisma.gasto.aggregate = async () => ({ _sum: { monto: 1200 } });
  prisma.aporteAhorro.aggregate = async () => ({ _sum: { monto: 800 } });
  prisma.inversion.aggregate = async () => ({ _sum: { montoInvertido: 1000, valorActual: 1100 } });

  try {
    assert.deepEqual(await obtenerResumen("usuario-1"), {
      ingresos: 5000,
      gastos: 1200,
      balance: 3800,
      aportes: 800,
      capitalInvertido: 1000,
      valorInversiones: 1100,
      disponible: 2000,
      capitalReal: 3900,
    });
  } finally {
    prisma.ingreso.aggregate = models.ingreso;
    prisma.gasto.aggregate = models.gasto;
    prisma.aporteAhorro.aggregate = models.aporteAhorro;
    prisma.inversion.aggregate = models.inversion;
  }
});
