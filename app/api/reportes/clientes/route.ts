import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let dateFilterGuias = '';
    const paramsGuias: any[] = [];
    if (from) { dateFilterGuias += ' AND gd.created_at >= ?'; paramsGuias.push(from); }
    if (to) { dateFilterGuias += ' AND gd.created_at <= ?'; paramsGuias.push(to + ' 23:59:59'); }

    const clientes = await query(`
      SELECT
        c.id,
        c.nombre,
        c.rif,
        c.vendedor,
        COALESCE(SUM(i.precioBs), 0) AS totalIngresosBs,
        COALESCE(SUM(i.precioDivisa), 0) AS totalIngresosUsd,
        COALESCE(SUM(i.montoIva), 0) AS totalIvaBs,
        COUNT(DISTINCT i.id) AS totalIngresos,
        COUNT(DISTINCT gd.id) AS totalGuias,
        COALESCE(SUM(gd.cantidad_m3), 0) AS totalM3,
        COALESCE(SUM(
          CASE WHEN i.comision_porcentaje IS NOT NULL AND i.comision_porcentaje > 0
          THEN (gd.cantidad_m3 * i.comision_porcentaje / 100) ELSE 0 END
        ), 0) AS totalComisiones
      FROM clientes c
      LEFT JOIN ingresos i ON i.nombreCliente = c.nombre
      LEFT JOIN guia_despacho gd ON gd.cliente_id = c.id ${dateFilterGuias}
      GROUP BY c.id, c.nombre, c.rif, c.vendedor
      ORDER BY c.nombre ASC
    `);

    const detalles = await query(`
      SELECT
        i.nombreCliente AS clienteNombre,
        'Ingreso' AS tipo,
        i.tipoDocumento AS documento,
        i.referencia,
        i.precioBs AS montoBs,
        i.precioDivisa AS montoUsd,
        i.montoIva AS ivaBs,
        i.descripcion
      FROM ingresos i
      ORDER BY i.id DESC
    `);

    return NextResponse.json({ clientes, detalles });
  } catch (error) {
    console.error('Error GET /api/reportes/clientes:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
