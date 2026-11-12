import { NextResponse } from 'next/server';
import { query, transaccion } from '@/lib/db';
import { emitSocketEvent } from '@/lib/socket-server';
import { registrarLog, getUsuarioFromRequest, getClientIp } from '@/lib/audit-log';
import { requireAuth } from '@/lib/auth-guard';

// Viajes de materia prima: un chofer sale con una unidad a buscar piedra,
// arena, cemento, etc. a la planta de un proveedor.
//
//   en_ruta   -> el viaje salió, todavía no llegó a planta.
//   recibido  -> llegó. Al recibirlo se crea la entrada en materia_prima con la
//                cantidad real recibida, así el inventario sube en ese momento
//                y no antes. El id queda en materia_prima_id.
//   cancelado -> el viaje no se concretó; no mueve inventario.
//
// Lectura: admin, gerencia, dosificador, seguridad-vial (este último ve
// viajes de choferes, sin montos). Alta y recepción: admin, gerencia,
// dosificador. Editar y eliminar: admin y gerencia, porque un viaje recibido
// está atado a una entrada de inventario.
// Ver sql/migracion_viajes_materia_prima.sql.

let tablaLista = false;
async function ensureTabla() {
  if (tablaLista) return;
  await query(`
    CREATE TABLE IF NOT EXISTS viajes_materia_prima (
      id INT AUTO_INCREMENT PRIMARY KEY,
      fecha DATE NOT NULL,
      chofer_id BIGINT UNSIGNED NULL,
      unidad_id INT NULL,
      agregado_id INT NOT NULL,
      proveedor_id INT NULL,
      planta_id INT NULL,
      cantidad DECIMAL(12,2) NULL,
      unidad VARCHAR(20) NOT NULL DEFAULT 'M3',
      nro_guia_proveedor VARCHAR(100) NULL,
      hora_salida DATETIME NULL,
      hora_llegada DATETIME NULL,
      estado VARCHAR(20) NOT NULL DEFAULT 'en_ruta',
      observaciones TEXT NULL,
      materia_prima_id INT NULL,
      usuario_id INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_vmp_fecha (fecha),
      INDEX idx_vmp_chofer (chofer_id),
      INDEX idx_vmp_estado (estado)
    )
  `);
  // materia_prima ya tiene estas columnas si pasó por /api/materia-prima, pero
  // se aseguran por si se recibe un viaje antes de abrir esa pantalla.
  try { await query(`ALTER TABLE materia_prima ADD COLUMN es_saldo_inicial TINYINT(1) DEFAULT 0`); } catch {}
  try { await query(`ALTER TABLE materia_prima ADD COLUMN planta_id INT NULL`); } catch {}
  try { await query(`ALTER TABLE materia_prima ADD COLUMN chofer_id INT NULL`); } catch {}
  try { await query(`ALTER TABLE materia_prima ADD COLUMN unidad_id INT NULL`); } catch {}
  tablaLista = true;
}

const SELECT_VIAJE = `
  SELECT v.id, v.fecha, v.chofer_id AS choferId, ch.nombre AS choferNombre, ch.cedula AS choferCedula,
         v.unidad_id AS unidadId, un.numero_unidad AS unidadNumero, un.placa AS unidadPlaca,
         v.agregado_id AS agregadoId, a.nombre AS agregadoNombre, a.unidad_medida AS unidadMedida,
         v.proveedor_id AS proveedorId, pv.nombre AS proveedorNombre,
         v.planta_id AS plantaId, pl.nombre AS plantaNombre,
         v.cantidad, v.unidad, v.nro_guia_proveedor AS nroGuiaProveedor,
         v.hora_salida AS horaSalida, v.hora_llegada AS horaLlegada, v.estado,
         v.observaciones, v.materia_prima_id AS materiaPrimaId, v.usuario_id AS usuarioId,
         u.nombre AS usuarioNombre, v.created_at AS createdAt
  FROM viajes_materia_prima v
  LEFT JOIN choferes ch ON v.chofer_id = ch.id
  LEFT JOIN unidades un ON v.unidad_id = un.id
  LEFT JOIN agregados a ON v.agregado_id = a.id
  LEFT JOIN proveedores pv ON v.proveedor_id = pv.id
  LEFT JOIN proveedor_plantas pl ON v.planta_id = pl.id
  LEFT JOIN users u ON v.usuario_id = u.id
`;

const esFecha = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const aNumero = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
/** 'YYYY-MM-DDTHH:mm' (input datetime-local) -> 'YYYY-MM-DD HH:mm:00' */
const aDatetime = (v: unknown): string | null => {
  if (typeof v !== 'string' || !v) return null;
  const m = v.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(:\d{2})?/);
  return m ? `${m[1]} ${m[2]}${m[3] || ':00'}` : null;
};

async function validarPlanta(plantaId: number | null, proveedorId: number | null) {
  if (plantaId === null) return null;
  const plantas: any = await query('SELECT id FROM proveedor_plantas WHERE id = ? AND proveedor_id = ?', [plantaId, proveedorId]);
  return plantas.length === 0 ? 'La planta seleccionada no pertenece al proveedor.' : null;
}

export async function GET(req: Request) {
  const auth = await requireAuth(['admin', 'gerencia', 'dosificador', 'seguridad-vial']);
  if (auth.response) return auth.response;

  try {
    await ensureTabla();
    const { searchParams } = new URL(req.url);
    const where: string[] = [];
    const params: any[] = [];
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const estado = searchParams.get('estado');
    const choferId = aNumero(searchParams.get('choferId'));
    if (esFecha(from)) { where.push('v.fecha >= ?'); params.push(from); }
    if (esFecha(to)) { where.push('v.fecha <= ?'); params.push(to); }
    if (estado && ['en_ruta', 'recibido', 'cancelado'].includes(estado)) { where.push('v.estado = ?'); params.push(estado); }
    if (choferId) { where.push('v.chofer_id = ?'); params.push(choferId); }

    const viajes = await query(
      `${SELECT_VIAJE} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY v.fecha DESC, v.id DESC`,
      params
    );
    return NextResponse.json({ success: true, viajes });
  } catch (error) {
    console.error('Error GET viajes materia prima:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth(['admin', 'gerencia', 'dosificador']);
  if (auth.response) return auth.response;

  try {
    await ensureTabla();
    const data = await req.json();

    const agregadoId = aNumero(data.agregado_id);
    const choferId = aNumero(data.chofer_id);
    const unidadId = aNumero(data.unidad_id);
    const proveedorId = aNumero(data.proveedor_id);
    const plantaId = aNumero(data.planta_id);
    const cantidad = aNumero(data.cantidad);
    const fecha = esFecha(data.fecha) ? data.fecha : null;
    // Se puede cargar un viaje que ya llegó (recibido directo) o uno que sale.
    const recibidoDirecto = data.estado === 'recibido';

    if (!agregadoId) return NextResponse.json({ error: 'Seleccioná el material.' }, { status: 400 });
    if (!choferId) return NextResponse.json({ error: 'Seleccioná el chofer.' }, { status: 400 });
    if (!fecha) return NextResponse.json({ error: 'La fecha es obligatoria.' }, { status: 400 });
    if (recibidoDirecto && (!cantidad || cantidad <= 0)) {
      return NextResponse.json({ error: 'Para registrar un viaje recibido indicá la cantidad.' }, { status: 400 });
    }
    if (cantidad !== null && cantidad < 0) return NextResponse.json({ error: 'Cantidad inválida.' }, { status: 400 });
    const errPlanta = await validarPlanta(plantaId, proveedorId);
    if (errPlanta) return NextResponse.json({ error: errPlanta }, { status: 400 });

    const agg: any = await query('SELECT unidad_medida FROM agregados WHERE id = ?', [agregadoId]);
    if (agg.length === 0) return NextResponse.json({ error: 'El material no existe.' }, { status: 400 });
    const unidad = String(data.unidad || agg[0].unidad_medida || 'M3');

    const horaSalida = aDatetime(data.hora_salida);
    const horaLlegada = recibidoDirecto ? (aDatetime(data.hora_llegada) || null) : null;

    const id = await transaccion(async (conn) => {
      let materiaPrimaId: number | null = null;
      if (recibidoDirecto) {
        const [mp]: any = await conn.execute(
          `INSERT INTO materia_prima (agregado_id, cantidad, unidad, fecha, proveedor_id, planta_id, chofer_id, unidad_id, es_saldo_inicial, usuario_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
          [agregadoId, cantidad, unidad, fecha, proveedorId, plantaId, choferId, unidadId, auth.session.userId]
        );
        materiaPrimaId = mp.insertId;
      }
      const [r]: any = await conn.execute(
        `INSERT INTO viajes_materia_prima
           (fecha, chofer_id, unidad_id, agregado_id, proveedor_id, planta_id, cantidad, unidad,
            nro_guia_proveedor, hora_salida, hora_llegada, estado, observaciones, materia_prima_id, usuario_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [fecha, choferId, unidadId, agregadoId, proveedorId, plantaId, cantidad, unidad,
         data.nro_guia_proveedor || null, horaSalida, horaLlegada,
         recibidoDirecto ? 'recibido' : 'en_ruta', data.observaciones || null, materiaPrimaId, auth.session.userId]
      );
      return r.insertId as number;
    });

    emitSocketEvent('viajes-mp:changed');
    if (recibidoDirecto) emitSocketEvent('materia-prima:created');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'crear', modulo: 'Viajes Materia Prima', entidad_id: id,
      descripcion: `Registró viaje de materia prima #${id} (${recibidoDirecto ? 'recibido' : 'en ruta'})${cantidad ? ` - ${cantidad} ${unidad}` : ''}`,
      datos_nuevos: { fecha, chofer_id: choferId, unidad_id: unidadId, agregado_id: agregadoId, proveedor_id: proveedorId, planta_id: plantaId, cantidad, estado: recibidoDirecto ? 'recibido' : 'en_ruta' },
      ip_address: getClientIp(req),
    });

    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (error) {
    console.error('Error POST viajes materia prima:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT con `accion`:
//   recibir  -> marca el viaje como recibido y da entrada a materia_prima.
//   cancelar -> marca el viaje en ruta como cancelado.
//   editar   -> (admin/gerencia) corrige los datos; si ya estaba recibido,
//               también corrige la entrada de inventario vinculada.
export async function PUT(req: Request) {
  const auth = await requireAuth(['admin', 'gerencia', 'dosificador']);
  if (auth.response) return auth.response;

  try {
    await ensureTabla();
    const data = await req.json();
    const id = aNumero(data.id);
    if (!id) return NextResponse.json({ error: 'ID es requerido.' }, { status: 400 });

    const filas: any = await query('SELECT * FROM viajes_materia_prima WHERE id = ?', [id]);
    if (filas.length === 0) return NextResponse.json({ error: 'El viaje no existe.' }, { status: 404 });
    const anterior = filas[0];
    const accion = String(data.accion || 'editar');
    const usuario = await getUsuarioFromRequest();

    if (accion === 'recibir') {
      if (anterior.estado !== 'en_ruta') {
        return NextResponse.json({ error: 'Solo se puede recibir un viaje en ruta.' }, { status: 400 });
      }
      const cantidad = aNumero(data.cantidad) ?? aNumero(anterior.cantidad);
      if (!cantidad || cantidad <= 0) return NextResponse.json({ error: 'Indicá la cantidad recibida.' }, { status: 400 });
      const horaLlegada = aDatetime(data.hora_llegada);
      const fechaEntrada = esFecha(data.fecha) ? data.fecha : String(anterior.fecha).slice(0, 10);

      await transaccion(async (conn) => {
        const [mp]: any = await conn.execute(
          `INSERT INTO materia_prima (agregado_id, cantidad, unidad, fecha, proveedor_id, planta_id, chofer_id, unidad_id, es_saldo_inicial, usuario_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
          [anterior.agregado_id, cantidad, anterior.unidad, fechaEntrada, anterior.proveedor_id, anterior.planta_id, anterior.chofer_id, anterior.unidad_id, auth.session.userId]
        );
        await conn.execute(
          `UPDATE viajes_materia_prima
             SET estado = 'recibido', cantidad = ?, hora_llegada = COALESCE(?, NOW()),
                 nro_guia_proveedor = COALESCE(?, nro_guia_proveedor),
                 observaciones = COALESCE(?, observaciones), materia_prima_id = ?
           WHERE id = ?`,
          [cantidad, horaLlegada, data.nro_guia_proveedor || null, data.observaciones || null, mp.insertId, id]
        );
      });
      emitSocketEvent('viajes-mp:changed');
      emitSocketEvent('materia-prima:created');
      await registrarLog({
        ...usuario, accion: 'editar', modulo: 'Viajes Materia Prima', entidad_id: id,
        descripcion: `Recibió viaje de materia prima #${id}: ${cantidad} ${anterior.unidad}`,
        datos_anteriores: { estado: anterior.estado, cantidad: anterior.cantidad },
        datos_nuevos: { estado: 'recibido', cantidad },
        ip_address: getClientIp(req),
      });
      return NextResponse.json({ success: true });
    }

    if (accion === 'cancelar') {
      if (anterior.estado !== 'en_ruta') {
        return NextResponse.json({ error: 'Solo se puede cancelar un viaje en ruta.' }, { status: 400 });
      }
      await query(
        `UPDATE viajes_materia_prima SET estado = 'cancelado', observaciones = COALESCE(?, observaciones) WHERE id = ?`,
        [data.observaciones || null, id]
      );
      emitSocketEvent('viajes-mp:changed');
      await registrarLog({
        ...usuario, accion: 'editar', modulo: 'Viajes Materia Prima', entidad_id: id,
        descripcion: `Canceló viaje de materia prima #${id}`,
        datos_anteriores: { estado: anterior.estado }, datos_nuevos: { estado: 'cancelado' },
        ip_address: getClientIp(req),
      });
      return NextResponse.json({ success: true });
    }

    // editar: solo admin/gerencia
    if (auth.session.role !== 'admin' && auth.session.role !== 'gerencia') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }
    const agregadoId = aNumero(data.agregado_id) ?? anterior.agregado_id;
    const choferId = aNumero(data.chofer_id);
    const unidadId = aNumero(data.unidad_id);
    const proveedorId = aNumero(data.proveedor_id);
    const plantaId = aNumero(data.planta_id);
    const cantidad = aNumero(data.cantidad);
    const fecha = esFecha(data.fecha) ? data.fecha : String(anterior.fecha).slice(0, 10);
    if (!choferId) return NextResponse.json({ error: 'Seleccioná el chofer.' }, { status: 400 });
    if (anterior.estado === 'recibido' && (!cantidad || cantidad <= 0)) {
      return NextResponse.json({ error: 'Un viaje recibido necesita cantidad.' }, { status: 400 });
    }
    const errPlanta = await validarPlanta(plantaId, proveedorId);
    if (errPlanta) return NextResponse.json({ error: errPlanta }, { status: 400 });
    const agg: any = await query('SELECT unidad_medida FROM agregados WHERE id = ?', [agregadoId]);
    if (agg.length === 0) return NextResponse.json({ error: 'El material no existe.' }, { status: 400 });
    const unidad = String(data.unidad || agg[0].unidad_medida || anterior.unidad || 'M3');

    await transaccion(async (conn) => {
      await conn.execute(
        `UPDATE viajes_materia_prima
           SET fecha = ?, chofer_id = ?, unidad_id = ?, agregado_id = ?, proveedor_id = ?, planta_id = ?,
               cantidad = ?, unidad = ?, nro_guia_proveedor = ?, hora_salida = ?, hora_llegada = ?, observaciones = ?
         WHERE id = ?`,
        [fecha, choferId, unidadId, agregadoId, proveedorId, plantaId, cantidad, unidad,
         data.nro_guia_proveedor || null, aDatetime(data.hora_salida), aDatetime(data.hora_llegada),
         data.observaciones || null, id]
      );
      if (anterior.estado === 'recibido' && anterior.materia_prima_id) {
        await conn.execute(
          `UPDATE materia_prima SET agregado_id = ?, cantidad = ?, unidad = ?, fecha = ?, proveedor_id = ?,
                  planta_id = ?, chofer_id = ?, unidad_id = ? WHERE id = ?`,
          [agregadoId, cantidad, unidad, fecha, proveedorId, plantaId, choferId, unidadId, anterior.materia_prima_id]
        );
      }
    });
    emitSocketEvent('viajes-mp:changed');
    if (anterior.estado === 'recibido') emitSocketEvent('materia-prima:updated');
    await registrarLog({
      ...usuario, accion: 'editar', modulo: 'Viajes Materia Prima', entidad_id: id,
      descripcion: `Editó viaje de materia prima #${id}`,
      datos_anteriores: { fecha: anterior.fecha, chofer_id: anterior.chofer_id, agregado_id: anterior.agregado_id, cantidad: anterior.cantidad },
      datos_nuevos: { fecha, chofer_id: choferId, agregado_id: agregadoId, cantidad },
      ip_address: getClientIp(req),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error PUT viajes materia prima:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireAuth(['admin', 'gerencia']);
  if (auth.response) return auth.response;

  try {
    await ensureTabla();
    const id = aNumero(new URL(req.url).searchParams.get('id'));
    if (!id) return NextResponse.json({ error: 'ID es requerido.' }, { status: 400 });
    const filas: any = await query('SELECT * FROM viajes_materia_prima WHERE id = ?', [id]);
    if (filas.length === 0) return NextResponse.json({ error: 'El viaje no existe.' }, { status: 404 });
    const anterior = filas[0];

    // Si el viaje ya dio entrada a inventario, se borra esa entrada también.
    await transaccion(async (conn) => {
      if (anterior.materia_prima_id) {
        await conn.execute('DELETE FROM materia_prima WHERE id = ?', [anterior.materia_prima_id]);
      }
      await conn.execute('DELETE FROM viajes_materia_prima WHERE id = ?', [id]);
    });
    emitSocketEvent('viajes-mp:changed');
    if (anterior.materia_prima_id) emitSocketEvent('materia-prima:deleted');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'eliminar', modulo: 'Viajes Materia Prima', entidad_id: id,
      descripcion: `Eliminó viaje de materia prima #${id}${anterior.materia_prima_id ? ' y su entrada de inventario' : ''}`,
      datos_anteriores: { fecha: anterior.fecha, chofer_id: anterior.chofer_id, agregado_id: anterior.agregado_id, cantidad: anterior.cantidad, estado: anterior.estado },
      ip_address: getClientIp(req),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error DELETE viajes materia prima:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
