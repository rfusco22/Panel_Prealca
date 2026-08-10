"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  DollarSign, Euro, Coins, TrendingUp,
  Loader2, ArrowUp, ArrowDown, Minus, Wifi
} from "lucide-react";

interface Tasa {
  moneda: string;
  nombre: string;
  compra: number;
  venta: number;
  promedio: number;
  fuente: string;
  fecha: string;
}

interface Brecha {
  porcentaje: number;
  monto: number;
  tasaMayor: number;
  tasaMenor: number;
  monedaMayor: string;
  monedaMenor: string;
}

const INTERVALO = 30;

export default function BrechaCambiariaContent() {
  const [tasas, setTasas] = useState<Tasa[]>([]);
  const [brecha, setBrecha] = useState<Brecha | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(INTERVALO);
  const [connected, setConnected] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async (isInitial = false) => {
    if (isInitial) setInitialLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/brecha-cambiaria");
      const data = await res.json();
      if (data.success) {
        setTasas(data.tasas || []);
        setBrecha(data.brecha || null);
        setLastUpdate(new Date());
        setConnected(true);
        setCountdown(INTERVALO);
      }
    } catch {
      setError("Error al obtener las tasas de cambio");
      setConnected(false);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
    intervalRef.current = setInterval(() => fetchData(), INTERVALO * 1000);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => (prev <= 1 ? INTERVALO : prev - 1));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [fetchData]);

  const getIcon = (moneda: string) => {
    switch (moneda) {
      case 'USD': return DollarSign;
      case 'EUR': return Euro;
      case 'USDT': return Coins;
      default: return DollarSign;
    }
  };

  const getColor = (moneda: string) => {
    switch (moneda) {
      case 'USD': return { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-100' };
      case 'EUR': return { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-100' };
      case 'USDT': return { bg: 'bg-amber-50', icon: 'text-amber-600', border: 'border-amber-100' };
      default: return { bg: 'bg-slate-50', icon: 'text-slate-600', border: 'border-slate-100' };
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <TrendingUp size={28} className="text-violet-600" />
            Brecha Cambiaria
          </h1>
          <p className="text-slate-500 mt-1">Comparación de tasas de cambio en tiempo real.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
            connected ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
          }`}>
            <div className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            {connected ? 'En vivo' : 'Desconectado'}
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs text-slate-500 font-medium">
            <Wifi size={12} />
            {countdown}s
          </div>
          {lastUpdate && (
            <span className="text-[10px] text-slate-400">
              Última: {lastUpdate.toLocaleTimeString('es-VE')}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-800 p-4 rounded-xl text-sm font-medium">{error}</div>
      )}

      {initialLoading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <Loader2 size={24} className="animate-spin text-slate-300 mx-auto" />
          <p className="text-slate-400 mt-3 text-sm">Obteniendo tasas de cambio...</p>
        </div>
      ) : (
        <>
          {/* BRECHA CARD */}
          {brecha && brecha.tasaMayor > 0 && (
            <div className={`rounded-2xl border-2 p-6 shadow-lg transition-all duration-500 ${
              brecha.porcentaje > 5 ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200' :
              brecha.porcentaje > 2 ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200' :
              'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200'
            }`}>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Brecha Actual</p>
                  <div className="flex items-baseline gap-3">
                    <span className={`text-5xl font-black transition-all duration-300 ${
                      brecha.porcentaje > 5 ? 'text-red-600' :
                      brecha.porcentaje > 2 ? 'text-amber-600' :
                      'text-emerald-600'
                    }`}>
                      {brecha.porcentaje.toFixed(2)}%
                    </span>
                    <span className="text-lg font-bold text-slate-500">
                      Bs. {brecha.monto.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="bg-white/80 backdrop-blur rounded-xl px-4 py-3 border border-white shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Tasa Mayor</p>
                    <p className="text-xl font-black text-red-600">Bs. {brecha.tasaMayor.toFixed(2)}</p>
                    <p className="text-xs text-slate-500">{brecha.monedaMayor}</p>
                  </div>
                  <div className="bg-white/80 backdrop-blur rounded-xl px-4 py-3 border border-white shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Tasa Menor</p>
                    <p className="text-xl font-black text-emerald-600">Bs. {brecha.tasaMenor.toFixed(2)}</p>
                    <p className="text-xs text-slate-500">{brecha.monedaMenor}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TASAS CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tasas.map((tasa) => {
              const Icon = getIcon(tasa.moneda);
              const colors = getColor(tasa.moneda);
              const isMayor = brecha?.tasaMayor === tasa.promedio;
              const isMenor = brecha?.tasaMenor === tasa.promedio;
              return (
                <div key={tasa.moneda} className={`bg-white rounded-2xl border ${colors.border} shadow-sm overflow-hidden transition-all duration-300`}>
                  <div className={`${colors.bg} px-5 py-4 flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl ${colors.bg} flex items-center justify-center border ${colors.border}`}>
                        <Icon size={20} className={colors.icon} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{tasa.nombre}</h3>
                        <p className="text-[10px] text-slate-400">{tasa.fuente}</p>
                      </div>
                    </div>
                    {isMayor && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-bold">MAYOR</span>
                    )}
                    {isMenor && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold">MENOR</span>
                    )}
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="text-center">
                      <p className="text-3xl font-black text-slate-900 transition-all duration-300">Bs. {tasa.promedio.toFixed(2)}</p>
                      <p className="text-xs text-slate-400 mt-1">Promedio</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 rounded-xl p-3 text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Compra</p>
                        <p className="text-lg font-bold text-slate-700">Bs. {tasa.compra.toFixed(2)}</p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Venta</p>
                        <p className="text-lg font-bold text-slate-700">Bs. {tasa.venta.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {tasas.length === 0 && !error && (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <p className="text-slate-400">No se pudieron obtener las tasas de cambio</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
