const { createCrudController } = require("../../src/utils/crud-resource");
const service = require("./inversion.service");

module.exports = createCrudController(service, "Inversión");
