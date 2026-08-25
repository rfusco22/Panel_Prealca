import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { emitSocketEvent } from '@/lib/socket-server';
import { registrarLog, getUsuarioFromRequest, getClientIp } from '@/lib/audit-log';

async function ensureColumns() {
  try { await query(`ALTER TABLE unidades ADD COLUMN km_actual DECIMAL(10,2) DEFAULT 0`); } catch {}
  try { await query(`ALTER TABLE unidades ADD COLUMN ultimo_mantenimiento DATE NULL`); } catch {}
  try { await query(`ALTER TABLE unidades ADD COLUMN proximo_mantenimiento DATE NULL`); } catch {}
  try { await query(`ALTER TABLE unidades ADD COLUMN proximo_mantenimiento_km DECIMAL(10,2) NULL`); } catch {}
}

export async function GET() {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    await ensureColumns();
    const unidades = await query(`
      SELECT id, numero_unidad AS numeroUnidad, placa, marca, modelo, ano, color,
             poliza_rcv_numero AS polizaRcvNumero, poliza_rcv_vencimiento AS polizaRcvVencimiento,
             rot_numero AS rotNumero, rot_vencimiento AS rotVencimiento,
             km_actual AS kmActual, ultimo_mantenimiento AS ultimoMantenimiento,
             proximo_mantenimiento AS proximoMantenimiento, proximo_mantenimiento_km AS proximoMantenimientoKm
      FROM unidades ORDER BY id DESC
    `);
    return NextResponse.json(unidades);
  } catch (error) {
    console.error('Error GET unidades:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const body = await request.json();
    const { numeroUnidad, placa, marca, modelo, ano, color, polizaRcvNumero, polizaRcvVencimiento, rotNumero, rotVencimiento } = body;
    if (!numeroUnidad || !placa || !marca || !modelo || !ano || !color) return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 });

    const hoy = new Date().toISOString().split('T')[0];
    if (polizaRcvVencimiento && polizaRcvVencimiento < hoy) return NextResponse.json({ error: 'La fecha de vencimiento de la Póliza RCV no puede ser anterior a hoy.' }, { status: 400 });
    if (rotVencimiento && rotVencimiento < hoy) return NextResponse.json({ error: 'La fecha de vencimiento del ROT no puede ser anterior a hoy.' }, { status: 400 });
    const result: any = await query(
      `INSERT INTO unidades (numero_unidad, placa, marca, modelo, ano, color, poliza_rcv_numero, poliza_rcv_vencimiento, rot_numero, rot_vencimiento) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [numeroUnidad, placa, marca, modelo, ano, color, polizaRcvNumero || null, polizaRcvVencimiento || null, rotNumero || null, rotVencimiento || null]
    );
    emitSocketEvent('unidades:created');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'crear', modulo: 'Unidades', entidad_id: result.insertId,
      descripcion: `Creó la unidad "${numeroUnidad}" (Placa: ${placa})`,
      datos_nuevos: { numeroUnidad, placa, marca, modelo, ano, color },
      ip_address: getClientIp(request),
    });

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Error POST unidades:', error);
    return NextResponse.json({ error: 'Error registrando unidad' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const body = await request.json();
    const { id, numeroUnidad, placa, marca, modelo, ano, color, polizaRcvNumero, polizaRcvVencimiento, rotNumero, rotVencimiento } = body;
    if (!id || !numeroUnidad || !placa || !marca || !modelo || !ano || !color) return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });

    const hoy = new Date().toISOString().split('T')[0];
    if (polizaRcvVencimiento && polizaRcvVencimiento < hoy) return NextResponse.json({ error: 'La fecha de vencimiento de la Póliza RCV no puede ser anterior a hoy.' }, { status: 400 });
    if (rotVencimiento && rotVencimiento < hoy) return NextResponse.json({ error: 'La fecha de vencimiento del ROT no puede ser anterior a hoy.' }, { status: 400 });

    const anterior: any = await query('SELECT id, numero_unidad, placa FROM unidades WHERE id = ?', [id]);
    const old = anterior.length > 0 ? anterior[0] : null;

    await query(
      `UPDATE unidades SET numero_unidad = ?, placa = ?, marca = ?, modelo = ?, ano = ?, color = ?,
       poliza_rcv_numero = ?, poliza_rcv_vencimiento = ?, rot_numero = ?, rot_vencimiento = ? WHERE id = ?`,
      [numeroUnidad, placa, marca, modelo, ano, color, polizaRcvNumero || null, polizaRcvVencimiento || null, rotNumero || null, rotVencimiento || null, id]
    );
    emitSocketEvent('unidades:updated');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'editar', modulo: 'Unidades', entidad_id: id,
      descripcion: `Editó la unidad "${numeroUnidad}"`,
      datos_anteriores: old ? { numeroUnidad: old.numero_unidad, placa: old.placa } : null,
      datos_nuevos: { numeroUnidad, placa, marca, modelo },
      ip_address: getClientIp(request),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error PUT unidades:', error);
    return NextResponse.json({ error: 'Error actualizando unidad' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });

    const anterior: any = await query('SELECT id, numero_unidad, placa FROM unidades WHERE id = ?', [id]);
    const old = anterior.length > 0 ? anterior[0] : null;

    await query('DELETE FROM unidades WHERE id = ?', [id]);
    emitSocketEvent('unidades:deleted');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'eliminar', modulo: 'Unidades', entidad_id: parseInt(id),
      descripcion: `Eliminó la unidad "${old?.numero_unidad || id}"`,
      datos_anteriores: old ? { numero_unidad: old.numero_unidad, placa: old.placa } : null,
      ip_address: getClientIp(request),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando unidad:', error);
    return NextResponse.json({ error: 'Error eliminando unidad' }, { status: 500 });
  }
}
