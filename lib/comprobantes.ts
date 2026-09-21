// Comprobantes de pago (transferencias, pagos móviles) de ingresos y egresos.
//
// Antes los formularios obligaban a adjuntar un comprobante, lo convertían a
// base64 y lo mandaban al servidor, pero el servidor lo ignoraba: no había
// dónde guardarlo. El admin adjuntaba la prueba del pago y se tiraba.
//
// Se guardan en la base y no en disco por tres motivos: queda todo en un solo
// respaldo (el export de la base que ya se hace), no depende de tener bien
// configurado un volumen en EasyPanel (sin él, los archivos se borrarían en
// cada deploy), y el comprobante queda protegido por los mismos permisos por
// rol que el registro al que pertenece.
//
// Van en una tabla aparte y no como columna de ingresos/egresos: los listados
// hacen SELECT * y cada apertura de la lista descargaría todas las imágenes.
// Acá el archivo solo se lee cuando alguien pide verlo.

import type { PoolConnection } from 'mysql2/promise';
import { query } from '@/lib/db';

export type TipoComprobante = 'ingreso' | 'egreso';

// Límites. Las fotos llegan ya comprimidas desde el navegador (unos 200-400 KB),
// así que 2 MB es un margen de seguridad, no el tamaño esperado. Los PDF del
// banco no se pueden comprimir en el navegador pero suelen pesar poco.
// max_allowed_packet en producción es 64 MB, muy por encima de esto.
const MAX_IMAGEN = 2 * 1024 * 1024;
const MAX_PDF = 3 * 1024 * 1024;
const MAX_POR_REGISTRO = 5;

// Solo estos tipos. SVG queda afuera a propósito: es XML y puede traer
// scripts, que se ejecutarían al abrir el archivo desde el panel.
const TIPOS = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const;
type Mime = (typeof TIPOS)[number];

export class ComprobanteInvalido extends Error {}

export async function ensureTablaComprobantes() {
  // CREATE TABLE hace commit implícito en MySQL: se llama antes de abrir la
  // transacción del alta, nunca adentro.
  await query(`
    CREATE TABLE IF NOT EXISTS comprobantes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tipo ENUM('ingreso','egreso') NOT NULL,
      registro_id INT NOT NULL,
      nombre VARCHAR(255) NOT NULL,
      mime VARCHAR(100) NOT NULL,
      tamano INT NOT NULL,
      datos MEDIUMBLOB NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_comprobantes_registro (tipo, registro_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

// El tipo se decide por los primeros bytes del archivo, no por lo que declara
// el data URL: ese dato lo arma el navegador y se puede falsear. Un archivo
// que dice ser JPEG pero no empieza como un JPEG se rechaza.
function detectarMime(buf: Buffer): Mime | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.length >= 12 && buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  if (buf.length >= 5 && buf.subarray(0, 5).toString('ascii') === '%PDF-') return 'application/pdf';
  return null;
}

export interface ComprobanteListo {
  nombre: string;
  mime: Mime;
  datos: Buffer;
}

/**
 * Valida lo que manda el formulario ({ name, url } con url en data URL) y lo
 * convierte a binario. Lanza ComprobanteInvalido con un mensaje para mostrarle
 * al usuario. Se llama ANTES de insertar nada, para rechazar el alta entera si
 * un archivo no sirve.
 */
export function prepararComprobantes(entrada: unknown): ComprobanteListo[] {
  if (entrada == null) return [];
  if (!Array.isArray(entrada)) throw new ComprobanteInvalido('Formato de comprobantes inválido.');
  if (entrada.length > MAX_POR_REGISTRO) {
    throw new ComprobanteInvalido(`Se pueden adjuntar hasta ${MAX_POR_REGISTRO} comprobantes.`);
  }

  return entrada.map((c: any, i) => {
    const nombre = String(c?.name || `comprobante-${i + 1}`).slice(0, 255);
    // Solo caracteres base64: base64 no lleva saltos de línea ni otra cosa.
    const m = /^data:[^;,]*;base64,([A-Za-z0-9+/]+={0,2})$/.exec(String(c?.url || ''));
    if (!m) throw new ComprobanteInvalido(`"${nombre}" no es un archivo válido.`);

    const datos = Buffer.from(m[1], 'base64');
    const mime = detectarMime(datos);
    if (!mime) {
      throw new ComprobanteInvalido(`"${nombre}": solo se aceptan imágenes (JPG, PNG, WEBP) o PDF.`);
    }
    const max = mime === 'application/pdf' ? MAX_PDF : MAX_IMAGEN;
    if (datos.length > max) {
      throw new ComprobanteInvalido(`"${nombre}" pesa más de ${max / 1024 / 1024} MB.`);
    }
    return { nombre, mime, datos };
  });
}

/** Inserta los comprobantes dentro de la transacción del alta. */
export async function guardarComprobantes(
  conn: PoolConnection,
  tipo: TipoComprobante,
  registroId: number,
  lista: ComprobanteListo[],
) {
  for (const c of lista) {
    await conn.execute(
      'INSERT INTO comprobantes (tipo, registro_id, nombre, mime, tamano, datos) VALUES (?, ?, ?, ?, ?, ?)',
      [tipo, registroId, c.nombre, c.mime, c.datos.length, c.datos],
    );
  }
}

export interface ComprobanteMeta {
  id: number;
  nombre: string;
  mime: string;
  tamano: number;
}

/**
 * Metadatos de los comprobantes de varios registros, sin el archivo. Es lo que
 * usan los listados para mostrar el link "ver comprobante".
 */
export async function metaComprobantes(
  tipo: TipoComprobante,
  ids: number[],
): Promise<Record<number, ComprobanteMeta[]>> {
  const porRegistro: Record<number, ComprobanteMeta[]> = {};
  if (ids.length === 0) return porRegistro;
  // Un placeholder por id: execute() no expande arrays en un solo "?".
  const marcas = ids.map(() => '?').join(',');
  const filas: any = await query(
    `SELECT id, registro_id AS registroId, nombre, mime, tamano
     FROM comprobantes WHERE tipo = ? AND registro_id IN (${marcas}) ORDER BY id`,
    [tipo, ...ids],
  );
  for (const f of filas) {
    (porRegistro[f.registroId] ||= []).push({
      id: f.id, nombre: f.nombre, mime: f.mime, tamano: Number(f.tamano),
    });
  }
  return porRegistro;
}
