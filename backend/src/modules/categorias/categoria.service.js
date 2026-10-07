const { createCrudService } = require("../../utils/crud-resource");

module.exports = createCrudService("categoria", ["nombre", "color"], { nombre: "asc" });
