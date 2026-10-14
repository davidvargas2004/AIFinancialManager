const test = require("node:test");
const assert = require("node:assert/strict");

const prisma = require("../src/config/prisma");
const movementService = require("../src/modules/movimientos/movementService");

function movement(id, tipo, monto, ocurridoEn) {
  return {
    id,
    monto,
    ocurridoEn,
    descripcion: id,
    categoria: { nombre: tipo === "ingreso" ? "Trabajo" : "Hogar" },
  };
}

function installPrismaMocks({ ingresos, gastos }) {
  const original = {
    ingreso: {
      findMany: prisma.ingreso.findMany,
      count: prisma.ingreso.count,
      aggregate: prisma.ingreso.aggregate,
    },
    gasto: {
      findMany: prisma.gasto.findMany,
      count: prisma.gasto.count,
      aggregate: prisma.gasto.aggregate,
    },
  };
  const calls = { ingreso: [], gasto: [] };

  for (const [tipo, items] of [["ingreso", ingresos], ["gasto", gastos]]) {
    prisma[tipo].findMany = async (query) => {
      calls[tipo].push(query);
      const skip = query.skip || 0;
      const take = query.take || items.length;
      return items.slice(skip, take);
    };
    prisma[tipo].count = async () => items.length;
    prisma[tipo].aggregate = async () => ({
      _sum: { monto: items.reduce((total, item) => total + item.monto, 0) },
    });
  }

  return {
    calls,
    restore() {
      for (const tipo of ["ingreso", "gasto"]) {
        prisma[tipo].findMany = original[tipo].findMany;
        prisma[tipo].count = original[tipo].count;
        prisma[tipo].aggregate = original[tipo].aggregate;
      }
    },
  };
}

test("devuelve como máximo cinco movimientos y no repite consultas por página", async () => {
  const mocks = installPrismaMocks({
    ingresos: [
      movement("i1", "ingreso", 100, "2026-10-14T12:00:00.000Z"),
      movement("i2", "ingreso", 200, "2026-10-13T12:00:00.000Z"),
      movement("i3", "ingreso", 300, "2026-10-12T12:00:00.000Z"),
      movement("i4", "ingreso", 400, "2026-10-11T12:00:00.000Z"),
    ],
    gastos: [
      movement("g1", "gasto", 50, "2026-10-10T12:00:00.000Z"),
      movement("g2", "gasto", 60, "2026-10-09T12:00:00.000Z"),
      movement("g3", "gasto", 70, "2026-10-08T12:00:00.000Z"),
    ],
  });

  try {
    const result = await movementService.listarMovimientos("usuario-1", {
      page: 1,
      pageSize: 500,
    });

    assert.equal(result.items.length, 5);
    assert.equal(result.pageSize, 5);
    assert.equal(result.total, 7);
    assert.equal(result.totalPages, 2);
    assert.equal(result.hasNext, true);
    assert.equal(result.hasPrevious, false);
    assert.equal(mocks.calls.ingreso.length, 1);
    assert.equal(mocks.calls.gasto.length, 1);
    assert.equal(mocks.calls.ingreso[0].take, 5);
    assert.equal(mocks.calls.gasto[0].take, 5);
    assert.deepEqual(mocks.calls.ingreso[0].where, { usuarioId: "usuario-1" });
    assert.deepEqual(mocks.calls.gasto[0].where, { usuarioId: "usuario-1" });
    assert.deepEqual(mocks.calls.ingreso[0].orderBy, [{ ocurridoEn: "desc" }, { id: "desc" }]);
    assert.deepEqual(mocks.calls.ingreso[0].include, { categoria: true });
  } finally {
    mocks.restore();
  }
});

test("la segunda página no repite la primera y mantiene cinco como máximo", async () => {
  const mocks = installPrismaMocks({
    ingresos: [
      movement("i1", "ingreso", 100, "2026-10-14T12:00:00.000Z"),
      movement("i2", "ingreso", 200, "2026-10-12T12:00:00.000Z"),
      movement("i3", "ingreso", 300, "2026-10-10T12:00:00.000Z"),
    ],
    gastos: [
      movement("g1", "gasto", 50, "2026-10-13T12:00:00.000Z"),
      movement("g2", "gasto", 60, "2026-10-11T12:00:00.000Z"),
      movement("g3", "gasto", 70, "2026-10-09T12:00:00.000Z"),
    ],
  });

  try {
    const result = await movementService.listarMovimientos("usuario-1", {
      page: 2,
      pageSize: 5,
    });

    assert.deepEqual(result.items.map(({ id }) => id), ["g3"]);
    assert.equal(result.page, 2);
    assert.equal(result.hasNext, false);
    assert.equal(result.hasPrevious, true);
    assert.equal(mocks.calls.ingreso[0].take, 10);
    assert.equal(mocks.calls.gasto[0].take, 10);
  } finally {
    mocks.restore();
  }
});

test("el filtro por tipo consulta únicamente el modelo solicitado", async () => {
  const mocks = installPrismaMocks({
    ingresos: [
      movement("i1", "ingreso", 100, "2026-10-14T12:00:00.000Z"),
      movement("i2", "ingreso", 200, "2026-10-13T12:00:00.000Z"),
    ],
    gastos: [movement("g1", "gasto", 50, "2026-10-12T12:00:00.000Z")],
  });

  try {
    const result = await movementService.listarMovimientos("usuario-1", {
      tipo: "ingreso",
      page: 1,
      pageSize: 5,
    });

    assert.deepEqual(result.items.map(({ id }) => id), ["i1", "i2"]);
    assert.equal(result.total, 2);
    assert.equal(mocks.calls.ingreso.length, 1);
    assert.equal(mocks.calls.gasto.length, 0);
  } finally {
    mocks.restore();
  }
});
