require("dotenv").config();

const requiredVariables = ["DATABASE_URL", "DIRECT_URL", "SUPABASE_URL", "SUPABASE_SECRET_KEY"];

for (const variable of requiredVariables) {
  if (!process.env[variable]) {
    throw new Error(`Falta la variable de entorno requerida: ${variable}`);
  }
}

module.exports = {
  port: Number(process.env.PORT || 4000),
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_SECRET_KEY,
};