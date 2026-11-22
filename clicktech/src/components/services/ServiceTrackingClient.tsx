"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ClipboardList, MessageSquare, XCircle } from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";
import { formatBs } from "@/lib/domain/money";
import { formatDateLaPaz } from "@/lib/utils";
import { SERVICE_STAGE_ORDER, SERVICE_STATUS_LABELS } from "@/lib/domain/service-rules";
import type { ServiceOrderStatus } from "@prisma/client";

export interface PublicServiceOrderView {
  id: string;
  ticketNumber: string;
  customerName: string;
  deviceType: string;
  deviceBrandModel: string;
  deviceSerial: string | null;
  accessoriesReceived: string | null;
  initialPhysicalState: string | null;
  reportedSymptoms: string;
  status: ServiceOrderStatus;
  diagnosisReport: string | null;
  laborCents: number;
  partsTotalCents: number;
  totalApprovedCents: number;
  activeQuoteVersion: number | null;
  closingSummary: string | null;
  performedTestsJson: string[] | null;
  maintenanceRecommendations: string | null;
  createdAt: string;
  serviceCatalog: { name: string };
  assignedTech: { name: string } | null;
  timeline: Array<{
    id: string;
    toStatus: ServiceOrderStatus;
    publicMessage: string;
    createdAt: string;
  }>;
  parts: Array<{
    id: string;
    skuSnapshot: string;
    productNameSnapshot: string;
    quantity: number;
    unitPriceCentsSnapshot: number;
  }>;
  quotes: Array<{
    id: string;
    quoteNumber: string;
    status: string;
    versions: Array<{
      id: string;
      version: number;
      subtotalCents: number;
      assemblyOrLaborCents: number;
      totalCents: number;
      termsSnapshot: string;
      changeReason: string | null;
      status: string;
      createdAt: string;
    }>;
  }>;
  attachments: Array<{
    id: string;
    filePath: string;
    caption: string | null;
  }>;
}

export function ServiceTrackingClient({
  order,
  canDecideQuote,
}: {
  order: PublicServiceOrderView;
  canDecideQuote: boolean;
}) {
  const router = useRouter();
  const { notify } = useStore();
  const [busy, setBusy] = useState(false);
  const [consultMessage, setConsultMessage] = useState("");

  const latestQuote = order.quotes[0];
  const latestVersion = latestQuote?.versions[0];
  const stageIdx = SERVICE_STAGE_ORDER.indexOf(order.status);

  async function decideQuote(decision: "ACCEPTED" | "REJECTED") {
    setBusy(true);
    try {
      const res = await fetch(
        `/api/services/orders/${encodeURIComponent(order.ticketNumber)}/quote-decision`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        notify(data.error ?? "No se pudo registrar tu decisión.", "error");
        return;
      }
      notify(
        decision === "ACCEPTED"
          ? "Cotización aprobada. El taller puede proceder con el trabajo."
          : "Cotización rechazada.",
        decision === "ACCEPTED" ? "success" : "info"
      );
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function sendPostSaleQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!consultMessage.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: `Seguimiento orden ${order.ticketNumber}`,
          message: consultMessage,
          serviceOrderId: order.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error ?? "Error enviando consulta.", "error");
      } else {
        notify("Consulta asociada a tu orden técnica.", "success");
        setConsultMessage("");
      }
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
              Orden de Servicio Técnico · {order.ticketNumber}
            </p>
            <h1 className="font-display text-2xl font-bold mt-1">{order.serviceCatalog.name}</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              Equipo: <strong>{order.deviceBrandModel}</strong> ({order.deviceType})
              {order.deviceSerial ? ` · Serie: ${order.deviceSerial}` : ""}
            </p>
          </div>
          <span
            className="px-3 py-1.5 rounded-lg text-xs font-bold"
            style={{
              backgroundColor: "var(--accent-cyan-soft)",
              color: "var(--accent-cyan)",
            }}
            data-testid="service-status-badge"
          >
            {SERVICE_STATUS_LABELS[order.status]}
          </span>
        </div>

        {/* 10-Stage Visual Progress */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
          {SERVICE_STAGE_ORDER.map((st, idx) => {
            const done = stageIdx >= idx;
            return (
              <div
                key={st}
                className="rounded-lg border p-2 text-[11px] font-medium"
                style={{
                  backgroundColor: done ? "var(--accent-cyan-soft)" : "var(--bg-chassis)",
                  borderColor: done ? "var(--accent-cyan)" : "var(--border-subtle)",
                  color: done ? "var(--text-primary)" : "var(--text-muted)",
                }}
              >
                {idx + 1}. {SERVICE_STATUS_LABELS[st]}
              </div>
            );
          })}
        </div>
      </div>

      {/* Diagnosis & Quote Approval Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <div
            className="rounded-2xl border p-5 space-y-3"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
          >
            <h2 className="font-heading text-lg font-bold flex items-center gap-2">
              <ClipboardList className="w-5 h-5" style={{ color: "var(--accent-cyan)" }} />
              Línea de tiempo del servicio
            </h2>
            <div className="space-y-3" data-testid="service-timeline">
              {order.timeline.map((ev) => (
                <div
                  key={ev.id}
                  className="rounded-xl border p-3.5 space-y-1 text-xs"
                  style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)" }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold" style={{ color: "var(--accent-cyan)" }}>
                      {SERVICE_STATUS_LABELS[ev.toStatus]}
                    </span>
                    <span className="tabular-nums" style={{ color: "var(--text-muted)" }}>
                      {formatDateLaPaz(ev.createdAt)}
                    </span>
                  </div>
                  <p style={{ color: "var(--text-primary)" }}>{ev.publicMessage}</p>
                </div>
              ))}
            </div>
          </div>

          {order.status === "DELIVERED" && (
            <div
              className="rounded-2xl border p-5 space-y-3"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--status-ok)" }}
            >
              <h2 className="font-heading text-lg font-bold flex items-center gap-2" style={{ color: "var(--status-ok)" }}>
                <CheckCircle2 className="w-5 h-5" />
                Resumen de cierre y pruebas verificadas
              </h2>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {order.closingSummary}
              </p>
              {order.performedTestsJson && order.performedTestsJson.length > 0 && (
                <ul className="list-disc pl-5 text-xs space-y-1">
                  {order.performedTestsJson.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              )}
              {order.maintenanceRecommendations && (
                <p className="text-xs pt-2 border-t" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
                  <strong>Recomendaciones:</strong> {order.maintenanceRecommendations}
                </p>
              )}
            </div>
          )}
        </div>

        <aside className="lg:col-span-5 space-y-4">
          <div
            className="rounded-2xl border p-5 space-y-3"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
          >
            <h2 className="font-heading text-base font-bold">Diagnóstico y recepción</h2>
            <dl className="text-xs space-y-2">
              <div>
                <dt style={{ color: "var(--text-muted)" }}>Síntomas reportados</dt>
                <dd>{order.reportedSymptoms}</dd>
              </div>
              {order.accessoriesReceived && (
                <div>
                  <dt style={{ color: "var(--text-muted)" }}>Accesorios recibidos</dt>
                  <dd>{order.accessoriesReceived}</dd>
                </div>
              )}
              {order.initialPhysicalState && (
                <div>
                  <dt style={{ color: "var(--text-muted)" }}>Estado físico inicial</dt>
                  <dd>{order.initialPhysicalState}</dd>
                </div>
              )}
              {order.diagnosisReport && (
                <div>
                  <dt style={{ color: "var(--text-muted)" }}>Diagnóstico técnico</dt>
                  <dd className="font-medium">{order.diagnosisReport}</dd>
                </div>
              )}
            </dl>
          </div>

          {latestQuote && latestVersion && (
            <div
              className="rounded-2xl border p-5 space-y-3"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor:
                  order.status === "QUOTE_PENDING_APPROVAL"
                    ? "var(--status-warn)"
                    : "var(--border-subtle)",
              }}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-base font-bold">
                  Cotización v{latestVersion.version}
                </h2>
                <span className="text-xs font-semibold">{latestVersion.status}</span>
              </div>

              <div className="text-xs space-y-1.5 border-y py-3" style={{ borderColor: "var(--border-subtle)" }}>
                <div className="flex justify-between">
                  <span>Mano de obra técnica</span>
                  <span className="font-semibold tabular-nums">
                    {formatBs(latestVersion.assemblyOrLaborCents)}
                  </span>
                </div>
                {order.parts.map((pt) => (
                  <div key={pt.id} className="flex justify-between">
                    <span>
                      Repuesto: {pt.productNameSnapshot} ({pt.quantity}x)
                    </span>
                    <span className="font-semibold tabular-nums">
                      {formatBs(pt.unitPriceCentsSnapshot * pt.quantity)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between text-sm pt-2 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                  <span className="font-bold">Total cotizado</span>
                  <span className="font-bold tabular-nums" style={{ color: "var(--accent-cyan)" }}>
                    {formatBs(latestVersion.totalCents)}
                  </span>
                </div>
              </div>

              {latestVersion.changeReason && (
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Motivo: {latestVersion.changeReason}
                </p>
              )}

              {order.status === "QUOTE_PENDING_APPROVAL" && latestVersion.status === "PENDING" && (
                <div className="space-y-2 pt-1">
                  {canDecideQuote ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => decideQuote("ACCEPTED")}
                        className="ct-btn h-10 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
                        style={{ backgroundColor: "var(--status-ok)", color: "#ffffff" }}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Aprobar v{latestVersion.version}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => decideQuote("REJECTED")}
                        className="ct-btn h-10 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1"
                        style={{ borderColor: "var(--status-danger)", color: "var(--status-danger)" }}
                      >
                        <XCircle className="w-4 h-4" />
                        Rechazar
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs" style={{ color: "var(--status-warn)" }}>
                      Inicia sesión con tu cuenta propietaria de la orden para aprobar o rechazar esta cotización.
                    </p>
                  )}
                </div>
              )}

              {latestQuote.versions.length > 1 && (
                <div className="text-[11px] pt-2 border-t space-y-1" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
                  <p className="font-semibold">Historial de versiones:</p>
                  {latestQuote.versions.map((v) => (
                    <div key={v.id} className="flex justify-between">
                      <span>
                        v{v.version} ({v.status})
                      </span>
                      <span className="tabular-nums">{formatBs(v.totalCents)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Post-sale / follow-up question */}
          <form
            onSubmit={sendPostSaleQuestion}
            className="rounded-2xl border p-4 space-y-2"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
          >
            <h3 className="text-xs font-semibold flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" style={{ color: "var(--accent-cyan)" }} />
              Consultar sobre esta orden
            </h3>
            <textarea
              rows={2}
              value={consultMessage}
              onChange={(e) => setConsultMessage(e.target.value)}
              placeholder="Escribe tu consulta para el taller..."
              className="w-full p-2.5 rounded-lg border text-xs"
              style={{
                backgroundColor: "var(--bg-chassis)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            />
            <button
              type="submit"
              disabled={busy}
              className="ct-btn h-9 px-3 rounded-lg text-xs font-semibold"
              style={{ backgroundColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }}
            >
              Enviar mensaje
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
