const { createCrudController } = require("../../utils/crud-resource");
const service = require("./categoria.service");

module.exports = createCrudController(service, "Categoría");
