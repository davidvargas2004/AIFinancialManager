const { createCrudRouter } = require("../../utils/crud-resource");
const controller = require("./meta-ahorro.controller");

module.exports = createCrudRouter(controller);
