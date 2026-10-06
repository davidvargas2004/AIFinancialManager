const { createCrudController } = require("../../src/utils/crud-resource");
const service = require("./aporte-ahorro.service");

module.exports = createCrudController(service, "Aporte de ahorro");
