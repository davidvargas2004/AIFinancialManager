const { createCrudRouter } = require("../../src/utils/crud-resource");
const controller = require("./meta-ahorro.controller");

module.exports = createCrudRouter(controller);
