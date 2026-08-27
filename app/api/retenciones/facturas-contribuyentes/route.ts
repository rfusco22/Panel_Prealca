import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

export async function GET() {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const sql = `
      SELECT 
        f.id,
        f.total,
        f.fecha,
        f.estado,
        f.comprobante_retencion,
        c.id AS cliente_id,
        c.nombre AS cliente_nombre,
        c.rif AS cliente_rif,
        c.es_contribuyente_especial,
        gd.iva_monto,
        gd.cantidad_m3,
        gd.precio_m3,
        p.resistencia,
        p.pulgada
      FROM facturas f
      JOIN clientes c ON f.cliente_id = c.id
      JOIN guia_despacho gd ON f.guia_despacho_id = gd.id
      JOIN productos p ON gd.producto_id = p.id
      WHERE c.es_contribuyente_especial = 1
        AND f.estado != 'Anulada'
      ORDER BY f.id DESC
    `;
    const resultados = await query(sql);
    return NextResponse.json({ success: true, facturas: resultados }, { status: 200 });
  } catch (error) {
    console.error("Error obteniendo facturas de contribuyentes:", error);
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}
