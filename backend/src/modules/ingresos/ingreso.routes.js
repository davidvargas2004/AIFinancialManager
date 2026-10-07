const { createCrudRouter } = require("../../utils/crud-resource");
const controller = require("./ingreso.controller");

module.exports = createCrudRouter(controller);
