const service = require("./resumen.service");

async function get(req, res, next) {
  try {
    res.json(await service.obtenerResumen(req.usuarioId));
  } catch (error) {
    next(error);
  }
}

module.exports = { get };
