const { createCrudRouter } = require("../../utils/crud-resource");
const controller = require("./gasto.controller");

module.exports = createCrudRouter(controller);
