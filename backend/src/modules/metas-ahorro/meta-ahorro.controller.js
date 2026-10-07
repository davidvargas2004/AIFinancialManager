const { createCrudController } = require("../../utils/crud-resource");
const service = require("./meta-ahorro.service");

module.exports = createCrudController(service, "Meta de ahorro");
