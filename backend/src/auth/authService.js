const prisma = require("../config/prisma");
const supabase = require("../config/supabase");

const LINKED_USER_ID = "ff93cf51-fa57-47b0-8948-121ff98298a6";
const DEFAULT_CATEGORIES = [
  { nombre: "Vivienda", color: "#5c8d9e" },
  { nombre: "Alimentación", color: "#ef8865" },
  { nombre: "Transporte", color: "#b98a44" },
  { nombre: "Salud", color: "#d15f87" },
  { nombre: "Educación", color: "#8f6bb3" },
  { nombre: "Entretenimiento", color: "#8fbd4d" },
  { nombre: "Compras", color: "#ef8865" },
  { nombre: "Deudas", color: "#c56b4c" },
  { nombre: "Ahorro e Inversión", color: "#244b35" },
  { nombre: "Otros", color: "#8a9490" },
  { nombre: "Salario/Nómina", color: "#8fbd4d" },
  { nombre: "Freelance/Honorarios", color: "#5c8d9e" },
  { nombre: "Inversiones", color: "#b98a44" },
  { nombre: "Negocios", color: "#8f6bb3" },
  { nombre: "Regalos", color: "#d15f87" },
  { nombre: "Otros ingresos", color: "#8a9490" },
];

function authError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function ensureProfile(user) {
  if (!user?.id || !user.email) {
    throw authError("Supabase no devolvió un usuario válido", 502);
  }

  return prisma.$transaction(async (transaction) => {
    const perfil = await transaction.usuario.upsert({
      where: { id: user.id },
      update: {
        email: user.email,
        nombre: user.user_metadata?.nombre || undefined,
      },
      create: {
        id: user.id,
        email: user.email,
        nombre: user.user_metadata?.nombre || null,
      },
    });

    await Promise.all(DEFAULT_CATEGORIES.map((category) => transaction.categoria.upsert({
      where: {
        usuarioId_nombre: {
          usuarioId: perfil.id,
          nombre: category.nombre,
        },
      },
      update: { color: category.color },
      create: {
        usuarioId: perfil.id,
        nombre: category.nombre,
        color: category.color,
      },
    })));

    return perfil;
  });
}

async function registerUser({ email, password, nombre }) {
  if (!email || !password) throw authError("El correo y la contraseña son obligatorios");
  if (password.length < 6) throw authError("La contraseña debe tener al menos 6 caracteres");

  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: { data: { nombre: nombre?.trim() || null } },
  });

  if (error) throw authError(error.message, error.status || 400);
  if (!data.user) throw authError("Supabase no pudo crear el usuario", 502);

  const perfil = await ensureProfile(data.user);
  return {
    usuario: { id: perfil.id, email: perfil.email, nombre: perfil.nombre },
    session: data.session,
    requiresEmailConfirmation: !data.session,
  };
}

async function loginUser({ email, password }) {
  if (!email || !password) throw authError("El correo y la contraseña son obligatorios");

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) throw authError("Correo o contraseña incorrectos", 401);

  const perfil = await ensureProfile(data.user);
  return {
    usuario: { id: perfil.id, email: perfil.email, nombre: perfil.nombre },
    session: data.session,
  };
}

async function obtenerUsuarioPorToken(token) {
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw authError("Token de autenticación inválido o expirado", 401);

  const perfil = await ensureProfile(data.user);
  return { id: perfil.id, email: perfil.email, nombre: perfil.nombre };
}

module.exports = {
  LINKED_USER_ID,
  registerUser,
  loginUser,
  obtenerUsuarioPorToken,
};
