import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { emitSocketEvent } from '@/lib/socket-server';
import { registrarLog, getUsuarioFromRequest, getClientIp } from '@/lib/audit-log';
import { requireAuth } from '@/lib/auth-guard';
import { hoyLocal, validarFechaNoFutura } from '@/lib/fecha';


// Control de acceso por rol y por metodo: expone precio_m3, iva_monto y total por guia, o sea el precio de venta.
// Seguridad Vial no tiene ninguna pagina que la use y no la necesita: su
// reporte de viajes sale de /api/reportes?type=viajes, que no trae montos.
//
// Antes todos los handlers usaban requireAuth() sin roles, o sea cualquier
// usuario logueado. En los endpoints con POST/PUT/DELETE eso significaba que
// se podia crear, editar y borrar escribiendo la URL, sin tener el boton.
// La lista de roles sale de que paginas llaman al endpoint de verdad.
async function ensureColumns() {
  try { await query(`ALTER TABLE guia_despacho ADD COLUMN pedido_id INT NULL`); } catch {}
  try { await query(`ALTER TABLE guia_despacho ADD COLUMN obra VARCHAR(255) NULL`); } catch {}
  // Ver sql/migracion_fecha_observaciones_guia.sql.
  //
  // fecha es el día de despacho que elige quien emite la guía, que no siempre
  // es el día en que se carga al sistema: se cargan guías de días anteriores.
  // created_at sigue siendo el instante de carga (auditoría) y no se toca.
  try { await query(`ALTER TABLE guia_despacho ADD COLUMN fecha DATE NULL`); } catch {}
  try { await query(`ALTER TABLE guia_despacho ADD COLUMN observaciones TEXT NULL`); } catch {}
  try { await query(`CREATE INDEX idx_gd_fecha ON guia_despacho (fecha)`); } catch {}
  // Ver sql/migracion_anular_guia.sql.
  //
  // Una guía no se borra: se anula. El camión se accidentó, se rehace con otro
  // chofer y otra unidad, y el papel que ya salió de planta tiene que seguir
  // existiendo con su número. La guía anulada queda en la base, marcada, y deja
  // de sumar en inventario, pedidos y reportes, que es el "reverso" que hace
  // falta: el stock sale de la suma de las guías vigentes, no de un contador.
  try { await query(`ALTER TABLE guia_despacho ADD COLUMN anulada TINYINT(1) NOT NULL DEFAULT 0`); } catch {}
  try { await query(`ALTER TABLE guia_despacho ADD COLUMN motivo_anulacion VARCHAR(255) NULL`); } catch {}
  try { await query(`ALTER TABLE guia_despacho ADD COLUMN anulada_at DATETIME NULL`); } catch {}
  try { await query(`ALTER TABLE guia_despacho ADD COLUMN anulada_por INT NULL`); } catch {}
  try { await query(`CREATE INDEX idx_gd_anulada ON guia_despacho (anulada)`); } catch {}
  // Ver sql/migracion_numero_guia.sql y sql/migracion_numero_guia_por_tipo.sql
  try { await query(`ALTER TABLE guia_despacho ADD COLUMN numero_guia INT NULL`); } catch {}
  try { await query(`CREATE TABLE IF NOT EXISTS guia_numero_secuencia (numero INT AUTO_INCREMENT PRIMARY KEY)`); } catch {}
  try { await query(`CREATE TABLE IF NOT EXISTS guia_numero_secuencia_premezclado (numero INT AUTO_INCREMENT PRIMARY KEY)`); } catch {}
  try { await query(`CREATE TABLE IF NOT EXISTS guia_numero_secuencia_prealca (numero INT AUTO_INCREMENT PRIMARY KEY)`); } catch {}
  // Garantía a nivel de base: dos guías del mismo tipo no pueden compartir
  // número. Si quedan duplicados de antes, esto falla y se ignora, igual que el
  // resto de los ensure; la verificación de siguienteNumeroGuia igual impide
  // que se creen nuevos. Apenas se resuelvan los duplicados viejos, el índice
  // se crea solo en el siguiente pedido. Las guías anteriores a esta
  // numeración tienen numero_guia NULL, y UNIQUE admite varios NULL.
  try { await query(`CREATE UNIQUE INDEX idx_guia_tipo_numero ON guia_despacho (tipo, numero_guia)`); } catch {}
  // El chofer pasó de ser un nombre copiado a un FK. Ver
  // sql/migracion_chofer_id_guia_despacho.sql: ahí está el relleno de las
  // guías viejas y el porqué la columna chofer (texto) no se borra.
  //
  // BIGINT UNSIGNED para que coincida con choferes.id: MySQL exige que la
  // columna que referencia y la referenciada tengan exactamente el mismo tipo,
  // o la foreign key no se puede crear (error #3780).
  try { await query(`ALTER TABLE guia_despacho ADD COLUMN chofer_id BIGINT UNSIGNED NULL`); } catch {}
}

// numero_guia es una numeración aparte del id real, que arranca en 1 para las
// guías de acá en adelante (las guías viejas quedan con numero_guia NULL, no
// se les asigna uno retroactivo para no invalidar documentos ya impresos).
// Prealca y Premezclado llevan cada una su propio contador (guia_numero_secuencia_*)
// para no compartir la misma cronología entre los dos tipos de guía.
// Se apoya en el AUTO_INCREMENT de una tabla dedicada en vez de un
// SELECT MAX()+1 manual: dos guías creadas al mismo tiempo no pueden terminar
// con el mismo número, porque AUTO_INCREMENT ya resuelve esa concurrencia.
//
// El número que entrega siempre es mayor que el de cualquier guía del mismo
// tipo que ya exista. Hace falta porque los contadores por tipo se crearon
// arrancando en 1 cuando ya había guías numeradas del 1 al 5 con el contador
// viejo compartido: quedaron dos Premezclado con el número GD-2, y el contador
// seguía atrasado, así que iba a repetir también el 3 y el 4.
//
// No alcanza con buscar un número libre: eso llenaría los huecos y el
// correlativo iría para atrás (emitir hoy una GD-2 cuando ya se entregó la
// GD-5 parece un documento antedatado). Por eso la condición es "mayor que el
// máximo", no "que no esté usado".
//
// Esto no renumera ninguna guía existente: los duplicados ya impresos quedan
// como están, y lo que se evita es que aparezcan nuevos. Ver
// sql/migracion_numero_guia_duplicados.sql.
async function siguienteNumeroGuia(tipo: string): Promise<number> {
  const tabla = tipo === 'Prealca' ? 'guia_numero_secuencia_prealca' : 'guia_numero_secuencia_premezclado';

  // El tope de intentos es por si algo quedara inconsistente de un modo no
  // previsto: sin él, un error raro dejaría el pedido colgado en un bucle.
  for (let intento = 0; intento < 20; intento++) {
    const resultado: any = await query(`INSERT INTO ${tabla} (numero) VALUES (NULL)`);
    const numero: number = resultado.insertId;

    const fila: any = await query(
      'SELECT COALESCE(MAX(numero_guia), 0) AS maximo FROM guia_despacho WHERE tipo = ?',
      [tipo],
    );
    const maximo = Math.trunc(Number(fila[0]?.maximo ?? 0));
    if (numero > maximo) return numero;

    // El contador viene atrasado respecto de las guías que ya existen. Se lo
    // adelanta de una vez hasta pasar el máximo, en vez de ir de a uno. El
    // valor va interpolado y no como parámetro porque ALTER TABLE no acepta
    // placeholders; por eso se fuerza a entero antes de armar la sentencia.
    const siguiente = maximo + 1;
    if (!Number.isSafeInteger(siguiente) || siguiente < 1) break;
    await query(`ALTER TABLE ${tabla} AUTO_INCREMENT = ${siguiente}`);
  }

  throw new Error(`No se pudo asignar un número de guía libre para el tipo ${tipo}.`);
}

export async function GET() {
  const auth = await requireAuth(['admin', 'gerencia', 'registro', 'dosificador']);
  if (auth.response) return auth.response;

  try {
    await ensureColumns();
    const guias = await query(`SELECT gd.id, gd.numero_guia AS numeroGuia, gd.tipo, gd.cliente_id AS clienteId, c.nombre AS clienteNombre, c.rif AS clienteRif, c.direccion AS clienteDireccion, c.telefono AS clienteTelefono, gd.producto_id AS productoId, CONCAT(p.resistencia, ' - ', p.pulgada) AS productoNombre, p.resistencia, p.pulgada, gd.cantidad_m3 AS cantidadM3, gd.precio_m3 AS precioM3, gd.iva_aplicado AS ivaAplicado, gd.iva_monto AS ivaMonto, gd.total, gd.chofer_id AS choferId, COALESCE(ch.nombre, gd.chofer) AS choferNombre, gd.chofer, gd.unidad_id AS unidadId, un.numero_unidad AS numeroUnidad, un.placa, gd.pedido_id AS pedidoId, pe.cantidad_m3 AS pedidoTotalM3, pe.obra AS pedidoObra, gd.obra, gd.observaciones, COALESCE(gd.anulada, 0) AS anulada, gd.motivo_anulacion AS motivoAnulacion, gd.anulada_at AS anuladaAt, gd.usuario_id AS usuarioId, COALESCE(gd.fecha, DATE(gd.created_at)) AS fecha, gd.created_at AS creadoEn FROM guia_despacho gd LEFT JOIN clientes c ON gd.cliente_id = c.id LEFT JOIN productos p ON gd.producto_id = p.id LEFT JOIN unidades un ON gd.unidad_id = un.id LEFT JOIN choferes ch ON gd.chofer_id = ch.id LEFT JOIN pedidos pe ON gd.pedido_id = pe.id ORDER BY gd.id DESC`);
    return NextResponse.json({ success: true, guias }, { status: 200 });
  } catch (error) {
    console.error('Error GET guia_despacho:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureColumns();
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const data = await request.json();
    const { tipo, clienteId, productoId, cantidadM3, choferId, chofer, unidadId, pedidoId, obra, fecha, observaciones } = data;

    // La fecha de despacho la elige el usuario porque se cargan guías de días
    // anteriores. Si no viene, es hoy. Hacia adelante no se permite: una guía
    // es un despacho que ya ocurrió, igual que en egresos.
    const fechaFinal = fecha ? String(fecha) : hoyLocal();
    const errorFecha = validarFechaNoFutura(fechaFinal);
    if (errorFecha) {
      return NextResponse.json({ error: errorFecha }, { status: 400 });
    }

    // Se corta a 500 como en el formulario: es una celda de un papel, no un
    // campo de notas, y el límite del form no se puede dar por cumplido acá.
    const observacionesFinal = typeof observaciones === 'string' && observaciones.trim()
      ? observaciones.trim().slice(0, 500)
      : null;

    // El chofer llega como choferId (FK). Se sigue aceptando `chofer` (nombre
    // suelto) para no romper nada que todavía mande el formato viejo.
    // El nombre no se toma del request: se resuelve acá contra la tabla, y se
    // guarda además en la columna de texto como el nombre con el que se emitió
    // la guía -- si después le corrigen el nombre al chofer, el documento ya
    // impreso sigue coincidiendo con lo que quedó guardado.
    let choferIdFinal: number | null = null;
    let choferNombre: string | null = chofer || null;
    if (choferId) {
      const choferRows: any = await query('SELECT id, nombre FROM choferes WHERE id = ?', [choferId]);
      if (choferRows.length === 0) {
        return NextResponse.json({ error: 'El chofer seleccionado no existe.' }, { status: 400 });
      }
      choferIdFinal = choferRows[0].id;
      choferNombre = choferRows[0].nombre;
    }
    if (!choferNombre) {
      return NextResponse.json({ error: 'Debe seleccionar un chofer.' }, { status: 400 });
    }

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
               WHERE pf2.agregado_id = pf.agregado_id AND COALESCE(gd.anulada, 0) = 0), 0
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

    const numeroGuia = await siguienteNumeroGuia(tipo);
    const result: any = await query(`INSERT INTO guia_despacho (tipo, cliente_id, producto_id, cantidad_m3, precio_m3, total, chofer_id, chofer, unidad_id, pedido_id, obra, usuario_id, numero_guia, fecha, observaciones) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [tipo, clienteId, productoId, cantidadM3, 0, 0, choferIdFinal, choferNombre, unidadId || null, pedidoId || null, obraFinal, session.userId, numeroGuia, fechaFinal, observacionesFinal]);

    if (pedidoId) {
      const [pedidoRows]: any = await query('SELECT cantidad_m3 FROM pedidos WHERE id = ?', [pedidoId]);
      const pedidoTotal = Number(pedidoRows?.cantidad_m3 || 0);
      const [sumRows]: any = await query('SELECT COALESCE(SUM(cantidad_m3), 0) AS totalGuias FROM guia_despacho WHERE pedido_id = ? AND COALESCE(anulada, 0) = 0', [pedidoId]);
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
      descripcion: `Creó guía #${result.insertId} (${tipo}) - ${cantidadM3} M3 - fecha ${fechaFinal}`,
      datos_nuevos: { tipo, clienteId, productoId, cantidadM3, choferId: choferIdFinal, chofer: choferNombre, pedidoId, obra: obraFinal, fecha: fechaFinal, observaciones: observacionesFinal },
      ip_address: getClientIp(request),
    });

    return NextResponse.json({ success: true, id: result.insertId, numeroGuia, fecha: fechaFinal }, { status: 201 });
  } catch (error) {
    console.error('Error POST guia_despacho:', error);
    return NextResponse.json({ error: 'Error al crear guía de despacho' }, { status: 500 });
  }
}

// Anular una guía ya emitida.
//
// El caso real: el camión se accidentó en el camino, la guía ya está impresa y
// hay que rehacer el despacho con otro chofer y otra unidad. Borrar la fila
// también devolvería el inventario (el stock se calcula sumando las guías, no
// con un contador aparte), pero se lleva puesto el papel: queda un número de
// guía emitido del que no hay rastro, y la guía nueva igual lleva otro número.
// Anular deja la guía en la base, marcada y con el motivo, y la saca de todas
// las sumas: inventario, acumulado del pedido y reportes.
//
// No se reusa el número de guía anulada ni se renumeran las demás: el papel
// anulado existe y tiene ese número.
export async function PATCH(request: Request) {
  // requireAuth deja pasar siempre a admin y gerencia (son superusuarios),
  // así que esta lista es "además, el dosificador", que es quien emite las
  // guías en planta y el que se entera del accidente.
  const auth = await requireAuth(['dosificador']);
  if (auth.response) return auth.response;

  try {
    await ensureColumns();
    const { id, motivo } = await request.json();

    const idGuia = Number(id);
    if (!Number.isInteger(idGuia) || idGuia <= 0) {
      return NextResponse.json({ error: 'Guía inválida.' }, { status: 400 });
    }

    // El motivo es obligatorio: una guía anulada sin explicación no sirve para
    // reconstruir después qué pasó con ese número.
    const motivoLimpio = typeof motivo === 'string' ? motivo.trim() : '';
    if (motivoLimpio.length < 3) {
      return NextResponse.json({ error: 'Debe indicar el motivo de la anulación.' }, { status: 400 });
    }

    const filas: any = await query(
      'SELECT id, tipo, numero_guia AS numeroGuia, cantidad_m3 AS cantidadM3, pedido_id AS pedidoId, COALESCE(anulada, 0) AS anulada FROM guia_despacho WHERE id = ?',
      [idGuia],
    );
    if (filas.length === 0) {
      return NextResponse.json({ error: 'La guía no existe.' }, { status: 404 });
    }
    const guia = filas[0];
    if (Number(guia.anulada) === 1) {
      return NextResponse.json({ error: 'La guía ya está anulada.' }, { status: 400 });
    }

    await query(
      'UPDATE guia_despacho SET anulada = 1, motivo_anulacion = ?, anulada_at = NOW(), anulada_por = ? WHERE id = ?',
      [motivoLimpio.slice(0, 255), auth.session.userId, idGuia],
    );

    // El pedido vuelve al estado que le corresponde sin esta guía: los M³ que
    // no se despacharon quedan otra vez disponibles para la guía nueva.
    if (guia.pedidoId) {
      const [pedidoRows]: any = await query('SELECT cantidad_m3 FROM pedidos WHERE id = ?', [guia.pedidoId]);
      const pedidoTotal = Number(pedidoRows?.cantidad_m3 || 0);
      const [sumRows]: any = await query(
        'SELECT COALESCE(SUM(cantidad_m3), 0) AS totalGuias FROM guia_despacho WHERE pedido_id = ? AND COALESCE(anulada, 0) = 0',
        [guia.pedidoId],
      );
      const totalGuias = Number(sumRows?.totalGuias || 0);
      const estado = totalGuias >= pedidoTotal && pedidoTotal > 0
        ? 'completado'
        : totalGuias > 0 ? 'en_proceso' : 'pendiente';
      await query('UPDATE pedidos SET estado = ? WHERE id = ?', [estado, guia.pedidoId]);
      emitSocketEvent('pedidos:updated');
    }

    emitSocketEvent('guia-despacho:anulada');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      // La auditoría solo admite crear / editar / eliminar: anular es una
      // edición de la guía, no un borrado, y el detalle va en la descripción.
      ...usuario, accion: 'editar', modulo: 'Guías de Despacho', entidad_id: idGuia,
      descripcion: `Anuló la guía GD-${guia.numeroGuia ?? guia.id} (${guia.tipo}) - ${guia.cantidadM3} M3 - motivo: ${motivoLimpio}`,
      datos_anteriores: { anulada: 0 },
      datos_nuevos: { anulada: 1, motivo: motivoLimpio },
      ip_address: getClientIp(request),
    });

    return NextResponse.json({ success: true, id: idGuia }, { status: 200 });
  } catch (error) {
    console.error('Error PATCH guia_despacho (anular):', error);
    return NextResponse.json({ error: 'Error al anular la guía de despacho' }, { status: 500 });
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
