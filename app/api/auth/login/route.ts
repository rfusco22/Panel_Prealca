import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db'; // Tu conexión pura a MySQL
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

    // 1. Buscar usuario en la base de datos (Query puro MySQL)
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

    // 2. Verificar contraseña con bcrypt
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' }, 
        { status: 401 }
      );
    }

    // 3. Crear sesión con iron-session
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    
    session.userId = user.id;
    session.role = user.role;
    
    // Esto guarda la cookie en la respuesta automáticamente
    await session.save();

    // 4. Determinar redirección basada en rol
    // Asegúrate de que el rol sea exactamente el que tienes en tu DB
    const redirectPath = user.role === 'admin' ? '/admin' : '/registro';

    return NextResponse.json({ 
      success: true, 
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