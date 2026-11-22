"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Lock, MapPin, ShieldCheck, Truck } from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";
import { formatBs } from "@/lib/domain/money";
import type { PublicBusinessSettings } from "@/lib/domain/business-config";

export interface DeliveryZoneOption {
  id: string;
  slug: string;
  name: string;
  feeCents: number | null;
  estimatedSchedule: string | null;
}

export function CheckoutClient({
  zones,
  settings,
  assemblyFeeCents,
  currentUser,
}: {
  zones: DeliveryZoneOption[];
  settings: PublicBusinessSettings;
  assemblyFeeCents: number;
  currentUser: { id: string; name: string; email: string; phone: string | null } | null;
}) {
  const router = useRouter();
  const { items, subtotalCents, refreshCart, notify } = useStore();

  const [guestName, setGuestName] = useState(currentUser?.name ?? "");
  const [guestEmail, setGuestEmail] = useState(currentUser?.email ?? "");
  const [guestPhone, setGuestPhone] = useState(currentUser?.phone ?? "");
  const [guestCi, setGuestCi] = useState("");
  const [nationalDept, setNationalDept] = useState("La Paz");
  const [nationalTerminal, setNationalTerminal] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<
    "PICKUP_POTOSI" | "LOCAL_DELIVERY" | "DELIVERY_QUOTE_REQUESTED"
  >("PICKUP_POTOSI");
  const [deliveryZoneId, setDeliveryZoneId] = useState(
    zones.find((z) => z.feeCents !== null)?.id ?? ""
  );
  const [street, setStreet] = useState("");
  const [reference, setReference] = useState("");
  const [includeAssembly, setIncludeAssembly] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"TRANSFER_QR_MANUAL" | "PAY_ON_PICKUP">(
    settings.transferQrEnabled ? "TRANSFER_QR_MANUAL" : "PAY_ON_PICKUP"
  );
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [idempotencyKey] = useState(() =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? `ord-${crypto.randomUUID()}`
      : `ord-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  );

  const selectedZone = zones.find((z) => z.id === deliveryZoneId) ?? null;

  const deliveryFeeCents = useMemo(() => {
    if (deliveryMethod !== "LOCAL_DELIVERY") return 0;
    return selectedZone?.feeCents ?? 0;
  }, [deliveryMethod, selectedZone]);

  const activeAssemblyCents = includeAssembly ? assemblyFeeCents : 0;
  const totalEstimatedCents = subtotalCents + activeAssemblyCents + deliveryFeeCents;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) {
      notify("Tu carrito está vacío.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey,
          guestName: guestName || undefined,
          guestEmail: guestEmail || undefined,
          guestPhone: guestPhone || undefined,
          deliveryMethod,
          deliveryZoneId: deliveryMethod === "LOCAL_DELIVERY" ? deliveryZoneId : null,
          deliveryAddress:
            deliveryMethod === "PICKUP_POTOSI"
              ? null
              : {
                  street:
                    street ||
                    (deliveryMethod === "DELIVERY_QUOTE_REQUESTED"
                      ? `Destino Nacional: ${nationalDept}`
                      : "Dirección en Potosí"),
                  reference: reference || nationalTerminal,
                  city: deliveryMethod === "DELIVERY_QUOTE_REQUESTED" ? nationalDept : "Potosí",
                },
          paymentMethod,
          includeAssembly,
          notes: [
            guestCi ? `CI Receptor: ${guestCi}` : null,
            deliveryMethod === "DELIVERY_QUOTE_REQUESTED"
              ? `Envío Nacional a ${nationalDept} (Terminal/Agencia: ${nationalTerminal || "Central"})`
              : null,
            notes,
          ]
            .filter(Boolean)
            .join(" | "),
          clearCart: true,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error ?? "No se pudo confirmar el pedido.", "error");
        return;
      }
      await refreshCart();
      notify(`Pedido ${data.order.orderNumber} creado con reserva temporal.`, "success");
      const codeParam = data.guestAccessCode
        ? `?code=${encodeURIComponent(data.guestAccessCode)}`
        : "";
      router.push(`/pedido/${encodeURIComponent(data.order.id)}${codeParam}`);
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="font-display text-2xl font-bold">Checkout</h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          No tienes productos en tu carrito para confirmar un pedido.
        </p>
        <Link
          href="/catalogo"
          className="ct-btn h-11 px-6 rounded-lg text-sm font-semibold inline-flex items-center"
          style={{ backgroundColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }}
        >
          Explorar productos
        </Link>
      </div>
    );
  }

  return (
    <div className="ct-container py-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold">Finalizar Pedido</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Los precios y disponibilidad se revalidan en el servidor al crear el pedido. No solicitamos datos de tarjetas.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-5">
          {/* Contact info & anti-fraud security */}
          <section
            className="rounded-2xl border p-5 space-y-4"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border-subtle)" }}>
              <h2 className="font-heading text-lg font-bold">1. Datos de contacto y verificación</h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded border flex items-center gap-1" style={{ borderColor: "rgba(16, 185, 129, 0.4)", color: "var(--status-ok)" }}>
                <ShieldCheck className="w-3.5 h-3.5" /> Compra protegida
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label htmlFor="chk-name" className="block text-xs font-medium mb-1">
                  Nombre completo
                </label>
                <input
                  id="chk-name"
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border text-sm"
                  style={{
                    backgroundColor: "var(--bg-chassis)",
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div>
                <label htmlFor="chk-ci" className="block text-xs font-medium mb-1">
                  Cédula de Identidad (CI / NIT)
                </label>
                <input
                  id="chk-ci"
                  type="text"
                  placeholder="Ej. 6841295 PT / LP"
                  value={guestCi}
                  onChange={(e) => setGuestCi(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border text-sm"
                  style={{
                    backgroundColor: "var(--bg-chassis)",
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div>
                <label htmlFor="chk-phone" className="block text-xs font-medium mb-1">
                  Teléfono / WhatsApp
                </label>
                <input
                  id="chk-phone"
                  type="text"
                  required
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border text-sm"
                  style={{
                    backgroundColor: "var(--bg-chassis)",
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div>
                <label htmlFor="chk-email" className="block text-xs font-medium mb-1">
                  Correo electrónico
                </label>
                <input
                  id="chk-email"
                  type="email"
                  required
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border text-sm"
                  style={{
                    backgroundColor: "var(--bg-chassis)",
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
            </div>

            {/* Anti-fraud security guarantee */}
            <div
              className="p-3 rounded-xl border text-xs flex items-start gap-2.5"
              style={{
                backgroundColor: "rgba(0, 229, 255, 0.05)",
                borderColor: "rgba(0, 229, 255, 0.25)",
              }}
            >
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--accent-cyan)" }} />
              <div className="space-y-0.5">
                <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  Protocolo de Seguridad y Despacho Antifraude
                </p>
                <p style={{ color: "var(--text-secondary)" }}>
                  Para evitar estafas y suplantación de identidad, cada despacho se verifica telefónicamente antes del envío. El paquete se entrega precintado con número de guía oficial verificable.
                </p>
              </div>
            </div>
          </section>

          {/* Delivery method */}
          <section
            className="rounded-2xl border p-5 space-y-4"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
          >
            <h2 className="font-heading text-lg font-bold flex items-center gap-2">
              <Truck className="w-5 h-5" style={{ color: "var(--accent-cyan)" }} />
              2. Entrega o recojo en Potosí
            </h2>

            <div className="space-y-2.5 text-sm">
              <label className="flex items-start gap-3 p-3 rounded-xl border cursor-pointer" style={{ borderColor: deliveryMethod === "PICKUP_POTOSI" ? "var(--accent-cyan)" : "var(--border-subtle)" }}>
                <input
                  type="radio"
                  name="deliveryMethod"
                  checked={deliveryMethod === "PICKUP_POTOSI"}
                  onChange={() => setDeliveryMethod("PICKUP_POTOSI")}
                  className="mt-1 accent-[#00E5FF]"
                />
                <div>
                  <span className="font-semibold block">Recojo coordinado en Potosí (Bs 0)</span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Coordinación de horario tras validación de pedido.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border cursor-pointer" style={{ borderColor: deliveryMethod === "LOCAL_DELIVERY" ? "var(--accent-cyan)" : "var(--border-subtle)" }}>
                <input
                  type="radio"
                  name="deliveryMethod"
                  checked={deliveryMethod === "LOCAL_DELIVERY"}
                  onChange={() => setDeliveryMethod("LOCAL_DELIVERY")}
                  className="mt-1 accent-[#00E5FF]"
                />
                <div className="flex-1">
                  <span className="font-semibold block">Entrega en zona configurada de Potosí</span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Solo zonas con tarifa configurada en administración.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border cursor-pointer" style={{ borderColor: deliveryMethod === "DELIVERY_QUOTE_REQUESTED" ? "var(--accent-cyan)" : "var(--border-subtle)" }}>
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="DELIVERY_QUOTE_REQUESTED"
                  checked={deliveryMethod === "DELIVERY_QUOTE_REQUESTED"}
                  onChange={() => {
                    setDeliveryMethod("DELIVERY_QUOTE_REQUESTED");
                    if (paymentMethod === "PAY_ON_PICKUP") {
                      setPaymentMethod("TRANSFER_QR_MANUAL");
                    }
                  }}
                  className="mt-1 accent-[#00E5FF]"
                />
                <div>
                  <span className="font-semibold block">Envío Nacional a todo Bolivia (Otros departamentos / provincias)</span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    La Paz, Cochabamba, Santa Cruz, Sucre, Oruro, Tarija, Beni, Pando (vía encomienda terrestre segura con precinto).
                  </span>
                </div>
              </label>
            </div>

            {deliveryMethod === "DELIVERY_QUOTE_REQUESTED" && (
              <div
                className="space-y-3 pt-3 p-4 rounded-xl border"
                style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--accent-purple)" }}
              >
                <div className="flex items-center gap-2 text-xs font-bold" style={{ color: "var(--accent-purple)" }}>
                  <MapPin className="w-4 h-4" />
                  <span>Configurar Destino Nacional en Bolivia</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="chk-national-dept" className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
                      Departamento de destino
                    </label>
                    <select
                      id="chk-national-dept"
                      value={nationalDept}
                      onChange={(e) => setNationalDept(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border text-xs"
                      style={{
                        backgroundColor: "var(--bg-surface)",
                        borderColor: "var(--border-subtle)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <option value="La Paz">La Paz (Terminal Central / El Alto)</option>
                      <option value="Cochabamba">Cochabamba (Terminal de Buses)</option>
                      <option value="Santa Cruz">Santa Cruz (Terminal Bimodal / Courier)</option>
                      <option value="Sucre">Sucre / Chuquisaca (Terminal)</option>
                      <option value="Oruro">Oruro (Terminal de Buses)</option>
                      <option value="Tarija">Tarija (Terminal de Buses)</option>
                      <option value="Potosí Provincias">Potosí Provincias (Tupiza / Villazón / Uyuni / Llallagua)</option>
                      <option value="Beni">Beni (Trinidad)</option>
                      <option value="Pando">Pando (Cobija)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
                      Agencia de flota o dirección terminal
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Flota Cosmos / Copacabana / Courier a domicilio"
                      value={nationalTerminal}
                      onChange={(e) => setNationalTerminal(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border text-xs"
                      style={{
                        backgroundColor: "var(--bg-surface)",
                        borderColor: "var(--border-subtle)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>
                </div>
                <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                  Tarifa estimada de encomienda: Bs 35 a Bs 55 según peso y bulto. El operador de ClickTech te contactará por WhatsApp (+591 67605477) con la foto del paquete sellado y la guía oficial.
                </p>
              </div>
            )}

            {deliveryMethod === "LOCAL_DELIVERY" && (
              <div className="space-y-3 pt-2">
                <select
                  aria-label="Zona de entrega en Potosí"
                  value={deliveryZoneId}
                  onChange={(e) => setDeliveryZoneId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border text-sm"
                  style={{
                    backgroundColor: "var(--bg-chassis)",
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-primary)",
                  }}
                >
                  {zones
                    .filter((z) => z.feeCents !== null)
                    .map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name} — {formatBs(z.feeCents)}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {deliveryMethod !== "PICKUP_POTOSI" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Calle y zona (ej. Av. Universitaria / Zona Central)"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="h-10 px-3 rounded-lg border text-sm"
                  style={{
                    backgroundColor: "var(--bg-chassis)",
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-primary)",
                  }}
                />
                <input
                  type="text"
                  placeholder="Referencia visible"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="h-10 px-3 rounded-lg border text-sm"
                  style={{
                    backgroundColor: "var(--bg-chassis)",
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
            )}
          </section>

          {/* Payment method */}
          <section
            className="rounded-2xl border p-5 space-y-4"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
          >
            <h2 className="font-heading text-lg font-bold">3. Forma de pago</h2>
            {!settings.qrConfigured && (
              <div
                className="rounded-lg border p-3 text-xs flex items-start gap-2"
                style={{
                  backgroundColor: "var(--bg-chassis)",
                  borderColor: "var(--status-warn)",
                  color: "var(--text-secondary)",
                }}
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--status-warn)" }} />
                <span>
                  {settings.demoPaymentSandboxEnabled
                    ? "Modo demostración activo: los datos bancarios y QR reales aún no están configurados. Puedes subir un comprobante de prueba y pasará a revisión manual."
                    : "Transferencia/QR deshabilitado por administración hasta registrar cuenta bancaria real."}
                </span>
              </div>
            )}

            <div className="space-y-2.5 text-sm">
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border ${
                  settings.transferQrEnabled ? "cursor-pointer" : "opacity-50 cursor-not-allowed"
                }`}
                style={{
                  borderColor:
                    paymentMethod === "TRANSFER_QR_MANUAL"
                      ? "var(--accent-cyan)"
                      : "var(--border-subtle)",
                }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  disabled={!settings.transferQrEnabled}
                  checked={paymentMethod === "TRANSFER_QR_MANUAL"}
                  onChange={() => setPaymentMethod("TRANSFER_QR_MANUAL")}
                  className="mt-1 accent-[#00E5FF]"
                />
                <div>
                  <span className="font-semibold block">
                    Transferencia bancaria o QR (con revisión manual)
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {settings.transferQrEnabled
                      ? "Subir el comprobante no confirma automáticamente el pago: un operador autorizado lo revisará."
                      : "Deshabilitado: faltan datos bancarios reales en configuración."}
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-xl border ${
                  settings.payOnPickupEnabled && deliveryMethod === "PICKUP_POTOSI"
                    ? "cursor-pointer"
                    : "opacity-50 cursor-not-allowed"
                }`}
                style={{
                  borderColor:
                    paymentMethod === "PAY_ON_PICKUP"
                      ? "var(--accent-cyan)"
                      : "var(--border-subtle)",
                }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  disabled={!settings.payOnPickupEnabled || deliveryMethod !== "PICKUP_POTOSI"}
                  checked={paymentMethod === "PAY_ON_PICKUP"}
                  onChange={() => setPaymentMethod("PAY_ON_PICKUP")}
                  className="mt-1 accent-[#00E5FF]"
                />
                <div>
                  <span className="font-semibold block">Pago al recoger en Potosí</span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Disponible únicamente para recojo coordinado en Potosí.
                  </span>
                </div>
              </label>
            </div>

            <label className="flex items-center gap-3 pt-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={includeAssembly}
                onChange={(e) => setIncludeAssembly(e.target.checked)}
                className="w-4 h-4 accent-[#00E5FF]"
              />
              <span>
                Incluir ensamblaje / instalación de piezas ({formatBs(assemblyFeeCents)})
              </span>
            </label>

            <textarea
              rows={2}
              placeholder="Notas adicionales para entrega o coordinación..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 rounded-lg border text-xs"
              style={{
                backgroundColor: "var(--bg-chassis)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            />
          </section>
        </div>

        {/* Summary */}
        <aside
          className="lg:col-span-5 rounded-2xl border p-5 space-y-4"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-strong)" }}
        >
          <h2 className="font-heading text-lg font-bold">Resumen del pedido</h2>
          <div className="space-y-2.5 max-h-72 overflow-y-auto divide-y text-xs" style={{ borderColor: "var(--border-subtle)" }}>
            {items.map((it) => (
              <div key={it.id} className="pt-2.5 flex justify-between gap-2">
                <div>
                  <p className="font-semibold">{it.name}</p>
                  <p style={{ color: "var(--text-muted)" }}>
                    {it.quantity} x {formatBs(it.unitPriceCents)}
                  </p>
                </div>
                <span className="font-bold tabular-nums">{formatBs(it.lineTotalCents)}</span>
              </div>
            ))}
          </div>

          <div className="border-t pt-3 space-y-1.5 text-sm" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="flex justify-between">
              <span style={{ color: "var(--text-secondary)" }}>Subtotal productos</span>
              <span className="tabular-nums font-semibold">{formatBs(subtotalCents)}</span>
            </div>
            {includeAssembly && (
              <div className="flex justify-between">
                <span style={{ color: "var(--text-secondary)" }}>Ensamblaje / Instalación</span>
                <span className="tabular-nums font-semibold">{formatBs(activeAssemblyCents)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span style={{ color: "var(--text-secondary)" }}>Envío</span>
              <span className="tabular-nums font-semibold">
                {deliveryMethod === "DELIVERY_QUOTE_REQUESTED"
                  ? "Por cotizar"
                  : formatBs(deliveryFeeCents)}
              </span>
            </div>
            <div className="flex justify-between text-base pt-2 border-t" style={{ borderColor: "var(--border-subtle)" }}>
              <span className="font-bold">Total calculado (Bs)</span>
              <span className="font-heading text-xl font-extrabold tabular-nums" style={{ color: "var(--accent-cyan)" }}>
                {formatBs(totalEstimatedCents)}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="ct-btn w-full h-12 rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
            style={{ backgroundColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }}
          >
            <CheckCircle2 className="w-4 h-4" />
            {submitting ? "Reservando stock y creando pedido..." : "Confirmar pedido y reservar stock"}
          </button>

          <p className="text-[11px] flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
            <Lock className="w-3.5 h-3.5 shrink-0" />
            La reserva temporal protege tu stock por 30 minutos mientras envías tu comprobante.
          </p>
        </aside>
      </form>
    </div>
  );
}
