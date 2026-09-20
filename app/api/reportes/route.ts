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

      // Resumen de metros cúbicos despachados. Ver issue #1.
      //
      // La fuente es guia_despacho y no ingresos.m3 a propósito: acá se mide lo
      // que salió de planta (el despacho físico), no lo facturado. Los dos
      // números existen y no siempre coinciden.
      case 'm3': {
        const dateFilterGuias = dateFilter.replace(/created_at/g, 'gd.created_at');

        const porMes: any = await query(
          `SELECT DATE_FORMAT(gd.created_at, '%Y-%m') AS mes,
                  COUNT(*) AS guias,
                  SUM(gd.cantidad_m3) AS totalM3
           FROM guia_despacho gd
           WHERE 1=1 ${dateFilterGuias}
           GROUP BY DATE_FORMAT(gd.created_at, '%Y-%m')
           ORDER BY mes DESC`,
          params
        );

        const porTipo: any = await query(
          `SELECT gd.tipo, COUNT(*) AS guias, SUM(gd.cantidad_m3) AS totalM3
           FROM guia_despacho gd
           WHERE 1=1 ${dateFilterGuias}
           GROUP BY gd.tipo
           ORDER BY totalM3 DESC`,
          params
        );

        // Las guías sin obra cargada se agrupan bajo una etiqueta propia en vez
        // de quedar afuera: son despachos reales y tienen que sumar al total.
        const porObra: any = await query(
          `SELECT COALESCE(NULLIF(TRIM(gd.obra), ''), 'Sin obra') AS obra,
                  COUNT(*) AS guias,
                  SUM(gd.cantidad_m3) AS totalM3
           FROM guia_despacho gd
           WHERE 1=1 ${dateFilterGuias}
           GROUP BY COALESCE(NULLIF(TRIM(gd.obra), ''), 'Sin obra')
           ORDER BY totalM3 DESC`,
          params
        );

        const num = (rows: any[]) => rows.map((r: any) => ({
          ...r,
          guias: Number(r.guias),
          totalM3: Number(r.totalM3 || 0),
        }));

        const meses = num(porMes);
        const tipos = num(porTipo);
        const obras = num(porObra);

        const totalM3 = meses.reduce((s: number, r: any) => s + r.totalM3, 0);
        const totalGuias = meses.reduce((s: number, r: any) => s + r.guias, 0);

        const m3PorMes: Record<string, number> = {};
        meses.slice().reverse().forEach((r: any) => { m3PorMes[r.mes] = r.totalM3; });
        const m3PorTipo: Record<string, number> = {};
        tipos.forEach((r: any) => { m3PorTipo[r.tipo] = r.totalM3; });

        return NextResponse.json({
          success: true,
          data: meses,
          porTipo: tipos,
          porObra: obras,
          summary: {
            totalM3,
            totalGuias,
            promedioM3: totalGuias > 0 ? totalM3 / totalGuias : 0,
            m3PorMes,
            m3PorTipo,
          },
        });
      }

      // Resumen por resistencia del concreto. Ver issue #2.
      case 'resistencia': {
        const dateFilterGuias = dateFilter.replace(/created_at/g, 'gd.created_at');

        // Agrupa por resistencia sola (el listado de productos la muestra junto
        // a la pulgada, pero acá interesa la mezcla).
        //
        // Se agrupa ignorando espacios y mayúsculas porque la tabla de
        // productos tiene el mismo producto escrito de formas distintas:
        // "280 kgf/cm² FIBRA" y "280 kgf/cm²FIBRA" (sin espacio) son el mismo
        // concreto y sin normalizar salían como dos resistencias separadas.
        //
        // Lo que NO se toca es la distinción con fibra / sin fibra: "280
        // kgf/cm²" y "280 kgf/cm² FIBRA" son concretos distintos y tienen que
        // quedar en filas separadas, cosa que se cumple porque la palabra FIBRA
        // sigue formando parte del texto que se agrupa.
        //
        // La etiqueta sale de MIN(): devuelve una de las formas realmente
        // cargadas, no un nombre inventado.
        const normalizada = `UPPER(REPLACE(COALESCE(p.resistencia, 'Sin producto'), ' ', ''))`;

        const porResistencia: any = await query(
          `SELECT MIN(COALESCE(p.resistencia, 'Sin producto')) AS resistencia,
                  COUNT(*) AS guias,
                  SUM(gd.cantidad_m3) AS totalM3
           FROM guia_despacho gd
           LEFT JOIN productos p ON gd.producto_id = p.id
           WHERE 1=1 ${dateFilterGuias}
           GROUP BY ${normalizada}
           ORDER BY totalM3 DESC`,
          params
        );

        const detalle: any = await query(
          `SELECT MIN(COALESCE(p.resistencia, 'Sin producto')) AS resistencia,
                  COALESCE(p.pulgada, '—') AS pulgada,
                  COUNT(*) AS guias,
                  SUM(gd.cantidad_m3) AS totalM3
           FROM guia_despacho gd
           LEFT JOIN productos p ON gd.producto_id = p.id
           WHERE 1=1 ${dateFilterGuias}
           GROUP BY ${normalizada}, COALESCE(p.pulgada, '—')
           ORDER BY resistencia, pulgada`,
          params
        );

        const totalM3 = porResistencia.reduce((s: number, r: any) => s + Number(r.totalM3 || 0), 0);
        const totalGuias = porResistencia.reduce((s: number, r: any) => s + Number(r.guias), 0);

        const data = porResistencia.map((r: any) => ({
          resistencia: r.resistencia,
          guias: Number(r.guias),
          totalM3: Number(r.totalM3 || 0),
          porcentaje: totalM3 > 0 ? (Number(r.totalM3 || 0) / totalM3) * 100 : 0,
        }));

        const m3PorResistencia: Record<string, number> = {};
        data.forEach((r: any) => { m3PorResistencia[r.resistencia] = r.totalM3; });

        return NextResponse.json({
          success: true,
          data,
          detalle: detalle.map((r: any) => ({
            ...r,
            guias: Number(r.guias),
            totalM3: Number(r.totalM3 || 0),
          })),
          summary: {
            totalM3,
            totalGuias,
            resistencias: data.length,
            m3PorResistencia,
          },
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
