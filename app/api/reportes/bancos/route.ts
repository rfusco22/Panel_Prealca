import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let dateFilterEgresos = '';
    const paramsE: any[] = [];

    if (from) { dateFilterEgresos += ' AND e.fecha >= ?'; paramsE.push(from); }
    if (to) { dateFilterEgresos += ' AND e.fecha <= ?'; paramsE.push(to + ' 23:59:59'); }

    const bancos = await query(`
      SELECT
        b.id,
        b.nombre_banco AS nombreBanco,
        b.numero_cuenta AS numeroCuenta,
        b.titular_cuenta AS titularCuenta,
        COALESCE(ing.totalBs, 0) AS ingresosBs,
        COALESCE(ing.totalUsd, 0) AS ingresosUsd,
        COALESCE(egr.totalBs, 0) AS egresosBs,
        COALESCE(egr.totalUsd, 0) AS egresosUsd,
        COALESCE(ing.totalBs, 0) - COALESCE(egr.totalBs, 0) AS saldoBs,
        COALESCE(ing.totalUsd, 0) - COALESCE(egr.totalUsd, 0) AS saldoUsd
      FROM bancos b
      LEFT JOIN (
        SELECT banco, SUM(precioBs) AS totalBs, SUM(precioDivisa) AS totalUsd
        FROM ingresos
        GROUP BY banco
      ) ing ON ing.banco = b.nombre_banco
      LEFT JOIN (
        SELECT banco, SUM(montoBs) AS totalBs, SUM(montoDivisa) AS totalUsd
        FROM egresos WHERE 1=1 ${dateFilterEgresos}
        GROUP BY banco
      ) egr ON egr.banco = b.nombre_banco
      ORDER BY b.nombre_banco ASC
    `, paramsE);

    const movimientosIngresos = await query(`
      SELECT
        i.banco,
        i.nombreCliente AS titular,
        'Ingreso' AS tipo,
        i.referencia,
        i.precioBs AS montoBs,
        i.precioDivisa AS montoUsd,
        i.descripcion
      FROM ingresos i
      WHERE i.banco IS NOT NULL AND i.banco != ''
      ORDER BY i.id DESC
    `);

    const movimientosEgresos = await query(`
      SELECT
        e.banco,
        e.nombreProveedor AS titular,
        'Egreso' AS tipo,
        e.referencia,
        e.fecha,
        e.montoBs,
        e.montoDivisa,
        e.descripcion
      FROM egresos e
      WHERE e.banco IS NOT NULL AND e.banco != '' ${dateFilterEgresos}
      ORDER BY e.fecha DESC
    `, paramsE);

    return NextResponse.json({ bancos, movimientosIngresos, movimientosEgresos });
  } catch (error) {
    console.error('Error GET /api/reportes/bancos:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
