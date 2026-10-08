const ingresoService = require("../ingresos/ingreso.service");
const gastoService = require("../gastos/gasto.service");

const services = {
  ingreso: ingresoService,
  gasto: gastoService,
};

function createServiceError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function getService(tipo) {
  const service = services[tipo];
  if (!service) {
    throw createServiceError("El tipo de movimiento debe ser ingreso o gasto");
  }
  return service;
}

function normalizeMovement(movement, tipo) {
  return {
    ...movement,
    tipo,
    fecha: movement.ocurridoEn,
  };
}

function buildDateFilter({ desde, hasta } = {}) {
  if (!desde && !hasta) return {};

  const ocurridoEn = {};
  if (desde) {
    const fechaDesde = new Date(desde);
    if (Number.isNaN(fechaDesde.getTime())) {
      throw createServiceError("El parámetro desde debe ser una fecha válida");
    }
    ocurridoEn.gte = fechaDesde;
  }
  if (hasta) {
    const fechaHasta = new Date(hasta);
    if (Number.isNaN(fechaHasta.getTime())) {
      throw createServiceError("El parámetro hasta debe ser una fecha válida");
    }
    ocurridoEn.lte = fechaHasta;
  }
  return { ocurridoEn };
}

async function listarMovimientos(usuarioId, filters = {}) {
  const dateFilter = buildDateFilter(filters);
  const tipos = filters.tipo ? [filters.tipo] : ["ingreso", "gasto"];

  tipos.forEach(getService);

  const movimientos = await Promise.all(
    tipos.map(async (tipo) => {
      const service = getService(tipo);
      const items = service.listarIngresos
        ? await service.listarIngresos(usuarioId, dateFilter)
        : await service.listar(usuarioId, dateFilter);
      return items.map((item) => normalizeMovement(item, tipo));
    }),
  );

  return movimientos
    .flat()
    .sort((a, b) => new Date(b.ocurridoEn) - new Date(a.ocurridoEn));
}

async function obtenerMovimiento(id, usuarioId, tipo) {
  if (tipo) {
    const item = await getService(tipo).obtenerIngreso
      ? getService(tipo).obtenerIngreso(id, usuarioId)
      : getService(tipo).obtener(id, usuarioId);
    return item ? normalizeMovement(item, tipo) : null;
  }

  const [ingreso, gasto] = await Promise.all([
    ingresoService.obtenerIngreso(id, usuarioId),
    gastoService.obtener(id, usuarioId),
  ]);
  if (ingreso) return normalizeMovement(ingreso, "ingreso");
  return gasto ? normalizeMovement(gasto, "gasto") : null;
}

async function crearMovimiento(usuarioId, data) {
  const { tipo } = data || {};
  const service = getService(tipo);
  const item = service.crearIngreso
    ? await service.crearIngreso(usuarioId, data)
    : await service.crear(usuarioId, data);
  return normalizeMovement(item, tipo);
}

async function actualizarMovimiento(id, usuarioId, data) {
  const { tipo } = data || {};
  const service = getService(tipo);
  const result = service.actualizarIngreso
    ? await service.actualizarIngreso(id, usuarioId, data)
    : await service.actualizar(id, usuarioId, data);
  if (!result.count) return null;
  return obtenerMovimiento(id, usuarioId, tipo);
}

async function eliminarMovimiento(id, usuarioId, tipo) {
  if (tipo) {
    const service = getService(tipo);
    const result = service.eliminarIngreso
      ? await service.eliminarIngreso(id, usuarioId)
      : await service.eliminar(id, usuarioId);
    return result.count > 0;
  }

  const ingreso = await ingresoService.eliminarIngreso(id, usuarioId);
  if (ingreso.count > 0) return true;
  const gasto = await gastoService.eliminar(id, usuarioId);
  return gasto.count > 0;
}

module.exports = {
  listarMovimientos,
  obtenerMovimiento,
  crearMovimiento,
  actualizarMovimiento,
  eliminarMovimiento,
};
