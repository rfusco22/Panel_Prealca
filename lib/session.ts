// lib/session.ts
import { SessionOptions } from "iron-session";

// 1. Define la estructura de tu sesión
export interface SessionData {
  userId: number;
  role: string;
}

// lib/session.ts
export const sessionOptions = {
  password: "un-password-super-secreto-de-32-caracteres-minimo",
  cookieName: "prealca-session",
  cookieOptions: {
    // CAMBIA ESTO A FALSE SI ESTÁS EN LOCALHOST
    secure: process.env.NODE_ENV === "production", 
    httpOnly: true,
    path: "/", // IMPORTANTE: Indicar que la cookie es para toda la app
    sameSite: "lax",
  },
};