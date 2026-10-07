const { createCrudRouter } = require("../../utils/crud-resource");
const controller = require("./aporte-ahorro.controller");

module.exports = createCrudRouter(controller);
