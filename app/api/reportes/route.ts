import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

export async function GET(request: Request) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

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

      // Viajes por trompero: cada guía de despacho es un viaje. Ver issue #6.
      //
      // Se agrupa por chofer_id (el FK que dejó sql/migracion_chofer_id_guia_despacho.sql)
      // y no por el nombre en texto, que es lo que hacía imposible este reporte
      // antes: dos formas de escribir el mismo nombre se contaban como dos choferes.
      //
      // Las guías que quedaron sin vincular (chofer_id NULL) igual aparecen,
      // agrupadas por su texto, para que se note que falta asignarlas en vez de
      // que desaparezcan del conteo.
      case 'viajes': {
        const dateFilterGuias = dateFilter.replace(/created_at/g, 'gd.created_at');

        // El GROUP BY lista todas las columnas no agregadas a propósito:
        // only_full_group_by (activo por defecto) rechaza la consulta si no.
        const porChofer: any = await query(
          `SELECT
             gd.chofer_id AS choferId,
             COALESCE(ch.nombre, gd.chofer) AS chofer,
             ch.cedula,
             ch.licencia_vencimiento AS licenciaVencimiento,
             ch.certificado_vencimiento AS certificadoVencimiento,
             COUNT(*) AS viajes,
             SUM(gd.cantidad_m3) AS totalM3,
             COUNT(DISTINCT gd.unidad_id) AS unidadesDistintas
           FROM guia_despacho gd
           LEFT JOIN choferes ch ON gd.chofer_id = ch.id
           WHERE 1=1 ${dateFilterGuias}
           GROUP BY gd.chofer_id, COALESCE(ch.nombre, gd.chofer), ch.cedula,
                    ch.licencia_vencimiento, ch.certificado_vencimiento
           ORDER BY viajes DESC, totalM3 DESC`,
          params
        );

        const porUnidad: any = await query(
          `SELECT
             gd.unidad_id AS unidadId,
             un.numero_unidad AS numeroUnidad,
             un.placa,
             COUNT(*) AS viajes,
             SUM(gd.cantidad_m3) AS totalM3
           FROM guia_despacho gd
           LEFT JOIN unidades un ON gd.unidad_id = un.id
           WHERE 1=1 ${dateFilterGuias}
           GROUP BY gd.unidad_id, un.numero_unidad, un.placa
           ORDER BY viajes DESC`,
          params
        );

        const data = porChofer.map((r: any) => ({
          ...r,
          viajes: Number(r.viajes),
          totalM3: Number(r.totalM3 || 0),
          unidadesDistintas: Number(r.unidadesDistintas || 0),
          promedioM3: Number(r.viajes) > 0 ? Number(r.totalM3 || 0) / Number(r.viajes) : 0,
        }));

        const unidades = porUnidad.map((r: any) => ({
          ...r,
          viajes: Number(r.viajes),
          totalM3: Number(r.totalM3 || 0),
        }));

        const totalViajes = data.reduce((s: number, r: any) => s + r.viajes, 0);
        const totalM3 = data.reduce((s: number, r: any) => s + r.totalM3, 0);
        const sinVincular = data.filter((r: any) => r.choferId === null)
          .reduce((s: number, r: any) => s + r.viajes, 0);

        const viajesPorChofer: Record<string, number> = {};
        data.forEach((r: any) => { viajesPorChofer[r.chofer || 'Sin chofer'] = r.viajes; });

        return NextResponse.json({
          success: true,
          data,
          unidades,
          summary: {
            totalViajes,
            totalM3,
            choferes: data.length,
            promedioM3: totalViajes > 0 ? totalM3 / totalViajes : 0,
            sinVincular,
            viajesPorChofer,
          },
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
