// lib/auth-guard.ts
import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';

export const ROLES_VALIDOS = ['admin', 'gerencia', 'registro', 'dosificador', 'seguridad-vial'] as const;
export type Rol = (typeof ROLES_VALIDOS)[number];

export function esRolValido(role: unknown): role is Rol {
  return typeof role === 'string' && (ROLES_VALIDOS as readonly string[]).includes(role);
}

export interface Sesion {
  userId: number;
  role: Rol;
}

/**
 * Verifica que exista una sesión válida y, opcionalmente, que el rol esté
 * dentro de los permitidos.
 *
 * Devuelve `{ session }` si pasa, o `{ response }` con el 401/403 ya armado.
 * Uso:
 *   const auth = await requireAuth();                       // cualquier usuario logueado
 *   const auth = await requireAuth(['admin', 'gerencia']);  // solo esos roles
 *   if (auth.response) return auth.response;
 */
export async function requireAuth(
  rolesPermitidos?: readonly Rol[]
): Promise<{ session: Sesion; response: null } | { session: null; response: NextResponse }> {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

  if (!session.userId || !esRolValido(session.role)) {
    return {
      session: null,
      response: NextResponse.json({ error: 'No autorizado' }, { status: 401 }),
    };
  }

  if (rolesPermitidos && !rolesPermitidos.includes(session.role)) {
    return {
      session: null,
      response: NextResponse.json({ error: 'Acceso denegado' }, { status: 403 }),
    };
  }

  return { session: { userId: session.userId, role: session.role }, response: null };
}
