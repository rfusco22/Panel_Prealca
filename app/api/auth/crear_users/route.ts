import { NextResponse } from 'next/server';
import { query } from '@/lib/db'; // Usamos tu función query directa
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, nombre, role } = body;

    if (!email || !password || !nombre) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    // Hashear contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Insertar usando SQL directo
    // Nota: MySQL gestiona automáticamente id (AUTO_INCREMENT) y fechas (DEFAULT CURRENT_TIMESTAMP)
    await query(
      'INSERT INTO users (email, password_hash, nombre, role, estado) VALUES (?, ?, ?, ?, ?)',
      [email, passwordHash, nombre, role || 'registro', 'activo']
    );

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