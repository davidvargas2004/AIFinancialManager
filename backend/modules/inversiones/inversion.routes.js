const { createCrudRouter } = require("../../src/utils/crud-resource");
const controller = require("./inversion.controller");

module.exports = createCrudRouter(controller);
