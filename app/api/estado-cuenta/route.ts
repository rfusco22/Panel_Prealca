import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

// Estado de cuenta de clientes.
//
// Cargos (Debe):  facturas del cliente, excepto las anuladas. Se toma `total`,
//                 que ya viene con IVA y descontada la retención.
// Abonos (Haber): ingresos del cliente. El ingreso no tiene cliente_id, solo
//                 nombreCliente y rif copiados como texto, así que se vincula
//                 por RIF y, si no hay RIF, por nombre. El monto es lo que
//                 entró al banco: precioBs + montoIva.
// Despachos:      guías de despacho del cliente (M³), como referencia de lo
//                 entregado; hoy las guías se emiten con precio 0, por eso no
//                 suman al saldo.
//
// Expone montos facturados y cobrados: admin y gerencia.
export const dynamic = 'force-dynamic';

const MATCH_INGRESO = `(
  (c.rif IS NOT NULL AND c.rif <> '' AND i.rif = c.rif)
  OR ((i.rif IS NULL OR i.rif = '') AND i.nombreCliente = c.nombre)
)`;

const MONTO_INGRESO = `(COALESCE(i.precioBs, 0) + COALESCE(i.montoIva, 0))`;

function esFecha(v: string | null): v is string {
  return !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

export async function GET(req: Request) {
  const auth = await requireAuth(['admin', 'gerencia']);
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const clienteId = Number(searchParams.get('clienteId'));
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // ── Resumen de todos los clientes ──
    if (!Number.isInteger(clienteId) || clienteId <= 0) {
      const filas: any = await query(`
        SELECT c.id, c.nombre, c.rif, c.telefono, c.vendedor,
          (SELECT COALESCE(SUM(f.total), 0) FROM facturas f
            WHERE f.cliente_id = c.id AND COALESCE(f.estado, '') <> 'Anulada') AS totalFacturado,
          (SELECT COUNT(*) FROM facturas f
            WHERE f.cliente_id = c.id AND COALESCE(f.estado, '') <> 'Anulada') AS cantidadFacturas,
          (SELECT COALESCE(SUM(${MONTO_INGRESO}), 0) FROM ingresos i WHERE ${MATCH_INGRESO}) AS totalPagado,
          (SELECT COALESCE(SUM(i.precioDivisa), 0) FROM ingresos i WHERE ${MATCH_INGRESO}) AS totalPagadoUsd,
          (SELECT COUNT(*) FROM ingresos i WHERE ${MATCH_INGRESO}) AS cantidadPagos,
          (SELECT COALESCE(SUM(gd.cantidad_m3), 0) FROM guia_despacho gd WHERE gd.cliente_id = c.id) AS totalM3,
          (SELECT MAX(f.created_at) FROM facturas f WHERE f.cliente_id = c.id) AS ultimaFactura,
          (SELECT MAX(i.createdAt) FROM ingresos i WHERE ${MATCH_INGRESO}) AS ultimoPago
        FROM clientes c
        ORDER BY c.nombre ASC
      `);

      const clientes = filas.map((r: any) => {
        const totalFacturado = Number(r.totalFacturado || 0);
        const totalPagado = Number(r.totalPagado || 0);
        return {
          ...r,
          totalFacturado,
          totalPagado,
          totalPagadoUsd: Number(r.totalPagadoUsd || 0),
          totalM3: Number(r.totalM3 || 0),
          cantidadFacturas: Number(r.cantidadFacturas || 0),
          cantidadPagos: Number(r.cantidadPagos || 0),
          saldo: totalFacturado - totalPagado,
        };
      });

      return NextResponse.json({ success: true, clientes });
    }

    // ── Detalle de un cliente ──
    const clientesRows: any = await query(
      'SELECT id, nombre, rif, telefono, direccion, vendedor FROM clientes WHERE id = ?',
      [clienteId]
    );
    if (clientesRows.length === 0) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }
    const cliente = clientesRows[0];

    const facturas: any = await query(
      `SELECT f.id, f.created_at AS fecha, f.fecha_vencimiento AS fechaVencimiento, f.estado,
              f.forma_pago AS formaPago, f.subtotal, f.iva_monto AS ivaMonto,
              f.monto_retencion AS montoRetencion, f.total, f.guia_despacho_id AS guiaDespachoId
       FROM facturas f
       WHERE f.cliente_id = ? AND COALESCE(f.estado, '') <> 'Anulada'
       ORDER BY f.created_at ASC, f.id ASC`,
      [clienteId]
    );

    const ingresos: any = await query(
      `SELECT i.id, i.createdAt AS fecha, i.banco, i.tipoDocumento, i.referencia, i.descripcion,
              i.moneda, i.precioBs, i.montoIva, i.precioDivisa, i.tasaCambio,
              ${MONTO_INGRESO} AS monto
       FROM ingresos i, clientes c
       WHERE c.id = ? AND ${MATCH_INGRESO}
       ORDER BY i.createdAt ASC, i.id ASC`,
      [clienteId]
    );

    const guias: any = await query(
      `SELECT gd.id, gd.numero_guia AS numeroGuia, gd.tipo, gd.created_at AS fecha,
              gd.cantidad_m3 AS cantidadM3, gd.obra,
              CONCAT(p.resistencia, ' - ', p.pulgada) AS producto,
              COALESCE(ch.nombre, gd.chofer) AS chofer
       FROM guia_despacho gd
       LEFT JOIN productos p ON gd.producto_id = p.id
       LEFT JOIN choferes ch ON gd.chofer_id = ch.id
       WHERE gd.cliente_id = ?
       ORDER BY gd.created_at DESC, gd.id DESC`,
      [clienteId]
    );

    // Movimientos en orden cronológico con saldo corrido.
    type Mov = {
      tipo: 'factura' | 'pago';
      id: number;
      fecha: string;
      documento: string;
      descripcion: string;
      debe: number;
      haber: number;
      estado?: string | null;
      saldo?: number;
    };
    const movimientos: Mov[] = [
      ...facturas.map((f: any): Mov => ({
        tipo: 'factura',
        id: f.id,
        fecha: String(f.fecha || ''),
        documento: `Factura #${f.id}`,
        descripcion: [
          f.formaPago ? `Forma de pago: ${f.formaPago}` : null,
          f.guiaDespachoId ? `Guía #${f.guiaDespachoId}` : null,
          f.fechaVencimiento ? `Vence: ${String(f.fechaVencimiento).slice(0, 10)}` : null,
        ].filter(Boolean).join(' · '),
        debe: Number(f.total || 0),
        haber: 0,
        estado: f.estado,
      })),
      ...ingresos.map((i: any): Mov => ({
        tipo: 'pago',
        id: i.id,
        fecha: String(i.fecha || ''),
        documento: `${i.tipoDocumento || 'Pago'}${i.referencia ? ` Ref. ${i.referencia}` : ''}`,
        descripcion: [i.banco, i.descripcion].filter(Boolean).join(' · '),
        debe: 0,
        haber: Number(i.monto || 0),
      })),
    ].sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : a.tipo === 'factura' ? -1 : 1));

    // Saldo anterior: lo que quedó antes de `from`.
    let saldoAnterior = 0;
    let saldo = 0;
    const enRango: Mov[] = [];
    for (const m of movimientos) {
      const dia = m.fecha.slice(0, 10);
      saldo += m.debe - m.haber;
      if (esFecha(from) && dia < from) {
        saldoAnterior = saldo;
        continue;
      }
      if (esFecha(to) && dia > to) continue;
      enRango.push({ ...m, saldo });
    }

    const totalFacturado = facturas.reduce((s: number, f: any) => s + Number(f.total || 0), 0);
    const totalPagado = ingresos.reduce((s: number, i: any) => s + Number(i.monto || 0), 0);
    const totalPagadoUsd = ingresos.reduce((s: number, i: any) => s + Number(i.precioDivisa || 0), 0);
    const debePeriodo = enRango.reduce((s, m) => s + m.debe, 0);
    const haberPeriodo = enRango.reduce((s, m) => s + m.haber, 0);

    const guiasEnRango = guias.filter((g: any) => {
      const dia = String(g.fecha || '').slice(0, 10);
      if (esFecha(from) && dia < from) return false;
      if (esFecha(to) && dia > to) return false;
      return true;
    });

    // Facturas pendientes con antigüedad (sin aplicar pagos factura por factura:
    // el sistema no registra a qué factura corresponde cada pago).
    const pendientes = facturas
      .filter((f: any) => (f.estado || 'Pendiente') !== 'Pagada')
      .map((f: any) => ({
        id: f.id,
        fecha: f.fecha,
        fechaVencimiento: f.fechaVencimiento,
        total: Number(f.total || 0),
        estado: f.estado || 'Pendiente',
      }));

    return NextResponse.json({
      success: true,
      cliente,
      resumen: {
        totalFacturado,
        totalPagado,
        totalPagadoUsd,
        saldo: totalFacturado - totalPagado,
        saldoAnterior,
        debePeriodo,
        haberPeriodo,
        saldoFinal: saldoAnterior + debePeriodo - haberPeriodo,
        totalM3: guiasEnRango.reduce((s: number, g: any) => s + Number(g.cantidadM3 || 0), 0),
        cantidadGuias: guiasEnRango.length,
      },
      movimientos: enRango,
      guias: guiasEnRango.map((g: any) => ({ ...g, cantidadM3: Number(g.cantidadM3 || 0) })),
      pendientes,
    });
  } catch (error) {
    console.error('Error GET /api/estado-cuenta:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
