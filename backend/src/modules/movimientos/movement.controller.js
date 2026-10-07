const movementService = require("./movementService");

async function list(req, res, next) {
  try {
    const movimientos = await movementService.listarMovimientos(req.usuarioId, {
      tipo: req.query.tipo,
      desde: req.query.desde,
      hasta: req.query.hasta,
    });
    res.json(movimientos);
  } catch (error) {
    next(error);
  }
}

async function get(req, res, next) {
  try {
    const movimiento = await movementService.obtenerMovimiento(
      req.params.id,
      req.usuarioId,
      req.query.tipo,
    );
    if (!movimiento) return res.status(404).json({ message: "Movimiento no encontrado" });
    res.json(movimiento);
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    res.status(201).json(await movementService.crearMovimiento(req.usuarioId, req.body));
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const movimiento = await movementService.actualizarMovimiento(
      req.params.id,
      req.usuarioId,
      req.body,
    );
    if (!movimiento) return res.status(404).json({ message: "Movimiento no encontrado o no autorizado" });
    res.json(movimiento);
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    const deleted = await movementService.eliminarMovimiento(
      req.params.id,
      req.usuarioId,
      req.query.tipo,
    );
    if (!deleted) return res.status(404).json({ message: "Movimiento no encontrado o no autorizado" });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = { list, get, create, update, remove };
