// lib/session.ts
import type { SessionOptions } from "iron-session";

// 1. Define la estructura de tu sesión
export interface SessionData {
  userId: number;
  role: string;
}

// El secreto NUNCA debe estar en el código: se lee de la variable de entorno
// SESSION_SECRET (ver .env.example). iron-session exige mínimo 32 caracteres.
const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  throw new Error(
    "Falta la variable de entorno SESSION_SECRET. Generá una con: node -e \"console.log(require('crypto').randomBytes(32).toString('base64url'))\""
  );
}

if (sessionSecret.length < 32) {
  throw new Error("SESSION_SECRET debe tener al menos 32 caracteres.");
}

export const sessionOptions: SessionOptions = {
  password: sessionSecret,
  cookieName: "prealca-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
  },
};
