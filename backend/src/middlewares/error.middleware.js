function errorMiddleware(error, req, res, next) {
  console.error(error);

  res.status(error.statusCode || 500).json({
    error: "Error interno del servidor contacta a soporte o espera un momento",
  });
}

module.exports = errorMiddleware;