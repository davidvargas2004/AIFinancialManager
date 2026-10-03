require("dotenv").config();

const requiredVariables = ["DATABASE_URL", "DIRECT_URL"];

for (const variable of requiredVariables) {
  if (!process.env[variable]) {
    throw new Error(`Falta la variable de entorno requerida: ${variable}`);
  }
}

module.exports = {
  port: Number(process.env.PORT || 4000),
};