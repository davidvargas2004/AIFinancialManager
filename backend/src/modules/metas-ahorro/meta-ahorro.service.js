const { createCrudService } = require("../../utils/crud-resource");

module.exports = createCrudService(
  "metaAhorro",
  ["nombre", "descripcion", "montoObjetivo", "fechaObjetivo", "estado"],
  { creadoEn: "desc" },
);
