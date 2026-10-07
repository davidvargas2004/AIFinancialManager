const { createCrudController } = require("../../utils/crud-resource");
const service = require("./inversion.service");

module.exports = createCrudController(service, "Inversión");
