const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());


app.get("/", (req, res) => {
  res.send("Hello from the backend! api funcionando con express");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server corriend con exito :) ${PORT}`);
});

