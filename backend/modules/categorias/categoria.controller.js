const { createCrudController } = require("../../src/utils/crud-resource");
const service = require("./categoria.service");

module.exports = createCrudController(service, "Categoría");
