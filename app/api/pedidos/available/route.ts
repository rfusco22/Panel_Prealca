import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const pedidos = await query(`
      SELECT
        pe.id,
        pe.cliente_id AS clienteId,
        c.nombre AS clienteNombre,
        pe.producto_id AS productoId,
        CONCAT(p.resistencia, ' - ', p.pulgada) AS productoNombre,
        pe.cantidad_m3 AS totalM3,
        COALESCE(SUM(gd.cantidad_m3), 0) AS acumuladoM3,
        pe.estado,
        pe.created_at AS fecha
      FROM pedidos pe
      LEFT JOIN clientes c ON pe.cliente_id = c.id
      LEFT JOIN productos p ON pe.producto_id = p.id
      LEFT JOIN guia_despacho gd ON gd.pedido_id = pe.id
      WHERE pe.estado IN ('pendiente', 'en_proceso')
      GROUP BY pe.id, pe.cliente_id, c.nombre, pe.producto_id, p.resistencia, p.pulgada, pe.cantidad_m3, pe.estado, pe.created_at
      ORDER BY pe.id DESC
    `);

    return NextResponse.json({ success: true, pedidos }, { status: 200 });
  } catch (error) {
    console.error('Error GET pedidos available:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
