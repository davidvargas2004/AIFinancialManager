const { createCrudService } = require("../../utils/crud-resource");

module.exports = createCrudService(
  "inversion",
  ["nombre", "tipo", "montoInvertido", "valorActual", "estado", "fechaInicio", "fechaCierre", "descripcion"],
  { fechaInicio: "desc" },
);
