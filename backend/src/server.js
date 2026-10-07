const env = require("./config/env");
const app = require("./app");
const prisma = require("./config/prisma");

const server = app.listen(env.port, () => {
  console.log(`API escuchando en el puerto ${env.port}`);
});

async function shutdown(signal) {
  console.log(`${signal}: cerrando servidor`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
