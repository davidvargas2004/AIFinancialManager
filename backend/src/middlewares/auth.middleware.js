const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requireUser(req, res, next) {
  const usuarioId = req.usuarioId || req.get("x-user-id");

  if (!usuarioId || !UUID_PATTERN.test(usuarioId)) {
    return res.status(401).json({
      message: "Se requiere un usuario autenticado mediante el encabezado X-User-Id",
    });
  }

  req.usuarioId = usuarioId;
  next();
}

module.exports = requireUser;
