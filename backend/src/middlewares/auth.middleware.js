const authService = require("../auth/authService");

async function requireUser(req, res, next) {
  const authorization = req.get("authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return res.status(401).json({
      message: "Se requiere un token Supabase Bearer",
    });
  }

  try {
    req.usuario = await authService.obtenerUsuarioPorToken(match[1]);
    req.usuarioId = req.usuario.id;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = requireUser;
