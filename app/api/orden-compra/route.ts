import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';

export async function GET() {
  try {
    const ordenes = await query(`
      SELECT
        oc.id,
        oc.tipo,
        oc.proveedor_id AS proveedorId,
        pv.nombre AS proveedorNombre,
        oc.producto_id AS productoId,
        CONCAT(pd.resistencia, ' - ', pd.pulgada) AS productoNombre,
        oc.cantidad_m3 AS cantidadM3,
        oc.precio_m3 AS precioM3,
        oc.iva_aplicado AS ivaAplicado,
        oc.iva_monto AS ivaMonto,
        oc.total,
        oc.usuario_id AS usuarioId,
        oc.created_at AS fecha
      FROM orden_compra oc
      LEFT JOIN proveedores pv ON oc.proveedor_id = pv.id
      LEFT JOIN productos pd ON oc.producto_id = pd.id
      ORDER BY oc.id DESC
    `);

    return NextResponse.json({ success: true, ordenes }, { status: 200 });
  } catch (error) {
    console.error('Error GET orden_compra:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const data = await request.json();
    const { tipo, proveedorId, productoId, cantidadM3, precioM3, ivaAplicado, ivaMonto, total } = data;

    const result: any = await query(`
      INSERT INTO orden_compra (tipo, proveedor_id, producto_id, cantidad_m3, precio_m3, iva_aplicado, iva_monto, total, usuario_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [tipo, proveedorId, productoId, cantidadM3, precioM3, ivaAplicado ? 1 : 0, ivaMonto, total, session.userId]);

    return NextResponse.json({ success: true, id: result.insertId }, { status: 201 });
  } catch (error) {
    console.error('Error POST orden_compra:', error);
    return NextResponse.json({ error: 'Error al crear orden de compra' }, { status: 500 });
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

    await query('DELETE FROM orden_compra WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error DELETE orden_compra:', error);
    return NextResponse.json({ error: 'Error al eliminar orden de compra' }, { status: 500 });
  }
}
