import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { emitSocketEvent } from '@/lib/socket-server';
import { registrarLog, getUsuarioFromRequest, getClientIp } from '@/lib/audit-log';

export async function GET() {
  try {
    const facturas = await query(`SELECT f.id, f.guia_despacho_id AS guiaDespachoId, f.cliente_id AS clienteId, c.nombre AS clienteNombre, f.forma_pago AS formaPago, f.comprobante_retencion AS comprobanteRetencion, f.total, f.usuario_id AS usuarioId, f.created_at AS fecha FROM facturas f LEFT JOIN clientes c ON f.cliente_id = c.id ORDER BY f.id DESC`);
    return NextResponse.json({ success: true, facturas }, { status: 200 });
  } catch (error) {
    console.error('Error GET facturas:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const data = await request.json();
    const { guiaDespachoId, clienteId, formaPago, comprobanteRetencion, total } = data;
    const result: any = await query(`INSERT INTO facturas (guia_despacho_id, cliente_id, forma_pago, comprobante_retencion, total, usuario_id) VALUES (?, ?, ?, ?, ?, ?)`, [guiaDespachoId || null, clienteId, formaPago, comprobanteRetencion || null, total, session.userId]);
    emitSocketEvent('facturas:created');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'crear', modulo: 'Facturas', entidad_id: result.insertId,
      descripcion: `Creó factura #${result.insertId} - Total: Bs. ${total}`,
      datos_nuevos: { clienteId, formaPago, total, comprobanteRetencion },
      ip_address: getClientIp(request),
    });

    return NextResponse.json({ success: true, mensaje: 'Factura creada correctamente', id: result.insertId, formaPago }, { status: 201 });
  } catch (error) {
    console.error('Error POST facturas:', error);
    return NextResponse.json({ error: 'Error al crear factura' }, { status: 500 });
  }
}
