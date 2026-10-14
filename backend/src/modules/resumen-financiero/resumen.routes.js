const express = require("express");
const controller = require("./resumen.controller");

const router = express.Router();

router.get("/", controller.get);

module.exports = router;
