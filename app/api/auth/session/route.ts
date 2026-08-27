import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

    if (!session.userId) {
      return NextResponse.json(
        { user: null, message: 'No hay sesión activa' },
        { status: 401 }
      );
    }

    const users = await query(
      'SELECT id, email, role, nombre, estado FROM users WHERE id = ?',
      [session.userId]
    ) as any[];

    if (users.length === 0) {
      return NextResponse.json(
        { user: null, message: 'Usuario no encontrado' },
        { status: 401 }
      );
    }

    const user = users[0];

    // Si el usuario fue desactivado con la sesion abierta, se cierra al instante
    if (user.estado !== 'activo') {
      session.destroy();
      return NextResponse.json(
        { user: null, message: 'Usuario inactivo' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        nombre: user.nombre,
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error validando la sesión:', error);

    return NextResponse.json(
      { user: null, message: 'Sesión inválida o expirada' },
      { status: 401 }
    );
  }
}
