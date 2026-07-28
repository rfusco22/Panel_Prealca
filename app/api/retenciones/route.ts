import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { emitSocketEvent } from '@/lib/socket-server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clienteId = searchParams.get('cliente_id');
    const facturaId = searchParams.get('factura_id');

    let sql = `
      SELECT 
        r.*,
        c.nombre AS cliente_nombre,
        c.rif AS cliente_rif,
        f.total AS factura_total,
        f.fecha AS factura_fecha,
        f.estado AS factura_estado,
        gd.iva_monto AS iva_monto,
        gd.cantidad_m3,
        gd.precio_m3,
        p.resistencia,
        p.pulgada
      FROM retenciones_impuestos r
      JOIN clientes c ON r.cliente_id = c.id
      JOIN facturas f ON r.factura_id = f.id
      JOIN guia_despacho gd ON f.guia_despacho_id = gd.id
      JOIN productos p ON gd.producto_id = p.id
      WHERE 1=1
    `;

    const valores: any[] = [];

    if (clienteId) {
      sql += ` AND r.cliente_id = ?`;
      valores.push(clienteId);
    }
    if (facturaId) {
      sql += ` AND r.factura_id = ?`;
      valores.push(facturaId);
    }

    sql += ` ORDER BY r.id DESC`;

    const resultados = await query(sql, valores);
    return NextResponse.json({ success: true, retenciones: resultados }, { status: 200 });
  } catch (error) {
    console.error("Error obteniendo retenciones:", error);
    return NextResponse.json({ error: 'Error interno al cargar las retenciones.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const sql = `
      INSERT INTO retenciones_impuestos (cliente_id, factura_id, monto_retenido, porcentaje_retencion, fecha, usuario_id)
      VALUES (?, ?, ?, ?, NOW(), ?)
    `;

    const valores = [
      data.cliente_id,
      data.factura_id,
      parseFloat(data.monto_retenido),
      parseFloat(data.porcentaje_retencion) || 75.00,
      data.usuario_id || 1
    ];

    const resultado: any = await query(sql, valores);

    emitSocketEvent('retenciones:created');
    return NextResponse.json({
      success: true,
      mensaje: 'Retención registrada correctamente.',
      insertId: resultado.insertId
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error registrando retención:", error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Ya existe una retención para esta factura.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
