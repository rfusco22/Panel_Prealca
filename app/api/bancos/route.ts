import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { emitSocketEvent } from '@/lib/socket-server';
import { registrarLog, getUsuarioFromRequest, getClientIp } from '@/lib/audit-log';

export async function GET() {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const bancos = await query(`SELECT id, nombre_banco AS nombreBanco, numero_cuenta AS numeroCuenta, titular_cuenta AS titularCuenta, cedula FROM bancos ORDER BY id DESC`);
    return NextResponse.json(bancos);
  } catch (error) {
    console.error('Error obteniendo bancos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const body = await request.json();
    const { nombreBanco, numeroCuenta, titularCuenta, cedula } = body;
    if (!nombreBanco || !numeroCuenta || !titularCuenta || !cedula) return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 });
    const result: any = await query(`INSERT INTO bancos (nombre_banco, numero_cuenta, titular_cuenta, cedula) VALUES (?, ?, ?, ?)`, [nombreBanco, numeroCuenta, titularCuenta, cedula]);
    emitSocketEvent('bancos:created');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'crear', modulo: 'Bancos', entidad_id: result.insertId,
      descripcion: `Creó el banco "${nombreBanco}" (Cta: ${numeroCuenta})`,
      datos_nuevos: { nombreBanco, numeroCuenta, titularCuenta, cedula },
      ip_address: getClientIp(request),
    });

    return NextResponse.json({ success: true, message: 'Banco registrado exitosamente', id: result.insertId });
  } catch (error) {
    console.error('Error registrando banco:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const body = await request.json();
    const { id, nombreBanco, numeroCuenta, titularCuenta, cedula } = body;
    if (!id || !nombreBanco || !numeroCuenta || !titularCuenta || !cedula) return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });

    const anterior: any = await query('SELECT id, nombre_banco, numero_cuenta, titular_cuenta FROM bancos WHERE id = ?', [id]);
    const old = anterior.length > 0 ? anterior[0] : null;

    await query(`UPDATE bancos SET nombre_banco = ?, numero_cuenta = ?, titular_cuenta = ?, cedula = ? WHERE id = ?`, [nombreBanco, numeroCuenta, titularCuenta, cedula, id]);
    emitSocketEvent('bancos:updated');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'editar', modulo: 'Bancos', entidad_id: id,
      descripcion: `Editó el banco "${nombreBanco}"`,
      datos_anteriores: old ? { nombreBanco: old.nombre_banco, numeroCuenta: old.numero_cuenta } : null,
      datos_nuevos: { nombreBanco, numeroCuenta, titularCuenta },
      ip_address: getClientIp(request),
    });

    return NextResponse.json({ success: true, message: 'Banco actualizado' });
  } catch (error) {
    console.error('Error actualizando banco:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });

    const anterior: any = await query('SELECT id, nombre_banco, numero_cuenta FROM bancos WHERE id = ?', [id]);
    const old = anterior.length > 0 ? anterior[0] : null;

    await query('DELETE FROM bancos WHERE id = ?', [id]);
    emitSocketEvent('bancos:deleted');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'eliminar', modulo: 'Bancos', entidad_id: parseInt(id),
      descripcion: `Eliminó el banco "${old?.nombre_banco || id}"`,
      datos_anteriores: old ? { nombre_banco: old.nombre_banco, numero_cuenta: old.numero_cuenta } : null,
      ip_address: getClientIp(request),
    });

    return NextResponse.json({ success: true, message: 'Banco eliminado' });
  } catch (error) {
    console.error('Error eliminando banco:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
