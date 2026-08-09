"use client";

import { useState, useEffect } from "react";
import { Shield, UserCircle, FileText, Eye } from "lucide-react";

const roleLabels: Record<string, { label: string; color: string; bg: string }> = {
  admin: { label: "Administrador", color: "text-red-600", bg: "bg-red-50" },
  registro: { label: "Registro", color: "text-blue-600", bg: "bg-blue-50" },
  dosificador: { label: "Dosificador", color: "text-emerald-600", bg: "bg-emerald-50" },
  gerencia: { label: "Gerencia", color: "text-violet-600", bg: "bg-violet-50" },
};

const roleIcons: Record<string, any> = {
  admin: Shield,
  registro: UserCircle,
  dosificador: FileText,
  gerencia: Eye,
};

export default function GerenciaUsersPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/users')
      .then(res => res.json())
      .then(result => setData(result.users || result.data || (Array.isArray(result) ? result : [])))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Usuarios del Sistema</h1>
        <p className="text-slate-500 mt-1">Directorio de usuarios registrados.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6">
        {loading ? (
          <div className="text-center py-12 text-slate-500">Cargando...</div>
        ) : data.length === 0 ? (
          <div className="text-center py-12 text-slate-400">No hay usuarios registrados</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-[10px] uppercase font-extrabold text-slate-500 tracking-widest border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Nombre</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Rol</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Último Acceso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((u) => {
                  const role = roleLabels[u.role] || { label: u.role, color: "text-slate-600", bg: "bg-slate-50" };
                  const Icon = roleIcons[u.role] || Shield;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{u.nombre}</td>
                      <td className="px-6 py-4 text-slate-500">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${role.bg} ${role.color}`}>
                          <Icon size={12} /> {role.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          u.estado === 'activo' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}>{u.estado || 'activo'}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{u.last_login ? new Date(u.last_login).toLocaleDateString('es-VE') : 'Nunca'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
