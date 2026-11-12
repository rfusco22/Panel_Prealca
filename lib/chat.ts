// Chat interno entre usuarios.
//
// Lo usan dos lados: server.ts (los mensajes entran y salen por WebSocket, con
// Socket.IO) y las rutas /api/chat/* (historial y lista de contactos). Por eso
// los imports son relativos y no con el alias '@/': server.ts corre con tsx
// fuera de Next.
//
// destinatario_id NULL = canal "General" (lo ven todos los usuarios).
// En mensajes directos, `leido` marca si el destinatario ya lo vio. En el canal
// general no hay un leído por mensaje: cada usuario guarda hasta qué id leyó
// en chat_lecturas.
// Ver sql/migracion_chat.sql.
import { query } from './db';

export const LARGO_MAXIMO_MENSAJE = 2000;

export interface MensajeChat {
  id: number;
  remitenteId: number;
  remitenteNombre: string | null;
  remitenteRol: string | null;
  destinatarioId: number | null;
  contenido: string;
  leido: number;
  createdAt: string;
}

let tablasListas = false;

export async function ensureTablasChat(): Promise<void> {
  if (tablasListas) return;
  await query(`
    CREATE TABLE IF NOT EXISTS chat_mensajes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      remitente_id INT NOT NULL,
      destinatario_id INT NULL,
      contenido TEXT NOT NULL,
      leido TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_chat_conversacion (remitente_id, destinatario_id),
      INDEX idx_chat_destinatario (destinatario_id, leido)
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS chat_lecturas (
      usuario_id INT PRIMARY KEY,
      ultimo_general_id INT NOT NULL DEFAULT 0
    )
  `);
  tablasListas = true;
}

const SELECT_MENSAJE = `
  SELECT m.id, m.remitente_id AS remitenteId, u.nombre AS remitenteNombre, u.role AS remitenteRol,
         m.destinatario_id AS destinatarioId, m.contenido, m.leido, m.created_at AS createdAt
  FROM chat_mensajes m
  LEFT JOIN users u ON u.id = m.remitente_id
`;

function normalizar(r: any): MensajeChat {
  return {
    ...r,
    id: Number(r.id),
    remitenteId: Number(r.remitenteId),
    destinatarioId: r.destinatarioId === null || r.destinatarioId === undefined ? null : Number(r.destinatarioId),
    leido: Number(r.leido || 0),
  };
}

/** Valida y guarda un mensaje. Devuelve el mensaje completo o un error. */
export async function guardarMensaje(
  remitenteId: number,
  destinatarioId: number | null,
  contenidoCrudo: unknown
): Promise<{ mensaje: MensajeChat } | { error: string }> {
  await ensureTablasChat();
  const contenido = typeof contenidoCrudo === 'string' ? contenidoCrudo.trim() : '';
  if (!contenido) return { error: 'El mensaje está vacío.' };
  if (contenido.length > LARGO_MAXIMO_MENSAJE) {
    return { error: `El mensaje supera los ${LARGO_MAXIMO_MENSAJE} caracteres.` };
  }
  if (destinatarioId !== null) {
    if (!Number.isInteger(destinatarioId) || destinatarioId <= 0) return { error: 'Destinatario inválido.' };
    if (destinatarioId === remitenteId) return { error: 'No podés enviarte mensajes a vos mismo.' };
    const existe: any = await query('SELECT id FROM users WHERE id = ?', [destinatarioId]);
    if (existe.length === 0) return { error: 'El usuario no existe.' };
  }

  const r: any = await query(
    'INSERT INTO chat_mensajes (remitente_id, destinatario_id, contenido) VALUES (?, ?, ?)',
    [remitenteId, destinatarioId, contenido]
  );
  const filas: any = await query(`${SELECT_MENSAJE} WHERE m.id = ?`, [r.insertId]);
  // Quien escribe en el general ya leyó hasta su propio mensaje.
  if (destinatarioId === null) await marcarGeneralLeido(remitenteId, r.insertId);
  return { mensaje: normalizar(filas[0]) };
}

/** Marca como leídos los mensajes que `otroId` le mandó a `usuarioId`. */
export async function marcarDirectosLeidos(usuarioId: number, otroId: number): Promise<number> {
  await ensureTablasChat();
  const r: any = await query(
    'UPDATE chat_mensajes SET leido = 1 WHERE remitente_id = ? AND destinatario_id = ? AND leido = 0',
    [otroId, usuarioId]
  );
  return Number(r.affectedRows || 0);
}

export async function marcarGeneralLeido(usuarioId: number, hastaId?: number): Promise<void> {
  await ensureTablasChat();
  let ultimo = hastaId;
  if (!ultimo) {
    const f: any = await query('SELECT COALESCE(MAX(id), 0) AS ultimo FROM chat_mensajes WHERE destinatario_id IS NULL');
    ultimo = Number(f[0]?.ultimo || 0);
  }
  await query(
    `INSERT INTO chat_lecturas (usuario_id, ultimo_general_id) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE ultimo_general_id = GREATEST(ultimo_general_id, VALUES(ultimo_general_id))`,
    [usuarioId, ultimo]
  );
}

/** Historial de una conversación, del más viejo al más nuevo. */
export async function obtenerMensajes(
  usuarioId: number,
  con: number | null,
  antesDeId?: number | null,
  limite = 50
): Promise<MensajeChat[]> {
  await ensureTablasChat();
  const lim = Math.min(Math.max(Math.trunc(limite) || 50, 1), 200);
  const params: any[] = [];
  let where: string;
  if (con === null) {
    where = 'm.destinatario_id IS NULL';
  } else {
    where = '((m.remitente_id = ? AND m.destinatario_id = ?) OR (m.remitente_id = ? AND m.destinatario_id = ?))';
    params.push(usuarioId, con, con, usuarioId);
  }
  if (antesDeId) { where += ' AND m.id < ?'; params.push(antesDeId); }
  // LIMIT va interpolado (ya validado como entero): mysql2 con execute() no
  // acepta bien LIMIT como parámetro en todas las versiones de MySQL.
  const filas: any = await query(`${SELECT_MENSAJE} WHERE ${where} ORDER BY m.id DESC LIMIT ${lim}`, params);
  return filas.map(normalizar).reverse();
}

/** Contactos (todos los usuarios menos uno mismo) con último mensaje y no leídos. */
export async function obtenerContactos(usuarioId: number) {
  await ensureTablasChat();
  const usuarios: any = await query(
    `SELECT u.id, u.nombre, u.role, u.estado,
       (SELECT COUNT(*) FROM chat_mensajes m
         WHERE m.remitente_id = u.id AND m.destinatario_id = ? AND m.leido = 0) AS noLeidos,
       (SELECT MAX(m.id) FROM chat_mensajes m
         WHERE (m.remitente_id = u.id AND m.destinatario_id = ?) OR (m.remitente_id = ? AND m.destinatario_id = u.id)) AS ultimoId
     FROM users u
     WHERE u.id <> ?
     ORDER BY u.nombre ASC`,
    [usuarioId, usuarioId, usuarioId, usuarioId]
  );

  const ids = usuarios.map((u: any) => u.ultimoId).filter(Boolean);
  const ultimos = new Map<number, any>();
  if (ids.length) {
    const filas: any = await query(
      `SELECT id, remitente_id AS remitenteId, contenido, created_at AS createdAt
       FROM chat_mensajes WHERE id IN (${ids.map(() => '?').join(',')})`,
      ids
    );
    for (const f of filas) ultimos.set(Number(f.id), f);
  }

  const lectura: any = await query('SELECT ultimo_general_id FROM chat_lecturas WHERE usuario_id = ?', [usuarioId]);
  const ultimoLeidoGeneral = Number(lectura[0]?.ultimo_general_id || 0);
  const general: any = await query(
    `SELECT
       (SELECT COUNT(*) FROM chat_mensajes WHERE destinatario_id IS NULL AND id > ? AND remitente_id <> ?) AS noLeidos,
       (SELECT MAX(id) FROM chat_mensajes WHERE destinatario_id IS NULL) AS ultimoId`,
    [ultimoLeidoGeneral, usuarioId]
  );
  let ultimoGeneral: any = null;
  if (general[0]?.ultimoId) {
    const f: any = await query(
      `SELECT m.id, m.remitente_id AS remitenteId, u.nombre AS remitenteNombre, m.contenido, m.created_at AS createdAt
       FROM chat_mensajes m LEFT JOIN users u ON u.id = m.remitente_id WHERE m.id = ?`,
      [general[0].ultimoId]
    );
    ultimoGeneral = f[0] || null;
  }

  return {
    general: {
      noLeidos: Number(general[0]?.noLeidos || 0),
      ultimoMensaje: ultimoGeneral,
    },
    contactos: usuarios.map((u: any) => ({
      id: Number(u.id),
      nombre: u.nombre,
      role: u.role,
      estado: u.estado,
      noLeidos: Number(u.noLeidos || 0),
      ultimoMensaje: u.ultimoId ? ultimos.get(Number(u.ultimoId)) || null : null,
    })),
  };
}
