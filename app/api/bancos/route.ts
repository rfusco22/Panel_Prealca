import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session'; // <-- Importamos SessionData aquí

// GET: Obtener todos los bancos registrados
export async function GET() {
  try {
    // Le decimos a TypeScript qué forma tiene nuestra sesión con <SessionData>
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    
    if (!session.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const bancos = await query(`
      SELECT 
        id, 
        nombre_banco AS nombreBanco, 
        numero_cuenta AS numeroCuenta, 
        titular_cuenta AS titularCuenta, 
        cedula 
      FROM bancos 
      ORDER BY id DESC
    `);

    return NextResponse.json(bancos);
  } catch (error) {
    console.error('Error obteniendo bancos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST: Registrar un nuevo banco
export async function POST(request: Request) {
  try {
    // También lo agregamos aquí
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    
    if (!session.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { nombreBanco, numeroCuenta, titularCuenta, cedula } = body;

    // Validación básica
    if (!nombreBanco || !numeroCuenta || !titularCuenta || !cedula) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 });
    }

    // Insertamos en MySQL
    const result: any = await query(`
      INSERT INTO bancos (nombre_banco, numero_cuenta, titular_cuenta, cedula) 
      VALUES (?, ?, ?, ?)
    `, [nombreBanco, numeroCuenta, titularCuenta, cedula]);

    return NextResponse.json({ 
      success: true, 
      message: 'Banco registrado exitosamente',
      id: result.insertId 
    });

  } catch (error) {
    console.error('Error registrando banco:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE: Eliminar un banco
export async function DELETE(request: Request) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Extraemos el ID de la URL (ejemplo: /api/bancos?id=1)
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
    }

    // Ejecutamos el borrado en MySQL
    await query('DELETE FROM bancos WHERE id = ?', [id]);

    return NextResponse.json({ success: true, message: 'Banco eliminado' });

  } catch (error) {
    console.error('Error eliminando banco:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT: Editar un banco existente
export async function PUT(request: Request) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { id, nombreBanco, numeroCuenta, titularCuenta, cedula } = body;

    if (!id || !nombreBanco || !numeroCuenta || !titularCuenta || !cedula) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    // Actualizamos en MySQL
    await query(`
      UPDATE bancos 
      SET nombre_banco = ?, numero_cuenta = ?, titular_cuenta = ?, cedula = ?
      WHERE id = ?
    `, [nombreBanco, numeroCuenta, titularCuenta, cedula, id]);

    return NextResponse.json({ success: true, message: 'Banco actualizado' });

  } catch (error) {
    console.error('Error actualizando banco:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}