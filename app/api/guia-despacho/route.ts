import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { emitSocketEvent } from '@/lib/socket-server';
import { registrarLog, getUsuarioFromRequest, getClientIp } from '@/lib/audit-log';
import { requireAuth } from '@/lib/auth-guard';

async function ensurePedidoColumn() {
  try { await query(`ALTER TABLE guia_despacho ADD COLUMN pedido_id INT NULL`); } catch {}
  try { await query(`ALTER TABLE guia_despacho ADD COLUMN obra VARCHAR(255) NULL`); } catch {}
}

export async function GET() {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    await ensurePedidoColumn();
    const guias = await query(`SELECT gd.id, gd.tipo, gd.cliente_id AS clienteId, c.nombre AS clienteNombre, c.rif AS clienteRif, c.direccion AS clienteDireccion, c.telefono AS clienteTelefono, gd.producto_id AS productoId, CONCAT(p.resistencia, ' - ', p.pulgada) AS productoNombre, p.resistencia, p.pulgada, gd.cantidad_m3 AS cantidadM3, gd.precio_m3 AS precioM3, gd.iva_aplicado AS ivaAplicado, gd.iva_monto AS ivaMonto, gd.total, gd.chofer, gd.unidad_id AS unidadId, un.numero_unidad AS numeroUnidad, un.placa, gd.pedido_id AS pedidoId, pe.cantidad_m3 AS pedidoTotalM3, pe.obra AS pedidoObra, gd.obra, gd.usuario_id AS usuarioId, gd.created_at AS fecha FROM guia_despacho gd LEFT JOIN clientes c ON gd.cliente_id = c.id LEFT JOIN productos p ON gd.producto_id = p.id LEFT JOIN unidades un ON gd.unidad_id = un.id LEFT JOIN pedidos pe ON gd.pedido_id = pe.id ORDER BY gd.id DESC`);
    return NextResponse.json({ success: true, guias }, { status: 200 });
  } catch (error) {
    console.error('Error GET guia_despacho:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensurePedidoColumn();
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const data = await request.json();
    const { tipo, clienteId, productoId, cantidadM3, chofer, unidadId, pedidoId, obra } = data;

    // Auto-obtener obra del pedido si no se envía
    let obraFinal = obra || null;
    if (pedidoId && !obraFinal) {
      const [pedidoRows]: any = await query('SELECT obra FROM pedidos WHERE id = ?', [pedidoId]);
      if (pedidoRows?.obra) obraFinal = pedidoRows.obra;
    }

    // Validar stock disponible
    const stockRows: any = await query(`
      SELECT MIN(
        CASE 
          WHEN pf.cantidad = 0 THEN 999999999
          ELSE (
            COALESCE(
              (SELECT SUM(mp.cantidad) FROM materia_prima mp WHERE mp.agregado_id = pf.agregado_id), 0
            ) - COALESCE(
              (SELECT SUM(gd.cantidad_m3 * pf2.cantidad) 
               FROM guia_despacho gd 
               INNER JOIN producto_formulas pf2 ON pf2.producto_id = gd.producto_id 
               WHERE pf2.agregado_id = pf.agregado_id), 0
            )
          ) / pf.cantidad
        END
      ) AS stockDisponible
      FROM producto_formulas pf
      WHERE pf.producto_id = ?
    `, [productoId]);

    const stockDisponible = stockRows.length > 0 ? Number(stockRows[0].stockDisponible) : null;
    if (stockDisponible !== null && stockDisponible <= 0) {
      return NextResponse.json({ error: `No hay stock disponible para este producto. Stock actual: ${stockDisponible} M³` }, { status: 400 });
    }
    if (stockDisponible !== null && Number(cantidadM3) > stockDisponible) {
      return NextResponse.json({ error: `La cantidad solicitada (${cantidadM3} M³) excede el stock disponible (${stockDisponible} M³)` }, { status: 400 });
    }

    const result: any = await query(`INSERT INTO guia_despacho (tipo, cliente_id, producto_id, cantidad_m3, chofer, unidad_id, pedido_id, obra, usuario_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [tipo, clienteId, productoId, cantidadM3, chofer, unidadId || null, pedidoId || null, obraFinal, session.userId]);

    if (pedidoId) {
      const [pedidoRows]: any = await query('SELECT cantidad_m3 FROM pedidos WHERE id = ?', [pedidoId]);
      const pedidoTotal = Number(pedidoRows?.cantidad_m3 || 0);
      const [sumRows]: any = await query('SELECT COALESCE(SUM(cantidad_m3), 0) AS totalGuias FROM guia_despacho WHERE pedido_id = ?', [pedidoId]);
      const totalGuias = Number(sumRows?.totalGuias || 0);
      if (totalGuias >= pedidoTotal) {
        await query("UPDATE pedidos SET estado = 'completado' WHERE id = ?", [pedidoId]);
        emitSocketEvent('pedidos:updated');
      } else if (totalGuias > 0) {
        await query("UPDATE pedidos SET estado = 'en_proceso' WHERE id = ?", [pedidoId]);
        emitSocketEvent('pedidos:updated');
      }
    }
    emitSocketEvent('guia-despacho:created');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'crear', modulo: 'Guías de Despacho', entidad_id: result.insertId,
      descripcion: `Creó guía #${result.insertId} (${tipo}) - ${cantidadM3} M3`,
      datos_nuevos: { tipo, clienteId, productoId, cantidadM3, chofer, pedidoId, obra: obraFinal },
      ip_address: getClientIp(request),
    });

    return NextResponse.json({ success: true, id: result.insertId }, { status: 201 });
  } catch (error) {
    console.error('Error POST guia_despacho:', error);
    return NextResponse.json({ error: 'Error al crear guía de despacho' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });

    const anterior: any = await query('SELECT id, tipo, cliente_id, cantidad_m3 FROM guia_despacho WHERE id = ?', [id]);
    const old = anterior.length > 0 ? anterior[0] : null;

    await query('DELETE FROM guia_despacho WHERE id = ?', [id]);
    emitSocketEvent('guia-despacho:deleted');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'eliminar', modulo: 'Guías de Despacho', entidad_id: parseInt(id),
      descripcion: `Eliminó guía #${id}`,
      datos_anteriores: old ? { tipo: old.tipo, cliente_id: old.cliente_id, cantidad_m3: old.cantidad_m3 } : null,
      ip_address: getClientIp(request),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error DELETE guia_despacho:', error);
    return NextResponse.json({ error: 'Error al eliminar guía de despacho' }, { status: 500 });
  }
}
