// lib/session.ts
import { SessionOptions } from "iron-session";

// NOTA: Asegúrate de guardar esta clave en tus variables de entorno (.env) en un futuro.
// Debe ser una cadena de al menos 32 caracteres.
export const sessionOptions: SessionOptions = {
  password: process.env.SECRET_COOKIE_PASSWORD || "un-password-super-secreto-de-al-menos-32-caracteres-de-largo",
  cookieName: "prealca-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: 'lax',
  },
};