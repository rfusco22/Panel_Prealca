"use client";

import { useState, useEffect } from "react";
import {
  Plus, X, Users, Loader2, Trash2, Edit2, AlertCircle, CheckCircle2,
  Shield, UserCircle, FileText, Clock, Mail, Key
} from "lucide-react";

interface User {
  id: number;
  email: string;
  nombre: string;
  role: string;
  estado: string;
  created_at: string;
  last_login: string | null;
}

const ROLES = [
  { value: "admin", label: "Administrador", icon: Shield, color: "text-red-600", bg: "bg-red-50" },
  { value: "registro", label: "Registro", icon: UserCircle, color: "text-blue-600", bg: "bg-blue-50" },
  { value: "dosificador", label: "Dosificador", icon: FileText, color: "text-emerald-600", bg: "bg-emerald-50" },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    role: "registro",
    estado: "activo",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success) setUsers(data.users);
    } catch {
      setError("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({ nombre: "", email: "", password: "", role: "registro", estado: "activo" });
    setIsModalOpen(true);
  };

  const openEdit = (user: User) => {
    setIsEditing(true);
    setEditingId(user.id);
    setFormData({ nombre: user.nombre, email: user.email, password: "", role: user.role, estado: user.estado });
    setIsModalOpen(true);
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setEditingId(null);
    setFormData({ nombre: "", email: "", password: "", role: "registro", estado: "activo" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload: any = { ...formData };
      if (isEditing && editingId) {
        payload.id = editingId;
        if (!payload.password) delete payload.password;
        const res = await fetch("/api/admin/users", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setSuccess("Usuario actualizado correctamente");
        setUsers(users.map(u => u.id === editingId ? { ...u, nombre: payload.nombre, role: payload.role, estado: payload.estado } : u));
      } else {
        if (!payload.password) throw new Error("La contraseña es obligatoria");
        const res = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setSuccess("Usuario creado correctamente");
        setUsers([{ ...data.user, created_at: new Date().toISOString(), last_login: null }, ...users]);
      }
      cerrarModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este usuario?")) return;
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      setUsers(users.filter(u => u.id !== id));
      setSuccess("Usuario eliminado correctamente");
    } catch {
      setError("No se pudo eliminar el usuario");
    }
  };

  const handleToggleEstado = async (user: User) => {
    const nuevoEstado = user.estado === "activo" ? "inactivo" : "activo";
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, nombre: user.nombre, role: user.role, estado: nuevoEstado })
      });
      if (!res.ok) throw new Error("Error");
      setUsers(users.map(u => u.id === user.id ? { ...u, estado: nuevoEstado } : u));
    } catch {
      setError("No se pudo actualizar el estado");
    }
  };

  const formatFecha = (fecha: string | null) => {
    if (!fecha) return "Nunca";
    const d = new Date(fecha);
    const ahora = new Date();
    const diffMs = ahora.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMin / 60);
    const diffD = Math.floor(diffH / 24);
    if (diffMin < 1) return "Ahora mismo";
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffH < 24) return `Hace ${diffH}h`;
    if (diffD < 7) return `Hace ${diffD}d`;
    return d.toLocaleDateString("es-VE", { day: "2-digit", month: "short", year: "numeric" });
  };

  const getRoleInfo = (role: string) => ROLES.find(r => r.value === role) || ROLES[1];

  const inputCls = "w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 shadow-sm transition-all";
  const labelCls = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2";

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Gestión de Usuarios</h1>
          <p className="text-slate-500 mt-1">Crear, editar y administrar usuarios del sistema.</p>
        </div>
        <button onClick={openCreate} className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm px-5 py-2.5 flex items-center gap-2 transition-all font-medium">
          <Plus size={18} />
          Nuevo Usuario
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-800 p-4 rounded-xl text-sm font-medium">
          <AlertCircle size={18} className="text-red-500 shrink-0" /> {error}
          <button onClick={() => setError(null)} className="ml-auto"><X size={16} /></button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 text-emerald-800 p-4 rounded-xl text-sm font-medium">
          <CheckCircle2 size={18} className="text-emerald-500 shrink-0" /> {success}
          <button onClick={() => setSuccess(null)} className="ml-auto"><X size={16} /></button>
        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Usuarios", value: users.length, color: "text-slate-900" },
          { label: "Activos", value: users.filter(u => u.estado === "activo").length, color: "text-emerald-600" },
          { label: "Inactivos", value: users.filter(u => u.estado !== "activo").length, color: "text-red-500" },
          { label: "En línea ahora", value: users.filter(u => u.last_login && (new Date().getTime() - new Date(u.last_login).getTime()) < 900000).length, color: "text-blue-600" },
        ].map((s, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{s.label}</p>
            <p className={`text-2xl font-black ${s.color} mt-1`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><Loader2 size={24} className="animate-spin text-slate-300 mx-auto" /></div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No hay usuarios registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-[10px] uppercase font-extrabold text-slate-500 tracking-widest border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Rol</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Último acceso</th>
                  <th className="px-6 py-4">Creado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => {
                  const roleInfo = getRoleInfo(user.role);
                  const RoleIcon = roleInfo.icon;
                  const isOnline = user.last_login && (new Date().getTime() - new Date(user.last_login).getTime()) < 900000;
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">
                              {user.nombre.charAt(0).toUpperCase()}
                            </div>
                            {isOnline && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />}
                          </div>
                          <span className="font-bold text-slate-900">{user.nombre}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${roleInfo.bg} ${roleInfo.color}`}>
                          <RoleIcon size={12} /> {roleInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => handleToggleEstado(user)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${user.estado === "activo" ? "bg-emerald-500" : "bg-slate-300"}`}>
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm ${user.estado === "activo" ? "translate-x-4.5" : "translate-x-0.5"}`} />
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} className="text-slate-400" />
                          <span className={`text-xs font-medium ${isOnline ? 'text-emerald-600' : 'text-slate-500'}`}>
                            {isOnline ? "En línea" : formatFecha(user.last_login)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {new Date(user.created_at).toLocaleDateString("es-VE")}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(user)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit2 size={15} />
                          </button>
                          <button onClick={() => handleDelete(user.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={cerrarModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{isEditing ? "Editar Usuario" : "Nuevo Usuario"}</h3>
                <p className="text-sm text-slate-500 mt-1">{isEditing ? "Modifica los datos del usuario." : "Completa los datos para crear un nuevo usuario."}</p>
              </div>
              <button onClick={cerrarModal} className="text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div>
                <label className={labelCls}>Nombre completo</label>
                <input type="text" required value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} placeholder="Ej: Juan Pérez" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="usuario@prealca.com" className={`${inputCls} pl-10`} disabled={isEditing} />
                </div>
              </div>
              <div>
                <label className={labelCls}>{isEditing ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña"}</label>
                <div className="relative">
                  <Key size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="password" required={!isEditing} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="••••••••" className={`${inputCls} pl-10`} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Rol</label>
                  <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className={inputCls}>
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Estado</label>
                  <select value={formData.estado} onChange={e => setFormData({ ...formData, estado: e.target.value })} className={inputCls}>
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={cerrarModal} className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all">Cancelar</button>
                <button type="submit" disabled={saving} className="px-6 py-2.5 bg-slate-900 hover:bg-slate-700 active:scale-[0.98] text-white text-sm font-medium rounded-lg shadow-md transition-all disabled:opacity-40 flex items-center gap-2">
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {saving ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
