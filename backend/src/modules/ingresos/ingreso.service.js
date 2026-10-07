const { createCrudService } = require("../../utils/crud-resource");

const service = createCrudService("ingreso", ["categoriaId", "monto", "descripcion", "ocurridoEn"], {
  ocurridoEn: "desc",
});

module.exports = {
  crearIngreso: service.crear,
  listarIngresos: service.listar,
  obtenerIngreso: service.obtener,
  actualizarIngreso: service.actualizar,
  eliminarIngreso: service.eliminar,
};
