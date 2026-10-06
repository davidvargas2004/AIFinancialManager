const { createCrudController } = require("../../src/utils/crud-resource");
const service = require("./ingreso.service");

module.exports = createCrudController({
  listar: service.listarIngresos,
  obtener: service.obtenerIngreso,
  crear: service.crearIngreso,
  actualizar: service.actualizarIngreso,
  eliminar: service.eliminarIngreso,
}, "Ingreso");
