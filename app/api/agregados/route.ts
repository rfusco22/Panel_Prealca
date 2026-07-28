import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { emitSocketEvent } from '@/lib/socket-server';

export async function GET() {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const agregados = await query(`
      SELECT 
        id, 
        nombre, 
        unidad_medida AS unidadMedida 
      FROM agregados 
      ORDER BY id DESC
    `);

    return NextResponse.json(agregados);
  } catch (error) {
    console.error('Error GET agregados:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await request.json();
    const { nombre, unidadMedida } = body;

    if (!nombre || !unidadMedida) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 });
    }

    const result: any = await query(`
      INSERT INTO agregados (nombre, unidad_medida) 
      VALUES (?, ?)
    `, [nombre, unidadMedida]);

    emitSocketEvent('agregados:created');

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Error POST agregados:', error);
    return NextResponse.json({ error: 'Error registrando agregado' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await request.json();
    const { id, nombre, unidadMedida } = body;

    if (!id || !nombre || !unidadMedida) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    await query(`
      UPDATE agregados 
      SET nombre = ?, unidad_medida = ?
      WHERE id = ?
    `, [nombre, unidadMedida, id]);

    emitSocketEvent('agregados:updated');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error PUT agregados:', error);
    return NextResponse.json({ error: 'Error actualizando agregado' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });

    await query('DELETE FROM agregados WHERE id = ?', [id]);

    emitSocketEvent('agregados:deleted');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando agregado:', error);
    return NextResponse.json({ error: 'Error eliminando agregado' }, { status: 500 });
  }
}