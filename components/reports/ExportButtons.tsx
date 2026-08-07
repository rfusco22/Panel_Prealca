'use client';

import { FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { exportToExcel, exportToPDF } from '@/lib/export';

interface ExportButtonsProps {
  excelData: { title: string; columns: string[]; data: (string | number)[][]; footer?: string };
  pdfData?: { title: string; columns: string[]; data: (string | number)[][]; footer?: string };
}

export function ExportButtons({ excelData, pdfData }: ExportButtonsProps) {
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExcel = () => {
    setExporting('excel');
    setTimeout(() => {
      exportToExcel(excelData);
      setExporting(null);
    }, 300);
  };

  const handlePDF = () => {
    setExporting('pdf');
    setTimeout(() => {
      exportToPDF(pdfData || excelData);
      setExporting(null);
    }, 300);
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleExcel}
        disabled={exporting === 'excel'}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition disabled:opacity-50"
      >
        {exporting === 'excel' ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
        Excel
      </button>
      <button
        onClick={handlePDF}
        disabled={exporting === 'pdf'}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition disabled:opacity-50"
      >
        {exporting === 'pdf' ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
        PDF
      </button>
    </div>
  );
}
