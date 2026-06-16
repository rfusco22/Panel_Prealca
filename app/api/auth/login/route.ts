import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // 1. Buscar usuario
    const users = await query('SELECT * FROM users WHERE email = ?', [email]) as any[];
    const user = users[0];

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // 2. Verificar contraseña
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
    }

    // 3. Crear sesión
    const session = await getIronSession(await cookies(), sessionOptions);
    session.userId = user.id;
    session.role = user.role; // 'admin', 'registro', 'documentador'
    await session.save();

    // 4. Determinar redirección según rol
    const redirectPath = {
      admin: '/admin',
      registro: '/registro',
      documentador: '/dosificador',
    }[user.role as string] || '/dashboard';

    return NextResponse.json({ success: true, redirect: redirectPath });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}