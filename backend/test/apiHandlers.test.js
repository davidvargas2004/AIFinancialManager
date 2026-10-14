const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const handler = require("../../api/handler");

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(handler);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      const request = http.request({
        hostname: "127.0.0.1",
        port,
        path,
        method: options.method || "GET",
        headers: options.headers,
      }, (response) => {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => { body += chunk; });
        response.on("end", () => {
          server.close(() => resolve({
            statusCode: response.statusCode,
            body,
          }));
        });
      });
      request.on("error", (error) => server.close(() => reject(error)));
      request.end(options.body);
    });
  });
}

test("el handler serverless expone health sin autenticación", async () => {
  const response = await request("/api/health");

  assert.equal(response.statusCode, 200);
  assert.deepEqual(JSON.parse(response.body), {
    ok: true,
    service: "ai-financial-manager-api",
  });
});

test("las rutas de movimientos exigen Bearer token", async () => {
  const response = await request("/api/movimientos");

  assert.equal(response.statusCode, 401);
  assert.match(response.body, /token Supabase Bearer/);
});

test("la ruta de autenticación llega a Express en lugar de devolver 404 de Vercel", async () => {
  const response = await request("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({}),
  });

  assert.notEqual(response.statusCode, 404);
  assert.ok([400, 401].includes(response.statusCode));
});
