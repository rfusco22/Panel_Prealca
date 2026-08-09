import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/session';

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
      'SELECT id, password_hash, role FROM users WHERE email = ?',
      [email]
    ) as any[];

    if (users.length === 0) {
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

    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

    session.userId = user.id;
    session.role = user.role;

    await session.save();

    await query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    const redirectPath = user.role === 'admin' ? '/admin' : user.role === 'dosificador' ? '/dosificador' : user.role === 'gerencia' ? '/gerencia' : '/registro';

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
