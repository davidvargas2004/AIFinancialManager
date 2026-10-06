const { createCrudService } = require("../../src/utils/crud-resource");

module.exports = createCrudService("gasto", ["categoriaId", "monto", "descripcion", "ocurridoEn"], {
  ocurridoEn: "desc",
});
