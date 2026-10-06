const express = require("express");
const cors = require("cors");
const errorMiddleware = require("./middlewares/error.middleware");
const requireUser = require("./middlewares/auth.middleware");
const ingresoRoutes = require("../modules/ingresos/ingreso.routes");
const categoriaRoutes = require("../modules/categorias/categoria.routes");
const gastoRoutes = require("../modules/gastos/gasto.routes");
const metaAhorroRoutes = require("../modules/metas-ahorro/meta-ahorro.routes");
const aporteAhorroRoutes = require("../modules/aportes-ahorro/aporte-ahorro.routes");
const inversionRoutes = require("../modules/inversiones/inversion.routes");
const movementRoutes = require("../modules/movimientos/movement.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "API de AI Financial Manager funcionando estoy listo para trabajar" });
});

app.use("/api/categorias", requireUser, categoriaRoutes);
app.use("/api/ingresos", requireUser, ingresoRoutes);
app.use("/api/gastos", requireUser, gastoRoutes);
app.use("/api/metas-ahorro", requireUser, metaAhorroRoutes);
app.use("/api/aportes-ahorro", requireUser, aporteAhorroRoutes);
app.use("/api/inversiones", requireUser, inversionRoutes);
app.use("/api/movimientos", requireUser, movementRoutes);

app.use(errorMiddleware);

module.exports = app;