import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'ingresos';
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let dateFilter = '';
    const params: any[] = [];

    if (from && to) {
      dateFilter = `AND DATE(created_at) BETWEEN ? AND ?`;
      params.push(from, to);
    } else if (from) {
      dateFilter = `AND DATE(created_at) >= ?`;
      params.push(from);
    } else if (to) {
      dateFilter = `AND DATE(created_at) <= ?`;
      params.push(to);
    }

    switch (type) {
      case 'ingresos': {
        const rows: any = await query('SELECT * FROM ingresos ORDER BY id DESC');
        
        let filteredRows = rows;
        if (from || to) {
          filteredRows = rows.filter((r: any) => {
            const fecha = r.created_at || r.fecha || r.id;
            if (from && fecha < from) return false;
            if (to && fecha > to + ' 23:59:59') return false;
            return true;
          });
        }
        
        const totalBs = filteredRows.reduce((s: number, r: any) => s + Number(r.precioBs || 0), 0);
        const totalDivisa = filteredRows.reduce((s: number, r: any) => s + Number(r.precioDivisa || 0), 0);
        const totalIva = filteredRows.reduce((s: number, r: any) => s + Number(r.montoIva || 0), 0);
        const totalM3 = filteredRows.reduce((s: number, r: any) => s + Number(r.m3 || 0), 0);

        const byBanco: Record<string, number> = {};
        filteredRows.forEach((r: any) => { byBanco[r.banco] = (byBanco[r.banco] || 0) + Number(r.precioBs || 0); });

        const byVendedor: Record<string, number> = {};
        filteredRows.forEach((r: any) => { byVendedor[r.vendedor] = (byVendedor[r.vendedor] || 0) + Number(r.precioBs || 0); });

        return NextResponse.json({ success: true, data: filteredRows, summary: { totalBs, totalDivisa, totalIva, totalM3, count: filteredRows.length, byBanco, byVendedor } });
      }

      case 'egresos': {
        const dateFilterEgresos = dateFilter.replace(/created_at/g, 'fecha');
        const rows: any = await query(dateFilter ? `SELECT * FROM egresos WHERE 1=1 ${dateFilterEgresos}` : 'SELECT * FROM egresos ORDER BY id DESC', params);

        const totalBs = rows.reduce((s: number, r: any) => s + Number(r.montoBs || 0), 0);
        const totalDivisa = rows.reduce((s: number, r: any) => s + Number(r.montoDivisa || 0), 0);

        const byClasificacion: Record<string, number> = {};
        rows.forEach((r: any) => { byClasificacion[r.clasificacionGasto] = (byClasificacion[r.clasificacionGasto] || 0) + Number(r.montoBs || 0); });

        const byBanco: Record<string, number> = {};
        rows.forEach((r: any) => { byBanco[r.banco] = (byBanco[r.banco] || 0) + Number(r.montoBs || 0); });

        return NextResponse.json({ success: true, data: rows, summary: { totalBs, totalDivisa, count: rows.length, byClasificacion, byBanco } });
      }

      case 'ventas': {
        const rows: any = await query(
          `SELECT f.*, c.nombre AS clienteNombre
           FROM facturas f
           LEFT JOIN clientes c ON f.cliente_id = c.id
           WHERE 1=1 ${dateFilter}
           ORDER BY f.id DESC`, params
        );

        const totalBs = rows.reduce((s: number, r: any) => s + Number(r.total || 0), 0);

        const byCliente: Record<string, number> = {};
        rows.forEach((r: any) => { byCliente[r.clienteNombre || 'N/A'] = (byCliente[r.clienteNombre || 'N/A'] || 0) + Number(r.total || 0); });

        const byFormaPago: Record<string, number> = {};
        rows.forEach((r: any) => { byFormaPago[r.formaPago] = (byFormaPago[r.formaPago] || 0) + Number(r.total || 0); });

        return NextResponse.json({ success: true, data: rows, summary: { totalBs, count: rows.length, byCliente, byFormaPago } });
      }

      case 'retenciones': {
        const rows: any = await query(
          `SELECT r.*, c.nombre AS cliente_nombre, c.rif AS cliente_rif,
                  f.total AS factura_total, f.fecha AS factura_fecha
           FROM retenciones_impuestos r
           JOIN clientes c ON r.cliente_id = c.id
           JOIN facturas f ON r.factura_id = f.id
           WHERE 1=1 ${dateFilter.replace(/created_at/g, 'r.fecha')}
           ORDER BY r.id DESC`, params
        );

        const totalRetenido = rows.reduce((s: number, r: any) => s + Number(r.monto_retenido || 0), 0);

        const byCliente: Record<string, number> = {};
        rows.forEach((r: any) => { byCliente[r.cliente_nombre || 'N/A'] = (byCliente[r.cliente_nombre || 'N/A'] || 0) + Number(r.monto_retenido || 0); });

        return NextResponse.json({ success: true, data: rows, summary: { totalRetenido, count: rows.length, byCliente } });
      }

      case 'financiero': {
        const allIngresos: any = await query('SELECT * FROM ingresos ORDER BY id DESC');
        const egresosSql = dateFilter ? `SELECT * FROM egresos WHERE 1=1 ${dateFilter.replace(/created_at/g, 'fecha')}` : 'SELECT * FROM egresos ORDER BY id DESC';
        const egresosRows: any = await query(egresosSql, params);

        let ingresosRows = allIngresos;
        if (from || to) {
          ingresosRows = allIngresos.filter((r: any) => {
            const fecha = r.created_at || r.fecha;
            if (!fecha) return true;
            if (from && fecha < from) return false;
            if (to && fecha > to + ' 23:59:59') return false;
            return true;
          });
        }

        const totalIngresos = ingresosRows.reduce((s: number, r: any) => s + Number(r.precioBs || 0), 0);
        const totalEgresos = egresosRows.reduce((s: number, r: any) => s + Number(r.montoBs || 0), 0);
        const balance = totalIngresos - totalEgresos;

        return NextResponse.json({
          success: true,
          summary: { totalIngresos, totalEgresos, balance, countIngresos: ingresosRows.length, countEgresos: egresosRows.length },
          ingresos: ingresosRows,
          egresos: egresosRows,
        });
      }

      default:
        return NextResponse.json({ error: 'Tipo de reporte inválido' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error en reportes API:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
