// lib/session.ts
import type { SessionOptions } from "iron-session";

// 1. Define la estructura de tu sesión
export interface SessionData {
  userId: number;
  role: string;
}

// El secreto NUNCA debe estar en el código: se lee de la variable de entorno
// SESSION_SECRET (ver .env.example). iron-session exige mínimo 32 caracteres.
export function leerSessionSecret(): string {
  const secreto = process.env.SESSION_SECRET;
  if (!secreto) {
    throw new Error(
      "Falta la variable de entorno SESSION_SECRET. Generá una con: node -e \"console.log(require('crypto').randomBytes(32).toString('base64url'))\""
    );
  }
  if (secreto.length < 32) {
    throw new Error("SESSION_SECRET debe tener al menos 32 caracteres.");
  }
  return secreto;
}

export const sessionOptions: SessionOptions = {
  // Getter a propósito, no un valor: importar este módulo no debe exigir el
  // secreto. `next build` evalúa cada ruta para recolectar page data, y si la
  // validación corría al importar, el build fallaba sin tener las variables de
  // entorno. Un secreto tampoco debería viajar como build-arg ni quedar
  // horneado en una capa de la imagen. Se valida al usarse, ya en runtime, y
  // además al arrancar el servidor (ver server.ts).
  get password(): string {
    return leerSessionSecret();
  },
  cookieName: "prealca-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
  },
};
