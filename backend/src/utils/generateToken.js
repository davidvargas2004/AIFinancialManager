 const jwt = require('jsonwebtoken');

function generateToken(usuarioId) {
  const secret = process.env.JWT_SECRET || process.env.JWT_SECRET0;
  if (!secret) {
    throw new Error("Falta la variable de entorno JWT_SECRET");
  }

  return jwt.sign({ usuarioId }, secret, { expiresIn: '1d' });
}

module.exports = generateToken;