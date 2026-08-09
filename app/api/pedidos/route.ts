import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { emitSocketEvent } from '@/lib/socket-server';
import { registrarLog, getUsuarioFromRequest, getClientIp } from '@/lib/audit-log';

async function ensureTable() {
  await query(`CREATE TABLE IF NOT EXISTS pedidos (id INT AUTO_INCREMENT PRIMARY KEY, cliente_id INT NOT NULL, producto_id INT NOT NULL, cantidad_m3 DECIMAL(10,2) NOT NULL, estado ENUM('pendiente','en_proceso','completado','cancelado') DEFAULT 'pendiente', notas TEXT, usuario_id INT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`);
}

export async function GET() {
  try {
    await ensureTable();
    const pedidos = await query(`SELECT pe.id, pe.cliente_id AS clienteId, c.nombre AS clienteNombre, pe.producto_id AS productoId, CONCAT(p.resistencia, ' - ', p.pulgada) AS productoNombre, pe.cantidad_m3 AS cantidadM3, pe.estado, pe.notas, pe.usuario_id AS usuarioId, u.nombre AS usuarioNombre, pe.created_at AS fecha FROM pedidos pe LEFT JOIN clientes c ON pe.cliente_id = c.id LEFT JOIN productos p ON pe.producto_id = p.id LEFT JOIN users u ON pe.usuario_id = u.id ORDER BY pe.id DESC`);
    return NextResponse.json({ success: true, pedidos }, { status: 200 });
  } catch (error) {
    console.error('Error GET pedidos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureTable();
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const data = await request.json();
    const { clienteId, productoId, cantidadM3, notas } = data;
    if (!clienteId || !productoId || !cantidadM3) return NextResponse.json({ error: 'Cliente, producto y cantidad son requeridos' }, { status: 400 });
    const result: any = await query(`INSERT INTO pedidos (cliente_id, producto_id, cantidad_m3, notas, usuario_id) VALUES (?, ?, ?, ?, ?)`, [clienteId, productoId, cantidadM3, notas || null, session.userId]);
    emitSocketEvent('pedidos:created');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'crear', modulo: 'Pedidos', entidad_id: result.insertId,
      descripcion: `Creó pedido #${result.insertId} - ${cantidadM3} M3`,
      datos_nuevos: { clienteId, productoId, cantidadM3, notas },
      ip_address: getClientIp(request),
    });

    return NextResponse.json({ success: true, id: result.insertId }, { status: 201 });
  } catch (error) {
    console.error('Error POST pedidos:', error);
    return NextResponse.json({ error: 'Error al crear pedido' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await ensureTable();
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const data = await request.json();
    const { id, estado, notas } = data;
    if (!id) return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });

    const anterior: any = await query('SELECT id, estado, notas FROM pedidos WHERE id = ?', [id]);
    const old = anterior.length > 0 ? anterior[0] : null;

    await query(`UPDATE pedidos SET estado = COALESCE(?, estado), notas = COALESCE(?, notas) WHERE id = ?`, [estado || null, notas !== undefined ? notas : null, id]);
    emitSocketEvent('pedidos:updated');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'editar', modulo: 'Pedidos', entidad_id: id,
      descripcion: `Editó pedido #${id}${estado ? ` → Estado: ${estado}` : ''}`,
      datos_anteriores: old ? { estado: old.estado } : null,
      datos_nuevos: { estado, notas },
      ip_address: getClientIp(request),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error PUT pedidos:', error);
    return NextResponse.json({ error: 'Error al actualizar pedido' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await ensureTable();
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });

    const anterior: any = await query('SELECT id, cliente_id, estado FROM pedidos WHERE id = ?', [id]);
    const old = anterior.length > 0 ? anterior[0] : null;

    await query('DELETE FROM pedidos WHERE id = ?', [id]);
    emitSocketEvent('pedidos:deleted');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'eliminar', modulo: 'Pedidos', entidad_id: parseInt(id),
      descripcion: `Eliminó pedido #${id}`,
      datos_anteriores: old ? { cliente_id: old.cliente_id, estado: old.estado } : null,
      ip_address: getClientIp(request),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error DELETE pedidos:', error);
    return NextResponse.json({ error: 'Error al eliminar pedido' }, { status: 500 });
  }
}
