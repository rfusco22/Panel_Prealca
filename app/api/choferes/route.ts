import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { emitSocketEvent } from '@/lib/socket-server';
import { registrarLog, getUsuarioFromRequest, getClientIp } from '@/lib/audit-log';

export async function GET() {
  try {
    const resultados = await query('SELECT * FROM choferes ORDER BY id DESC');
    return NextResponse.json({ success: true, choferes: resultados }, { status: 200 });
  } catch (error) {
    console.error("Error obteniendo choferes:", error);
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const sql = `INSERT INTO choferes (nombre, cedula, telefono, correo, direccion, licencia_documento, licencia_vencimiento, certificado_documento, certificado_vencimiento, rif, rif_vencimiento, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const valores = [data.nombre, data.cedula, data.telefono, data.correo, data.direccion || null, data.licencia_documento || null, data.licencia_vencimiento || null, data.certificado_documento || null, data.certificado_vencimiento || null, data.rif || null, data.rif_vencimiento || null, data.estado || 'activo'];
    const resultado: any = await query(sql, valores);
    emitSocketEvent('choferes:created');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'crear', modulo: 'Choferes', entidad_id: resultado.insertId,
      descripcion: `Creó el chofer "${data.nombre}" (Cédula: ${data.cedula})`,
      datos_nuevos: { nombre: data.nombre, cedula: data.cedula, telefono: data.telefono },
      ip_address: getClientIp(req),
    });

    return NextResponse.json({ success: true, mensaje: 'Chofer registrado correctamente.', insertId: resultado.insertId }, { status: 201 });
  } catch (error: any) {
    console.error("Error registrando chofer:", error);
    if (error.code === 'ER_DUP_ENTRY') return NextResponse.json({ error: 'La cédula ya está registrada.' }, { status: 409 });
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    const anterior: any = await query('SELECT id, nombre, cedula FROM choferes WHERE id = ?', [data.id]);
    const old = anterior.length > 0 ? anterior[0] : null;

    const sql = `UPDATE choferes SET nombre=?, cedula=?, telefono=?, correo=?, direccion=?, licencia_documento=?, licencia_vencimiento=?, certificado_documento=?, certificado_vencimiento=?, rif=?, rif_vencimiento=?, estado=? WHERE id=?`;
    const valores = [data.nombre, data.cedula, data.telefono, data.correo, data.direccion || null, data.licencia_documento || null, data.licencia_vencimiento || null, data.certificado_documento || null, data.certificado_vencimiento || null, data.rif || null, data.rif_vencimiento || null, data.estado || 'activo', data.id];
    await query(sql, valores);
    emitSocketEvent('choferes:updated');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'editar', modulo: 'Choferes', entidad_id: data.id,
      descripcion: `Editó el chofer "${data.nombre}"`,
      datos_anteriores: old ? { nombre: old.nombre, cedula: old.cedula } : null,
      datos_nuevos: { nombre: data.nombre, cedula: data.cedula, telefono: data.telefono },
      ip_address: getClientIp(req),
    });

    return NextResponse.json({ success: true, mensaje: 'Chofer actualizado.' }, { status: 200 });
  } catch (error: any) {
    console.error("Error actualizando chofer:", error);
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const anterior: any = await query('SELECT id, nombre, cedula FROM choferes WHERE id = ?', [id]);
    const old = anterior.length > 0 ? anterior[0] : null;

    await query('DELETE FROM choferes WHERE id = ?', [id]);
    emitSocketEvent('choferes:deleted');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'eliminar', modulo: 'Choferes', entidad_id: parseInt(id),
      descripcion: `Eliminó el chofer "${old?.nombre || id}"`,
      datos_anteriores: old ? { nombre: old.nombre, cedula: old.cedula } : null,
      ip_address: getClientIp(req),
    });

    return NextResponse.json({ success: true, mensaje: 'Chofer eliminado.' }, { status: 200 });
  } catch (error) {
    console.error("Error eliminando chofer:", error);
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}
