const express = require("express");
const cors = require("cors");
const errorMiddleware = require("./middlewares/error.middleware");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "API de AI Financial Manager funcionando" });
});

app.use(errorMiddleware);

module.exports = app;