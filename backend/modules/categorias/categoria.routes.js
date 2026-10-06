const { createCrudRouter } = require("../../src/utils/crud-resource");
const controller = require("./categoria.controller");

module.exports = createCrudRouter(controller);
