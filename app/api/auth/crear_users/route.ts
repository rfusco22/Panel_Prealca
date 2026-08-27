import { NextResponse } from 'next/server';
import { query } from '@/lib/db'; // Usamos tu función query directa
import bcrypt from 'bcryptjs';
import { emitSocketEvent } from '@/lib/socket-server';
import { requireAuth, esRolValido } from '@/lib/auth-guard';

export async function POST(req: Request) {
  const auth = await requireAuth(['admin', 'gerencia']);
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const { email, password, nombre, role } = body;

    if (!email || !password || !nombre) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const rolAsignado = role || 'registro';
    if (!esRolValido(rolAsignado)) {
      return NextResponse.json({ error: 'Rol inválido' }, { status: 400 });
    }

    // Hashear contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Insertar usando SQL directo
    // Nota: MySQL gestiona automáticamente id (AUTO_INCREMENT) y fechas (DEFAULT CURRENT_TIMESTAMP)
    await query(
      'INSERT INTO users (email, password_hash, nombre, role, estado) VALUES (?, ?, ?, ?, ?)',
      [email, passwordHash, nombre, rolAsignado, 'activo']
    );

    emitSocketEvent('users:created');

    return NextResponse.json({ success: true, message: 'Usuario creado exitosamente' }, { status: 201 });

  } catch (error: any) {
    console.error('Error en API:', error);
    
    // Error 1062 es duplicado en MySQL (UNIQUE key violation)
    if (error.errno === 1062) {
      return NextResponse.json({ error: 'El correo ya está registrado' }, { status: 409 });
    }

    return NextResponse.json({ success: false, error: 'Error interno al crear usuario' }, { status: 500 });
  }
}