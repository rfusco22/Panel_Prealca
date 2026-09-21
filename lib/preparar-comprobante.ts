// Prepara un comprobante en el navegador antes de mandarlo al servidor.
//
// Los comprobantes se guardan en la base (ver lib/comprobantes.ts). Una foto de
// celular pesa 3 a 5 MB, y en base64 un tercio más: guardada tal cual, la base
// crecería rápido y los exports de phpMyAdmin se volverían lentos y pesados.
// Por eso las fotos se reducen acá a un tamaño que se sigue leyendo bien
// (lado mayor de 1600 px, JPEG al 80%), y quedan en unos 200-400 KB.
//
// Los PDF no se pueden comprimir en el navegador; se aceptan tal cual con un
// tope. Los límites tienen que coincidir con los del servidor.

const LADO_MAXIMO = 1600;
const CALIDAD_JPEG = 0.8;
const MAX_PDF = 3 * 1024 * 1024;

export interface ComprobanteAdjunto {
  name: string;
  url: string; // data URL
}

function leerComoDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsDataURL(file);
  });
}

function cargarImagen(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo abrir la imagen.'));
    img.src = url;
  });
}

async function comprimirImagen(file: File): Promise<ComprobanteAdjunto> {
  const original = await leerComoDataUrl(file);
  const img = await cargarImagen(original);

  const escala = Math.min(1, LADO_MAXIMO / Math.max(img.width, img.height));
  const ancho = Math.round(img.width * escala);
  const alto = Math.round(img.height * escala);

  const canvas = document.createElement('canvas');
  canvas.width = ancho;
  canvas.height = alto;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { name: file.name, url: original };
  // Fondo blanco: un PNG con transparencia pasado a JPEG quedaría con el
  // fondo negro y el texto del comprobante sería ilegible.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, ancho, alto);
  ctx.drawImage(img, 0, 0, ancho, alto);

  const comprimida = canvas.toDataURL('image/jpeg', CALIDAD_JPEG);
  // Si por algún motivo la versión "comprimida" quedó más pesada (una imagen
  // chica y ya optimizada), se manda la original.
  const url = comprimida.length < original.length ? comprimida : original;
  const nombre = url === comprimida ? file.name.replace(/\.[^.]+$/, '') + '.jpg' : file.name;
  return { name: nombre, url };
}

/**
 * Convierte un archivo elegido en el formulario en un comprobante listo para
 * mandar. Lanza un Error con un mensaje para el usuario si el archivo no sirve.
 */
export async function prepararComprobante(file: File): Promise<ComprobanteAdjunto> {
  if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
    if (file.size > MAX_PDF) {
      throw new Error(`"${file.name}" pesa más de 3 MB. Probá exportarlo de nuevo o mandá una captura.`);
    }
    return { name: file.name, url: await leerComoDataUrl(file) };
  }
  // SVG queda afuera: es XML y puede traer scripts.
  if (file.type.startsWith('image/') && file.type !== 'image/svg+xml') {
    return comprimirImagen(file);
  }
  throw new Error(`"${file.name}": solo se aceptan imágenes o PDF.`);
}
