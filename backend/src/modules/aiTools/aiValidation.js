const MAX_QUESTION_LENGTH = 2000;

function sanitizeQuestion(value) {
  if (typeof value !== "string") return "";

  return value
    .normalize("NFKC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();
}

function validateQuestion(value) {
  const pregunta = sanitizeQuestion(value);

  if (!pregunta) {
    return { valid: false, message: "La pregunta es obligatoria", pregunta };
  }

  if (pregunta.length > MAX_QUESTION_LENGTH) {
    return {
      valid: false,
      message: `La pregunta no puede superar ${MAX_QUESTION_LENGTH} caracteres`,
      pregunta,
    };
  }

  return { valid: true, pregunta };
}

module.exports = { MAX_QUESTION_LENGTH, sanitizeQuestion, validateQuestion };
