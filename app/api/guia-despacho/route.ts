import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { emitSocketEvent } from '@/lib/socket-server';

export async function GET() {
  try {
    const guias = await query(`
      SELECT
        gd.id,
        gd.tipo,
        gd.cliente_id AS clienteId,
        c.nombre AS clienteNombre,
        gd.producto_id AS productoId,
        CONCAT(p.resistencia, ' - ', p.pulgada) AS productoNombre,
        gd.cantidad_m3 AS cantidadM3,
        gd.precio_m3 AS precioM3,
        gd.iva_aplicado AS ivaAplicado,
        gd.iva_monto AS ivaMonto,
        gd.total,
        gd.chofer,
        gd.unidad_id AS unidadId,
        u.numero_unidad AS numeroUnidad,
        u.placa,
        gd.usuario_id AS usuarioId,
        gd.created_at AS fecha
      FROM guia_despacho gd
      LEFT JOIN clientes c ON gd.cliente_id = c.id
      LEFT JOIN productos p ON gd.producto_id = p.id
      LEFT JOIN unidades u ON gd.unidad_id = u.id
      ORDER BY gd.id DESC
    `);

    return NextResponse.json({ success: true, guias }, { status: 200 });
  } catch (error) {
    console.error('Error GET guia_despacho:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const data = await request.json();
    const { tipo, clienteId, productoId, cantidadM3, precioM3, ivaAplicado, ivaMonto, total, chofer, unidadId } = data;

    const result: any = await query(`
      INSERT INTO guia_despacho (tipo, cliente_id, producto_id, cantidad_m3, precio_m3, iva_aplicado, iva_monto, total, chofer, unidad_id, usuario_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [tipo, clienteId, productoId, cantidadM3, precioM3, ivaAplicado ? 1 : 0, ivaMonto, total, chofer, unidadId || null, session.userId]);

    emitSocketEvent('guia-despacho:created');

    return NextResponse.json({ success: true, id: result.insertId }, { status: 201 });
  } catch (error) {
    console.error('Error POST guia_despacho:', error);
    return NextResponse.json({ error: 'Error al crear guía de despacho' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
    }

    await query('DELETE FROM guia_despacho WHERE id = ?', [id]);

    emitSocketEvent('guia-despacho:deleted');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error DELETE guia_despacho:', error);
    return NextResponse.json({ error: 'Error al eliminar guía de despacho' }, { status: 500 });
  }
}
