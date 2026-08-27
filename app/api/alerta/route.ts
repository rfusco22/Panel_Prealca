import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

export async function GET() {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const sql = `
      SELECT 
        gd.producto_id,
        p.resistencia,
        p.pulgada,
        p.unidad,
        SUM(gd.cantidad_m3) AS total_despachado,
        COUNT(*) AS total_guias
      FROM guia_despacho gd
      JOIN productos p ON gd.producto_id = p.id
      WHERE gd.fecha >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY gd.producto_id, p.resistencia, p.pulgada, p.unidad
      HAVING SUM(gd.cantidad_m3) < 200
      ORDER BY total_despachado ASC
    `;
    const resultados = await query(sql);

    const sqlProductos = `
      SELECT 
        p.id,
        p.resistencia,
        p.pulgada,
        p.unidad,
        COALESCE(SUM(gd.cantidad_m3), 0) AS total_despachado
      FROM productos p
      LEFT JOIN guia_despacho gd ON p.id = gd.producto_id AND gd.fecha >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY p.id, p.resistencia, p.pulgada, p.unidad
      HAVING total_despachado < 200
      ORDER BY total_despachado ASC
    `;
    const todosProductos = await query(sqlProductos);

    return NextResponse.json({ success: true, alertas: resultados, productos: todosProductos }, { status: 200 });
  } catch (error) {
    console.error("Error obteniendo alertas:", error);
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}
