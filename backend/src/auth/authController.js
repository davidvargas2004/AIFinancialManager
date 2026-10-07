const service = require("./authService");

async function register(req, res, next) {
  try {
    res.status(201).json(await service.registerUser(req.body));
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    res.json(await service.loginUser(req.body));
  } catch (error) {
    next(error);
  }
}

module.exports = { register, login };
