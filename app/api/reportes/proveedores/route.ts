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

    let dateFilter = '';
    const params: any[] = [];

    if (from) { dateFilter += ' AND e.fecha >= ?'; params.push(from); }
    if (to) { dateFilter += ' AND e.fecha <= ?'; params.push(to + ' 23:59:59'); }

    const proveedores = await query(`
      SELECT
        e.nombreProveedor AS nombre,
        e.rif,
        COALESCE(SUM(e.montoBs), 0) AS totalEgresosBs,
        COALESCE(SUM(e.montoDivisa), 0) AS totalEgresosUsd,
        COUNT(DISTINCT e.id) AS totalEgresos,
        0 AS totalOrdenesCompra
      FROM egresos e
      WHERE 1=1 ${dateFilter}
      GROUP BY e.nombreProveedor, e.rif
      ORDER BY e.nombreProveedor ASC
    `, params);

    const detalles = await query(`
      SELECT
        e.nombreProveedor AS proveedorNombre,
        'Egreso' AS tipo,
        e.clasificacionGasto,
        e.subCategoria,
        e.referencia,
        e.fecha,
        e.montoBs,
        e.montoDivisa,
        e.descripcion
      FROM egresos e
      WHERE 1=1 ${dateFilter}
      ORDER BY e.fecha DESC
    `, params);

    return NextResponse.json({ proveedores, detalles });
  } catch (error) {
    console.error('Error GET /api/reportes/proveedores:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
