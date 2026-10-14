const service = require("./aiService");
const { validateQuestion } = require("./aiValidation");

async function preguntar(req, res, next) {
  try {
    const validacion = validateQuestion(req.body?.pregunta);
    if (!validacion.valid) {
      return res.status(400).json({ message: validacion.message });
    }

    const respuesta = await service.generarRespuesta(
      req.usuarioId,
      validacion.pregunta,
      { confirmarOperacion: req.body?.confirmarOperacion || null },
    );
    return res.json({
      respuesta: typeof respuesta === "string"
        ? { saludo: "Hola, gracias por consultar a tu asesor financiero.", resumen: respuesta, observaciones: [], recomendacion: "Revisa tus movimientos y define tu próximo objetivo financiero.", operacion: { registrar: false } }
        : respuesta,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { preguntar };
