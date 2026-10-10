const express = require("express");
const controller = require("./aiController");

const router = express.Router();

router.post("/ask", controller.preguntar);

module.exports = router;
