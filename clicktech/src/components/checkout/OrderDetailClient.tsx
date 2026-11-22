"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Upload, XCircle } from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";
import { formatBs } from "@/lib/domain/money";
import { formatDateLaPaz } from "@/lib/utils";

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
  items: Array<{
    id: string;
    skuSnapshot: string;
    productNameSnapshot: string;
    quantity: number;
    unitPriceCentsSnapshot: number;
    lineTotalCents: number;
    warrantyMonthsSnapshot: number | null;
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

  const codeParam = guestCode ? `?code=${encodeURIComponent(guestCode)}` : "";
  const canUploadProof =
    order.paymentStatus !== "APPROVED" &&
    order.status !== "CANCELLED" &&
    order.paymentMethod === "TRANSFER_QR_MANUAL";
  const canCancel =
    order.status !== "CANCELLED" &&
    order.status !== "DELIVERED" &&
    order.status !== "PAID_CONFIRMED";

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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div
        className="rounded-2xl border p-6 space-y-4"
        style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-strong)" }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase" style={{ color: "var(--accent-cyan)" }}>
              Comprobante operativo ClickTech · {order.orderNumber}
            </p>
            <h1 className="font-display text-2xl font-bold mt-1">Detalle de Pedido</h1>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
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
              className="ct-btn h-10 px-4 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5"
              style={{ borderColor: "var(--border-strong)", color: "var(--accent-cyan)" }}
            >
              <FileText className="w-4 h-4" />
              Comprobante descargable
            </a>
            {canCancel && (
              <button
                type="button"
                disabled={busy}
                onClick={cancelOrder}
                className="ct-btn h-10 px-4 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5"
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
            className="rounded-lg border p-3 text-xs"
            style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--accent-cyan)" }}
          >
            <strong>Código de consulta de invitado:</strong>{" "}
            <code className="font-bold">{guestCode}</code> — Guárdalo para volver a consultar o subir comprobantes de este pedido.
          </div>
        )}

        {/* Separated Order / Payment / Delivery states */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="rounded-xl border p-3" style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)" }}>
            <span style={{ color: "var(--text-muted)" }}>Estado del pedido</span>
            <p className="font-heading font-bold text-sm mt-0.5" data-testid="order-status">
              {order.status}
            </p>
          </div>
          <div className="rounded-xl border p-3" style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)" }}>
            <span style={{ color: "var(--text-muted)" }}>Estado del pago</span>
            <p className="font-heading font-bold text-sm mt-0.5" data-testid="payment-status">
              {order.paymentStatus}
            </p>
          </div>
          <div className="rounded-xl border p-3" style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)" }}>
            <span style={{ color: "var(--text-muted)" }}>Estado de entrega</span>
            <p className="font-heading font-bold text-sm mt-0.5">
              {order.deliveryMethod} · {order.deliveryStatus}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
          >
            <h2 className="p-4 font-heading font-bold text-base border-b" style={{ borderColor: "var(--border-subtle)" }}>
              Productos y montos en Bs
            </h2>
            <div className="divide-y text-xs sm:text-sm" style={{ borderColor: "var(--border-subtle)" }}>
              {order.items.map((it) => (
                <div key={it.id} className="p-4 flex justify-between gap-4">
                  <div>
                    <p className="font-semibold">{it.productNameSnapshot}</p>
                    <p className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                      {it.skuSnapshot} · {it.quantity} x {formatBs(it.unitPriceCentsSnapshot)}
                      {it.warrantyMonthsSnapshot ? ` · Garantía: ${it.warrantyMonthsSnapshot} m` : ""}
                    </p>
                  </div>
                  <span className="font-bold tabular-nums">{formatBs(it.lineTotalCents)}</span>
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

        <aside className="lg:col-span-5 space-y-4">
          {canUploadProof && (
            <form
              onSubmit={uploadProof}
              className="rounded-2xl border p-5 space-y-3"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-strong)" }}
            >
              <h2 className="font-heading text-base font-bold flex items-center gap-2">
                <Upload className="w-4 h-4" style={{ color: "var(--accent-cyan)" }} />
                Subir comprobante de transferencia / QR
              </h2>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                El comprobante queda almacenado en repositorio privado y en estado <strong>pendiente de revisión manual</strong> hasta ser verificado por personal autorizado.
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
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
          >
            <h2 className="font-heading text-base font-bold">Historial de pagos registrados</h2>
            {order.payments.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Aún no se registraron comprobantes de pago para este pedido.
              </p>
            ) : (
              <div className="space-y-2.5 text-xs">
                {order.payments.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-xl border p-3 space-y-1"
                    style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)" }}
                  >
                    <div className="flex justify-between font-semibold">
                      <span>Estado: {p.status}</span>
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
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
