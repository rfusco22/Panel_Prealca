// Menú del panel de Gerencia, ordenado por área de negocio.
// Lo usan el sidebar (components/gerencia-sidebar.tsx) y los accesos rápidos
// del dashboard (app/gerencia/page.tsx), así los dos muestran lo mismo y en
// el mismo orden.
import {
  LayoutDashboard, AlertTriangle, BarChart3, ArrowLeftRight,
  Users, BookOpen, ShoppingCart, UserCircle,
  TrendingUp, TrendingDown, FileText, Receipt, Building2,
  Package, ClipboardList,
  Layers, Boxes, Mountain, FlaskConical,
  Truck, Route, History, HardHat, Wrench,
  UsersRound, Shield, Settings,
  Gauge, Briefcase, Wallet, ShoppingBag, Factory, Navigation, Cog,
  type LucideIcon,
} from "lucide-react";

export interface GerenciaMenuItem {
  id: string;
  label: string;
  descripcion: string;
  icon: LucideIcon;
  href: string;
}

export interface GerenciaMenuSection {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Color de acento de la sección (clases Tailwind) */
  tono: { texto: string; fondo: string; punto: string };
  items: GerenciaMenuItem[];
}

export const GERENCIA_MENU: GerenciaMenuSection[] = [
  {
    id: "principal",
    label: "Principal",
    icon: Gauge,
    tono: { texto: "text-violet-600", fondo: "bg-violet-50", punto: "bg-violet-400" },
    items: [
      { id: "dashboard", label: "Dashboard", descripcion: "Resumen general del sistema", icon: LayoutDashboard, href: "/gerencia" },
      { id: "alerta", label: "Alertas", descripcion: "Vencimientos y avisos críticos", icon: AlertTriangle, href: "/gerencia/alerta" },
      { id: "reportes", label: "Reportes", descripcion: "Indicadores y reportes", icon: BarChart3, href: "/gerencia/reportes" },
      { id: "brecha", label: "Brecha Cambiaria", descripcion: "Tasas y diferencial cambiario", icon: ArrowLeftRight, href: "/gerencia/brecha-cambiaria" },
    ],
  },
  {
    id: "comercial",
    label: "Comercial",
    icon: Briefcase,
    tono: { texto: "text-emerald-600", fondo: "bg-emerald-50", punto: "bg-emerald-400" },
    items: [
      { id: "clientes", label: "Clientes", descripcion: "Directorio de clientes", icon: Users, href: "/gerencia/clientes" },
      { id: "estado-cuenta", label: "Estado de Cuenta", descripcion: "Saldos y movimientos por cliente", icon: BookOpen, href: "/gerencia/estado-cuenta" },
      { id: "pedidos", label: "Pedidos", descripcion: "Pedidos de concreto", icon: ShoppingCart, href: "/gerencia/pedidos" },
      { id: "vendedores", label: "Vendedores", descripcion: "Equipo de ventas", icon: UserCircle, href: "/gerencia/vendedores" },
    ],
  },
  {
    id: "finanzas",
    label: "Finanzas",
    icon: Wallet,
    tono: { texto: "text-sky-600", fondo: "bg-sky-50", punto: "bg-sky-400" },
    items: [
      { id: "ingresos", label: "Ingresos", descripcion: "Cobros registrados", icon: TrendingUp, href: "/gerencia/ingresos" },
      { id: "egresos", label: "Egresos", descripcion: "Pagos y gastos", icon: TrendingDown, href: "/gerencia/egresos" },
      { id: "facturas", label: "Facturas", descripcion: "Facturación emitida", icon: FileText, href: "/gerencia/facturas" },
      { id: "retenciones", label: "Retenciones", descripcion: "Retenciones de IVA", icon: Receipt, href: "/gerencia/retenciones" },
      { id: "bancos", label: "Bancos", descripcion: "Cuentas bancarias", icon: Building2, href: "/gerencia/bancos" },
    ],
  },
  {
    id: "compras",
    label: "Compras",
    icon: ShoppingBag,
    tono: { texto: "text-amber-600", fondo: "bg-amber-50", punto: "bg-amber-400" },
    items: [
      { id: "proveedores", label: "Proveedores", descripcion: "Proveedores y plantas", icon: Package, href: "/gerencia/proveedores" },
      { id: "ordenes", label: "Órdenes de Compra", descripcion: "Órdenes emitidas", icon: ClipboardList, href: "/gerencia/ordenes-compra" },
    ],
  },
  {
    id: "produccion",
    label: "Producción",
    icon: Factory,
    tono: { texto: "text-indigo-600", fondo: "bg-indigo-50", punto: "bg-indigo-400" },
    items: [
      { id: "productos", label: "Productos", descripcion: "Catálogo y fórmulas", icon: Layers, href: "/gerencia/productos" },
      { id: "stock", label: "Inventario", descripcion: "Stock por producto", icon: Boxes, href: "/gerencia/stock" },
      { id: "materia-prima", label: "Materia Prima", descripcion: "Entradas de materiales", icon: Mountain, href: "/gerencia/materia-prima" },
      { id: "agregados", label: "Agregados", descripcion: "Tipos de materiales", icon: FlaskConical, href: "/gerencia/agregados" },
    ],
  },
  {
    id: "logistica",
    label: "Logística",
    icon: Navigation,
    tono: { texto: "text-orange-600", fondo: "bg-orange-50", punto: "bg-orange-400" },
    items: [
      { id: "guias", label: "Guías de Despacho", descripcion: "Despachos a clientes", icon: FileText, href: "/gerencia/guia-despacho" },
      { id: "viajes-mp", label: "Viajes Materia Prima", descripcion: "Viajes de piedra, arena, cemento", icon: Route, href: "/gerencia/viajes-materia-prima" },
      { id: "historico-viajes", label: "Histórico de Viajes", descripcion: "Diario, semanal y mensual", icon: History, href: "/gerencia/historico-viajes" },
      { id: "choferes", label: "Choferes", descripcion: "Conductores y documentos", icon: HardHat, href: "/gerencia/choferes" },
      { id: "unidades", label: "Unidades", descripcion: "Flota de transporte", icon: Truck, href: "/gerencia/unidades" },
      { id: "mantenimiento", label: "Mantenimiento", descripcion: "Servicios de la flota", icon: Wrench, href: "/gerencia/mantenimiento-unidades" },
    ],
  },
  {
    id: "administracion",
    label: "Administración",
    icon: Cog,
    tono: { texto: "text-rose-600", fondo: "bg-rose-50", punto: "bg-rose-400" },
    items: [
      { id: "usuarios", label: "Usuarios", descripcion: "Cuentas y roles", icon: UsersRound, href: "/gerencia/users" },
      { id: "auditoria", label: "Auditoría", descripcion: "Registro de cambios", icon: Shield, href: "/gerencia/audit-log" },
      { id: "settings", label: "Configuración", descripcion: "Tasas y ajustes", icon: Settings, href: "/gerencia/settings" },
    ],
  },
];

export function esRutaActiva(pathname: string, href: string) {
  return pathname === href || (href !== "/gerencia" && pathname.startsWith(href + "/"));
}
