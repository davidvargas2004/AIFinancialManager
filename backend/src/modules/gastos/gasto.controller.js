const { createCrudController } = require("../../utils/crud-resource");
const service = require("./gasto.service");

module.exports = createCrudController(service, "Gasto");
