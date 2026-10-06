const { createCrudController } = require("../../src/utils/crud-resource");
const service = require("./gasto.service");

module.exports = createCrudController(service, "Gasto");
