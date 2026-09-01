import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { emitSocketEvent } from '@/lib/socket-server';
import { registrarLog, getUsuarioFromRequest, getClientIp } from '@/lib/audit-log';
import { requireAuth } from '@/lib/auth-guard';

export async function GET() {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const agregados = await query(`SELECT id, nombre, unidad_medida AS unidadMedida FROM agregados ORDER BY id DESC`);
    return NextResponse.json(agregados);
  } catch (error) {
    console.error('Error GET agregados:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const { nombre, unidadMedida } = body;
    if (!nombre || !unidadMedida) return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 });
    const result: any = await query(`INSERT INTO agregados (nombre, unidad_medida) VALUES (?, ?)`, [nombre, unidadMedida]);
    emitSocketEvent('agregados:created');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'crear', modulo: 'Agregados', entidad_id: result.insertId,
      descripcion: `Creó el agregado "${nombre}" (${unidadMedida})`,
      datos_nuevos: { nombre, unidadMedida },
      ip_address: getClientIp(request),
    });

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Error POST agregados:', error);
    return NextResponse.json({ error: 'Error registrando agregado' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const { id, nombre, unidadMedida } = body;
    if (!id || !nombre || !unidadMedida) return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });

    const anterior: any = await query('SELECT id, nombre, unidad_medida FROM agregados WHERE id = ?', [id]);
    const old = anterior.length > 0 ? anterior[0] : null;

    await query(`UPDATE agregados SET nombre = ?, unidad_medida = ? WHERE id = ?`, [nombre, unidadMedida, id]);
    emitSocketEvent('agregados:updated');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'editar', modulo: 'Agregados', entidad_id: id,
      descripcion: `Editó el agregado "${nombre}"`,
      datos_anteriores: old ? { nombre: old.nombre, unidad_medida: old.unidad_medida } : null,
      datos_nuevos: { nombre, unidadMedida },
      ip_address: getClientIp(request),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error PUT agregados:', error);
    return NextResponse.json({ error: 'Error actualizando agregado' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });

    const anterior: any = await query('SELECT id, nombre FROM agregados WHERE id = ?', [id]);
    const old = anterior.length > 0 ? anterior[0] : null;

    await query('DELETE FROM agregados WHERE id = ?', [id]);
    emitSocketEvent('agregados:deleted');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'eliminar', modulo: 'Agregados', entidad_id: parseInt(id),
      descripcion: `Eliminó el agregado "${old?.nombre || id}"`,
      datos_anteriores: old ? { nombre: old.nombre } : null,
      ip_address: getClientIp(request),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando agregado:', error);
    return NextResponse.json({ error: 'Error eliminando agregado' }, { status: 500 });
  }
}
