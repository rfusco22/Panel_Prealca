import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// Evitamos que Next.js almacene en caché esta ruta (fundamental para la sesión)
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = cookies();
    
    // Buscamos la cookie del token. (Si en tu login la llamaste de otra forma, 
    // por ejemplo 'auth_token', cámbialo aquí).
    const token = cookieStore.get('token')?.value || cookieStore.get('session')?.value;

    // Si no existe la cookie, el usuario no está autenticado
    if (!token) {
      return NextResponse.json(
        { user: null, message: 'No hay sesión activa' },
        { status: 401 }
      );
    }

    // Esta clave debe ser exactamente la misma que usaste en app/api/auth/login/route.ts
    const secret = process.env.JWT_SECRET || 'tu_secreto_super_seguro';

    // Verificamos y decodificamos el token
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload;

    // Retornamos el objeto 'user' para que tu hook useAuth.ts y tu Layout lo reciban
    return NextResponse.json({
      user: {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role, // Este es el campo clave que valida tu Layout ('registro', 'admin', etc.)
        nombre: decoded.nombre || '',
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error validando la sesión:', error);
    
    // Si el token caducó o es incorrecto, lo rechazamos
    return NextResponse.json(
      { user: null, message: 'Token inválido o expirado' },
      { status: 401 }
    );
  }
}