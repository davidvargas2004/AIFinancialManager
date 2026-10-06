const { createCrudService } = require("../../src/utils/crud-resource");

module.exports = createCrudService(
  "aporteAhorro",
  ["metaId", "monto", "descripcion", "ocurridoEn"],
  { ocurridoEn: "desc" },
);
