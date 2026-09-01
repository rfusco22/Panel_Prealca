import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/session';
import { esRolValido } from '@/lib/auth-guard';

// Hash señuelo, sin contraseña real detrás: se usa cuando el email no existe,
// para que bcrypt.compare() siempre corra y el tiempo de respuesta no delate
// si una cuenta está registrada (email inexistente respondía casi al
// instante; uno existente tardaba lo que tarda bcrypt, ~100ms).
const HASH_SENUELO = '$2b$10$uGo07eTsrLiScqSUcH2hZuoyXiZYkEYcIISv8VkVz3wB/.Vz7GQ5.';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son obligatorios' },
        { status: 400 }
      );
    }

    const users = await query(
      'SELECT id, password_hash, role, estado FROM users WHERE email = ?',
      [email]
    ) as any[];

    if (users.length === 0) {
      // Se compara igual contra el hash señuelo en vez de retornar directo:
      // sin esto, un email inexistente respondía casi al instante mientras
      // que uno existente tardaba lo que tarda bcrypt, filtrando por timing
      // qué correos están registrados.
      await bcrypt.compare(password, HASH_SENUELO);
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Se valida despues de la contrasena para no revelar que la cuenta existe
    if (user.estado !== 'activo') {
      return NextResponse.json(
        { error: 'Usuario inactivo. Contacte al administrador.' },
        { status: 403 }
      );
    }

    if (!esRolValido(user.role)) {
      return NextResponse.json(
        { error: 'El usuario no tiene un rol valido asignado.' },
        { status: 403 }
      );
    }

    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

    session.userId = user.id;
    session.role = user.role;

    await session.save();

    await query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    const redirectPath = user.role === 'admin' ? '/admin'
      : user.role === 'dosificador' ? '/dosificador'
      : user.role === 'gerencia' ? '/gerencia'
      : user.role === 'seguridad-vial' ? '/seguridad-vial'
      : '/registro';

    return NextResponse.json({
      success: true,
      role: user.role,
      redirect: redirectPath
    });

  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
