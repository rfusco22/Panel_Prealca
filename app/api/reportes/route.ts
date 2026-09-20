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
        // El filtro va en SQL sobre createdAt, que es como se llama la columna
        // en esta tabla (camelCase, no created_at).
        //
        // Antes se filtraba en JS con `r.created_at || r.fecha || r.id`: como
        // ninguna de las dos primeras existe, terminaba comparando el id
        // (un número) contra la fecha (un string). En JS eso da NaN y las dos
        // comparaciones devuelven false, así que ninguna fila se descartaba:
        // el reporte ignoraba el período elegido y devolvía todo el histórico.
        const dateFilterIngresos = dateFilter.replace(/created_at/g, 'createdAt');
        const filteredRows: any = await query(
          `SELECT * FROM ingresos WHERE 1=1 ${dateFilterIngresos} ORDER BY id DESC`,
          params
        );

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
        // Mismo arreglo que en el caso 'ingresos': el filtro va en SQL contra
        // createdAt. El filtrado en JS buscaba created_at y fecha, que en esta
        // tabla no existen, y con `if (!fecha) return true` se quedaba con
        // todas las filas: el balance salía del histórico completo y no del
        // período elegido.
        const dateFilterIngresos = dateFilter.replace(/created_at/g, 'createdAt');
        const ingresosRows: any = await query(
          `SELECT * FROM ingresos WHERE 1=1 ${dateFilterIngresos} ORDER BY id DESC`,
          params
        );
        const egresosSql = dateFilter ? `SELECT * FROM egresos WHERE 1=1 ${dateFilter.replace(/created_at/g, 'fecha')}` : 'SELECT * FROM egresos ORDER BY id DESC';
        const egresosRows: any = await query(egresosSql, params);

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

      // Materia prima comprada en el período. Ver issue #4.
      //
      // Esto responde solo la primera mitad del reporte pedido ("cuánto se
      // compró"). La segunda ("cuánto se gastó") no se puede calcular:
      // materia_prima no guarda ningún costo -sus columnas son agregado_id,
      // cantidad, unidad, fecha, proveedor_id, planta_id, chofer_id,
      // unidad_id, es_saldo_inicial, usuario_id- y egresos, que sí tiene
      // montos, no dice qué agregado se compró. La página lo aclara en vez de
      // mostrar un cero que parezca un dato.
      //
      // No se devuelve un total general de cantidad a propósito: cada agregado
      // se mide en su unidad (cemento en kilogramos, aditivos en litros,
      // fibras en bolsas) y sumarlos daría un número sin sentido.
      case 'materia-prima': {
        const dateFilterMp = dateFilter.replace(/created_at/g, 'mp.fecha');

        // Se agrupa por agregado_id (el FK) y no por el nombre: en la tabla de
        // agregados el cemento está cargado como " CEMENTO", con un espacio
        // adelante. Agrupando por el id eso no importa, y el nombre se recorta
        // solo para mostrarlo.
        //
        // es_saldo_inicial = 0 excluye las cargas de inventario inicial, que no
        // son compras del período: sin ese filtro el primer mes mostraría
        // compras que nunca ocurrieron.
        const porAgregado: any = await query(
          `SELECT mp.agregado_id AS agregadoId,
                  TRIM(a.nombre) AS agregado,
                  COALESCE(NULLIF(TRIM(mp.unidad), ''), a.unidad_medida, '—') AS unidad,
                  COUNT(*) AS entradas,
                  SUM(mp.cantidad) AS cantidad
           FROM materia_prima mp
           LEFT JOIN agregados a ON mp.agregado_id = a.id
           WHERE mp.es_saldo_inicial = 0 ${dateFilterMp}
           GROUP BY mp.agregado_id, TRIM(a.nombre),
                    COALESCE(NULLIF(TRIM(mp.unidad), ''), a.unidad_medida, '—')
           ORDER BY entradas DESC, agregado`,
          params
        );

        const porMes: any = await query(
          `SELECT DATE_FORMAT(mp.fecha, '%Y-%m') AS mes,
                  TRIM(a.nombre) AS agregado,
                  COALESCE(NULLIF(TRIM(mp.unidad), ''), a.unidad_medida, '—') AS unidad,
                  COUNT(*) AS entradas,
                  SUM(mp.cantidad) AS cantidad
           FROM materia_prima mp
           LEFT JOIN agregados a ON mp.agregado_id = a.id
           WHERE mp.es_saldo_inicial = 0 ${dateFilterMp}
           GROUP BY DATE_FORMAT(mp.fecha, '%Y-%m'), mp.agregado_id, TRIM(a.nombre),
                    COALESCE(NULLIF(TRIM(mp.unidad), ''), a.unidad_medida, '—')
           ORDER BY mes DESC, agregado`,
          params
        );

        const porProveedor: any = await query(
          `SELECT COALESCE(TRIM(p.nombre), 'Sin proveedor') AS proveedor,
                  COUNT(*) AS entradas,
                  COUNT(DISTINCT mp.agregado_id) AS agregadosDistintos
           FROM materia_prima mp
           LEFT JOIN proveedores p ON mp.proveedor_id = p.id
           WHERE mp.es_saldo_inicial = 0 ${dateFilterMp}
           GROUP BY COALESCE(TRIM(p.nombre), 'Sin proveedor')
           ORDER BY entradas DESC`,
          params
        );

        // Las cargas de inventario inicial se cuentan aparte, para que se vea
        // que existen y no parezca que faltan entradas.
        const saldoInicial: any = await query(
          `SELECT COUNT(*) AS entradas
           FROM materia_prima mp
           WHERE mp.es_saldo_inicial = 1 ${dateFilterMp}`,
          params
        );

        const num = (rows: any[]) => rows.map((r: any) => ({
          ...r,
          entradas: Number(r.entradas),
          cantidad: r.cantidad === undefined ? undefined : Number(r.cantidad || 0),
        }));

        const agregados = num(porAgregado);
        const meses = num(porMes);

        return NextResponse.json({
          success: true,
          data: agregados,
          porMes: meses,
          porProveedor: porProveedor.map((r: any) => ({
            ...r,
            entradas: Number(r.entradas),
            agregadosDistintos: Number(r.agregadosDistintos),
          })),
          summary: {
            entradas: agregados.reduce((s: number, r: any) => s + r.entradas, 0),
            agregados: agregados.length,
            proveedores: porProveedor.length,
            entradasSaldoInicial: Number(saldoInicial[0]?.entradas || 0),
            // Cantidad comprada por material, cada una en su unidad. Se manda
            // como lista y no como un mapa de un solo número justamente para
            // que la vista no las pueda sumar entre sí.
            cantidadPorAgregado: agregados.map((r: any) => ({
              agregado: r.agregado, unidad: r.unidad, cantidad: r.cantidad,
            })),
          },
        });
      }

      // Comisiones de vendedores. Ver issue #5.
      //
      // Reglas del negocio, según se definieron:
      //   * La comisión se devenga cuando entra la plata, o sea por cada
      //     ingreso registrado (no por guía despachada ni por factura emitida).
      //   * Puede ser un monto fijo (comision_monto) o un porcentaje de la
      //     venta (comision_porcentaje). Son excluyentes: el formulario deja
      //     cargar uno u otro, y el que no se eligió queda en NULL.
      //   * Se paga en la moneda en que se cobró: si el ingreso entró en
      //     bolívares la comisión es en bolívares, y si entró en dólares es en
      //     dólares. Por eso NO se suman las dos en un solo total: se llevan
      //     dos columnas separadas y mezclarlas daría un número sin sentido.
      //
      // ingresos.moneda es la columna que hace posible esto último; ver
      // sql/migracion_moneda_ingresos.sql (antes la moneda del pago se
      // descartaba al guardar).
      case 'comisiones': {
        const dateFilterIngresos = dateFilter.replace(/created_at/g, 'i.createdAt');

        // El porcentaje se aplica sobre el monto de la venta en la moneda del
        // pago: precioBs si se cobró en bolívares, precioDivisa si en dólares.
        const comisionBs = `CASE WHEN i.moneda = 'BS' THEN
             COALESCE(i.comision_monto, 0) + (i.precioBs * COALESCE(i.comision_porcentaje, 0) / 100)
           ELSE 0 END`;
        const comisionUsd = `CASE WHEN i.moneda = 'USD' THEN
             COALESCE(i.comision_monto, 0) + (i.precioDivisa * COALESCE(i.comision_porcentaje, 0) / 100)
           ELSE 0 END`;

        const porVendedor: any = await query(
          `SELECT i.vendedor,
                  COUNT(*) AS operaciones,
                  SUM(${comisionBs}) AS comisionBs,
                  SUM(${comisionUsd}) AS comisionUsd,
                  SUM(CASE WHEN i.moneda = 'BS' THEN i.precioBs ELSE 0 END) AS ventaBs,
                  SUM(CASE WHEN i.moneda = 'USD' THEN i.precioDivisa ELSE 0 END) AS ventaUsd,
                  SUM(COALESCE(i.m3, 0)) AS totalM3,
                  SUM(CASE WHEN i.comision_monto IS NOT NULL THEN 1 ELSE 0 END) AS opsMontoFijo,
                  SUM(CASE WHEN i.comision_porcentaje IS NOT NULL THEN 1 ELSE 0 END) AS opsPorcentaje
           FROM ingresos i
           WHERE 1=1 ${dateFilterIngresos}
           GROUP BY i.vendedor
           ORDER BY comisionBs DESC, comisionUsd DESC`,
          params
        );

        // Detalle operación por operación, para poder auditar de dónde sale el
        // monto de cada vendedor.
        const detalle: any = await query(
          `SELECT i.id, i.vendedor, i.nombreCliente, i.referencia, i.moneda,
                  i.m3, i.precioBs, i.precioDivisa,
                  i.comision_porcentaje AS comisionPorcentaje,
                  i.comision_monto AS comisionMonto,
                  ${comisionBs} AS comisionBs,
                  ${comisionUsd} AS comisionUsd,
                  i.createdAt AS fecha
           FROM ingresos i
           WHERE 1=1 ${dateFilterIngresos}
           ORDER BY i.createdAt DESC, i.id DESC`,
          params
        );

        const data = porVendedor.map((r: any) => ({
          vendedor: r.vendedor,
          operaciones: Number(r.operaciones),
          comisionBs: Number(r.comisionBs || 0),
          comisionUsd: Number(r.comisionUsd || 0),
          ventaBs: Number(r.ventaBs || 0),
          ventaUsd: Number(r.ventaUsd || 0),
          totalM3: Number(r.totalM3 || 0),
          opsMontoFijo: Number(r.opsMontoFijo || 0),
          opsPorcentaje: Number(r.opsPorcentaje || 0),
        }));

        const comisionPorVendedorBs: Record<string, number> = {};
        data.forEach((r: any) => {
          if (r.comisionBs > 0) comisionPorVendedorBs[r.vendedor] = r.comisionBs;
        });

        return NextResponse.json({
          success: true,
          data,
          detalle: detalle.map((r: any) => ({
            ...r,
            m3: r.m3 === null ? null : Number(r.m3),
            precioBs: Number(r.precioBs || 0),
            precioDivisa: Number(r.precioDivisa || 0),
            comisionPorcentaje: r.comisionPorcentaje === null ? null : Number(r.comisionPorcentaje),
            comisionMonto: r.comisionMonto === null ? null : Number(r.comisionMonto),
            comisionBs: Number(r.comisionBs || 0),
            comisionUsd: Number(r.comisionUsd || 0),
          })),
          summary: {
            totalComisionBs: data.reduce((s: number, r: any) => s + r.comisionBs, 0),
            totalComisionUsd: data.reduce((s: number, r: any) => s + r.comisionUsd, 0),
            vendedores: data.length,
            operaciones: data.reduce((s: number, r: any) => s + r.operaciones, 0),
            comisionPorVendedorBs,
          },
        });
      }

      // Principales clientes del período. Ver issue #3.
      //
      // Los M³ salen de guia_despacho, que se une a clientes por FK y es
      // confiable. La plata sale de ingresos, que NO tiene cliente_id: guarda
      // el nombre y el RIF como texto. Se agrupa por RIF (más estable que el
      // nombre) y se cruza contra clientes.rif. Lo que no matchee ningún
      // cliente se devuelve igual, como fila aparte, para no esconder plata.
      case 'clientes-top': {
        const dateFilterGuias = dateFilter.replace(/created_at/g, 'gd.created_at');
        // ingresos usa createdAt en camelCase, no created_at.
        const dateFilterIngresos = dateFilter.replace(/created_at/g, 'i.createdAt');

        const porM3: any = await query(
          `SELECT c.id AS clienteId, c.nombre AS cliente, c.rif, c.vendedor,
                  COUNT(*) AS guias, SUM(gd.cantidad_m3) AS totalM3
           FROM guia_despacho gd
           JOIN clientes c ON gd.cliente_id = c.id
           WHERE 1=1 ${dateFilterGuias}
           GROUP BY c.id, c.nombre, c.rif, c.vendedor
           ORDER BY totalM3 DESC`,
          params
        );

        const porPlata: any = await query(
          `SELECT i.rif, MIN(i.nombreCliente) AS nombreCliente,
                  COUNT(*) AS operaciones,
                  SUM(i.precioBs) AS totalBs,
                  SUM(i.precioDivisa) AS totalDivisa
           FROM ingresos i
           WHERE 1=1 ${dateFilterIngresos}
           GROUP BY i.rif`,
          params
        );

        const plataPorRif = new Map<string, any>();
        porPlata.forEach((r: any) => {
          plataPorRif.set(String(r.rif || '').trim().toUpperCase(), {
            operaciones: Number(r.operaciones),
            totalBs: Number(r.totalBs || 0),
            totalDivisa: Number(r.totalDivisa || 0),
            nombreCliente: r.nombreCliente,
          });
        });

        const data = porM3.map((r: any) => {
          const clave = String(r.rif || '').trim().toUpperCase();
          const plata = plataPorRif.get(clave);
          if (plata) plataPorRif.delete(clave);
          return {
            clienteId: r.clienteId,
            cliente: r.cliente,
            rif: r.rif,
            vendedor: r.vendedor,
            guias: Number(r.guias),
            totalM3: Number(r.totalM3 || 0),
            operaciones: plata?.operaciones || 0,
            totalBs: plata?.totalBs || 0,
            totalDivisa: plata?.totalDivisa || 0,
          };
        });

        // Ingresos cuyo RIF no coincide con ningún cliente que haya despachado
        // en el período: se agregan para que los totales de plata cierren.
        plataPorRif.forEach((plata, rif) => {
          data.push({
            clienteId: null,
            cliente: plata.nombreCliente || 'Cliente sin identificar',
            rif,
            vendedor: null,
            guias: 0,
            totalM3: 0,
            operaciones: plata.operaciones,
            totalBs: plata.totalBs,
            totalDivisa: plata.totalDivisa,
          });
        });

        const totalM3 = data.reduce((s: number, r: any) => s + r.totalM3, 0);
        const totalBs = data.reduce((s: number, r: any) => s + r.totalBs, 0);

        const conPorcentaje = data.map((r: any) => ({
          ...r,
          porcentajeM3: totalM3 > 0 ? (r.totalM3 / totalM3) * 100 : 0,
          porcentajeBs: totalBs > 0 ? (r.totalBs / totalBs) * 100 : 0,
        }));

        const topM3 = [...conPorcentaje].sort((a, b) => b.totalM3 - a.totalM3);
        const m3PorCliente: Record<string, number> = {};
        topM3.slice(0, 10).forEach((r: any) => { m3PorCliente[r.cliente] = r.totalM3; });

        return NextResponse.json({
          success: true,
          data: conPorcentaje,
          summary: {
            totalM3,
            totalBs,
            clientes: conPorcentaje.filter((r: any) => r.totalM3 > 0).length,
            // Cuánto del volumen concentran los tres primeros: si es muy alto,
            // la facturación depende de pocos clientes.
            concentracionTop3: totalM3 > 0
              ? (topM3.slice(0, 3).reduce((s: number, r: any) => s + r.totalM3, 0) / totalM3) * 100
              : 0,
            m3PorCliente,
          },
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
