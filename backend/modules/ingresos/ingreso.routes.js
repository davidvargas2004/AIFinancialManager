const express = require("express");
const controller = require("./ingreso.controller");

const router = express.Router();

router.post("/", controller.crearIngreso);
router.get("/", controller.list);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

module.exports = router;    