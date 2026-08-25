import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { emitSocketEvent } from '@/lib/socket-server';
import { registrarLog, getUsuarioFromRequest, getClientIp } from '@/lib/audit-log';

async function ensureTables() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS unidad_mantenimientos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        unidad_id INT NOT NULL,
        fecha DATE NOT NULL,
        tipo_mantenimiento ENUM('preventivo','correctivo','revision','reparacion','otro') DEFAULT 'preventivo',
        descripcion TEXT NOT NULL,
        km DECIMAL(10,2) NULL,
        costo DECIMAL(12,2) NULL,
        costo_usd DECIMAL(12,2) NULL,
        tasa_bcv DECIMAL(10,4) NULL,
        moneda ENUM('USD','BS') DEFAULT 'BS',
        proximo_servicio_km DECIMAL(10,2) NULL,
        proximo_servicio_fecha DATE NULL,
        realizado_por VARCHAR(255) NULL,
        notas TEXT NULL,
        usuario_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_unidad (unidad_id),
        INDEX idx_fecha (fecha)
      )
    `);
  } catch {}
  try { await query(`ALTER TABLE unidades ADD COLUMN km_actual DECIMAL(10,2) DEFAULT 0`); } catch {}
  try { await query(`ALTER TABLE unidades ADD COLUMN ultimo_mantenimiento DATE NULL`); } catch {}
  try { await query(`ALTER TABLE unidades ADD COLUMN proximo_mantenimiento DATE NULL`); } catch {}
  try { await query(`ALTER TABLE unidades ADD COLUMN proximo_mantenimiento_km DECIMAL(10,2) NULL`); } catch {}
  try { await query(`ALTER TABLE unidad_mantenimientos ADD COLUMN costo_usd DECIMAL(12,2) NULL`); } catch {}
  try { await query(`ALTER TABLE unidad_mantenimientos ADD COLUMN tasa_bcv DECIMAL(10,4) NULL`); } catch {}
  try { await query(`ALTER TABLE unidad_mantenimientos ADD COLUMN moneda ENUM('USD','BS') DEFAULT 'BS'`); } catch {}
}

export async function GET(request: Request) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    await ensureTables();

    const { searchParams } = new URL(request.url);
    const unidadId = searchParams.get('unidadId');

    let sql = `
      SELECT m.id, m.unidad_id AS unidadId, u.numero_unidad AS unidadNumero, u.placa AS unidadPlaca,
             m.fecha, m.tipo_mantenimiento AS tipoMantenimiento, m.descripcion, m.km, m.costo,
             m.costo_usd AS costoUsd, m.tasa_bcv AS tasaBcv, m.moneda,
             m.proximo_servicio_km AS proximoServicioKm, m.proximo_servicio_fecha AS proximoServicioFecha,
             m.realizado_por AS realizadoPor, m.notas, m.usuario_id AS usuarioId,
             usr.nombre AS usuarioNombre, m.created_at AS createdAt
      FROM unidad_mantenimientos m
      LEFT JOIN unidades u ON m.unidad_id = u.id
      LEFT JOIN users usr ON m.usuario_id = usr.id
    `;
    const params: any[] = [];
    if (unidadId) { sql += ' WHERE m.unidad_id = ?'; params.push(unidadId); }
    sql += ' ORDER BY m.fecha DESC, m.id DESC';

    const mantenimientos = await query(sql, params);
    return NextResponse.json({ success: true, mantenimientos });
  } catch (error) {
    console.error('Error GET mantenimientos:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    await ensureTables();

    const body = await request.json();
    const { unidadId, fecha, tipoMantenimiento, descripcion, km, costo, costoUsd, tasaBcv, moneda, proximoServicioKm, proximoServicioFecha, realizadoPor, notas } = body;

    if (!unidadId || !fecha || !descripcion) {
      return NextResponse.json({ error: 'Unidad, fecha y descripción son requeridos' }, { status: 400 });
    }

    const result: any = await query(
      `INSERT INTO unidad_mantenimientos (unidad_id, fecha, tipo_mantenimiento, descripcion, km, costo, costo_usd, tasa_bcv, moneda, proximo_servicio_km, proximo_servicio_fecha, realizado_por, notas, usuario_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [unidadId, fecha, tipoMantenimiento || 'preventivo', descripcion, km || null, costo || null, costoUsd || null, tasaBcv || null, moneda || 'BS', proximoServicioKm || null, proximoServicioFecha || null, realizadoPor || null, notas || null, session.userId]
    );

    // Smart update: actualizar km_actual y fechas en la unidad
    if (km) {
      await query(`UPDATE unidades SET km_actual = ? WHERE id = ?`, [km, unidadId]);
    }
    await query(
      `UPDATE unidades SET ultimo_mantenimiento = ?, proximo_mantenimiento = ?, proximo_mantenimiento_km = ? WHERE id = ?`,
      [fecha, proximoServicioFecha || null, proximoServicioKm || null, unidadId]
    );

    emitSocketEvent('mantenimientos:created');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'crear', modulo: 'Mantenimiento Unidades', entidad_id: result.insertId,
      descripcion: `Registró mantenimiento en unidad #${unidadId} - ${descripcion}`,
      datos_nuevos: { unidadId, fecha, tipoMantenimiento, descripcion, km, costo },
      ip_address: getClientIp(request),
    });

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Error POST mantenimiento:', error);
    return NextResponse.json({ error: 'Error registrando mantenimiento' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    await ensureTables();

    const body = await request.json();
    const { id, fecha, tipoMantenimiento, descripcion, km, costo, costoUsd, tasaBcv, moneda, proximoServicioKm, proximoServicioFecha, realizadoPor, notas, unidadId } = body;
    if (!id) return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });

    await query(
      `UPDATE unidad_mantenimientos SET fecha = ?, tipo_mantenimiento = ?, descripcion = ?, km = ?, costo = ?,
       costo_usd = ?, tasa_bcv = ?, moneda = ?, proximo_servicio_km = ?, proximo_servicio_fecha = ?, realizado_por = ?, notas = ? WHERE id = ?`,
      [fecha, tipoMantenimiento || 'preventivo', descripcion, km || null, costo || null, costoUsd || null, tasaBcv || null, moneda || 'BS', proximoServicioKm || null, proximoServicioFecha || null, realizadoPor || null, notas || null, id]
    );

    if (unidadId && km) {
      await query(`UPDATE unidades SET km_actual = ? WHERE id = ?`, [km, unidadId]);
    }

    emitSocketEvent('mantenimientos:updated');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'editar', modulo: 'Mantenimiento Unidades', entidad_id: id,
      descripcion: `Editó mantenimiento #${id}`,
      datos_nuevos: { fecha, tipoMantenimiento, descripcion, km },
      ip_address: getClientIp(request),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error PUT mantenimiento:', error);
    return NextResponse.json({ error: 'Error actualizando' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    await ensureTables();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });

    await query('DELETE FROM unidad_mantenimientos WHERE id = ?', [id]);
    emitSocketEvent('mantenimientos:deleted');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'eliminar', modulo: 'Mantenimiento Unidades', entidad_id: parseInt(id),
      descripcion: `Eliminó mantenimiento #${id}`,
      ip_address: getClientIp(request),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error DELETE mantenimiento:', error);
    return NextResponse.json({ error: 'Error eliminando' }, { status: 500 });
  }
}