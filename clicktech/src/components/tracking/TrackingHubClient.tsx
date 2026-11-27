"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bike,
  CheckCircle2,
  ExternalLink,
  MapPin,
  MessageCircle,
  Package,
  Search,
  ShieldCheck,
  Store,
  Wrench,
} from "lucide-react";
import { SERVICE_STATUS_LABELS } from "@/lib/domain/service-rules";
import { ORDER_STATUS_META, STORE_LOCATION } from "@/lib/domain/status-labels";
import type { ServiceOrderStatus } from "@prisma/client";

export function TrackingHubClient({
  userServices,
  userOrders,
  isLoggedIn,
}: {
  isLoggedIn: boolean;
  userServices: Array<{
    id: string;
    ticketNumber: string;
    serviceName: string;
    deviceBrandModel: string;
    status: ServiceOrderStatus;
  }>;
  userOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalBs: string;
    createdAtLabel: string;
  }>;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"order" | "service">("order");
  const [orderQuery, setOrderQuery] = useState("");
  const [orderCode, setOrderCode] = useState("");

  function handleOrderSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = orderQuery.trim();
    if (!q) return;
    const c = orderCode.trim();
    router.push(`/pedido/${encodeURIComponent(q)}${c ? `?code=${encodeURIComponent(c)}` : ""}`);
  }

  return (
    <div className="ct-container py-8 sm:py-10 space-y-8">
      {/* Full-Width Hero Header */}
      <section
        className="rounded-2xl border p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="space-y-2 max-w-2xl">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold"
            style={{
              backgroundColor: "var(--accent-cyan-soft)",
              borderColor: "var(--border-strong)",
              color: "var(--accent-cyan)",
            }}
          >
            <Bike className="w-3.5 h-3.5" />
            Centro de Seguimiento en Vivo · ClickTech Calle Oruro
          </div>
          <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Seguimiento de Pedidos y Servicio Técnico
          </h1>
          <p className="text-sm sm:text-base" style={{ color: "var(--text-secondary)" }}>
            Rastrea en tiempo real dónde está tu envío con mapa desde <strong>Calle Oruro, Potosí</strong> o consulta avances, diagnóstico y pruebas de tu equipo en taller.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setMode("order")}
            className="ct-btn h-11 px-5 rounded-xl border text-xs sm:text-sm font-bold flex items-center gap-2"
            style={
              mode === "order"
                ? { backgroundColor: "var(--accent-cyan)", borderColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }
                : { backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }
            }
          >
            <Package className="w-4 h-4" />
            Seguir Pedido Web (CT-...)
          </button>
          <button
            type="button"
            onClick={() => setMode("service")}
            className="ct-btn h-11 px-5 rounded-xl border text-xs sm:text-sm font-bold flex items-center gap-2"
            style={
              mode === "service"
                ? { backgroundColor: "var(--accent-cyan)", borderColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }
                : { backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }
            }
          >
            <Wrench className="w-4 h-4" />
            Servicio Técnico (ST-...)
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Large Interactive Search + Lists */}
        <div className="lg:col-span-7 space-y-6">
          {mode === "order" ? (
            <form
              onSubmit={handleOrderSubmit}
              className="rounded-2xl border p-6 sm:p-7 space-y-5"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-strong)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div className="space-y-1">
                <h2 className="font-heading text-xl font-bold flex items-center gap-2">
                  <Package className="w-5 h-5" style={{ color: "var(--accent-cyan)" }} />
                  Rastrear Pedido en Mapa y Estados
                </h2>
                <p className="text-xs sm:text-sm" style={{ color: "var(--text-muted)" }}>
                  Ingresa tu código de pedido (ej. <span className="font-mono">CT-2026-...</span>) y, si compraste como invitado, el código de verificación.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="trk-order-id" className="block text-xs font-semibold mb-1.5">
                    Código de Pedido
                  </label>
                  <input
                    id="trk-order-id"
                    type="text"
                    required
                    value={orderQuery}
                    onChange={(e) => setOrderQuery(e.target.value)}
                    placeholder="Ej. CT-2026-35E39F"
                    className="w-full h-12 px-4 rounded-xl border text-sm font-mono"
                    style={{
                      backgroundColor: "var(--bg-chassis)",
                      borderColor: "var(--border-subtle)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="trk-order-code" className="block text-xs font-semibold mb-1.5">
                    Código de invitado (opcional si iniciaste sesión)
                  </label>
                  <input
                    id="trk-order-code"
                    type="text"
                    value={orderCode}
                    onChange={(e) => setOrderCode(e.target.value)}
                    placeholder="Ej. A7F2-901C"
                    className="w-full h-12 px-4 rounded-xl border text-sm font-mono"
                    style={{
                      backgroundColor: "var(--bg-chassis)",
                      borderColor: "var(--border-subtle)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  className="ct-btn h-12 px-6 rounded-xl text-sm font-bold inline-flex items-center gap-2"
                  style={{ backgroundColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }}
                >
                  <Search className="w-4 h-4" />
                  Ver seguimiento y mapa del pedido
                </button>
                <Link
                  href={isLoggedIn ? "/cuenta" : "/login"}
                  className="ct-btn h-12 px-5 rounded-xl border text-sm font-semibold inline-flex items-center"
                  style={{
                    borderColor: "var(--border-subtle)",
                    backgroundColor: "var(--bg-chassis)",
                    color: "var(--text-primary)",
                  }}
                >
                  {isLoggedIn ? "Ir a mis pedidos" : "Iniciar sesión"}
                </Link>
              </div>
            </form>
          ) : (
            <form
              method="GET"
              action="/seguimiento"
              className="rounded-2xl border p-6 sm:p-7 space-y-5"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-strong)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div className="space-y-1">
                <h2 className="font-heading text-xl font-bold flex items-center gap-2">
                  <Wrench className="w-5 h-5" style={{ color: "var(--accent-cyan)" }} />
                  Consultar Orden de Servicio Técnico
                </h2>
                <p className="text-xs sm:text-sm" style={{ color: "var(--text-muted)" }}>
                  Ingresa el número de orden técnica y el correo registrado para revisar diagnóstico, aprobar cotizaciones y ver pruebas realizadas.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="trk-ticket" className="block text-xs font-semibold mb-1.5">
                    Número de orden técnica
                  </label>
                  <input
                    id="trk-ticket"
                    name="ticket"
                    type="text"
                    required
                    placeholder="Ej. ST-2026-DEMO-01"
                    className="w-full h-12 px-4 rounded-xl border text-sm font-mono"
                    style={{
                      backgroundColor: "var(--bg-chassis)",
                      borderColor: "var(--border-subtle)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="trk-email" className="block text-xs font-semibold mb-1.5">
                    Correo de contacto (si eres invitado)
                  </label>
                  <input
                    id="trk-email"
                    name="email"
                    type="email"
                    placeholder="tu@correo.example"
                    className="w-full h-12 px-4 rounded-xl border text-sm"
                    style={{
                      backgroundColor: "var(--bg-chassis)",
                      borderColor: "var(--border-subtle)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="ct-btn h-12 px-6 rounded-xl text-sm font-bold inline-flex items-center gap-2"
                style={{ backgroundColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }}
              >
                <Search className="w-4 h-4" />
                Consultar orden técnica
              </button>
            </form>
          )}

          {/* Visual 5-Stage Process Guide */}
          <div
            className="rounded-2xl border p-5 sm:p-6 space-y-4"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)", boxShadow: "var(--shadow-card)" }}
          >
            <h3 className="font-heading font-bold text-sm uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              ¿Cómo funciona nuestro rastreo paso a paso?
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {[
                { n: "1", t: "Recepción", d: "Reserva de stock o ingreso a taller" },
                { n: "2", t: "Validación", d: "Pago / diagnóstico técnico" },
                { n: "3", t: "Despacho", d: "Salida desde Calle Oruro" },
                { n: "4", t: "Entrega", d: "Con garantía y precinto" },
              ].map((s) => (
                <div key={s.n} className="rounded-xl border p-3 space-y-1" style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)" }}>
                  <span
                    className="inline-flex w-6 h-6 rounded-full items-center justify-center text-[11px] font-bold"
                    style={{ backgroundColor: "var(--accent-cyan-soft)", color: "var(--accent-cyan)" }}
                  >
                    {s.n}
                  </span>
                  <p className="font-bold">{s.t}</p>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{s.d}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Authenticated User Quick History */}
          {userOrders.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-heading text-lg font-bold">Tus pedidos recientes</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {userOrders.map((ord) => (
                  <Link
                    key={ord.id}
                    href={`/pedido/${ord.id}`}
                    className="ct-card rounded-xl border p-4 flex items-center justify-between gap-3"
                    style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
                  >
                    <div className="min-w-0">
                      <p className="font-heading font-bold text-sm truncate">{ord.orderNumber}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {ord.createdAtLabel} · {ord.totalBs}
                      </p>
                    </div>
                    <span className="text-xs font-bold shrink-0" style={{ color: "var(--accent-cyan)" }}>
                      {ORDER_STATUS_META[ord.status]?.label ?? ord.status}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {userServices.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-heading text-lg font-bold">Tus órdenes técnicas registradas</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {userServices.map((so) => (
                  <Link
                    key={so.id}
                    href={`/seguimiento/${so.ticketNumber}`}
                    className="ct-card rounded-xl border p-4 flex items-center justify-between gap-3"
                    style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
                  >
                    <div className="min-w-0">
                      <p className="font-heading font-bold text-sm truncate">{so.ticketNumber}</p>
                      <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                        {so.serviceName} · {so.deviceBrandModel}
                      </p>
                    </div>
                    <span className="text-xs font-bold shrink-0" style={{ color: "var(--accent-cyan)" }}>
                      {SERVICE_STATUS_LABELS[so.status]}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Store Location Google Map + Direct Help */}
        <aside className="lg:col-span-5 space-y-4">
          <div
            className="rounded-2xl border p-5 space-y-4"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-subtle)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-heading text-base font-bold flex items-center gap-2">
                  <Store className="w-4 h-4" style={{ color: "var(--accent-cyan)" }} />
                  Tienda Central ClickTech
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  {STORE_LOCATION.address} · {STORE_LOCATION.schedule}
                </p>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${STORE_LOCATION.lat},${STORE_LOCATION.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold inline-flex items-center gap-1 underline shrink-0"
                style={{ color: "var(--accent-cyan)" }}
              >
                Abrir Mapa <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="rounded-xl border overflow-hidden h-64" style={{ borderColor: "var(--border-subtle)" }}>
              <iframe
                title="Ubicación ClickTech Calle Oruro Potosí"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://maps.google.com/maps?q=${STORE_LOCATION.lat},${STORE_LOCATION.lng}&hl=es&z=16&output=embed`}
              />
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                <MapPin className="w-4 h-4 shrink-0" style={{ color: "var(--accent-cyan)" }} />
                <span>Punto de recojo sin costo (Bs 0) y centro de diagnóstico</span>
              </div>
              <div className="flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "var(--status-ok)" }} />
                <span>Mantenimiento gratis (Bs 0) si compraste tu PC en ClickTech</span>
              </div>
              <div className="flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: "var(--accent-purple)" }} />
                <span>Garantía verificable y precinto de seguridad en cada envío</span>
              </div>
            </div>

            <a
              href={`https://wa.me/${STORE_LOCATION.whatsapp}?text=${encodeURIComponent(
                "Hola ClickTech (+591 67605477), necesito ayuda para rastrear mi pedido o servicio técnico."
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ct-btn w-full h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
              style={{ backgroundColor: "#25D366", color: "#FFFFFF" }}
            >
              <MessageCircle className="w-4 h-4" />
              Consultar estado por WhatsApp ({STORE_LOCATION.whatsappDisplay})
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
