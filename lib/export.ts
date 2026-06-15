import XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ExportData {
  title: string;
  columns: string[];
  data: (string | number)[][];
  footer?: string;
}

export function exportToExcel(data: ExportData) {
  const worksheet = XLSX.utils.aoa_to_sheet([
    [data.title],
    [],
    data.columns,
    ...data.data,
  ]);

  worksheet['!cols'] = Array(data.columns.length).fill({ wch: 15 });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');

  const filename = `${data.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

export function exportToPDF(data: ExportData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // Title
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text(data.title, margin, 20);

  // Date
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, margin, 28);

  // Table
  const startY = 35;
  (doc as any).autoTable({
    head: [data.columns],
    body: data.data,
    startY: startY,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
  });

  // Footer
  if (data.footer) {
    const finalY = (doc as any).lastAutoTable.finalY || startY;
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(data.footer, margin, finalY + 10);
  }

  // Page numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin - 20, pageHeight - 10);
  }

  const filename = `${data.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

export function generateIngresoReport(ingresos: any[]) {
  const columns = [
    'Fecha',
    'Banco',
    'Cliente',
    'Vendedor',
    'Monto (Bs)',
    'Monto ($)',
    'IVA',
    'Es Anticipo',
  ];

  const data = ingresos.map((ingreso) => [
    new Date(ingreso.fecha).toLocaleDateString('es-ES'),
    `Banco ${ingreso.bancoId}`,
    `Cliente ${ingreso.clienteId}`,
    ingreso.vendedor || '-',
    ingreso.precioBolivares.toFixed(2),
    (ingreso.precioDolares || 0).toFixed(2),
    (ingreso.ivaMonto || 0).toFixed(2),
    ingreso.esAnticipo ? 'Sí' : 'No',
  ]);

  return { title: 'Reporte de Ingresos', columns, data };
}

export function generateEgresoReport(egresos: any[]) {
  const columns = [
    'Fecha',
    'Banco',
    'Proveedor',
    'Clasificación',
    'Tipo de Gasto',
    'Monto (Bs)',
    'Monto ($)',
  ];

  const data = egresos.map((egreso) => [
    new Date(egreso.fecha).toLocaleDateString('es-ES'),
    `Banco ${egreso.bancoId}`,
    `Proveedor ${egreso.proveedorId}`,
    egreso.clasificacionGasto,
    egreso.tipoGasto,
    egreso.montoBolivares.toFixed(2),
    (egreso.montoDolares || 0).toFixed(2),
  ]);

  return { title: 'Reporte de Egresos', columns, data };
}

export function generateFacturaReport(facturas: any[]) {
  const columns = [
    'Nº Factura',
    'Fecha',
    'Cliente',
    'Tipo',
    'Monto (Bs)',
    'IVA',
    'Total',
    'Estatus',
  ];

  const data = facturas.map((factura) => [
    factura.numeroFactura,
    new Date(factura.fechaEmision).toLocaleDateString('es-ES'),
    `Cliente ${factura.clienteId}`,
    factura.tipoFactura,
    factura.montoTotal.toFixed(2),
    (factura.iva || 0).toFixed(2),
    (factura.montoTotal + (factura.iva || 0)).toFixed(2),
    factura.estatus,
  ]);

  return { title: 'Reporte de Facturas', columns, data };
}
