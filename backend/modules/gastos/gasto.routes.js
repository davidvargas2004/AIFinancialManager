const { createCrudRouter } = require("../../src/utils/crud-resource");
const controller = require("./gasto.controller");

module.exports = createCrudRouter(controller);
