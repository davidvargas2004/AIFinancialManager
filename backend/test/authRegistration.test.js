const test = require("node:test");
const assert = require("node:assert/strict");

const prisma = require("../src/config/prisma");
const supabase = require("../src/config/supabase");
const authService = require("../src/auth/authService");

test("el registro crea el perfil y las categorías con el UUID de Supabase", async () => {
  const originalSignUp = supabase.auth.signUp;
  const originalTransaction = prisma.$transaction;
  const calls = [];
  const user = {
    id: "11111111-1111-4111-8111-111111111111",
    email: "nuevo@example.com",
    user_metadata: { nombre: "Nuevo usuario" },
  };

  supabase.auth.signUp = async () => ({
    data: { user, session: { access_token: "token-prueba" } },
    error: null,
  });
  prisma.$transaction = async (callback) => callback({
    usuario: {
      upsert: async (query) => {
        calls.push({ model: "usuario", query });
        return { id: user.id, email: user.email, nombre: "Nuevo usuario" };
      },
    },
    categoria: {
      upsert: async (query) => {
        calls.push({ model: "categoria", query });
        return query.create;
      },
    },
  });

  try {
    const result = await authService.registerUser({
      email: user.email,
      password: "password-seguro",
      nombre: "Nuevo usuario",
    });

    assert.equal(result.usuario.id, user.id);
    assert.equal(calls[0].query.create.id, user.id);
    assert.equal(calls.filter(({ model }) => model === "categoria").length, 16);
    assert.ok(calls.every(({ query }) => !query.create || query.create.usuarioId === user.id || query.create.id === user.id));
  } finally {
    supabase.auth.signUp = originalSignUp;
    prisma.$transaction = originalTransaction;
  }
});

test("transforma P2003 en un error explícito de sincronización Supabase-PostgreSQL", async () => {
  const error = Object.assign(new Error("foreign key"), { code: "P2003" });
  const translated = authService.translateProfileError(error);

  assert.equal(translated.statusCode, 503);
  assert.match(translated.message, /Supabase y DATABASE_URL/);
});

test("el registro no oculta una falla de FK del perfil", async () => {
  const originalSignUp = supabase.auth.signUp;
  const originalTransaction = prisma.$transaction;
  const error = Object.assign(new Error("foreign key"), { code: "P2003" });

  supabase.auth.signUp = async () => ({
    data: {
      user: {
        id: "22222222-2222-4222-8222-222222222222",
        email: "fk@example.com",
        user_metadata: {},
      },
      session: null,
    },
    error: null,
  });
  prisma.$transaction = async () => {
    throw error;
  };

  try {
    await assert.rejects(
      authService.registerUser({ email: "fk@example.com", password: "password-seguro" }),
      (failure) => failure.statusCode === 503 && /no está sincronizada/.test(failure.message),
    );
  } finally {
    supabase.auth.signUp = originalSignUp;
    prisma.$transaction = originalTransaction;
  }
});
