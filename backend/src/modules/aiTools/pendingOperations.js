const crypto = require("node:crypto");

const PENDING_TTL_MS = 5 * 60 * 1000;
const pendingOperations = new Map();

function purgeExpired(now = Date.now()) {
  for (const [token, operation] of pendingOperations) {
    if (operation.expiresAt <= now || operation.used) pendingOperations.delete(token);
  }
}

function createPendingOperation(usuarioId, operation, now = Date.now()) {
  purgeExpired(now);
  const token = crypto.randomBytes(32).toString("base64url");
  pendingOperations.set(token, {
    usuarioId,
    operation: { ...operation },
    expiresAt: now + PENDING_TTL_MS,
    used: false,
  });
  return token;
}

function consumePendingOperation(usuarioId, token, now = Date.now()) {
  purgeExpired(now);
  const pending = pendingOperations.get(token);
  if (!pending || pending.usuarioId !== usuarioId || pending.expiresAt <= now || pending.used) return null;
  pending.used = true;
  pendingOperations.delete(token);
  return { ...pending.operation };
}

function clearPendingOperations() {
  pendingOperations.clear();
}

module.exports = {
  PENDING_TTL_MS,
  createPendingOperation,
  consumePendingOperation,
  clearPendingOperations,
};
