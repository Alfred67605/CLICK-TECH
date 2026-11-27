import type React from "react";
import {
  Activity,
  BarChart3,
  Boxes,
  CreditCard,
  Download,
  FileSpreadsheet,
  Package,
  Settings,
  ShoppingBag,
  Truck,
  Users,
  Wrench,
} from "lucide-react";

export type AdminTab =
  | "resumen"
  | "productos"
  | "inventario"
  | "compras"
  | "pedidos"
  | "pagos"
  | "cotizaciones"
  | "servicios"
  | "clientes"
  | "configuracion"
  | "reportes"
  | "auditoria";

export interface AdminNavItem {
  id: AdminTab;
  label: string;
  group: "Principal" | "Comercial y Stock" | "Taller y Sistema";
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  hideForTech?: boolean;
  adminOnly?: boolean;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { id: "resumen", label: "Resumen", group: "Principal", icon: BarChart3 },
  { id: "reportes", label: "Reportes", group: "Principal", icon: Download },

  { id: "productos", label: "Productos", group: "Comercial y Stock", icon: Package, hideForTech: true },
  { id: "inventario", label: "Inventario", group: "Comercial y Stock", icon: Boxes, hideForTech: true },
  { id: "compras", label: "Compras", group: "Comercial y Stock", icon: ShoppingBag, hideForTech: true },
  { id: "pedidos", label: "Pedidos", group: "Comercial y Stock", icon: Truck, hideForTech: true },
  { id: "pagos", label: "Pagos", group: "Comercial y Stock", icon: CreditCard, hideForTech: true },
  { id: "cotizaciones", label: "Cotizaciones", group: "Comercial y Stock", icon: FileSpreadsheet, hideForTech: true },

  { id: "servicios", label: "Servicio Técnico", group: "Taller y Sistema", icon: Wrench },
  { id: "clientes", label: "Clientes y Garantías", group: "Taller y Sistema", icon: Users },
  { id: "configuracion", label: "Configuración", group: "Taller y Sistema", icon: Settings, adminOnly: true },
  { id: "auditoria", label: "Auditoría", group: "Taller y Sistema", icon: Activity, hideForTech: true },
];

export const ADMIN_GROUPS: Array<AdminNavItem["group"]> = [
  "Principal",
  "Comercial y Stock",
  "Taller y Sistema",
];
