const app = require("../backend/src/app");

function handler(req, res) {
  if (!req.url.startsWith("/api")) {
    req.url = `/api${req.url.startsWith("/") ? "" : "/"}${req.url}`;
  }
  return app(req, res);
}

module.exports = handler;
