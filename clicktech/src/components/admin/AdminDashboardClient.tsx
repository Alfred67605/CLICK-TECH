"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  Boxes,
  CreditCard,
  Download,
  FileSpreadsheet,
  Package,
  Plus,
  RefreshCw,
  Settings,
  ShoppingBag,
  Truck,
  Users,
  Wrench,
} from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";
import { formatBs } from "@/lib/domain/money";
import { formatDateLaPaz } from "@/lib/utils";
import {
  ALLOWED_SERVICE_TRANSITIONS,
  SERVICE_STATUS_LABELS,
} from "@/lib/domain/service-rules";
import type { Role, ServiceOrderStatus } from "@prisma/client";

export interface AdminSnapshotData {
  currentUser: { id: string; name: string; email: string; role: Role };
  canSeeFinance: boolean;
  isAdmin: boolean;
  kpis: {
    salesCollectedCents?: number;
    pendingOrdersCount: number;
    activeServicesCount: number;
    lowStockCount: number;
    openQuotesCount: number;
  };
  categories: Array<{ id: string; name: string }>;
  brands: Array<{ id: string; name: string }>;
  suppliers: Array<{ id: string; name: string }>;
  products: Array<{
    id: string;
    sku: string;
    slug: string;
    name: string;
    model: string;
    categoryName: string;
    brandName: string;
    priceCents: number;
    costCents?: number;
    stockOnHand: number;
    stockReserved: number;
    stockAvailable: number;
    minStockAlert: number;
    isPublished: boolean;
    imageUrl: string | null;
    isIllustrative: boolean;
  }>;
  movements: Array<{
    id: string;
    sku: string;
    productName: string;
    type: string;
    quantityDelta: number;
    stockOnHandAfter: number;
    reason: string;
    createdAt: string;
  }>;
  reservations: Array<{
    id: string;
    orderNumber: string;
    sku: string;
    quantity: number;
    status: string;
    expiresAt: string;
  }>;
  returns: Array<{
    id: string;
    orderNumber: string;
    productName: string;
    quantity: number;
    reason: string;
    physicalValidationStatus: string;
  }>;
  purchaseOrders: Array<{
    id: string;
    code: string;
    supplierName: string;
    status: string;
    totalCostCents?: number;
    createdAt: string;
    items: Array<{
      id: string;
      skuSnapshot: string;
      productNameSnapshot: string;
      orderedQty: number;
      receivedQty: number;
    }>;
  }>;
  orders: Array<{
    id: string;
    orderNumber: string;
    customerLabel: string;
    status: string;
    paymentStatus: string;
    deliveryMethod: string;
    deliveryStatus: string;
    totalCents: number;
    createdAt: string;
    categoriesInOrder: string[];
  }>;
  payments: Array<{
    id: string;
    orderId: string;
    orderNumber: string;
    method: string;
    amountCents: number;
    status: string;
    referenceNumber: string | null;
    proofFilePath: string | null;
    isLateSubmission: boolean;
    reviewNotes: string | null;
    createdAt: string;
  }>;
  quotes: Array<{
    id: string;
    quoteNumber: string;
    type: string;
    customerName: string;
    companyName: string | null;
    status: string;
    currentVersion: number;
    totalCents: number;
    validUntil: string;
  }>;
  serviceOrders: Array<{
    id: string;
    ticketNumber: string;
    customerName: string;
    serviceName: string;
    deviceBrandModel: string;
    status: ServiceOrderStatus;
    diagnosisReport: string | null;
    internalNotes: string | null;
    laborCents: number;
    partsTotalCents: number;
    totalApprovedCents: number;
    activeQuoteVersion: number | null;
    createdAt: string;
  }>;
  customers: Array<{
    id: string;
    name: string;
    email: string;
    phone: string | null;
    ordersCount: number;
    servicesCount: number;
  }>;
  warrantyClaims: Array<{
    id: string;
    warrantyCode: string;
    itemLabel: string;
    customerName: string;
    description: string;
    status: string;
  }>;
  consultations: Array<{
    id: string;
    customerName: string;
    subject: string;
    status: string;
    lastMessage: string;
  }>;
  configs: Array<{
    key: string;
    valueJson: Record<string, unknown>;
    isPendingRealData: boolean;
    description: string;
  }>;
  auditLogs: Array<{
    id: string;
    actorName: string;
    actorRole: string;
    action: string;
    entityType: string;
    entityId: string;
    createdAt: string;
  }>;
}

type AdminTab =
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

export function AdminDashboardClient({ data }: { data: AdminSnapshotData }) {
  const router = useRouter();
  const { notify } = useStore();
  const [tab, setTab] = useState<AdminTab>(
    data.currentUser.role === "TECH" ? "servicios" : "resumen"
  );
  const [busy, setBusy] = useState(false);

  // Interactive chart drill-down filters on Resumen
  const [periodDays, setPeriodDays] = useState<7 | 30 | 90 | 365>(30);
  const [drillCategory, setDrillCategory] = useState<string | null>(null);
  const [drillServiceStatus, setDrillServiceStatus] = useState<string | null>(null);

  // New Product form
  const [newSku, setNewSku] = useState("");
  const [newName, setNewName] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newCatId, setNewCatId] = useState(data.categories[0]?.id ?? "");
  const [newBrandId, setNewBrandId] = useState(data.brands[0]?.id ?? "");
  const [newCostBs, setNewCostBs] = useState("100");
  const [newPriceBs, setNewPriceBs] = useState("130");
  const newStock = "2";

  // Manual Stock Adjustment
  const [adjProductId, setAdjProductId] = useState(data.products[0]?.id ?? "");
  const [adjDelta, setAdjDelta] = useState("1");
  const [adjReason, setAdjReason] = useState("");

  // New PO form
  const [poSupplierId, setPoSupplierId] = useState(data.suppliers[0]?.id ?? "");
  const [poProductId, setPoProductId] = useState(data.products[0]?.id ?? "");
  const [poQty, setPoQty] = useState("3");
  const poCostBs = "400";

  // Service workshop active order editor
  const [activeServiceId, setActiveServiceId] = useState(data.serviceOrders[0]?.id ?? "");
  const activeService =
    data.serviceOrders.find((s) => s.id === activeServiceId) ?? data.serviceOrders[0] ?? null;
  const [srvNextStatus, setSrvNextStatus] = useState<ServiceOrderStatus>("DIAGNOSIS");
  const [srvPublicMsg, setSrvPublicMsg] = useState("");
  const [srvInternalNote, setSrvInternalNote] = useState("");
  const [srvDiagnosis, setSrvDiagnosis] = useState("");
  const [srvLaborBs, setSrvLaborBs] = useState("150");
  const [srvPartId, setSrvPartId] = useState(data.products[0]?.id ?? "");
  const [srvClosureSummary, setSrvClosureSummary] = useState("");
  const [srvTestsText, setSrvTestsText] = useState(
    "Prueba de encendido y estabilidad térmica; Verificación de SMART SSD; Control de ventilación"
  );

  // Consultation reply
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");

  // Config editor
  const [whatsappInput, setWhatsappInput] = useState(
    String(
      (data.configs.find((c) => c.key === "pending_business_contacts")?.valueJson
        ?.whatsappNumber as string) ?? ""
    )
  );
  const [transferEnabled, setTransferEnabled] = useState(
    data.configs.find((c) => c.key === "payment_settings")?.valueJson?.transferQrEnabled !== false
  );

  const [referenceNowMs, setReferenceNowMs] = useState<number>(0);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setReferenceNowMs(Date.now()));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Computed chart series on Resumen respecting periodDays
  const filteredOrdersInPeriod = useMemo(() => {
    const cutoff = referenceNowMs ? referenceNowMs - periodDays * 86400_000 : 0;
    return data.orders.filter((o) => new Date(o.createdAt).getTime() >= cutoff);
  }, [data.orders, periodDays, referenceNowMs]);

  const categoryChartData = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of filteredOrdersInPeriod) {
      if (o.paymentStatus !== "APPROVED") continue;
      for (const cat of o.categoriesInOrder) {
        map.set(cat, (map.get(cat) ?? 0) + o.totalCents);
      }
    }
    return Array.from(map.entries()).map(([category, cents]) => ({ category, cents }));
  }, [filteredOrdersInPeriod]);

  const serviceChartData = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of data.serviceOrders) {
      map.set(s.status, (map.get(s.status) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([status, count]) => ({ status, count }));
  }, [data.serviceOrders]);

  const navItems: Array<{
    id: AdminTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    hideForTech?: boolean;
    adminOnly?: boolean;
  }> = [
    { id: "resumen", label: "Resumen", icon: BarChart3 },
    { id: "productos", label: "Productos", icon: Package, hideForTech: true },
    { id: "inventario", label: "Inventario", icon: Boxes, hideForTech: true },
    { id: "compras", label: "Compras", icon: ShoppingBag, hideForTech: true },
    { id: "pedidos", label: "Pedidos", icon: Truck, hideForTech: true },
    { id: "pagos", label: "Pagos", icon: CreditCard, hideForTech: true },
    { id: "cotizaciones", label: "Cotizaciones", icon: FileSpreadsheet, hideForTech: true },
    { id: "servicios", label: "Servicio Técnico", icon: Wrench },
    { id: "clientes", label: "Clientes y Garantías", icon: Users },
    { id: "configuracion", label: "Configuración", icon: Settings, adminOnly: true },
    { id: "reportes", label: "Reportes", icon: Download },
    { id: "auditoria", label: "Auditoría", icon: Activity, hideForTech: true },
  ];

  const visibleNav = navItems.filter((item) => {
    if (item.adminOnly && !data.isAdmin) return false;
    if (item.hideForTech && data.currentUser.role === "TECH") return false;
    return true;
  });

  async function apiAction(url: string, method: string, body?: unknown, successMsg?: string) {
    setBusy(true);
    try {
      const res = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json();
      if (!res.ok) {
        notify(json.error ?? "No se pudo completar la acción.", "error");
        return null;
      }
      if (successMsg) notify(successMsg, "success");
      router.refresh();
      return json;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ct-container py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase" style={{ color: "var(--accent-purple)" }}>
            Operación ClickTech · Rol: {data.currentUser.role}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">Panel de Gestión</h1>
        </div>
        <button
          type="button"
          onClick={() => router.refresh()}
          className="ct-btn h-10 px-4 rounded-lg border text-xs font-semibold flex items-center gap-1.5"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Actualizar datos
        </button>
      </div>

      {/* Horizontal Scrollable Tab Bar */}
      <nav aria-label="Módulos administrativos" className="flex flex-wrap gap-1.5 pb-2 border-b" style={{ borderColor: "var(--border-subtle)" }}>
        {visibleNav.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className="ct-btn h-9 px-3 rounded-lg border text-xs font-semibold flex items-center gap-1.5"
              style={{
                backgroundColor: active ? "var(--accent-cyan-soft)" : "var(--bg-surface)",
                borderColor: active ? "var(--accent-cyan)" : "var(--border-subtle)",
                color: active ? "var(--accent-cyan)" : "var(--text-secondary)",
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* 1. RESUMEN */}
      {tab === "resumen" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span style={{ color: "var(--text-muted)" }}>Período de gráficos:</span>
              {([7, 30, 90, 365] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setPeriodDays(d)}
                  className="ct-btn h-8 px-3 rounded border text-xs font-semibold"
                  style={{
                    borderColor: periodDays === d ? "var(--accent-cyan)" : "var(--border-subtle)",
                    color: periodDays === d ? "var(--accent-cyan)" : "var(--text-secondary)",
                  }}
                >
                  {d} días
                </button>
              ))}
            </div>
            <a
              href="/api/admin/reports?format=csv"
              className="ct-btn h-9 px-4 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5"
              style={{ borderColor: "var(--border-strong)", color: "var(--accent-cyan)" }}
            >
              <Download className="w-3.5 h-3.5" /> Exportar CSV
            </a>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {data.canSeeFinance && (
              <div className="rounded-xl border p-4" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Ventas cobradas</span>
                <p className="font-heading text-xl font-extrabold tabular-nums mt-1" style={{ color: "var(--accent-cyan)" }}>
                  {formatBs(data.kpis.salesCollectedCents ?? 0)}
                </p>
              </div>
            )}
            <div className="rounded-xl border p-4" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>Pedidos pendientes</span>
              <p className="font-heading text-2xl font-extrabold tabular-nums mt-1">{data.kpis.pendingOrdersCount}</p>
            </div>
            <div className="rounded-xl border p-4" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>Servicios activos</span>
              <p className="font-heading text-2xl font-extrabold tabular-nums mt-1">{data.kpis.activeServicesCount}</p>
            </div>
            <div className="rounded-xl border p-4" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>Alertas stock bajo</span>
              <p className="font-heading text-2xl font-extrabold tabular-nums mt-1" style={{ color: "var(--status-warn)" }}>
                {data.kpis.lowStockCount}
              </p>
            </div>
            <div className="rounded-xl border p-4" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>Cotizaciones abiertas</span>
              <p className="font-heading text-2xl font-extrabold tabular-nums mt-1">{data.kpis.openQuotesCount}</p>
            </div>
          </div>

          {/* 2D Readable Interactive Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data.canSeeFinance && (
              <div className="rounded-xl border p-5 space-y-3" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
                <div className="flex justify-between items-center">
                  <h2 className="font-heading font-bold text-sm">Ventas cobradas por categoría (clic para filtrar)</h2>
                  {drillCategory && (
                    <button type="button" onClick={() => setDrillCategory(null)} className="text-xs underline" style={{ color: "var(--accent-cyan)" }}>
                      Quitar filtro
                    </button>
                  )}
                </div>
                {categoryChartData.length === 0 ? (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Sin ventas cobradas en este período.</p>
                ) : (
                  <div className="space-y-2">
                    {categoryChartData.map((row) => {
                      const maxVal = Math.max(...categoryChartData.map((x) => x.cents), 1);
                      const pct = Math.max(8, Math.round((row.cents / maxVal) * 100));
                      return (
                        <button
                          key={row.category}
                          type="button"
                          onClick={() => setDrillCategory(row.category)}
                          className="w-full text-left space-y-1 p-1.5 rounded hover:bg-white/5"
                        >
                          <div className="flex justify-between text-xs">
                            <span className="font-medium">{row.category}</span>
                            <span className="font-bold tabular-nums">{formatBs(row.cents)}</span>
                          </div>
                          <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-chassis)" }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: "var(--accent-cyan)" }} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="rounded-xl border p-5 space-y-3" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
              <div className="flex justify-between items-center">
                <h2 className="font-heading font-bold text-sm">Órdenes de servicio por estado (clic para abrir)</h2>
                {drillServiceStatus && (
                  <button type="button" onClick={() => setDrillServiceStatus(null)} className="text-xs underline" style={{ color: "var(--accent-purple)" }}>
                    Ver todos
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {serviceChartData.map((row) => {
                  const maxC = Math.max(...serviceChartData.map((x) => x.count), 1);
                  const pct = Math.max(12, Math.round((row.count / maxC) * 100));
                  return (
                    <button
                      key={row.status}
                      type="button"
                      onClick={() => setDrillServiceStatus(row.status)}
                      className="w-full text-left space-y-1 p-1.5 rounded hover:bg-white/5"
                    >
                      <div className="flex justify-between text-xs">
                        <span>{SERVICE_STATUS_LABELS[row.status as ServiceOrderStatus] ?? row.status}</span>
                        <span className="font-bold tabular-nums">{row.count}</span>
                      </div>
                      <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-chassis)" }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: "var(--accent-purple)" }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Drill-down table */}
          {(drillCategory || drillServiceStatus) && (
            <div className="rounded-xl border p-4 space-y-2 text-xs" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-strong)" }}>
              <h3 className="font-heading font-bold text-sm">
                Registros que explican la cifra seleccionada ({drillCategory ?? drillServiceStatus})
              </h3>
              {drillCategory &&
                filteredOrdersInPeriod
                  .filter((o) => o.paymentStatus === "APPROVED" && o.categoriesInOrder.includes(drillCategory))
                  .map((o) => (
                    <div key={o.id} className="flex justify-between border-b py-1.5" style={{ borderColor: "var(--border-subtle)" }}>
                      <Link href={`/pedido/${o.id}`} className="underline font-semibold">
                        {o.orderNumber} — {o.customerLabel}
                      </Link>
                      <span className="tabular-nums">{formatBs(o.totalCents)}</span>
                    </div>
                  ))}
              {drillServiceStatus &&
                data.serviceOrders
                  .filter((s) => s.status === drillServiceStatus)
                  .map((s) => (
                    <div key={s.id} className="flex justify-between border-b py-1.5" style={{ borderColor: "var(--border-subtle)" }}>
                      <Link href={`/seguimiento/${s.ticketNumber}`} className="underline font-semibold">
                        {s.ticketNumber} — {s.deviceBrandModel}
                      </Link>
                      <span>{s.customerName}</span>
                    </div>
                  ))}
            </div>
          )}
        </div>
      )}

      {/* 2. PRODUCTOS */}
      {tab === "productos" && data.currentUser.role !== "TECH" && (
        <div className="space-y-6">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await apiAction(
                "/api/admin/products",
                "POST",
                {
                  sku: newSku,
                  name: newName,
                  model: newModel,
                  categoryId: newCatId,
                  brandId: newBrandId,
                  description: `${newName} (${newModel})`,
                  costCents: Math.round(Number(newCostBs) * 100),
                  priceCents: Math.round(Number(newPriceBs) * 100),
                  stockOnHand: Math.max(0, Number(newStock) || 0),
                },
                "Producto creado."
              );
              setNewSku("");
              setNewName("");
              setNewModel("");
            }}
            className="rounded-xl border p-4 space-y-3"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
          >
            <h2 className="font-heading font-bold text-sm flex items-center gap-1.5">
              <Plus className="w-4 h-4" style={{ color: "var(--accent-cyan)" }} /> Nuevo producto
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
              <input required placeholder="SKU único" value={newSku} onChange={(e) => setNewSku(e.target.value)} className="h-9 px-2.5 rounded border" style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }} />
              <input required placeholder="Nombre comercial" value={newName} onChange={(e) => setNewName(e.target.value)} className="h-9 px-2.5 rounded border" style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }} />
              <input required placeholder="Modelo" value={newModel} onChange={(e) => setNewModel(e.target.value)} className="h-9 px-2.5 rounded border" style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }} />
              <select value={newCatId} onChange={(e) => setNewCatId(e.target.value)} className="h-9 px-2.5 rounded border" style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}>
                {data.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={newBrandId} onChange={(e) => setNewBrandId(e.target.value)} className="h-9 px-2.5 rounded border" style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}>
                {data.brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <input required type="number" placeholder="Costo Bs" value={newCostBs} onChange={(e) => setNewCostBs(e.target.value)} className="h-9 px-2.5 rounded border" style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }} />
              <input required type="number" placeholder="Precio Bs" value={newPriceBs} onChange={(e) => setNewPriceBs(e.target.value)} className="h-9 px-2.5 rounded border" style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }} />
              <button type="submit" disabled={busy} className="ct-btn h-9 rounded font-semibold" style={{ backgroundColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }}>
                Guardar SKU
              </button>
            </div>
          </form>

          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border-subtle)" }}>
            <table className="w-full text-xs text-left" style={{ backgroundColor: "var(--bg-surface)" }}>
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Producto</th>
                  <th className="p-3">Precio Bs</th>
                  <th className="p-3">Stock (Disp / Res)</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                {data.products.map((p) => (
                  <tr key={p.id}>
                    <td className="p-3 font-mono">{p.sku}</td>
                    <td className="p-3 font-medium">
                      {p.name}
                      <span className="block text-[11px]" style={{ color: "var(--text-muted)" }}>
                        {p.categoryName} · {p.isIllustrative ? "Foto ilustrativa" : "Foto exacta"}
                      </span>
                    </td>
                    <td className="p-3 tabular-nums font-semibold">{formatBs(p.priceCents)}</td>
                    <td className="p-3 tabular-nums">
                      {p.stockAvailable} disp. ({p.stockOnHand} fís / {p.stockReserved} res)
                    </td>
                    <td className="p-3">{p.isPublished ? "Publicado" : "Archivado"}</td>
                    <td className="p-3">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          apiAction(
                            "/api/admin/products",
                            "PATCH",
                            { id: p.id, isPublished: !p.isPublished },
                            p.isPublished ? "Producto archivado (preserva historial)." : "Producto publicado."
                          )
                        }
                        className="ct-btn px-2.5 py-1 rounded border text-[11px] font-semibold"
                        style={{ borderColor: "var(--border-subtle)" }}
                      >
                        {p.isPublished ? "Desactivar" : "Publicar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. INVENTARIO */}
      {tab === "inventario" && data.currentUser.role !== "TECH" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await apiAction(
                  "/api/admin/inventory",
                  "POST",
                  {
                    action: "adjust",
                    productId: adjProductId,
                    quantityDelta: Number(adjDelta),
                    reason: adjReason,
                  },
                  "Ajuste de inventario registrado."
                );
                setAdjReason("");
              }}
              className="rounded-xl border p-4 space-y-3 text-xs"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
            >
              <h2 className="font-heading font-bold text-sm">Ajuste manual de existencias</h2>
              <select value={adjProductId} onChange={(e) => setAdjProductId(e.target.value)} className="w-full h-9 px-2.5 rounded border" style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}>
                {data.products.map((p) => <option key={p.id} value={p.id}>{p.sku} — {p.name} (Stock: {p.stockOnHand})</option>)}
              </select>
              <div className="grid grid-cols-3 gap-2">
                <input type="number" required value={adjDelta} onChange={(e) => setAdjDelta(e.target.value)} placeholder="Delta (+/-)" className="h-9 px-2.5 rounded border" style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }} />
                <input required value={adjReason} onChange={(e) => setAdjReason(e.target.value)} placeholder="Motivo obligatorio del ajuste" className="col-span-2 h-9 px-2.5 rounded border" style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }} />
              </div>
              <button type="submit" disabled={busy} className="ct-btn h-9 px-4 rounded font-semibold" style={{ backgroundColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }}>
                Aplicar ajuste
              </button>
            </form>

            <div className="rounded-xl border p-4 space-y-3 text-xs" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
              <div className="flex justify-between items-center">
                <h2 className="font-heading font-bold text-sm">Reservas activas y vencidas</h2>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => apiAction("/api/admin/inventory", "POST", { action: "release_expired" }, "Barrido de reservas vencidas ejecutado.")}
                  className="ct-btn h-8 px-3 rounded border font-semibold"
                  style={{ borderColor: "var(--border-strong)", color: "var(--accent-cyan)" }}
                >
                  Liberar vencidas
                </button>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1.5">
                {data.reservations.map((r) => (
                  <div key={r.id} className="flex justify-between border-b py-1" style={{ borderColor: "var(--border-subtle)" }}>
                    <span>{r.orderNumber} · {r.sku} ({r.quantity}x)</span>
                    <span>{r.status} · {formatDateLaPaz(r.expiresAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border overflow-x-auto" style={{ borderColor: "var(--border-subtle)" }}>
            <table className="w-full text-xs text-left" style={{ backgroundColor: "var(--bg-surface)" }}>
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Delta</th>
                  <th className="p-3">Stock Resultante</th>
                  <th className="p-3">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                {data.movements.map((m) => (
                  <tr key={m.id}>
                    <td className="p-3 tabular-nums">{formatDateLaPaz(m.createdAt)}</td>
                    <td className="p-3 font-mono">{m.sku}</td>
                    <td className="p-3">{m.type}</td>
                    <td className="p-3 font-bold tabular-nums">{m.quantityDelta > 0 ? `+${m.quantityDelta}` : m.quantityDelta}</td>
                    <td className="p-3 tabular-nums">{m.stockOnHandAfter}</td>
                    <td className="p-3">{m.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. COMPRAS Y PROVEEDORES */}
      {tab === "compras" && data.currentUser.role !== "TECH" && (
        <div className="space-y-6">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await apiAction(
                "/api/admin/purchases",
                "POST",
                {
                  action: "create",
                  supplierId: poSupplierId,
                  items: [
                    {
                      productId: poProductId,
                      orderedQty: Math.max(1, Number(poQty) || 1),
                      unitCostCents: Math.max(100, Math.round(Number(poCostBs) * 100)),
                    },
                  ],
                },
                "Orden de compra creada (stock NO sumado hasta recepción física)."
              );
            }}
            className="rounded-xl border p-4 space-y-3 text-xs"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
          >
            <h2 className="font-heading font-bold text-sm">Registrar nueva orden de compra a proveedor</h2>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              <select value={poSupplierId} onChange={(e) => setPoSupplierId(e.target.value)} className="h-9 px-2.5 rounded border" style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}>
                {data.suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select value={poProductId} onChange={(e) => setPoProductId(e.target.value)} className="sm:col-span-2 h-9 px-2.5 rounded border" style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}>
                {data.products.map((p) => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
              </select>
              <input type="number" min={1} value={poQty} onChange={(e) => setPoQty(e.target.value)} placeholder="Cantidad" className="h-9 px-2.5 rounded border" style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }} />
              <button type="submit" disabled={busy} className="ct-btn h-9 rounded font-semibold" style={{ backgroundColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }}>
                Crear OC
              </button>
            </div>
          </form>

          <div className="space-y-3">
            {data.purchaseOrders.map((po) => (
              <div key={po.id} className="rounded-xl border p-4 space-y-2 text-xs" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
                <div className="flex flex-wrap justify-between gap-2 font-bold text-sm">
                  <span>{po.code} — {po.supplierName}</span>
                  <span style={{ color: "var(--accent-cyan)" }}>{po.status}</span>
                </div>
                {po.items.map((it) => {
                  const pending = it.orderedQty - it.receivedQty;
                  return (
                    <div key={it.id} className="flex flex-wrap justify-between items-center gap-2 border-t pt-2" style={{ borderColor: "var(--border-subtle)" }}>
                      <span>{it.skuSnapshot} — {it.productNameSnapshot} (Recibido: {it.receivedQty} / {it.orderedQty})</span>
                      {pending > 0 && po.status !== "CANCELLED" && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            apiAction(
                              "/api/admin/purchases",
                              "POST",
                              {
                                action: "receive",
                                purchaseOrderId: po.id,
                                idempotencyKey: `rcpt-${po.id}-${it.id}-${it.receivedQty}`,
                                items: [{ purchaseOrderItemId: it.id, qtyReceived: pending }],
                              },
                              `Recepción registrada (+${pending} unidades ingresadas a stock).`
                            )
                          }
                          className="ct-btn h-8 px-3 rounded font-semibold"
                          style={{ backgroundColor: "var(--status-ok)", color: "#ffffff" }}
                        >
                          Recibir {pending} unid.
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. PEDIDOS */}
      {tab === "pedidos" && data.currentUser.role !== "TECH" && (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border-subtle)" }}>
          <table className="w-full text-xs text-left" style={{ backgroundColor: "var(--bg-surface)" }}>
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
                <th className="p-3">Pedido</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Estado Pedido</th>
                <th className="p-3">Pago</th>
                <th className="p-3">Entrega</th>
                <th className="p-3">Total Bs</th>
                <th className="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
              {data.orders.map((o) => (
                <tr key={o.id}>
                  <td className="p-3 font-bold">
                    <Link href={`/pedido/${o.id}`} className="underline" style={{ color: "var(--accent-cyan)" }}>
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="p-3">{o.customerLabel}</td>
                  <td className="p-3">{o.status}</td>
                  <td className="p-3">{o.paymentStatus}</td>
                  <td className="p-3">{o.deliveryStatus}</td>
                  <td className="p-3 tabular-nums font-bold">{formatBs(o.totalCents)}</td>
                  <td className="p-3 flex flex-wrap gap-1.5">
                    {o.status === "PAID_CONFIRMED" && (
                      <button type="button" disabled={busy} onClick={() => apiAction(`/api/admin/orders/${o.id}`, "PATCH", { status: "READY_FOR_PICKUP", deliveryStatus: "READY" }, "Pedido marcado como listo.")} className="px-2 py-1 rounded border">
                        Marcar listo
                      </button>
                    )}
                    {(o.status === "READY_FOR_PICKUP" || o.status === "OUT_FOR_DELIVERY") && (
                      <button type="button" disabled={busy} onClick={() => apiAction(`/api/admin/orders/${o.id}`, "PATCH", { status: "DELIVERED", deliveryStatus: "DELIVERED" }, "Pedido entregado.")} className="px-2 py-1 rounded" style={{ backgroundColor: "var(--status-ok)", color: "#fff" }}>
                        Entregar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 6. PAGOS */}
      {tab === "pagos" && data.currentUser.role !== "TECH" && (
        <div className="space-y-3">
          {data.payments.map((p) => (
            <div key={p.id} className="rounded-xl border p-4 flex flex-wrap items-center justify-between gap-4 text-xs" style={{ backgroundColor: "var(--bg-surface)", borderColor: p.status === "PROOF_SUBMITTED" ? "var(--status-warn)" : "var(--border-subtle)" }}>
              <div className="space-y-1">
                <p className="font-heading font-bold text-sm">
                  {p.orderNumber} · {formatBs(p.amountCents)} ({p.status})
                </p>
                <p style={{ color: "var(--text-muted)" }}>
                  Método: {p.method} · Ref: {p.referenceNumber ?? "—"} · {formatDateLaPaz(p.createdAt)}
                </p>
                {p.proofFilePath && (
                  <a href={`/api/private-files/${p.proofFilePath}`} target="_blank" rel="noopener noreferrer" className="underline font-semibold" style={{ color: "var(--accent-cyan)" }}>
                    Abrir comprobante privado
                  </a>
                )}
              </div>
              {p.status === "PROOF_SUBMITTED" && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => apiAction(`/api/admin/payments/${p.id}/review`, "POST", { decision: "APPROVED", reviewNotes: "Conciliado en panel." }, "Pago aprobado y stock comprometido.")}
                    className="ct-btn h-9 px-4 rounded-lg font-semibold"
                    style={{ backgroundColor: "var(--status-ok)", color: "#ffffff" }}
                  >
                    Aprobar pago
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => apiAction(`/api/admin/payments/${p.id}/review`, "POST", { decision: "REJECTED", reviewNotes: "Comprobante rechazado en revisión." }, "Pago rechazado.")}
                    className="ct-btn h-9 px-4 rounded-lg border font-semibold"
                    style={{ borderColor: "var(--status-danger)", color: "var(--status-danger)" }}
                  >
                    Rechazar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 7. COTIZACIONES */}
      {tab === "cotizaciones" && data.currentUser.role !== "TECH" && (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border-subtle)" }}>
          <table className="w-full text-xs text-left" style={{ backgroundColor: "var(--bg-surface)" }}>
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
                <th className="p-3">Cotización</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Cliente / Empresa</th>
                <th className="p-3">Versión</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Total Bs</th>
                <th className="p-3">Vigencia</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
              {data.quotes.map((q) => (
                <tr key={q.id}>
                  <td className="p-3 font-bold">{q.quoteNumber}</td>
                  <td className="p-3">{q.type}</td>
                  <td className="p-3">{q.companyName ?? q.customerName}</td>
                  <td className="p-3">v{q.currentVersion}</td>
                  <td className="p-3 font-semibold">{q.status}</td>
                  <td className="p-3 tabular-nums font-bold">{formatBs(q.totalCents)}</td>
                  <td className="p-3 tabular-nums">{formatDateLaPaz(q.validUntil, false)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 8. SERVICIO TÉCNICO */}
      {tab === "servicios" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-2.5">
            <h2 className="font-heading font-bold text-sm">Órdenes técnicas ({data.serviceOrders.length})</h2>
            {data.serviceOrders.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setActiveServiceId(s.id);
                  const nextOpts = ALLOWED_SERVICE_TRANSITIONS[s.status];
                  if (nextOpts?.[0]) setSrvNextStatus(nextOpts[0]);
                }}
                className="w-full text-left rounded-xl border p-3.5 space-y-1 text-xs"
                style={{
                  backgroundColor: activeService?.id === s.id ? "var(--accent-cyan-soft)" : "var(--bg-surface)",
                  borderColor: activeService?.id === s.id ? "var(--accent-cyan)" : "var(--border-subtle)",
                }}
              >
                <div className="flex justify-between font-bold">
                  <span>{s.ticketNumber}</span>
                  <span style={{ color: "var(--accent-cyan)" }}>{SERVICE_STATUS_LABELS[s.status]}</span>
                </div>
                <p>{s.serviceName} — {s.deviceBrandModel}</p>
                <p style={{ color: "var(--text-muted)" }}>Cliente: {s.customerName}</p>
              </button>
            ))}
          </div>

          {activeService && (
            <div className="lg:col-span-7 rounded-2xl border p-5 space-y-5 text-xs" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-strong)" }}>
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <h2 className="font-heading text-lg font-bold">{activeService.ticketNumber}</h2>
                  <p style={{ color: "var(--text-secondary)" }}>
                    {activeService.deviceBrandModel} · Estado actual:{" "}
                    <strong style={{ color: "var(--accent-cyan)" }}>
                      {SERVICE_STATUS_LABELS[activeService.status]}
                    </strong>
                  </p>
                </div>
                <Link href={`/seguimiento/${activeService.ticketNumber}`} className="underline font-semibold" style={{ color: "var(--accent-cyan)" }}>
                  Ver vista cliente
                </Link>
              </div>

              {activeService.internalNotes && (
                <div className="rounded-lg border p-3" style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--accent-purple)" }}>
                  <p className="font-semibold" style={{ color: "var(--accent-purple)" }}>Notas internas (solo taller/personal):</p>
                  <p className="whitespace-pre-line">{activeService.internalNotes}</p>
                </div>
              )}

              {/* Add spare part from inventory */}
              <div className="rounded-xl border p-3.5 space-y-2" style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)" }}>
                <p className="font-semibold">Asignar repuesto desde inventario (genera salida vinculada)</p>
                <div className="flex gap-2">
                  <select value={srvPartId} onChange={(e) => setSrvPartId(e.target.value)} className="flex-1 h-9 px-2.5 rounded border" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}>
                    {data.products.map((p) => <option key={p.id} value={p.id}>{p.sku} — {p.name} ({p.stockAvailable} disp.)</option>)}
                  </select>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      apiAction(
                        `/api/admin/services/${activeService.id}`,
                        "POST",
                        {
                          action: "add_part",
                          productId: srvPartId,
                          quantity: 1,
                          idempotencyKey: `${activeService.id}-${srvPartId}-${Date.now()}`,
                        },
                        "Repuesto asignado e inventario descontado."
                      )
                    }
                    className="ct-btn h-9 px-3 rounded font-semibold"
                    style={{ backgroundColor: "var(--accent-purple)", color: "#ffffff" }}
                  >
                    + Asignar repuesto
                  </button>
                </div>
                <p style={{ color: "var(--text-muted)" }}>
                  Mano de obra: {formatBs(activeService.laborCents)} · Repuestos: {formatBs(activeService.partsTotalCents)} · Aprobado por cliente: {formatBs(activeService.totalApprovedCents)}
                </p>
              </div>

              {/* Issue / Update Quote Version */}
              <div className="rounded-xl border p-3.5 space-y-2" style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)" }}>
                <p className="font-semibold">Emitir / actualizar cotización (requiere nueva aceptación del cliente)</p>
                <div className="flex flex-wrap gap-2">
                  <input type="number" min={0} value={srvLaborBs} onChange={(e) => setSrvLaborBs(e.target.value)} placeholder="Mano de obra Bs" className="w-36 h-9 px-2.5 rounded border" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }} />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      apiAction(
                        `/api/admin/services/${activeService.id}`,
                        "POST",
                        {
                          action: "issue_quote",
                          laborCents: Math.max(0, Math.round(Number(srvLaborBs) * 100)),
                          changeReason: "Cotización actualizada desde taller",
                        },
                        "Nueva versión de cotización emitida al cliente."
                      )
                    }
                    className="ct-btn h-9 px-4 rounded font-semibold"
                    style={{ backgroundColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }}
                  >
                    Enviar cotización al cliente
                  </button>
                </div>
              </div>

              {/* Stage transition */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await apiAction(
                    `/api/admin/services/${activeService.id}`,
                    "POST",
                    {
                      action: "transition",
                      toStatus: srvNextStatus,
                      publicMessage: srvPublicMsg || `Estado actualizado a ${SERVICE_STATUS_LABELS[srvNextStatus]}.`,
                      internalNote: srvInternalNote || undefined,
                      diagnosisReport: srvDiagnosis || undefined,
                      closingSummary: srvClosureSummary || undefined,
                      performedTests:
                        srvNextStatus === "DELIVERED"
                          ? srvTestsText.split(";").map((s) => s.trim()).filter(Boolean)
                          : undefined,
                    },
                    "Estado técnico actualizado."
                  );
                  setSrvPublicMsg("");
                  setSrvInternalNote("");
                }}
                className="space-y-3 border-t pt-3"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <p className="font-semibold">Avanzar flujo técnico</p>
                <select value={srvNextStatus} onChange={(e) => setSrvNextStatus(e.target.value as ServiceOrderStatus)} className="w-full h-9 px-2.5 rounded border" style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}>
                  {(ALLOWED_SERVICE_TRANSITIONS[activeService.status] ?? []).map((st) => (
                    <option key={st} value={st}>{SERVICE_STATUS_LABELS[st]}</option>
                  ))}
                </select>
                <input required placeholder="Mensaje comprensible para el cliente" value={srvPublicMsg} onChange={(e) => setSrvPublicMsg(e.target.value)} className="w-full h-9 px-2.5 rounded border" style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }} />
                <input placeholder="Nota interna privada (nunca visible al cliente)" value={srvInternalNote} onChange={(e) => setSrvInternalNote(e.target.value)} className="w-full h-9 px-2.5 rounded border" style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }} />
                <input placeholder="Diagnóstico técnico (opcional)" value={srvDiagnosis} onChange={(e) => setSrvDiagnosis(e.target.value)} className="w-full h-9 px-2.5 rounded border" style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }} />
                {srvNextStatus === "DELIVERED" && (
                  <>
                    <input required placeholder="Resumen final de cierre del trabajo" value={srvClosureSummary} onChange={(e) => setSrvClosureSummary(e.target.value)} className="w-full h-9 px-2.5 rounded border" style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }} />
                    <input required placeholder="Pruebas realizadas (separadas por ;)" value={srvTestsText} onChange={(e) => setSrvTestsText(e.target.value)} className="w-full h-9 px-2.5 rounded border" style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }} />
                  </>
                )}
                <button type="submit" disabled={busy} className="ct-btn h-10 px-5 rounded-lg font-semibold" style={{ backgroundColor: "var(--status-ok)", color: "#ffffff" }}>
                  Aplicar transición
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* 9. CLIENTES Y GARANTÍAS */}
      {tab === "clientes" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
          <div className="rounded-xl border p-4 space-y-3" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
            <h2 className="font-heading font-bold text-sm">Clientes registrados</h2>
            {data.customers.map((c) => (
              <div key={c.id} className="flex justify-between border-b py-2" style={{ borderColor: "var(--border-subtle)" }}>
                <div>
                  <p className="font-semibold">{c.name}</p>
                  <p style={{ color: "var(--text-muted)" }}>{c.email}</p>
                </div>
                <span className="tabular-nums">{c.ordersCount} pedidos · {c.servicesCount} servicios</span>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border p-4 space-y-2" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
              <h2 className="font-heading font-bold text-sm">Consultas postventa</h2>
              {data.consultations.map((con) => (
                <div key={con.id} className="border-b py-2 space-y-1.5" style={{ borderColor: "var(--border-subtle)" }}>
                  <div className="flex justify-between font-semibold">
                    <span>{con.subject} ({con.customerName})</span>
                    <span>{con.status}</span>
                  </div>
                  <p style={{ color: "var(--text-muted)" }}>{con.lastMessage}</p>
                  <button type="button" onClick={() => setReplyTargetId(con.id)} className="underline" style={{ color: "var(--accent-cyan)" }}>
                    Responder
                  </button>
                  {replyTargetId === con.id && (
                    <div className="flex gap-2">
                      <input value={replyBody} onChange={(e) => setReplyBody(e.target.value)} placeholder="Respuesta..." className="flex-1 h-8 px-2 rounded border" style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }} />
                      <button
                        type="button"
                        onClick={async () => {
                          await apiAction(`/api/admin/consultations/${con.id}/reply`, "POST", { body: replyBody }, "Respuesta enviada.");
                          setReplyTargetId(null);
                          setReplyBody("");
                        }}
                        className="px-3 rounded font-semibold"
                        style={{ backgroundColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }}
                      >
                        Enviar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 10. CONFIGURACIÓN */}
      {tab === "configuracion" && data.isAdmin && (
        <div className="space-y-4 max-w-2xl text-xs">
          <div className="rounded-xl border p-5 space-y-3" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
            <h2 className="font-heading font-bold text-base">Canales y datos comerciales</h2>
            <label className="block font-medium">Número de WhatsApp Business (dejar vacío si no hay número oficial):</label>
            <input value={whatsappInput} onChange={(e) => setWhatsappInput(e.target.value)} placeholder="+591 ..." className="w-full h-10 px-3 rounded border" style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }} />
            <label className="flex items-center gap-2 pt-2">
              <input type="checkbox" checked={transferEnabled} onChange={(e) => setTransferEnabled(e.target.checked)} className="w-4 h-4 accent-[#00E5FF]" />
              <span>Habilitar pago por transferencia / QR con revisión manual</span>
            </label>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  apiAction(
                    "/api/admin/config",
                    "PATCH",
                    {
                      key: "pending_business_contacts",
                      valueJson: {
                        ...(data.configs.find((c) => c.key === "pending_business_contacts")?.valueJson ?? {}),
                        whatsappNumber: whatsappInput.trim(),
                      },
                      isPendingRealData: whatsappInput.trim().length === 0,
                    },
                    "Configuración de contacto actualizada."
                  )
                }
                className="ct-btn h-9 px-4 rounded font-semibold"
                style={{ backgroundColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }}
              >
                Guardar contacto
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  apiAction(
                    "/api/admin/config",
                    "PATCH",
                    {
                      key: "payment_settings",
                      valueJson: {
                        ...(data.configs.find((c) => c.key === "payment_settings")?.valueJson ?? {}),
                        transferQrEnabled: transferEnabled,
                      },
                    },
                    "Configuración de pagos actualizada."
                  )
                }
                className="ct-btn h-9 px-4 rounded border font-semibold"
                style={{ borderColor: "var(--border-strong)", color: "var(--accent-cyan)" }}
              >
                Guardar estado de QR/Transferencia
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. REPORTES */}
      {tab === "reportes" && (
        <div className="rounded-xl border p-5 space-y-4 text-xs" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
          <h2 className="font-heading font-bold text-base">Exportación de reportes calculados desde base de datos</h2>
          <p style={{ color: "var(--text-secondary)" }}>
            {data.canSeeFinance
              ? "Incluye ventas por producto, categoría, unidades e importes de costo/margen."
              : "Como rol Técnico, el reporte exporta cantidades e importes de venta sin revelar costos internos de compra ni márgenes."}
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="/api/admin/reports?format=csv"
              className="ct-btn h-10 px-4 rounded-lg font-semibold inline-flex items-center gap-2"
              style={{ backgroundColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }}
            >
              <Download className="w-4 h-4" />
              Descargar reporte CSV
            </a>
            <button
              type="button"
              onClick={() => window.print()}
              className="ct-btn h-10 px-4 rounded-lg border font-semibold"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              Imprimir vista / Guardar PDF
            </button>
          </div>
        </div>
      )}

      {/* 12. AUDITORÍA */}
      {tab === "auditoria" && data.currentUser.role !== "TECH" && (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border-subtle)" }}>
          <table className="w-full text-xs text-left" style={{ backgroundColor: "var(--bg-surface)" }}>
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
                <th className="p-3">Fecha (La Paz)</th>
                <th className="p-3">Actor</th>
                <th className="p-3">Rol</th>
                <th className="p-3">Acción</th>
                <th className="p-3">Entidad</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
              {data.auditLogs.map((a) => (
                <tr key={a.id}>
                  <td className="p-3 tabular-nums">{formatDateLaPaz(a.createdAt)}</td>
                  <td className="p-3">{a.actorName}</td>
                  <td className="p-3">{a.actorRole}</td>
                  <td className="p-3 font-semibold">{a.action}</td>
                  <td className="p-3 font-mono">{a.entityType}:{a.entityId.slice(0, 12)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
