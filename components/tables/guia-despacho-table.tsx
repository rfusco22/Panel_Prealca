'use client';

import { Printer, Download, Ban, AlertCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { generateGuiaDespachoHtml, generatePrealcaHtml, generateServicioBombaHtml } from '@/lib/document-templates';
import { formatearFecha } from '@/lib/fecha';
interface GuiaDespacho {
  id: number;
  // Numeración nueva, separada del id, que arranca en 1 (ver
  // sql/migracion_numero_guia.sql). Las guías creadas antes de esa
  // migración no lo tienen.
  numeroGuia?: number;
  fecha: string;
  tipo: string;
  clienteNombre: string;
  clienteRif?: string;
  clienteDireccion?: string;
  clienteTelefono?: string;
  productoNombre: string;
  resistencia?: string;
  pulgada?: string;
  cantidadM3: number;
  total: number;
  choferId?: number | null;
  /** Nombre actual del chofer, resuelto por la API contra la tabla choferes. */
  choferNombre?: string;
  /** Nombre con el que se emitió la guía. Se usa al reimprimir, ver buildGuiaHtml. */
  chofer: string;
  placa?: string;
  numeroUnidad?: string;
  pedidoId?: number;
  pedidoTotalM3?: number;
  obra?: string;
  /** Obra del pedido asociado, cuando la guía no trae una propia. */
  pedidoObra?: string;
  /** Texto libre que escribió quien emitió la guía. Se reimprime tal cual. */
  observaciones?: string;
  /** 1 cuando la guía fue anulada: no se reimprime ni suma en ningún lado. */
  anulada?: number | boolean;
  motivoAnulacion?: string;
  anuladaAt?: string;
}

interface GuiaDespachoTableProps {
  data: GuiaDespacho[];
  /** Se llama después de anular, para que el listado se refresque. */
  onChange?: () => void;
}

function estaAnulada(guia: GuiaDespacho): boolean {
  return guia.anulada === 1 || guia.anulada === true;
}

// Al reimprimir se usa guia.chofer (el nombre que quedó guardado al emitirla) y
// no el nombre actual del chofer: una reimpresión tiene que salir igual al
// documento original, aunque después le hayan corregido el nombre en su ficha.
function buildGuiaHtml(guia: GuiaDespacho, van: number, de: number): string {
  const item = {
    nombreProducto: guia.productoNombre,
    resistencia: guia.resistencia || guia.productoNombre.split(' - ')[0],
    pulgada: guia.pulgada || guia.productoNombre.split(' - ')[1],
    cantidad: Number(guia.cantidadM3),
    unidadMedida: 'M³',
    precioUnitario: 0,
    subtotalItem: 0,
  };

  const guiaNumber = `GD-${guia.numeroGuia ?? guia.id}`;

  // Cada tipo se reimprime con su propia plantilla. Antes la condición solo
  // separaba Prealca del resto, así que una orden de Servicio de Bomba se
  // reimprimía como guía de Premezclado, que es otro documento.
  if (guia.tipo === 'Servicio de Bomba') {
    return generateServicioBombaHtml({
      guiaNumber,
      fecha: guia.fecha,
      clienteNombre: guia.clienteNombre,
      clienteRif: guia.clienteRif || '',
      clienteDireccion: guia.clienteDireccion || '',
      clienteTelefono: guia.clienteTelefono,
      operador: guia.chofer,
      unidad: guia.placa || guia.numeroUnidad || '',
      observaciones: guia.observaciones || '',
      items: [item],
    });
  }

  return guia.tipo === 'Prealca'
    ? generatePrealcaHtml({
        guiaNumber,
        fecha: guia.fecha,
        clienteNombre: guia.clienteNombre,
        clienteRif: guia.clienteRif || '',
        clienteDireccion: guia.clienteDireccion || '',
        obra: guia.obra || guia.pedidoObra || '',
        chofer: guia.chofer,
        placa: guia.placa || '',
        observaciones: guia.observaciones || '',
        items: [item],
      })
    : generateGuiaDespachoHtml({
        guiaNumber,
        fecha: guia.fecha,
        clienteNombre: guia.clienteNombre,
        clienteRif: guia.clienteRif || '',
        clienteDireccion: guia.clienteDireccion || '',
        clienteTelefono: guia.clienteTelefono,
        chofer: guia.chofer,
        placa: guia.placa || '',
        vanM3: van,
        deM3: de,
        observaciones: guia.observaciones || '',
        items: [item],
        total: Number(guia.cantidadM3),
      });
}

export function GuiaDespachoTable({ data, onChange }: GuiaDespachoTableProps) {
  const [printingId, setPrintingId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  // Anular pide motivo, así que va por un cuadro propio y no por un confirm():
  // el motivo queda guardado y es lo único que explica después ese número de
  // guía sin despacho.
  const [guiaAAnular, setGuiaAAnular] = useState<GuiaDespacho | null>(null);
  const [motivo, setMotivo] = useState('');
  const [anulando, setAnulando] = useState(false);
  const [errorAnular, setErrorAnular] = useState<string | null>(null);

  const abrirAnular = (guia: GuiaDespacho) => {
    setGuiaAAnular(guia);
    setMotivo('');
    setErrorAnular(null);
  };

  const confirmarAnular = async () => {
    if (!guiaAAnular) return;
    if (motivo.trim().length < 3) {
      setErrorAnular('Escriba el motivo de la anulación.');
      return;
    }
    setAnulando(true);
    setErrorAnular(null);
    try {
      const res = await fetch('/api/guia-despacho', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: guiaAAnular.id, motivo: motivo.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'No se pudo anular la guía');
      setGuiaAAnular(null);
      onChange?.();
    } catch (e) {
      setErrorAnular(e instanceof Error ? e.message : 'No se pudo anular la guía');
    } finally {
      setAnulando(false);
    }
  };

  const getVanDe = (guia: GuiaDespacho) => {
    if (!guia.pedidoId) return { van: 0, de: 0 };
    const de = Number(guia.pedidoTotalM3) || 0;
    const priorM3 = data
      .filter(g => g.pedidoId === guia.pedidoId && g.id < guia.id && !estaAnulada(g))
      .reduce((sum, g) => sum + (Number(g.cantidadM3) || 0), 0);
    const van = priorM3 + Number(guia.cantidadM3);
    return { van, de };
  };

  const handlePrint = (guia: GuiaDespacho) => {
    setPrintingId(guia.id);
    const { van, de } = getVanDe(guia);
    const html = buildGuiaHtml(guia, van, de);
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
    }
    setTimeout(() => setPrintingId(null), 500);
  };

  const handleDownload = async (guia: GuiaDespacho) => {
    setDownloadingId(guia.id);
    try {
      const { van, de } = getVanDe(guia);
      const html = buildGuiaHtml(guia, van, de);

      const html2canvas = (await import('html2canvas-pro')).default;
      const jsPDF = (await import('jspdf')).default;

      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.left = '-9999px';
      iframe.style.top = '0';
      iframe.style.width = '800px';
      iframe.style.height = '1200px';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) throw new Error('No iframe document');
      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();

      await new Promise(resolve => setTimeout(resolve, 1500));

      const canvas = await html2canvas(iframeDoc.body, { scale: 2, useCORS: true, logging: false, allowTaint: true, backgroundColor: '#ffffff' });
      document.body.removeChild(iframe);

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      const pdfWidth = 297;
      const pdfHeight = (imgHeight * pdfWidth) / imgWidth;

      const pdf = new jsPDF('l', 'mm', [pdfWidth, pdfHeight]);
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      // El nombre del archivo lleva el mismo número que el documento. Con
      // guia.id, la guía GD-1 se descargaba como Guia_Despacho_GD-7.pdf.
      pdf.save(`Guia_Despacho_GD-${guia.numeroGuia ?? guia.id}.pdf`);
    } catch (e) {
      console.error('Error generating PDF:', e);
      alert('Error al generar el PDF');
    }
    setDownloadingId(null);
  };

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <p className="text-gray-500">No hay guías de despacho registradas</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Fecha</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tipo</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Cliente</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Producto</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">M³</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Chofer</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.map((guia) => (
              <tr
                key={guia.id}
                className={`border-b transition ${estaAnulada(guia) ? 'bg-red-50/40 text-gray-400' : 'hover:bg-gray-50'}`}
              >
                <td className="px-6 py-3 text-sm text-gray-900">
                  {formatearFecha(guia.fecha)}
                </td>
                <td className="px-6 py-3 text-sm">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      guia.tipo === 'Prealca'
                        ? 'bg-blue-100 text-blue-800'
                        : guia.tipo === 'Premezclado'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {guia.tipo}
                  </span>
                  {estaAnulada(guia) && (
                    <span className="ml-2 px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                      ANULADA
                    </span>
                  )}
                </td>
                <td className="px-6 py-3 text-sm text-gray-600">
                  {guia.clienteNombre}
                  {estaAnulada(guia) && guia.motivoAnulacion && (
                    <span className="block text-xs text-red-600 mt-0.5">Motivo: {guia.motivoAnulacion}</span>
                  )}
                </td>
                <td className="px-6 py-3 text-sm text-gray-600">{guia.productoNombre}</td>
                <td className="px-6 py-3 text-sm text-gray-900 font-medium">
                  {Number(guia.cantidadM3) ? Number(guia.cantidadM3).toFixed(2) : '-'}
                </td>
                <td className="px-6 py-3 text-sm text-gray-600">{guia.choferNombre || guia.chofer || '-'}</td>
                <td className="px-6 py-3 text-center">
                  <div className="flex gap-1 justify-center">
                    <button
                      onClick={() => handlePrint(guia)}
                      disabled={printingId === guia.id || estaAnulada(guia)}
                      className="p-2 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition disabled:opacity-50"
                      title={estaAnulada(guia) ? 'Guía anulada: no se reimprime' : 'Imprimir'}
                    >
                      {printingId === guia.id ? (
                        <span className="animate-spin inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                      ) : (
                        <Printer size={16} />
                      )}
                    </button>
                    <button
                      onClick={() => handleDownload(guia)}
                      disabled={downloadingId === guia.id || estaAnulada(guia)}
                      className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition disabled:opacity-50"
                      title={estaAnulada(guia) ? 'Guía anulada: no se descarga' : 'Descargar PDF'}
                    >
                      {downloadingId === guia.id ? (
                        <span className="animate-spin inline-block w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full" />
                      ) : (
                        <Download size={16} />
                      )}
                    </button>
                    {!estaAnulada(guia) && (
                      <button
                        onClick={() => abrirAnular(guia)}
                        className="p-2 text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                        title="Anular guía"
                      >
                        <Ban size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {guiaAAnular && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-red-50 rounded-xl"><Ban className="w-5 h-5 text-red-600" /></div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Anular guía</h3>
                <p className="text-sm text-slate-500">
                  GD-{guiaAAnular.numeroGuia ?? guiaAAnular.id} — {guiaAAnular.clienteNombre} — {Number(guiaAAnular.cantidadM3).toFixed(2)} M³
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-4">
              La guía queda registrada con su número, marcada como anulada, y deja de contar en
              inventario, en el pedido y en los reportes. Después se carga la guía nueva, que lleva
              su propio número.
            </p>

            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Motivo de la anulación</label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              maxLength={255}
              autoFocus
              placeholder="Ej: el camión se accidentó, se rehace con otra unidad"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 text-sm text-slate-900 resize-y"
            />

            {errorAnular && (
              <p className="text-red-600 text-xs mt-2 font-medium flex items-center gap-1">
                <AlertCircle size={12} />{errorAnular}
              </p>
            )}

            <div className="flex justify-end gap-3 mt-5">
              <button
                type="button"
                onClick={() => setGuiaAAnular(null)}
                disabled={anulando}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarAnular}
                disabled={anulando}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg shadow-md transition disabled:opacity-40 flex items-center gap-2"
              >
                {anulando && <Loader2 size={15} className="animate-spin" />}
                {anulando ? 'Anulando...' : 'Anular guía'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
