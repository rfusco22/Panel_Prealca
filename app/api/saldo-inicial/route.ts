import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const sql = `
      SELECT si.id, si.agregado_id, si.cantidad, si.fecha, si.created_at,
             a.nombre AS agregado_nombre, a.unidad_medida
      FROM saldo_inicial si
      INNER JOIN agregados a ON si.agregado_id = a.id
      ORDER BY a.nombre
    `;
    const saldos = await query(sql);
    return NextResponse.json({ success: true, saldos }, { status: 200 });
  } catch (error) {
    console.error('Error obteniendo saldo inicial:', error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    if (!data.agregado_id || data.cantidad === undefined || !data.fecha) {
      return NextResponse.json({ error: 'agregado_id, cantidad y fecha son obligatorios.' }, { status: 400 });
    }

    // Verificar si ya existe saldo para ese agregado
    const existente: any = await query('SELECT id FROM saldo_inicial WHERE agregado_id = ?', [data.agregado_id]);
    
    if (existente.length > 0) {
      // Actualizar saldo existente
      await query(
        'UPDATE saldo_inicial SET cantidad = ?, fecha = ? WHERE agregado_id = ?',
        [parseFloat(data.cantidad), data.fecha, data.agregado_id]
      );
    } else {
      // Crear nuevo saldo
      await query(
        'INSERT INTO saldo_inicial (agregado_id, cantidad, fecha, usuario_id) VALUES (?, ?, ?, ?)',
        [data.agregado_id, parseFloat(data.cantidad), data.fecha, data.usuario_id || null]
      );
    }

    return NextResponse.json({ success: true, mensaje: 'Saldo inicial actualizado correctamente.' }, { status: 201 });
  } catch (error) {
    console.error('Error guardando saldo inicial:', error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID es requerido.' }, { status: 400 });

    await query('DELETE FROM saldo_inicial WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando saldo inicial:', error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
