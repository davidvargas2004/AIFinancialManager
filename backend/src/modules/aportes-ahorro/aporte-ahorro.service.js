const { createCrudService } = require("../../utils/crud-resource");

module.exports = createCrudService(
  "aporteAhorro",
  ["metaId", "monto", "descripcion", "ocurridoEn"],
  { ocurridoEn: "desc" },
);
