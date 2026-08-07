'use client';

import { Printer, Download } from 'lucide-react';
import { useState } from 'react';
import { generateGuiaDespachoHtml, generatePrealcaHtml } from '@/lib/document-templates';

interface GuiaDespacho {
  id: number;
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
  chofer: string;
  placa?: string;
  numeroUnidad?: string;
  pedidoId?: number;
  pedidoTotalM3?: number;
}

interface GuiaDespachoTableProps {
  data: GuiaDespacho[];
}

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

  return guia.tipo === 'Prealca'
    ? generatePrealcaHtml({
        guiaNumber: `GD-${guia.id}`,
        fecha: guia.fecha,
        clienteNombre: guia.clienteNombre,
        clienteRif: guia.clienteRif || '',
        clienteDireccion: guia.clienteDireccion || '',
        chofer: guia.chofer,
        unidad: guia.placa || '',
        operador: guia.chofer,
        items: [item],
        total: Number(guia.cantidadM3),
      })
    : generateGuiaDespachoHtml({
        guiaNumber: `GD-${guia.id}`,
        fecha: guia.fecha,
        clienteNombre: guia.clienteNombre,
        clienteRif: guia.clienteRif || '',
        clienteDireccion: guia.clienteDireccion || '',
        clienteTelefono: guia.clienteTelefono,
        chofer: guia.chofer,
        placa: guia.placa || '',
        vanM3: van,
        deM3: de,
        items: [item],
        total: Number(guia.cantidadM3),
      });
}

export function GuiaDespachoTable({ data }: GuiaDespachoTableProps) {
  const [printingId, setPrintingId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const getVanDe = (guia: GuiaDespacho) => {
    if (!guia.pedidoId) return { van: 0, de: 0 };
    const de = Number(guia.pedidoTotalM3) || 0;
    const priorM3 = data
      .filter(g => g.pedidoId === guia.pedidoId && g.id < guia.id)
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
      pdf.save(`Guia_Despacho_GD-${guia.id}.pdf`);
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
              <tr key={guia.id} className="border-b hover:bg-gray-50 transition">
                <td className="px-6 py-3 text-sm text-gray-900">
                  {new Date(guia.fecha).toLocaleDateString('es-ES')}
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
                </td>
                <td className="px-6 py-3 text-sm text-gray-600">{guia.clienteNombre}</td>
                <td className="px-6 py-3 text-sm text-gray-600">{guia.productoNombre}</td>
                <td className="px-6 py-3 text-sm text-gray-900 font-medium">
                  {Number(guia.cantidadM3) ? Number(guia.cantidadM3).toFixed(2) : '-'}
                </td>
                <td className="px-6 py-3 text-sm text-gray-600">{guia.chofer || '-'}</td>
                <td className="px-6 py-3 text-center">
                  <div className="flex gap-1 justify-center">
                    <button
                      onClick={() => handlePrint(guia)}
                      disabled={printingId === guia.id}
                      className="p-2 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition disabled:opacity-50"
                      title="Imprimir"
                    >
                      {printingId === guia.id ? (
                        <span className="animate-spin inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                      ) : (
                        <Printer size={16} />
                      )}
                    </button>
                    <button
                      onClick={() => handleDownload(guia)}
                      disabled={downloadingId === guia.id}
                      className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition disabled:opacity-50"
                      title="Descargar PDF"
                    >
                      {downloadingId === guia.id ? (
                        <span className="animate-spin inline-block w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full" />
                      ) : (
                        <Download size={16} />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
