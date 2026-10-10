const crypto = require("node:crypto");
const env = require("../config/env");

function hasValidApiKey(providedKey) {
  if (!providedKey) return false;

  const provided = Buffer.from(providedKey);
  const expected = Buffer.from(env.apiKey);

  return provided.length === expected.length
    && crypto.timingSafeEqual(provided, expected);
}

function requireApiKey(req, res, next) {
  const apiKey = req.get("x-api-key");

  if (!apiKey) {
    return res.status(401).json({
      message: "Se requiere una clave de API",
    });
  }

  if (!hasValidApiKey(apiKey)) {
    return res.status(403).json({
      message: "Clave de API no autorizada",
    });
  }

  next();
}

module.exports = requireApiKey;
