import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const users = await query(
      'SELECT id, email, nombre, role, estado, created_at, last_login FROM users ORDER BY created_at DESC'
    );
    return NextResponse.json({ success: true, users }, { status: 200 });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    return NextResponse.json({ error: 'Error al cargar usuarios' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    if (!data.email || !data.password || !data.nombre || !data.role) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const result: any = await query(
      'INSERT INTO users (email, password_hash, nombre, role, estado) VALUES (?, ?, ?, ?, ?)',
      [data.email, passwordHash, data.nombre, data.role, data.estado || 'activo']
    );

    return NextResponse.json({
      success: true,
      mensaje: 'Usuario creado correctamente',
      user: { id: result.insertId, email: data.email, nombre: data.nombre, role: data.role, estado: data.estado || 'activo' }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creando usuario:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Ya existe un usuario con este email' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    if (!data.id) {
      return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 });
    }

    if (data.password) {
      const passwordHash = await bcrypt.hash(data.password, 10);
      await query(
        'UPDATE users SET nombre = ?, role = ?, estado = ?, password_hash = ? WHERE id = ?',
        [data.nombre, data.role, data.estado, passwordHash, data.id]
      );
    } else {
      await query(
        'UPDATE users SET nombre = ?, role = ?, estado = ? WHERE id = ?',
        [data.nombre, data.role, data.estado, data.id]
      );
    }

    return NextResponse.json({ success: true, mensaje: 'Usuario actualizado correctamente' }, { status: 200 });
  } catch (error: any) {
    console.error('Error actualizando usuario:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    await query('DELETE FROM users WHERE id = ?', [id]);
    return NextResponse.json({ success: true, mensaje: 'Usuario eliminado' }, { status: 200 });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 });
  }
}
