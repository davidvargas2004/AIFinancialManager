const prisma = require("../config/prisma");
const supabase = require("../config/supabase");

const LINKED_USER_ID = "ff93cf51-fa57-47b0-8948-121ff98298a6";

function authError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function ensureProfile(user) {
  if (!user?.id || !user.email) {
    throw authError("Supabase no devolvió un usuario válido", 502);
  }

  return prisma.usuario.upsert({
    where: { id: user.id },
    update: { email: user.email },
    create: {
      id: user.id,
      email: user.email,
      nombre: user.user_metadata?.nombre || null,
    },
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
