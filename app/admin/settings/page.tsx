'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  RefreshCw, Building2, Calculator, AlertCircle, 
  Landmark, FileDigit, Database, ShieldCheck, 
  MapPin, Phone, Mail, FileText
} from 'lucide-react';
import Image from 'next/image';

export default function SettingsPage() {
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const [isLoadingBCV, setIsLoadingBCV] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchBCVRate = async () => {
    setIsLoadingBCV(true);
    setErrorMsg(null);
    try {
      const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
      if (!res.ok) throw new Error('Error en la red');
      
      const data = await res.json();
      
      if (data && data.promedio) {
        setExchangeRate(data.promedio);
        
        const updateDate = new Date(data.fechaActualizacion);
        setLastUpdate(updateDate.toLocaleString('es-VE', { 
          dateStyle: 'medium', 
          timeStyle: 'short' 
        }));
      }
    } catch (error) {
      console.error('Error obteniendo tasa BCV:', error);
      setErrorMsg('No se pudo conectar con el servidor del BCV. Verifica tu conexión.');
    } finally {
      setIsLoadingBCV(false);
    }
  };

  useEffect(() => {
    fetchBCVRate();
  }, []);

  return (
    <div className="max-w-6xl space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Configuración del Sistema</h1>
        <p className="text-slate-500 mt-2">Gestiona las tasas, impuestos, correlativos y parámetros globales de la empresa.</p>
      </div>

      {/* Tasa de Cambio Section (Banner Principal) */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 relative overflow-hidden group">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-50/50 rounded-full blur-3xl group-hover:bg-blue-100/50 transition-colors duration-700 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-5 mb-8">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center p-2 relative overflow-hidden">
                <Image src="/logobcv.png" alt="Logo BCV" width={48} height={48} className="object-contain" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 leading-tight">Banco Central <br/>de Venezuela</h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-green-600">Tasa Oficial Activa</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">Tasa de Cambio del Sistema</p>
              {isLoadingBCV ? (
                <div className="h-16 w-48 bg-slate-100 animate-pulse rounded-xl mt-2"></div>
              ) : (
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-semibold text-slate-400">Bs.</span>
                  <span className="text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-slate-900 to-slate-600">
                    {exchangeRate.toFixed(2)}
                  </span>
                </div>
              )}

              {!isLoadingBCV && !errorMsg && (
                <p className="text-sm text-slate-400 font-medium flex items-center gap-1.5 mt-4">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Última actualización: {lastUpdate}
                </p>
              )}

              {errorMsg && (
                <p className="text-sm text-red-500 font-medium flex items-center gap-1.5 mt-4 bg-red-50 p-2 rounded-lg inline-flex">
                  <AlertCircle className="w-4 h-4" />
                  {errorMsg}
                </p>
              )}
            </div>
          </div>

          <div className="flex-shrink-0">
            <Button
              onClick={fetchBCVRate}
              disabled={isLoadingBCV}
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-6 px-6 font-semibold transition-all shadow-[0_0_20px_rgba(15,23,42,0.1)] hover:shadow-[0_0_25px_rgba(15,23,42,0.2)] flex items-center gap-3 w-full md:w-auto"
            >
              <RefreshCw className={`w-5 h-5 ${isLoadingBCV ? 'animate-spin' : ''}`} />
              Sincronizar Ahora
            </Button>
          </div>
        </div>
      </div>

      {/* Parámetros Fiscales (Grid de 3) */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-4">Parámetros Fiscales</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5 hover:border-slate-200 transition-colors group">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform duration-300">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">I.V.A General</p>
              <h3 className="text-3xl font-black text-slate-900">16<span className="text-xl text-slate-400">%</span></h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5 hover:border-slate-200 transition-colors group">
            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform duration-300">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Retención Especial</p>
              <h3 className="text-3xl font-black text-slate-900">75<span className="text-xl text-slate-400">%</span></h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5 hover:border-slate-200 transition-colors group">
            <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform duration-300">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">I.G.T.F</p>
              <h3 className="text-3xl font-black text-slate-900">3<span className="text-xl text-slate-400">%</span></h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Información de la Empresa */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">Perfil de la Empresa</h2>
              <p className="text-sm text-slate-500">Datos usados en la emisión de documentos.</p>
            </div>
            <Button variant="outline" className="rounded-xl border-slate-200 text-slate-600">Editar</Button>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Nombre / Razón Social</label>
                <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-900">PREALCA C.A.</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">RIF</label>
                <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-900">J-12345678-9</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Dirección Fiscal</label>
              <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-900 truncate">Zona Industrial Valencia, Edo. Carabobo</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Teléfono Principal</label>
                <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-900">+58 241 1234567</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Correo Electrónico</label>
                <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-900 truncate">admin@prealca.com</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Correlativos y Sistema */}
        <div className="space-y-8">
          {/* Correlativos */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-6">Correlativos Actuales</h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <FileDigit className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Próxima Factura</p>
                    <p className="text-xs text-slate-500">Serie A</p>
                  </div>
                </div>
                <span className="font-mono text-sm font-semibold bg-slate-100 px-3 py-1 rounded-md text-slate-700">00001452</span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                    <FileDigit className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Comprobante de Retención</p>
                    <p className="text-xs text-slate-500">Mes actual</p>
                  </div>
                </div>
                <span className="font-mono text-sm font-semibold bg-slate-100 px-3 py-1 rounded-md text-slate-700">20260600015</span>
              </div>
            </div>
          </div>

          {/* Estado del Sistema */}
          <div className="bg-slate-900 rounded-[2rem] p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <h2 className="text-lg font-bold text-white mb-6">Estado del Sistema</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-slate-300">
                    <Database className="w-5 h-5 text-blue-400" />
                    <span className="text-sm font-medium">Base de Datos</span>
                  </div>
                  <span className="text-xs font-semibold bg-green-500/20 text-green-400 px-2 py-1 rounded-full border border-green-500/20">En línea</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-slate-300">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-medium">Último Respaldo</span>
                  </div>
                  <span className="text-xs font-medium text-slate-400">Hoy, 04:00 AM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}