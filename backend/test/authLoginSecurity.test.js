const test = require("node:test");
const assert = require("node:assert/strict");

const prisma = require("../src/config/prisma");
const supabase = require("../src/config/supabase");
const authService = require("../src/auth/authService");
const requireUser = require("../src/middlewares/auth.middleware");

function mockResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(value) {
      this.body = value;
      return this;
    },
  };
}

test("rechaza credenciales vacías antes de contactar Supabase", async () => {
  const original = supabase.auth.signInWithPassword;
  let calls = 0;
  supabase.auth.signInWithPassword = async () => {
    calls += 1;
    return {};
  };

  try {
    await assert.rejects(
      authService.loginUser({ email: "", password: "" }),
      (error) => error.statusCode === 400 && /obligatorios/.test(error.message),
    );
    assert.equal(calls, 0);
  } finally {
    supabase.auth.signInWithPassword = original;
  }
});

test("los intentos de credenciales inválidas no enumeran usuarios", async () => {
  const original = supabase.auth.signInWithPassword;
  const attempts = [
    ["no-existe@example.com", "incorrecta"],
    ["usuario@example.com", "incorrecta"],
    ["usuario@example.com", ""],
  ];
  supabase.auth.signInWithPassword = async () => ({
    data: { user: null, session: null },
    error: { message: "Invalid login credentials", status: 400 },
  });

  try {
    for (const [email, password] of attempts.slice(0, 2)) {
      await assert.rejects(
        authService.loginUser({ email, password }),
        (error) => error.statusCode === 401 && error.message === "Correo o contraseña incorrectos",
      );
    }
  } finally {
    supabase.auth.signInWithPassword = original;
  }
});

test("normaliza el correo sin permitir alterar la identidad del usuario", async () => {
  const originalLogin = supabase.auth.signInWithPassword;
  const originalTransaction = prisma.$transaction;
  let received;
  const user = {
    id: "33333333-3333-4333-8333-333333333333",
    email: "usuario@example.com",
    user_metadata: {},
  };

  supabase.auth.signInWithPassword = async (credentials) => {
    received = credentials;
    return { data: { user, session: { access_token: "session-test" } }, error: null };
  };
  prisma.$transaction = async (callback) => callback({
    usuario: {
      upsert: async () => ({ id: user.id, email: user.email, nombre: null }),
    },
    categoria: {
      upsert: async ({ create }) => create,
    },
  });

  try {
    const result = await authService.loginUser({
      email: "  Usuario@Example.COM ",
      password: "password-seguro",
    });
    assert.equal(received.email, "usuario@example.com");
    assert.equal(result.usuario.id, user.id);
  } finally {
    supabase.auth.signInWithPassword = originalLogin;
    prisma.$transaction = originalTransaction;
  }
});

test("rechaza tokens ausentes, falsos y expirados sin consultar el perfil", async () => {
  const original = supabase.auth.getUser;
  let calls = 0;
  supabase.auth.getUser = async () => {
    calls += 1;
    return { data: { user: null }, error: new Error("invalid token") };
  };

  try {
    for (const authorization of [undefined, "", "Basic abc", "Bearer", "Bearer token-falso"]) {
      const req = { get: () => authorization };
      const res = mockResponse();
      let nextError;
      await requireUser(req, res, (error) => { nextError = error; });

      if (authorization === "Bearer token-falso") {
        assert.equal(res.statusCode, 200);
        assert.equal(nextError.statusCode, 401);
      } else {
        assert.equal(res.statusCode, 401);
        assert.equal(res.body.message, "Se requiere un token Supabase Bearer");
      }
    }
    assert.equal(calls, 1);
  } finally {
    supabase.auth.getUser = original;
  }
});

test("un token válido solo puede asignar el usuario devuelto por Supabase", async () => {
  const originalGetUser = supabase.auth.getUser;
  const originalTransaction = prisma.$transaction;
  const user = {
    id: "44444444-4444-4444-8444-444444444444",
    email: "token@example.com",
    user_metadata: {},
  };
  supabase.auth.getUser = async (token) => {
    assert.equal(token, "token-valido");
    return { data: { user }, error: null };
  };
  prisma.$transaction = async (callback) => callback({
    usuario: { upsert: async () => ({ id: user.id, email: user.email, nombre: null }) },
    categoria: { upsert: async ({ create }) => create },
  });

  try {
    const req = { get: () => "Bearer token-valido" };
    const res = mockResponse();
    let nextCalled = false;
    await requireUser(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, true);
    assert.equal(req.usuarioId, user.id);
    assert.equal(req.usuarioId, "44444444-4444-4444-8444-444444444444");
  } finally {
    supabase.auth.getUser = originalGetUser;
    prisma.$transaction = originalTransaction;
  }
});
