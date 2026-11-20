'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, Truck, Droplets, Clock, FileText } from 'lucide-react';
import { GuiaDespachoTable } from '@/components/tables/guia-despacho-table';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/hooks/useAuth';

export default function GuiaDespachoPage() {
  const { socket } = useSocket();
  const { session } = useAuth();
  const [guias, setGuias] = useState<any[]>([]);

  const fetchGuias = async () => {
    try {
      const res = await fetch('/api/guia-despacho');
      const data = await res.json();
      if (data.success) setGuias(data.guias);
    } catch (err) {
      console.error('[v0] Error fetching guías:', err);
    }
  };

  useEffect(() => {
    fetchGuias();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchGuias();
    };

    socket.on('guia-despacho:created', handleUpdate);
    socket.on('guia-despacho:anulada', handleUpdate);
    socket.on('guia-despacho:anulacion-solicitada', handleUpdate);

    return () => {
      socket.off('guia-despacho:created', handleUpdate);
      socket.off('guia-despacho:anulada', handleUpdate);
      socket.off('guia-despacho:anulacion-solicitada', handleUpdate);
    };
  }, [socket]);

  // Números de cabecera: lo que se mira antes de entrar a la tabla.
  const vigentes = guias.filter(g => !(g.anulada === 1 || g.anulada === true));
  const totalM3 = vigentes.reduce((s, g) => s + (Number(g.cantidadM3) || 0), 0);
  const pendientes = guias.filter(g => g.anulacionEstado === 'solicitada' && !(g.anulada === 1 || g.anulada === true)).length;

  return (
    <div className="space-y-6">
      <div className="aparecer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-700/20">
            <Truck size={22} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Guías de Despacho</h1>
            <p className="text-slate-500 mt-0.5 text-sm">Cada guía emitida, con su número y su estado.</p>
          </div>
        </div>
        <Link href={`/${session?.user?.role || 'dosificador'}/guia-despacho/new`}>
          <Button className="accion group bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 rounded-xl px-5 py-3 font-semibold shadow-lg shadow-blue-600/25 h-auto">
            <Plus size={20} className="transition-transform duration-200 group-hover:rotate-90" />
            Nueva Guía
          </Button>
        </Link>
      </div>

      {guias.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="superficie superficie-levanta indicador aparecer p-5" style={{ ['--tinte' as any]: 'rgba(37, 99, 235, 0.16)', ['--retraso' as any]: '0ms' }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Guías vigentes</p>
                <p className="mt-1.5 text-2xl font-black tracking-tight text-slate-900">{vigentes.length}</p>
                <p className="mt-1 text-xs font-medium text-slate-400">de {guias.length} emitidas</p>
              </div>
              <div className="shrink-0 rounded-xl bg-white/80 p-2.5 shadow-sm ring-1 ring-slate-100"><FileText size={18} className="text-blue-600" /></div>
            </div>
          </div>
          <div className="superficie superficie-levanta indicador aparecer p-5" style={{ ['--tinte' as any]: 'rgba(6, 182, 212, 0.16)', ['--retraso' as any]: '60ms' }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">M³ despachados</p>
                <p className="mt-1.5 text-2xl font-black tracking-tight text-slate-900">{totalM3.toFixed(2)}</p>
                <p className="mt-1 text-xs font-medium text-slate-400">sin contar anuladas</p>
              </div>
              <div className="shrink-0 rounded-xl bg-white/80 p-2.5 shadow-sm ring-1 ring-slate-100"><Droplets size={18} className="text-cyan-600" /></div>
            </div>
          </div>
          <div className="superficie superficie-levanta indicador aparecer p-5" style={{ ['--tinte' as any]: pendientes > 0 ? 'rgba(245, 158, 11, 0.20)' : 'rgba(148, 163, 184, 0.14)', ['--retraso' as any]: '120ms' }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Anulaciones pendientes</p>
                <p className={`mt-1.5 text-2xl font-black tracking-tight ${pendientes > 0 ? 'text-amber-600' : 'text-slate-900'}`}>{pendientes}</p>
                <p className="mt-1 text-xs font-medium text-slate-400">{pendientes > 0 ? 'esperando decisión' : 'nada pendiente'}</p>
              </div>
              <div className="shrink-0 rounded-xl bg-white/80 p-2.5 shadow-sm ring-1 ring-slate-100"><Clock size={18} className={pendientes > 0 ? 'text-amber-600' : 'text-slate-400'} /></div>
            </div>
          </div>
        </div>
      )}

      <GuiaDespachoTable
        data={guias}
        onChange={fetchGuias}
      />
    </div>
  );
}
