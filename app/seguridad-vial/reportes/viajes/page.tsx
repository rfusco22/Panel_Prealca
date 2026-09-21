'use client';

import { useState } from 'react';
import { Truck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { DateRangePicker, QuickDateFilters } from '@/components/reports/DateRangePicker';
import { ViajesPorTrompero } from '@/app/admin/reportes/operativos/page';

// Seguridad Vial ve SOLO el reporte de viajes, no el selector de los seis.
//
// Esta página no es un re-export de app/admin/reportes/operativos como las de
// Gerencia. Ahí los seis reportes viven en una misma página y se cambian con un
// desplegable, así que reexportarla le daría también las comisiones de los
// vendedores, los montos por cliente y el gasto en materia prima. Acá se monta
// el componente de viajes suelto y no hay forma de llegar a los otros cinco.
//
// El permiso de verdad no está en esta página sino en el API, que desde
// ROLES_POR_REPORTE deja a seguridad-vial pedir type=viajes y le devuelve 403
// en todo el resto: esconder un link no alcanza como control de acceso.
//
// Lo que sí necesita ver: cuántos viajes hizo cada chofer, al lado del estado
// de su licencia y su certificado médico. El reporte no muestra pagos -el
// sistema no registra lo que gana un chofer en ninguna parte- así que abrirlo
// no expone remuneraciones.
export default function ReporteViajesSeguridadVialPage() {
  // Sin filtro al abrir, igual que la página de Admin: arrancar en "hoy"
  // mostraría cero viajes casi siempre y parecería que el reporte está roto.
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/seguridad-vial" className="p-2 hover:bg-slate-100 rounded-lg transition">
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <div className="p-2.5 bg-cyan-50 rounded-xl"><Truck className="w-5 h-5 text-cyan-600" /></div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Viajes por Trompero</h1>
          <p className="text-xs text-slate-500">
            Viajes y M³ de cada chofer, con el estado de sus documentos
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end gap-3">
        <DateRangePicker from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />
        <QuickDateFilters onChange={(f, t) => { setFrom(f); setTo(t); }} />
      </div>

      <ViajesPorTrompero from={from} to={to} />
    </div>
  );
}
