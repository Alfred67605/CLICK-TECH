"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Cpu,
  FileCheck,
  LogOut,
  MessageSquare,
  Package,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";
import { formatBs } from "@/lib/domain/money";
import { formatDateLaPaz } from "@/lib/utils";
import { SERVICE_STATUS_LABELS } from "@/lib/domain/service-rules";
import type { ServiceOrderStatus } from "@prisma/client";

export interface CustomerPortalData {
  user: { id: string; name: string; email: string; phone: string | null; role: string };
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    deliveryStatus: string;
    totalCents: number;
    createdAt: string;
    itemsCount: number;
  }>;
  quotes: Array<{
    id: string;
    quoteNumber: string;
    type: string;
    status: string;
    currentVersion: number;
    validUntil: string;
    totalCents: number;
  }>;
  pcConfigs: Array<{
    id: string;
    shareToken: string;
    name: string;
    compatibilityStatus: string;
    totalCents: number;
    createdAt: string;
  }>;
  services: Array<{
    id: string;
    ticketNumber: string;
    serviceName: string;
    deviceBrandModel: string;
    status: ServiceOrderStatus;
    createdAt: string;
  }>;
  warranties: Array<{
    id: string;
    code: string;
    itemLabel: string;
    durationMonths: number;
    expiresAt: string;
    status: string;
    terms: string;
  }>;
  consultations: Array<{
    id: string;
    subject: string;
    status: string;
    createdAt: string;
    messages: Array<{ senderName: string; senderRole: string; body: string; createdAt: string }>;
  }>;
}

export function CustomerPortalClient({ data }: { data: CustomerPortalData }) {
  const router = useRouter();
  const { notify } = useStore();
  const [tab, setTab] = useState<
    "orders" | "services" | "quotes" | "warranties" | "consultations"
  >("orders");
  const [claimWarrantyId, setClaimWarrantyId] = useState<string | null>(null);
  const [claimDesc, setClaimDesc] = useState("");
  const [consultSubj, setConsultSubj] = useState("");
  const [consultBody, setConsultBody] = useState("");
  const [busy, setBusy] = useState(false);

  async function logout() {
    await fetch("/api/auth/login", { method: "DELETE" });
    notify("Sesión cerrada.", "info");
    router.push("/");
    router.refresh();
  }

  async function submitWarrantyClaim(e: React.FormEvent) {
    e.preventDefault();
    if (!claimWarrantyId) return;
    setBusy(true);
    try {
      const res = await fetch("/api/warranties/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ warrantyId: claimWarrantyId, description: claimDesc }),
      });
      const json = await res.json();
      if (!res.ok) {
        notify(json.error ?? "No se pudo registrar el reclamo.", "error");
        return;
      }
      notify("Solicitud de atención por garantía registrada.", "success");
      setClaimWarrantyId(null);
      setClaimDesc("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function createConsultation(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: consultSubj, message: consultBody }),
      });
      const json = await res.json();
      if (!res.ok) {
        notify(json.error ?? "Error registrando consulta.", "error");
        return;
      }
      notify("Consulta enviada al equipo técnico/comercial.", "success");
      setConsultSubj("");
      setConsultBody("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function decideQuote(quoteId: string, decision: "ACCEPTED" | "REJECTED") {
    setBusy(true);
    try {
      const res = await fetch(`/api/quotes/${encodeURIComponent(quoteId)}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (res.ok) {
        notify(decision === "ACCEPTED" ? "Cotización aceptada." : "Cotización rechazada.", "info");
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div
        className="rounded-2xl border p-6 flex flex-wrap items-center justify-between gap-4"
        style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-strong)" }}
      >
        <div>
          <p className="text-xs font-semibold uppercase" style={{ color: "var(--accent-cyan)" }}>
            Cuenta ClickTech ({data.user.role})
          </p>
          <h1 className="font-display text-2xl font-bold mt-0.5">{data.user.name}</h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {data.user.email} {data.user.phone ? `· ${data.user.phone}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(data.user.role === "ADMIN" || data.user.role === "SALES" || data.user.role === "TECH") && (
            <Link
              href="/admin"
              className="ct-btn h-10 px-4 rounded-lg text-xs font-semibold flex items-center"
              style={{ backgroundColor: "var(--accent-purple)", color: "#ffffff" }}
            >
              Ir al Panel Operativo
            </Link>
          )}
          <button
            type="button"
            onClick={logout}
            className="ct-btn h-10 px-4 rounded-lg border text-xs font-semibold flex items-center gap-1.5"
            style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: "orders" as const, label: `Pedidos (${data.orders.length})`, icon: Package },
          { id: "services" as const, label: `Servicios (${data.services.length})`, icon: Wrench },
          {
            id: "quotes" as const,
            label: `Cotizaciones y PCs (${data.quotes.length + data.pcConfigs.length})`,
            icon: FileCheck,
          },
          { id: "warranties" as const, label: `Garantías (${data.warranties.length})`, icon: ShieldCheck },
          {
            id: "consultations" as const,
            label: `Consultas (${data.consultations.length})`,
            icon: MessageSquare,
          },
        ].map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className="ct-btn h-10 px-4 rounded-lg border text-xs font-semibold flex items-center gap-1.5"
              style={{
                backgroundColor: active ? "var(--accent-cyan-soft)" : "var(--bg-surface)",
                borderColor: active ? "var(--accent-cyan)" : "var(--border-subtle)",
                color: active ? "var(--accent-cyan)" : "var(--text-secondary)",
              }}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "orders" && (
        <div className="space-y-3">
          {data.orders.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No has realizado pedidos todavía.
            </p>
          ) : (
            data.orders.map((o) => (
              <Link
                key={o.id}
                href={`/pedido/${o.id}`}
                className="ct-card block rounded-xl border p-4 flex flex-wrap items-center justify-between gap-4"
                style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
              >
                <div>
                  <p className="font-heading font-bold text-sm">{o.orderNumber}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {formatDateLaPaz(o.createdAt)} · {o.itemsCount} ítem(s)
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span>Pedido: <strong>{o.status}</strong></span>
                  <span>Pago: <strong>{o.paymentStatus}</strong></span>
                  <span className="font-heading font-bold text-base tabular-nums" style={{ color: "var(--accent-cyan)" }}>
                    {formatBs(o.totalCents)}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {tab === "services" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Link
              href="/servicios"
              className="ct-btn h-9 px-4 rounded-lg text-xs font-semibold inline-flex items-center"
              style={{ backgroundColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }}
            >
              Nueva solicitud técnica
            </Link>
          </div>
          {data.services.map((s) => (
            <Link
              key={s.id}
              href={`/seguimiento/${s.ticketNumber}`}
              className="ct-card block rounded-xl border p-4 flex flex-wrap items-center justify-between gap-4"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
            >
              <div>
                <p className="font-heading font-bold text-sm">{s.ticketNumber} — {s.serviceName}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {s.deviceBrandModel} · {formatDateLaPaz(s.createdAt)}
                </p>
              </div>
              <span className="text-xs font-bold" style={{ color: "var(--accent-cyan)" }}>
                {SERVICE_STATUS_LABELS[s.status]}
              </span>
            </Link>
          ))}
        </div>
      )}

      {tab === "quotes" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h2 className="font-heading font-bold text-base">Cotizaciones</h2>
            {data.quotes.map((q) => (
              <div
                key={q.id}
                className="rounded-xl border p-4 space-y-2 text-xs"
                style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
              >
                <div className="flex justify-between font-bold text-sm">
                  <span>{q.quoteNumber} (v{q.currentVersion})</span>
                  <span style={{ color: "var(--accent-cyan)" }}>{formatBs(q.totalCents)}</span>
                </div>
                <p style={{ color: "var(--text-muted)" }}>
                  Tipo: {q.type} · Estado: <strong>{q.status}</strong> · Vigente hasta {formatDateLaPaz(q.validUntil, false)}
                </p>
                {q.status === "SENT_PENDING_APPROVAL" && (
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => decideQuote(q.id, "ACCEPTED")}
                      className="ct-btn h-8 px-3 rounded text-xs font-semibold"
                      style={{ backgroundColor: "var(--status-ok)", color: "#ffffff" }}
                    >
                      Aceptar
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => decideQuote(q.id, "REJECTED")}
                      className="ct-btn h-8 px-3 rounded border text-xs font-semibold"
                      style={{ borderColor: "var(--status-danger)", color: "var(--status-danger)" }}
                    >
                      Rechazar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <h2 className="font-heading font-bold text-base flex items-center gap-1.5">
              <Cpu className="w-4 h-4" style={{ color: "var(--accent-purple)" }} />
              PCs guardadas en Arma tu PC
            </h2>
            {data.pcConfigs.map((pc) => (
              <Link
                key={pc.id}
                href={`/arma-tu-pc?share=${pc.shareToken}`}
                className="ct-card block rounded-xl border p-4 text-xs space-y-1"
                style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
              >
                <div className="flex justify-between font-bold text-sm">
                  <span>{pc.name}</span>
                  <span style={{ color: "var(--accent-cyan)" }}>{formatBs(pc.totalCents)}</span>
                </div>
                <p style={{ color: "var(--text-muted)" }}>
                  Compatibilidad: {pc.compatibilityStatus} · {formatDateLaPaz(pc.createdAt, false)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {tab === "warranties" && (
        <div className="space-y-4">
          {data.warranties.map((w) => (
            <div
              key={w.id}
              className="rounded-xl border p-4 space-y-2 text-xs"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
            >
              <div className="flex flex-wrap justify-between gap-2 font-bold text-sm">
                <span>{w.code} — {w.itemLabel}</span>
                <span style={{ color: w.status === "ACTIVE" ? "var(--status-ok)" : "var(--status-warn)" }}>
                  {w.status} ({w.durationMonths} meses)
                </span>
              </div>
              <p style={{ color: "var(--text-secondary)" }}>{w.terms}</p>
              <p style={{ color: "var(--text-muted)" }}>Vence: {formatDateLaPaz(w.expiresAt, false)}</p>
              {w.status === "ACTIVE" && (
                <button
                  type="button"
                  onClick={() => setClaimWarrantyId(w.id)}
                  className="ct-btn h-8 px-3 rounded border text-xs font-semibold"
                  style={{ borderColor: "var(--border-strong)", color: "var(--accent-cyan)" }}
                >
                  Solicitar atención por garantía
                </button>
              )}
              {claimWarrantyId === w.id && (
                <form onSubmit={submitWarrantyClaim} className="pt-2 space-y-2">
                  <textarea
                    required
                    rows={2}
                    placeholder="Describe el fallo observado..."
                    value={claimDesc}
                    onChange={(e) => setClaimDesc(e.target.value)}
                    className="w-full p-2.5 rounded border text-xs"
                    style={{
                      backgroundColor: "var(--bg-chassis)",
                      borderColor: "var(--border-subtle)",
                      color: "var(--text-primary)",
                    }}
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="ct-btn h-9 px-4 rounded text-xs font-semibold"
                    style={{ backgroundColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }}
                  >
                    Enviar solicitud de garantía
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "consultations" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-7 space-y-3">
            {data.consultations.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border p-4 space-y-2 text-xs"
                style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
              >
                <div className="flex justify-between font-bold text-sm">
                  <span>{c.subject}</span>
                  <span style={{ color: "var(--accent-cyan)" }}>{c.status}</span>
                </div>
                <div className="space-y-1.5 pt-2 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                  {c.messages.map((m, idx) => (
                    <div key={idx} className="p-2 rounded" style={{ backgroundColor: "var(--bg-chassis)" }}>
                      <p className="font-semibold">
                        {m.senderName} ({m.senderRole}) · {formatDateLaPaz(m.createdAt)}
                      </p>
                      <p style={{ color: "var(--text-secondary)" }}>{m.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <form
            onSubmit={createConsultation}
            className="md:col-span-5 rounded-xl border p-4 space-y-3 h-fit"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
          >
            <h2 className="font-heading font-bold text-sm">Nueva consulta postventa o asesoría</h2>
            <input
              type="text"
              required
              placeholder="Asunto"
              value={consultSubj}
              onChange={(e) => setConsultSubj(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border text-xs"
              style={{
                backgroundColor: "var(--bg-chassis)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            />
            <textarea
              required
              rows={3}
              placeholder="Tu consulta..."
              value={consultBody}
              onChange={(e) => setConsultBody(e.target.value)}
              className="w-full p-3 rounded-lg border text-xs"
              style={{
                backgroundColor: "var(--bg-chassis)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            />
            <button
              type="submit"
              disabled={busy}
              className="ct-btn h-10 px-4 rounded-lg text-xs font-semibold"
              style={{ backgroundColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }}
            >
              Enviar consulta
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
