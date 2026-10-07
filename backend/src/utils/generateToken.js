 const jwt = require('jsonwebtoken');

 function generateToken(usuarioId) {
    return jwt.sign({usuarioId}, process.env.JWT_SECRET, { expiresIn: '1d' });
 }
 
 module.exports = generateToken;