const { createCrudRouter } = require("../../src/utils/crud-resource");
const controller = require("./aporte-ahorro.controller");

module.exports = createCrudRouter(controller);
