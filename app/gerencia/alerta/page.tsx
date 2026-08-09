"use client";

import { useState, useEffect } from "react";
import {
  AlertTriangle, Truck, Package, ShoppingCart, Factory,
  Clock, XCircle, CheckCircle2, Loader2, Shield, RefreshCw
} from "lucide-react";

interface AlertaChofer {
  chofer: string;
  cedula: string;
  documento: string;
  fecha: string;
  dias: number;
  tipo: 'vencido' | 'urgente' | 'proximo';
}

interface AlertaMateriaPrima {
  nombre: string;
  unidad: string;
  disponible: number;
  entradas: number;
  consumido: number;
}

interface AlertaProduccion {
  nombre: string;
  unidad: string;
  despachado: number;
  guias: number;
}

interface AlertaPedido {
  id: number;
  cliente: string;
  producto: string;
  cantidadM3: number;
  estado: string;
  fecha: string;
  dias: number;
}

const TABS = [
  { id: "todas", label: "Todas", icon: Shield },
  { id: "choferes", label: "Choferes", icon: Truck },
  { id: "stock", label: "Bajo Stock", icon: Package },
  { id: "produccion", label: "Producción Baja", icon: Factory },
  { id: "pedidos", label: "Pedidos Pendientes", icon: ShoppingCart },
];

export default function GerenciaAlertaPage() {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("todas");
  const [choferes, setChoferes] = useState<AlertaChofer[]>([]);
  const [materiaPrima, setMateriaPrima] = useState<AlertaMateriaPrima[]>([]);
  const [produccion, setProduccion] = useState<AlertaProduccion[]>([]);
  const [pedidos, setPedidos] = useState<AlertaPedido[]>([]);

  const fetchAlertas = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/gerencia/alertas");
      const data = await res.json();
      if (data.success) {
        setChoferes(data.choferes || []);
        setMateriaPrima(data.materiaPrima || []);
        setProduccion(data.produccion || []);
        setPedidos(data.pedidos || []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAlertas(); }, []);

  const total = choferes.length + materiaPrima.length + produccion.length + pedidos.length;

  const vencidos = choferes.filter(c => c.tipo === 'vencido').length;
  const urgentes = choferes.filter(c => c.tipo === 'urgente').length + materiaPrima.length + pedidos.filter(p => p.dias > 7).length;

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <AlertTriangle size={28} className="text-amber-500" />
            Centro de Alertas
          </h1>
          <p className="text-slate-500 mt-1">Alertas generales de toda la empresa en tiempo real.</p>
        </div>
        <button onClick={fetchAlertas} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Alertas", value: total, color: "text-slate-900", bg: "bg-slate-50" },
          { label: "Vencidas", value: vencidos, color: "text-red-600", bg: "bg-red-50" },
          { label: "Urgentes (≤7 días)", value: urgentes, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Próximas (≤30 días)", value: total - vencidos - urgentes, color: "text-blue-600", bg: "bg-blue-50" },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} p-4 rounded-xl border border-slate-100 shadow-sm`}>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{s.label}</p>
            <p className={`text-2xl font-black ${s.color} mt-1`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {TABS.map(t => {
          const Icon = t.icon;
          const count = t.id === 'todas' ? total :
            t.id === 'choferes' ? choferes.length :
            t.id === 'stock' ? materiaPrima.length :
            t.id === 'produccion' ? produccion.length :
            pedidos.length;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}>
              <Icon size={16} />
              {t.label}
              {count > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  tab === t.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <Loader2 size={24} className="animate-spin text-slate-300 mx-auto" />
          <p className="text-slate-400 mt-3 text-sm">Cargando alertas...</p>
        </div>
      ) : total === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-3" />
          <p className="text-lg font-bold text-slate-700">Todo en orden</p>
          <p className="text-slate-400 text-sm mt-1">No hay alertas activas en este momento.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* CHOFERES */}
          {(tab === 'todas' || tab === 'choferes') && choferes.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Truck size={18} className="text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Documentos de Choferes</h3>
                  <p className="text-xs text-slate-400">{choferes.length} alerta{choferes.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {choferes.map((a, i) => (
                  <div key={i} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${a.tipo === 'vencido' ? 'bg-red-500' : a.tipo === 'urgente' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{a.chofer}</p>
                        <p className="text-xs text-slate-400">Cédula: {a.cedula}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">{a.documento}</span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        a.tipo === 'vencido' ? 'bg-red-100 text-red-700' :
                        a.tipo === 'urgente' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {a.tipo === 'vencido' ? `Vencido hace ${Math.abs(a.dias)}d` :
                         a.tipo === 'urgente' ? `Vence en ${a.dias}d` :
                         `Vence en ${a.dias}d`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BAJO STOCK */}
          {(tab === 'todas' || tab === 'stock') && materiaPrima.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-red-100 flex items-center justify-center">
                  <Package size={18} className="text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Bajo Stock - Materia Prima</h3>
                  <p className="text-xs text-slate-400">{materiaPrima.length} material{materiaPrima.length !== 1 ? 'es' : ''} agotado{materiaPrima.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {materiaPrima.map((m, i) => (
                  <div key={i} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{m.nombre}</p>
                        <p className="text-xs text-slate-400">Unidad: {m.unidad}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-slate-400">Entradas: <span className="font-semibold text-slate-700">{m.entradas}</span></span>
                      <span className="text-slate-400">Consumido: <span className="font-semibold text-slate-700">{m.consumido}</span></span>
                      <span className={`px-2.5 py-1 rounded-full font-bold ${m.disponible <= 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        Disponible: {m.disponible}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PRODUCCIÓN BAJA */}
          {(tab === 'todas' || tab === 'produccion') && produccion.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Factory size={18} className="text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Producción Baja (últimos 30 días)</h3>
                  <p className="text-xs text-slate-400">{produccion.length} producto{produccion.length !== 1 ? 's' : ''} con menos de 200 M3</p>
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {produccion.map((p, i) => (
                  <div key={i} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${p.despachado === 0 ? 'bg-red-500' : 'bg-orange-500'}`} />
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{p.nombre}</p>
                        <p className="text-xs text-slate-400">{p.guias} guía{p.guias !== 1 ? 's' : ''} despachada{p.guias !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      p.despachado === 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {p.despachado} {p.unidad}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PEDIDOS PENDIENTES */}
          {(tab === 'todas' || tab === 'pedidos') && pedidos.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-violet-100 flex items-center justify-center">
                  <ShoppingCart size={18} className="text-violet-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Pedidos Pendientes / En Proceso</h3>
                  <p className="text-xs text-slate-400">{pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''} sin completar por más de 3 días</p>
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {pedidos.map((p, i) => (
                  <div key={i} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${p.dias > 7 ? 'bg-red-500' : 'bg-amber-500'}`} />
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">Pedido #{p.id}</p>
                        <p className="text-xs text-slate-400">{p.cliente} - {p.producto}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">{p.cantidadM3} M3</span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        p.estado === 'pendiente' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {p.estado === 'pendiente' ? 'Pendiente' : 'En Proceso'} - {p.dias}d
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EMPTY STATE PER TAB */}
          {((tab === 'choferes' && choferes.length === 0) ||
            (tab === 'stock' && materiaPrima.length === 0) ||
            (tab === 'produccion' && produccion.length === 0) ||
            (tab === 'pedidos' && pedidos.length === 0)) && (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Sin alertas en esta categoría</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
