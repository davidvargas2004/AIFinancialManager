const { createCrudService } = require("../../src/utils/crud-resource");

module.exports = createCrudService("categoria", ["nombre", "color"], { nombre: "asc" });
