"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bike,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  MapPin,
  MessageCircle,
  Package,
  QrCode,
  ShieldCheck,
  Store,
  Upload,
  XCircle,
} from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";
import { formatBs } from "@/lib/domain/money";
import { formatDateLaPaz } from "@/lib/utils";
import {
  DELIVERY_METHOD_META,
  DELIVERY_STATUS_META,
  ORDER_STATUS_META,
  PAYMENT_STATUS_META,
  STORE_LOCATION,
  getEstimatedEtaText,
  getOrderProgressStep,
  getToneStyles,
} from "@/lib/domain/status-labels";
import { buildClickTechQrPayload, generateQrDataUrl } from "@/lib/ui/qr-generator";

export interface OrderDetailView {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  deliveryMethod: string;
  deliveryStatus: string;
  paymentMethod: string;
  subtotalCents: number;
  assemblyFeeCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  reservationExpiresAt: string | null;
  createdAt: string;
  guestName: string | null;
  guestEmail: string | null;
  notes?: string | null;
  deliveryZoneName?: string | null;
  deliveryAddress?: {
    street?: string;
    reference?: string;
    city?: string;
    department?: string;
    lat?: number;
    lng?: number;
  } | null;
  items: Array<{
    id: string;
    skuSnapshot: string;
    productNameSnapshot: string;
    quantity: number;
    unitPriceCentsSnapshot: number;
    lineTotalCents: number;
    warrantyMonthsSnapshot: number | null;
    imageUrl?: string | null;
    productSlug?: string | null;
  }>;
  payments: Array<{
    id: string;
    status: string;
    amountCents: number;
    referenceNumber: string | null;
    proofFilePath: string | null;
    isLateSubmission: boolean;
    reviewNotes: string | null;
    createdAt: string;
  }>;
}

const TRACKING_STEPS = [
  { label: "Pedido recibido", desc: "Stock reservado" },
  { label: "Pago verificado", desc: "Conciliado" },
  { label: "Preparando en Calle Oruro", desc: "Pruebas y precinto" },
  { label: "En camino / Listo", desc: "Listo o en ruta" },
  { label: "Entregado", desc: "Garantía activa" },
];

export function OrderDetailClient({
  order,
  guestCode,
}: {
  order: OrderDetailView;
  guestCode: string | null;
}) {
  const router = useRouter();
  const { notify } = useStore();
  const [referenceNumber, setReferenceNumber] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [qrUrl, setQrUrl] = useState<string>("");

  const codeParam = guestCode ? `?code=${encodeURIComponent(guestCode)}` : "";
  const canUploadProof =
    order.paymentStatus !== "APPROVED" &&
    order.status !== "CANCELLED" &&
    order.paymentMethod === "TRANSFER_QR_MANUAL";
  const canCancel =
    order.status !== "CANCELLED" &&
    order.status !== "DELIVERED" &&
    order.status !== "PAID_CONFIRMED";

  useEffect(() => {
    if (!canUploadProof) return;
    let active = true;
    const payload = buildClickTechQrPayload({
      reference: order.orderNumber,
      totalCents: order.totalCents,
      detail: "PEDIDO_WEB",
    });
    generateQrDataUrl(payload)
      .then((u) => {
        if (active) setQrUrl(u);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [canUploadProof, order.orderNumber, order.totalCents]);

  const orderMeta = ORDER_STATUS_META[order.status] ?? {
    label: order.status,
    description: "Estado operativo del pedido.",
    tone: "neutral" as const,
  };
  const paymentMeta = PAYMENT_STATUS_META[order.paymentStatus] ?? {
    label: order.paymentStatus,
    description: "Estado del pago.",
    tone: "neutral" as const,
  };
  const deliveryMeta = DELIVERY_STATUS_META[order.deliveryStatus] ?? {
    label: order.deliveryStatus,
    description: "Estado de despacho.",
    tone: "neutral" as const,
  };
  const deliveryMethodInfo = DELIVERY_METHOD_META[order.deliveryMethod] ?? {
    label: order.deliveryMethod,
    shortLabel: order.deliveryMethod,
  };

  const orderTone = getToneStyles(orderMeta.tone);
  const paymentTone = getToneStyles(paymentMeta.tone);
  const deliveryTone = getToneStyles(deliveryMeta.tone);
  const isCancelled = order.status === "CANCELLED" || order.status === "EXPIRED";
  const currentStep = getOrderProgressStep(order.status, order.deliveryStatus);
  const etaText = getEstimatedEtaText(order.deliveryMethod, order.status, order.deliveryStatus);

  const destLat = order.deliveryAddress?.lat ?? -19.5865;
  const destLng = order.deliveryAddress?.lng ?? -65.7512;
  const hasDeliveryRoute =
    order.deliveryMethod === "LOCAL_DELIVERY" &&
    typeof destLat === "number" &&
    typeof destLng === "number";

  const mapEmbedUrl = hasDeliveryRoute
    ? `https://maps.google.com/maps?saddr=${STORE_LOCATION.lat},${STORE_LOCATION.lng}&daddr=${destLat},${destLng}&hl=es&output=embed`
    : `https://maps.google.com/maps?q=${STORE_LOCATION.lat},${STORE_LOCATION.lng}&hl=es&z=16&output=embed`;

  const mapExternalUrl = hasDeliveryRoute
    ? `https://www.google.com/maps/dir/${STORE_LOCATION.lat},${STORE_LOCATION.lng}/${destLat},${destLng}`
    : `https://www.google.com/maps/search/?api=1&query=${STORE_LOCATION.lat},${STORE_LOCATION.lng}`;

  async function uploadProof(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("idempotencyKey", `proof-${order.id}-${Date.now()}`);
      if (guestCode) fd.set("code", guestCode);
      if (referenceNumber) fd.set("referenceNumber", referenceNumber);
      if (file) fd.set("file", file);

      const res = await fetch(`/api/orders/${encodeURIComponent(order.id)}/payment-proof`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error ?? "No se pudo subir el comprobante.", "error");
        return;
      }
      notify(
        "Comprobante registrado en estado PENDIENTE DE REVISIÓN. Un operador autorizado lo verificará.",
        "success"
      );
      setReferenceNumber("");
      setFile(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function cancelOrder() {
    setBusy(true);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(order.id)}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: guestCode, reason: "Cancelado por el cliente" }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error ?? "No se pudo cancelar el pedido.", "error");
        return;
      }
      notify("Pedido cancelado y reserva de stock liberada.", "info");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ct-container py-8 space-y-6">
      {/* Top Status & PedidosYa-Style Summary Hero */}
      <section
        className="rounded-2xl border p-5 sm:p-6 space-y-5"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-strong)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--accent-cyan)" }}>
              Seguimiento de Pedido ClickTech · {order.orderNumber}
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
              {isCancelled ? "Pedido detenido" : orderMeta.label}
            </h1>
            <p className="text-xs sm:text-sm" style={{ color: "var(--text-secondary)" }}>
              {orderMeta.description}
            </p>
            <p className="text-xs pt-0.5" style={{ color: "var(--text-muted)" }}>
              Fecha (La Paz): {formatDateLaPaz(order.createdAt)}
              {order.reservationExpiresAt && order.status === "PENDING_PAYMENT"
                ? ` · Reserva vigente hasta: ${formatDateLaPaz(order.reservationExpiresAt)}`
                : ""}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={`/api/orders/${encodeURIComponent(order.id)}/receipt${codeParam}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ct-btn h-10 px-4 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5"
              style={{
                borderColor: "var(--border-strong)",
                backgroundColor: "var(--accent-cyan-soft)",
                color: "var(--accent-cyan)",
              }}
            >
              <FileText className="w-4 h-4" />
              Comprobante / Factura PDF
            </a>
            <a
              href={`https://wa.me/${STORE_LOCATION.whatsapp}?text=${encodeURIComponent(
                `Hola ClickTech (+591 67605477), consulto por el estado de mi pedido ${order.orderNumber}.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ct-btn h-10 px-4 rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
              style={{ backgroundColor: "#25D366", color: "#FFFFFF" }}
            >
              <MessageCircle className="w-4 h-4" />
              Soporte WhatsApp
            </a>
            {canCancel && (
              <button
                type="button"
                disabled={busy}
                onClick={cancelOrder}
                className="ct-btn h-10 px-4 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5"
                style={{ borderColor: "var(--status-danger)", color: "var(--status-danger)" }}
              >
                <XCircle className="w-4 h-4" />
                Cancelar pedido
              </button>
            )}
          </div>
        </div>

        {guestCode && (
          <div
            className="rounded-xl border p-3.5 text-xs flex flex-wrap items-center justify-between gap-2"
            style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-strong)" }}
          >
            <span>
              <strong>Código de consulta de invitado:</strong>{" "}
              <code className="font-mono font-bold px-2 py-0.5 rounded" style={{ backgroundColor: "var(--accent-cyan-soft)", color: "var(--accent-cyan)" }}>
                {guestCode}
              </code>{" "}
              — Guárdalo para seguir tu pedido o subir tu comprobante en cualquier momento.
            </span>
          </div>
        )}

        {/* PedidosYa-Style 5-Step Progress Timeline */}
        {!isCancelled && (
          <div
            className="rounded-2xl border p-4 sm:p-5 space-y-4"
            style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)" }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                <Bike className="w-4 h-4" style={{ color: "var(--accent-cyan)" }} />
                <span>Progreso en tiempo real</span>
              </div>
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold"
                style={{
                  backgroundColor: "var(--accent-cyan-soft)",
                  borderColor: "var(--border-strong)",
                  color: "var(--accent-cyan)",
                }}
              >
                <Clock className="w-3.5 h-3.5" />
                Tiempo estimado: {etaText}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {TRACKING_STEPS.map((st, idx) => {
                const done = idx <= currentStep;
                const active = idx === currentStep;
                return (
                  <div
                    key={st.label}
                    className="rounded-xl border p-3 flex sm:flex-col items-center sm:items-start gap-3 sm:gap-1.5"
                    style={{
                      backgroundColor: active
                        ? "var(--accent-cyan-soft)"
                        : done
                        ? "var(--bg-surface)"
                        : "transparent",
                      borderColor: active
                        ? "var(--accent-cyan)"
                        : done
                        ? "var(--border-strong)"
                        : "var(--border-subtle)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-full text-[11px] font-extrabold flex items-center justify-center shrink-0 ${
                          active ? "animate-pulse" : ""
                        }`}
                        style={{
                          backgroundColor: done ? "var(--accent-cyan)" : "var(--bg-surface)",
                          color: done ? "var(--accent-cyan-ink)" : "var(--text-muted)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                      </span>
                      <span
                        className="text-xs font-bold"
                        style={{ color: done ? "var(--text-primary)" : "var(--text-muted)" }}
                      >
                        {st.label}
                      </span>
                    </div>
                    <p className="text-[11px] sm:pl-8" style={{ color: "var(--text-muted)" }}>
                      {st.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Separated Clear Spanish Status Cards (preserving exact E2E data-testid values cleanly) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div
            className="rounded-xl border p-3.5 space-y-1"
            style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)" }}
          >
            <span className="font-medium" style={{ color: "var(--text-muted)" }}>
              Estado del pedido
            </span>
            <p className="font-heading font-bold text-sm" style={{ color: orderTone.text }}>
              {orderMeta.label}
            </p>
            <code
              data-testid="order-status"
              className="inline-block font-mono text-[10px] px-1.5 py-0.5 rounded border"
              style={{
                backgroundColor: orderTone.bg,
                borderColor: orderTone.border,
                color: orderTone.text,
              }}
            >
              {order.status}
            </code>
          </div>

          <div
            className="rounded-xl border p-3.5 space-y-1"
            style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)" }}
          >
            <span className="font-medium" style={{ color: "var(--text-muted)" }}>
              Estado del pago
            </span>
            <p className="font-heading font-bold text-sm" style={{ color: paymentTone.text }}>
              {paymentMeta.label}
            </p>
            <code
              data-testid="payment-status"
              className="inline-block font-mono text-[10px] px-1.5 py-0.5 rounded border"
              style={{
                backgroundColor: paymentTone.bg,
                borderColor: paymentTone.border,
                color: paymentTone.text,
              }}
            >
              {order.paymentStatus}
            </code>
          </div>

          <div
            className="rounded-xl border p-3.5 space-y-1"
            style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)" }}
          >
            <span className="font-medium" style={{ color: "var(--text-muted)" }}>
              Logística y entrega
            </span>
            <p className="font-heading font-bold text-sm" style={{ color: deliveryTone.text }}>
              {deliveryMethodInfo.shortLabel} · {deliveryMeta.label}
            </p>
            <span className="block text-[11px]" style={{ color: "var(--text-secondary)" }}>
              {order.deliveryZoneName ? `Zona: ${order.deliveryZoneName}` : STORE_LOCATION.shortName}
            </span>
          </div>
        </div>
      </section>

      {/* PedidosYa-Style Live Map & Route Tracker */}
      <section
        className="rounded-2xl border p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="lg:col-span-7 rounded-xl border overflow-hidden min-h-[260px]" style={{ borderColor: "var(--border-subtle)" }}>
          <iframe
            title="Mapa de seguimiento de pedido ClickTech Potosí"
            width="100%"
            height="100%"
            style={{ border: 0, minHeight: "260px" }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={mapEmbedUrl}
          />
        </div>

        <div className="lg:col-span-5 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-heading text-base font-bold flex items-center gap-2">
                <MapPin className="w-4 h-4" style={{ color: "var(--accent-cyan)" }} />
                Mapa de Ruta en Vivo
              </h2>
              <a
                href={mapExternalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold inline-flex items-center gap-1 underline"
                style={{ color: "var(--accent-cyan)" }}
              >
                Ver en Google Maps <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="rounded-xl border p-3.5 space-y-2.5 text-xs" style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)" }}>
              <div className="flex items-start gap-2.5">
                <Store className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--accent-cyan)" }} />
                <div>
                  <p className="font-bold" style={{ color: "var(--text-primary)" }}>
                    Origen: {STORE_LOCATION.name}
                  </p>
                  <p style={{ color: "var(--text-muted)" }}>{STORE_LOCATION.address}</p>
                </div>
              </div>
              <div className="border-t pt-2.5 flex items-start gap-2.5" style={{ borderColor: "var(--border-subtle)" }}>
                <Package className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--status-ok)" }} />
                <div>
                  <p className="font-bold" style={{ color: "var(--text-primary)" }}>
                    Destino: {deliveryMethodInfo.label}
                  </p>
                  <p style={{ color: "var(--text-secondary)" }}>
                    {order.deliveryAddress?.street
                      ? `${order.deliveryAddress.street}${order.deliveryAddress.reference ? ` · Ref: ${order.deliveryAddress.reference}` : ""}`
                      : order.deliveryMethod === "PICKUP_POTOSI"
                      ? `Horario de atención: ${STORE_LOCATION.schedule}`
                      : "Coordinado con el titular"}
                  </p>
                </div>
              </div>
            </div>

            {order.notes && (
              <div className="rounded-xl border p-3 text-xs" style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)" }}>
                <p className="font-bold mb-0.5" style={{ color: "var(--text-muted)" }}>Observaciones registradas:</p>
                <p style={{ color: "var(--text-secondary)" }}>{order.notes}</p>
              </div>
            )}
          </div>

          <div
            className="rounded-xl border p-3 text-xs flex items-center gap-2.5"
            style={{ backgroundColor: "var(--accent-cyan-soft)", borderColor: "var(--border-strong)" }}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: "var(--accent-cyan)" }} />
            <span style={{ color: "var(--text-primary)" }}>
              Entregas protegidas con precinto numerado ClickTech y validación directa al <strong>{STORE_LOCATION.whatsappDisplay}</strong>.
            </span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Products List with Thumbnails */}
        <div className="lg:col-span-7 space-y-4">
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)", boxShadow: "var(--shadow-card)" }}
          >
            <h2 className="p-4 font-heading font-bold text-base border-b" style={{ borderColor: "var(--border-subtle)" }}>
              Productos y montos en Bs
            </h2>
            <div className="divide-y text-xs sm:text-sm" style={{ borderColor: "var(--border-subtle)" }}>
              {order.items.map((it) => (
                <div key={it.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-12 h-12 rounded-xl border overflow-hidden shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: "var(--bg-card-media)", borderColor: "var(--border-subtle)" }}
                    >
                      {it.imageUrl ? (
                        <img src={it.imageUrl} alt={it.productNameSnapshot} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
                      )}
                    </div>
                    <div className="min-w-0">
                      {it.productSlug ? (
                        <Link href={`/producto/${it.productSlug}`} className="font-semibold hover:underline block truncate">
                          {it.productNameSnapshot}
                        </Link>
                      ) : (
                        <p className="font-semibold truncate">{it.productNameSnapshot}</p>
                      )}
                      <p className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                        {it.skuSnapshot} · {it.quantity} x {formatBs(it.unitPriceCentsSnapshot)}
                        {it.warrantyMonthsSnapshot ? ` · Garantía: ${it.warrantyMonthsSnapshot} m` : ""}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold tabular-nums shrink-0">{formatBs(it.lineTotalCents)}</span>
                </div>
              ))}
            </div>
            <div className="p-4 border-t space-y-1 text-sm" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-chassis)" }}>
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatBs(order.subtotalCents)}</span>
              </div>
              {order.assemblyFeeCents > 0 && (
                <div className="flex justify-between">
                  <span>Ensamblaje</span>
                  <span className="tabular-nums">{formatBs(order.assemblyFeeCents)}</span>
                </div>
              )}
              {order.deliveryFeeCents > 0 && (
                <div className="flex justify-between">
                  <span>Envío</span>
                  <span className="tabular-nums">{formatBs(order.deliveryFeeCents)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold pt-2 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                <span>Total del pedido</span>
                <span className="tabular-nums" style={{ color: "var(--accent-cyan)" }} data-testid="order-total">
                  {formatBs(order.totalCents)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* QR + Upload Proof + Payment History */}
        <aside className="lg:col-span-5 space-y-4">
          {canUploadProof && (
            <form
              onSubmit={uploadProof}
              className="rounded-2xl border p-5 space-y-3"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-strong)", boxShadow: "var(--shadow-card)" }}
            >
              <h2 className="font-heading text-base font-bold flex items-center gap-2">
                <Upload className="w-4 h-4" style={{ color: "var(--accent-cyan)" }} />
                Subir comprobante de transferencia / QR
              </h2>

              {qrUrl && (
                <div className="rounded-xl border p-3 flex items-center gap-3" style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)" }}>
                  <img src={qrUrl} alt="QR de pago del pedido" className="w-20 h-20 rounded-lg bg-white p-1 border shrink-0" />
                  <div className="text-[11px] space-y-1">
                    <p className="font-bold flex items-center gap-1" style={{ color: "var(--accent-cyan)" }}>
                      <QrCode className="w-3.5 h-3.5" /> QR Simple · {formatBs(order.totalCents)}
                    </p>
                    <p style={{ color: "var(--text-muted)" }}>
                      Escanea y luego registra tu número de operación o captura abajo.
                    </p>
                  </div>
                </div>
              )}

              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                El comprobante queda almacenado en repositorio privado y en estado <strong>pendiente de revisión manual</strong> hasta ser verificado.
              </p>
              <input
                type="text"
                placeholder="Número de referencia o transferencia"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border text-sm"
                style={{
                  backgroundColor: "var(--bg-chassis)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
              />
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full text-xs"
              />
              <button
                type="submit"
                disabled={busy}
                className="ct-btn w-full h-10 rounded-lg text-sm font-semibold"
                style={{ backgroundColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }}
              >
                {busy ? "Subiendo comprobante..." : "Enviar comprobante para revisión"}
              </button>
            </form>
          )}

          <div
            className="rounded-2xl border p-5 space-y-3"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)", boxShadow: "var(--shadow-card)" }}
          >
            <h2 className="font-heading text-base font-bold">Historial de pagos registrados</h2>
            {order.payments.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Aún no se registraron comprobantes de pago para este pedido.
              </p>
            ) : (
              <div className="space-y-2.5 text-xs">
                {order.payments.map((p) => {
                  const pMeta = PAYMENT_STATUS_META[p.status];
                  return (
                    <div
                      key={p.id}
                      className="rounded-xl border p-3 space-y-1"
                      style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)" }}
                    >
                      <div className="flex justify-between font-semibold">
                        <span>{pMeta?.label ?? p.status}</span>
                        <span className="tabular-nums">{formatBs(p.amountCents)}</span>
                      </div>
                      {p.referenceNumber && <p>Ref: {p.referenceNumber}</p>}
                      {p.isLateSubmission && (
                        <p style={{ color: "var(--status-warn)" }}>
                          Envío tardío tras vencimiento de reserva: requiere revalidación de stock.
                        </p>
                      )}
                      {p.reviewNotes && <p style={{ color: "var(--text-muted)" }}>Nota: {p.reviewNotes}</p>}
                      {p.proofFilePath && (
                        <Link
                          href={`/api/private-files/${p.proofFilePath}`}
                          target="_blank"
                          className="underline block"
                          style={{ color: "var(--accent-cyan)" }}
                        >
                          Ver comprobante privado
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
