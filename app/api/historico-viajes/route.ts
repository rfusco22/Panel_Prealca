import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';
import { hoyLocal, hoyLocalMasDias } from '@/lib/fecha';

// Histórico de viajes por período (diario, semanal, mensual), separado en:
//   - Despacho:      guías de despacho (concreto que sale al cliente), en M³.
//   - Materia prima: entradas de materia prima con chofer (piedra, arena,
//                    cemento... que traen los choferes), sin contar saldos
//                    iniciales, que son ajustes y no viajes.
//
// No expone montos: solo cantidades de viajes y volumen. Por eso también lo
// puede ver Seguridad Vial además de admin, gerencia y dosificador.
export const dynamic = 'force-dynamic';

type Periodo = 'diario' | 'semanal' | 'mensual';

// La semana arranca el lunes; se identifica por la fecha de ese lunes.
function exprPeriodo(periodo: Periodo, col: string) {
  if (periodo === 'mensual') return `DATE_FORMAT(${col}, '%Y-%m')`;
  if (periodo === 'semanal') return `DATE_FORMAT(DATE_SUB(DATE(${col}), INTERVAL WEEKDAY(${col}) DAY), '%Y-%m-%d')`;
  return `DATE_FORMAT(${col}, '%Y-%m-%d')`;
}

const esFecha = (v: string | null): v is string => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);

export async function GET(req: Request) {
  const auth = await requireAuth(['admin', 'gerencia', 'dosificador', 'seguridad-vial']);
  if (auth.response) return auth.response;

  try {
    try { await query(`ALTER TABLE materia_prima ADD COLUMN es_saldo_inicial TINYINT(1) DEFAULT 0`); } catch {}
    try { await query(`ALTER TABLE materia_prima ADD COLUMN chofer_id INT NULL`); } catch {}
    try { await query(`ALTER TABLE materia_prima ADD COLUMN unidad_id INT NULL`); } catch {}

    const { searchParams } = new URL(req.url);
    const p = searchParams.get('periodo');
    const periodo: Periodo = p === 'semanal' || p === 'mensual' ? p : 'diario';
    const diasPorDefecto = periodo === 'diario' ? 30 : periodo === 'semanal' ? 7 * 12 : 365;
    const from = esFecha(searchParams.get('from')) ? searchParams.get('from')! : hoyLocalMasDias(-diasPorDefecto + 1);
    const to = esFecha(searchParams.get('to')) ? searchParams.get('to')! : hoyLocal();
    const choferId = Number(searchParams.get('choferId')) || null;

    // ── Despacho ──
    const pD: any[] = [from, `${to} 23:59:59`];
    let filtroChoferD = '';
    if (choferId) { filtroChoferD = ' AND gd.chofer_id = ?'; pD.push(choferId); }

    const despachoPeriodo: any = await query(
      `SELECT periodo, COUNT(*) AS viajes, COALESCE(SUM(m3), 0) AS m3,
              COUNT(DISTINCT chofer) AS choferes, COUNT(DISTINCT cliente_id) AS clientes
       FROM (
         SELECT ${exprPeriodo(periodo, 'gd.created_at')} AS periodo, gd.cantidad_m3 AS m3,
                COALESCE(CAST(gd.chofer_id AS CHAR), gd.chofer) AS chofer, gd.cliente_id
         FROM guia_despacho gd
         WHERE gd.created_at >= ? AND gd.created_at <= ? ${filtroChoferD}
       ) t
       GROUP BY periodo ORDER BY periodo ASC`,
      pD
    );

    const despachoChofer: any = await query(
      `SELECT gd.chofer_id AS choferId, COALESCE(ch.nombre, gd.chofer, 'Sin chofer') AS chofer,
              COUNT(*) AS viajes, COALESCE(SUM(gd.cantidad_m3), 0) AS m3
       FROM guia_despacho gd
       LEFT JOIN choferes ch ON gd.chofer_id = ch.id
       WHERE gd.created_at >= ? AND gd.created_at <= ? ${filtroChoferD}
       GROUP BY gd.chofer_id, COALESCE(ch.nombre, gd.chofer, 'Sin chofer')`,
      pD
    );

    const despachoDetalle: any = await query(
      `SELECT gd.id, gd.numero_guia AS numeroGuia, gd.tipo, gd.created_at AS fecha,
              ${exprPeriodo(periodo, 'gd.created_at')} AS periodo,
              gd.cantidad_m3 AS cantidad, COALESCE(ch.nombre, gd.chofer) AS chofer,
              un.numero_unidad AS unidad, c.nombre AS cliente, gd.obra,
              CONCAT(p.resistencia, ' - ', p.pulgada) AS producto
       FROM guia_despacho gd
       LEFT JOIN choferes ch ON gd.chofer_id = ch.id
       LEFT JOIN unidades un ON gd.unidad_id = un.id
       LEFT JOIN clientes c ON gd.cliente_id = c.id
       LEFT JOIN productos p ON gd.producto_id = p.id
       WHERE gd.created_at >= ? AND gd.created_at <= ? ${filtroChoferD}
       ORDER BY gd.created_at DESC, gd.id DESC
       LIMIT 2000`,
      pD
    );

    // ── Materia prima ──
    const pM: any[] = [from, to];
    let filtroChoferM = '';
    if (choferId) { filtroChoferM = ' AND mp.chofer_id = ?'; pM.push(choferId); }
    const baseMp = `FROM materia_prima mp
       LEFT JOIN agregados a ON mp.agregado_id = a.id
       LEFT JOIN choferes ch ON mp.chofer_id = ch.id
       WHERE COALESCE(mp.es_saldo_inicial, 0) = 0 AND mp.fecha >= ? AND mp.fecha <= ? ${filtroChoferM}`;

    const mpPeriodo: any = await query(
      `SELECT periodo, COUNT(*) AS viajes, COALESCE(SUM(cantidad), 0) AS cantidad, COUNT(DISTINCT chofer_id) AS choferes
       FROM (
         SELECT ${exprPeriodo(periodo, 'mp.fecha')} AS periodo, mp.cantidad, mp.chofer_id ${baseMp}
       ) t
       GROUP BY periodo ORDER BY periodo ASC`,
      pM
    );

    const mpMaterial: any = await query(
      `SELECT periodo, material, unidad, COUNT(*) AS viajes, COALESCE(SUM(cantidad), 0) AS cantidad
       FROM (
         SELECT ${exprPeriodo(periodo, 'mp.fecha')} AS periodo, TRIM(COALESCE(a.nombre, 'Sin material')) AS material,
                COALESCE(a.unidad_medida, mp.unidad, 'M3') AS unidad, mp.cantidad ${baseMp}
       ) t
       GROUP BY periodo, material, unidad ORDER BY periodo ASC, material ASC`,
      pM
    );

    const mpChofer: any = await query(
      `SELECT mp.chofer_id AS choferId, COALESCE(ch.nombre, 'Sin chofer') AS chofer,
              COUNT(*) AS viajes, COALESCE(SUM(mp.cantidad), 0) AS cantidad
       ${baseMp}
       GROUP BY mp.chofer_id, COALESCE(ch.nombre, 'Sin chofer')`,
      pM
    );

    const mpDetalle: any = await query(
      `SELECT mp.id, mp.fecha, ${exprPeriodo(periodo, 'mp.fecha')} AS periodo, mp.cantidad,
              COALESCE(a.unidad_medida, mp.unidad) AS unidad, TRIM(a.nombre) AS material,
              ch.nombre AS chofer, un.numero_unidad AS unidadNumero, pv.nombre AS proveedor
       FROM materia_prima mp
       LEFT JOIN agregados a ON mp.agregado_id = a.id
       LEFT JOIN choferes ch ON mp.chofer_id = ch.id
       LEFT JOIN unidades un ON mp.unidad_id = un.id
       LEFT JOIN proveedores pv ON mp.proveedor_id = pv.id
       WHERE COALESCE(mp.es_saldo_inicial, 0) = 0 AND mp.fecha >= ? AND mp.fecha <= ? ${filtroChoferM}
       ORDER BY mp.fecha DESC, mp.id DESC
       LIMIT 2000`,
      pM
    );

    // ── Unificar por período ──
    const periodos = new Map<string, any>();
    const fila = (k: string) => {
      if (!periodos.has(k)) {
        periodos.set(k, { periodo: k, viajesDespacho: 0, m3Despacho: 0, viajesMP: 0, cantidadMP: 0, materiales: [] as any[] });
      }
      return periodos.get(k);
    };
    for (const r of despachoPeriodo) {
      const f = fila(String(r.periodo));
      f.viajesDespacho = Number(r.viajes); f.m3Despacho = Number(r.m3);
    }
    for (const r of mpPeriodo) {
      const f = fila(String(r.periodo));
      f.viajesMP = Number(r.viajes); f.cantidadMP = Number(r.cantidad);
    }
    for (const r of mpMaterial) {
      fila(String(r.periodo)).materiales.push({
        material: r.material, unidad: r.unidad, viajes: Number(r.viajes), cantidad: Number(r.cantidad),
      });
    }
    const serie = [...periodos.values()].sort((a, b) => (a.periodo < b.periodo ? -1 : 1));

    // ── Unificar por chofer ──
    const choferes = new Map<string, any>();
    const filaCh = (id: any, nombre: string) => {
      const k = id ? `id:${id}` : `n:${nombre}`;
      if (!choferes.has(k)) choferes.set(k, { choferId: id ?? null, chofer: nombre, viajesDespacho: 0, m3Despacho: 0, viajesMP: 0, cantidadMP: 0 });
      return choferes.get(k);
    };
    for (const r of despachoChofer) {
      const f = filaCh(r.choferId, r.chofer);
      f.viajesDespacho += Number(r.viajes); f.m3Despacho += Number(r.m3);
    }
    for (const r of mpChofer) {
      const f = filaCh(r.choferId, r.chofer);
      f.viajesMP += Number(r.viajes); f.cantidadMP += Number(r.cantidad);
    }
    const porChofer = [...choferes.values()]
      .map((c) => ({ ...c, totalViajes: c.viajesDespacho + c.viajesMP }))
      .sort((a, b) => b.totalViajes - a.totalViajes);

    // Totales por material en todo el rango
    const totMat = new Map<string, any>();
    for (const r of mpMaterial) {
      const k = `${r.material}|${r.unidad}`;
      if (!totMat.has(k)) totMat.set(k, { material: r.material, unidad: r.unidad, viajes: 0, cantidad: 0 });
      const t = totMat.get(k); t.viajes += Number(r.viajes); t.cantidad += Number(r.cantidad);
    }

    return NextResponse.json({
      success: true,
      periodo, from, to,
      totales: {
        viajesDespacho: serie.reduce((s, r) => s + r.viajesDespacho, 0),
        m3Despacho: serie.reduce((s, r) => s + r.m3Despacho, 0),
        viajesMP: serie.reduce((s, r) => s + r.viajesMP, 0),
        cantidadMP: serie.reduce((s, r) => s + r.cantidadMP, 0),
      },
      serie,
      porChofer,
      porMaterial: [...totMat.values()].sort((a, b) => b.viajes - a.viajes),
      detalleDespacho: despachoDetalle.map((r: any) => ({ ...r, cantidad: Number(r.cantidad || 0) })),
      detalleMP: mpDetalle.map((r: any) => ({ ...r, cantidad: Number(r.cantidad || 0) })),
    });
  } catch (error) {
    console.error('Error GET /api/historico-viajes:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
