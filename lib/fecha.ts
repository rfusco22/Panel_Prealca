// Manejo de fechas del sistema.
//
// El problema que resuelve este módulo: las fechas de negocio (fecha de un
// ingreso, de una guía, un vencimiento) son días del calendario, no instantes.
// Convertirlas a UTC en cualquier punto del camino les mueve el día, porque
// Venezuela está en UTC-4. Dos formas típicas en que pasaba:
//
//   new Date().toISOString().split('T')[0]
//     Da el día en UTC, no el local. Después de las 20:00 en Venezuela ya es
//     el día siguiente en UTC, así que un registro de la noche se guardaba con
//     la fecha de mañana.
//
//   new Date('2026-08-26').toLocaleDateString('es-VE')
//     Un string de solo fecha lo parsea como medianoche UTC, que en UTC-4 es
//     el 25 a las 20:00. Mostraba el día anterior.
//
// La regla: las fechas de negocio se tratan como texto 'YYYY-MM-DD' de punta a
// punta, y solo se convierten a Date en zona local al momento de formatear.

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/**
 * Zona horaria del negocio. Se ancla a propósito en vez de usar la del ambiente:
 * el contenedor corre en UTC, así que "hoy" calculado con la zona del proceso
 * daría el día equivocado toda la tarde-noche de Venezuela. Del lado del
 * navegador también evita que alguien con la laptop en otra zona registre un día
 * distinto al de la planta.
 */
export const ZONA_HORARIA = process.env.NEXT_PUBLIC_TZ || 'America/Caracas';

// en-CA da directamente el formato YYYY-MM-DD
const fmtISO = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_HORARIA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Hoy como 'YYYY-MM-DD' en la zona del negocio. Reemplaza a toISOString().split('T')[0]. */
export function hoyLocal(): string {
  return fmtISO.format(new Date());
}

/** Un Date a 'YYYY-MM-DD' usando sus componentes locales, sin pasar por UTC. */
export function aISOLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dia}`;
}

/** 'YYYY-MM-DD' desplazado en días respecto de hoy. Negativo = pasado. */
export function hoyLocalMasDias(dias: number): string {
  // Se parte del día de hoy en la zona del negocio y se corre por componentes,
  // sin sumar milisegundos, para que no lo afecte la zona del proceso.
  const [y, m, d] = hoyLocal().split('-').map(Number);
  const base = new Date(y, m - 1, d + dias);
  return aISOLocal(base);
}

/**
 * Convierte un valor de fecha de la base a un Date en zona local, respetando el
 * día del calendario. Acepta lo que devuelve mysql2 con dateStrings activado
 * ('YYYY-MM-DD' y 'YYYY-MM-DD HH:mm:ss'), un Date, o un ISO con Z de datos
 * viejos que quedaron cacheados en el cliente.
 */
export function aFechaLocal(valor: unknown): Date | null {
  if (valor === null || valor === undefined || valor === '') return null;

  if (valor instanceof Date) {
    return isNaN(valor.getTime()) ? null : valor;
  }

  const texto = String(valor).trim();

  // 'YYYY-MM-DD' o 'YYYY-MM-DD HH:mm:ss' -> se arma con componentes locales
  const m = texto.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/
  );
  if (m) {
    const [, y, mes, dia, hh, mm, ss] = m;
    // Un ISO en UTC a medianoche exacta es una fecha de calendario que pasó por
    // una conversión: se toma el día tal cual viene, sin correrlo a local.
    const esMedianocheUtc = /T00:00:00(\.000)?Z$/.test(texto);
    if (!hh || esMedianocheUtc) {
      return new Date(Number(y), Number(mes) - 1, Number(dia));
    }
    return new Date(
      Number(y), Number(mes) - 1, Number(dia),
      Number(hh), Number(mm), Number(ss || 0)
    );
  }

  const d = new Date(texto);
  return isNaN(d.getTime()) ? null : d;
}

/** Formatea como dd/mm/aaaa. Devuelve el marcador si el valor está vacío. */
export function formatearFecha(valor: unknown, vacio = '—'): string {
  const d = aFechaLocal(valor);
  if (!d) return vacio;
  return d.toLocaleDateString('es-VE');
}

/** Formatea como '26 ago 2026'. */
export function formatearFechaCorta(valor: unknown, vacio = '—'): string {
  const d = aFechaLocal(valor);
  if (!d) return vacio;
  return `${String(d.getDate()).padStart(2, '0')} ${MESES_CORTOS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Formatea con hora: '26 ago 2026, 14:30'. Para timestamps de auditoría. */
export function formatearFechaHora(valor: unknown, vacio = '—'): string {
  const d = aFechaLocal(valor);
  if (!d) return vacio;
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${formatearFechaCorta(valor)}, ${hh}:${mm}`;
}

/**
 * Días enteros entre hoy y la fecha dada, comparando días del calendario.
 * Negativo = ya pasó. Devuelve null si el valor no es una fecha.
 *
 * Se compara medianoche local contra medianoche local a propósito: hacerlo con
 * getTime() sobre las horas crudas metía un desfase de 4 horas que, al redondear
 * con Math.ceil, corría el conteo un día y cambiaba de categoría un vencimiento.
 */
export function diasHasta(valor: unknown): number | null {
  const d = aFechaLocal(valor);
  if (!d) return null;
  const objetivo = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const [y, m, dia] = hoyLocal().split('-').map(Number);
  const hoy = new Date(y, m - 1, dia);
  return Math.round((objetivo.getTime() - hoy.getTime()) / 86400000);
}

/** 'YYYY-MM-DD' para poner en un <input type="date">. */
export function aFechaInput(valor: unknown): string {
  const d = aFechaLocal(valor);
  return d ? aISOLocal(d) : '';
}
