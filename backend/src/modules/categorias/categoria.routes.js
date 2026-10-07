const { createCrudRouter } = require("../../utils/crud-resource");
const controller = require("./categoria.controller");

module.exports = createCrudRouter(controller);
