const service = require("./aiService");

async function preguntar(req, res, next) {
  try {
    const pregunta = typeof req.body?.pregunta === "string"
      ? req.body.pregunta.trim()
      : "";

    if (!pregunta) {
      return res.status(400).json({ message: "La pregunta es obligatoria" });
    }

    if (pregunta.length >= 2000) {
      return res.status(400).json({ message: "La pregunta no puede superar 2000 caracteres" });
    }

    const respuesta = await service.generarRespuesta(req.usuarioId, pregunta);
    return res.json({ respuesta });
  } catch (error) {
    return next(error);
  }
}

module.exports = { preguntar };
