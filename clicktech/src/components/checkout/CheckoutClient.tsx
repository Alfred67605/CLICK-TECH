"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  CreditCard,
  Download,
  Lock,
  MapPin,
  QrCode,
  ShieldCheck,
  Store,
  Truck,
  UserCheck,
} from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";
import { formatBs } from "@/lib/domain/money";
import { STORE_LOCATION } from "@/lib/domain/status-labels";
import { buildClickTechQrPayload, generateQrDataUrl } from "@/lib/ui/qr-generator";
import { PotosiPinMap } from "@/components/checkout/PotosiPinMap";
import type { PublicBusinessSettings } from "@/lib/domain/business-config";

export interface DeliveryZoneOption {
  id: string;
  slug: string;
  name: string;
  feeCents: number | null;
  estimatedSchedule: string | null;
}

type PaymentUiChoice = "QR_SIMPLE" | "CARD" | "CASH";

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
  const [pinCoords, setPinCoords] = useState<{ lat: number; lng: number } | null>({
    lat: STORE_LOCATION.lat,
    lng: STORE_LOCATION.lng,
  });

  const [includeAssembly, setIncludeAssembly] = useState(false);
  const [paymentChoice, setPaymentChoice] = useState<PaymentUiChoice>(
    settings.transferQrEnabled ? "QR_SIMPLE" : "CASH"
  );
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  // Interactive visual card fields (sandbox demonstration UI — mapped to manual review order)
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  // Cash change calculator
  const [cashTenderBs, setCashTenderBs] = useState("");

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

  // Map UI choice into strict backend paymentMethod enum
  const backendPaymentMethod: "TRANSFER_QR_MANUAL" | "PAY_ON_PICKUP" = useMemo(() => {
    if (paymentChoice === "CASH" && deliveryMethod === "PICKUP_POTOSI" && settings.payOnPickupEnabled) {
      return "PAY_ON_PICKUP";
    }
    return "TRANSFER_QR_MANUAL";
  }, [paymentChoice, deliveryMethod, settings.payOnPickupEnabled]);

  // Generate dynamic real scannable QR whenever total or idempotency reference changes
  useEffect(() => {
    let active = true;
    const refShort = idempotencyKey.slice(0, 12).toUpperCase();
    const payload = buildClickTechQrPayload({
      reference: refShort,
      totalCents: totalEstimatedCents,
      detail: deliveryMethod,
    });
    generateQrDataUrl(payload)
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {
        if (active) setQrDataUrl("");
      });
    return () => {
      active = false;
    };
  }, [totalEstimatedCents, idempotencyKey, deliveryMethod]);

  const step1Complete =
    deliveryMethod === "PICKUP_POTOSI" ||
    (deliveryMethod === "LOCAL_DELIVERY" && street.trim().length > 0) ||
    (deliveryMethod === "DELIVERY_QUOTE_REQUESTED" && nationalDept.trim().length > 0);
  const step2Complete = Boolean(paymentChoice);
  const step3Complete = Boolean(guestName.trim() && guestEmail.trim() && guestPhone.trim());

  const cashTenderNum = Number(cashTenderBs);
  const totalBsNumeric = totalEstimatedCents / 100;
  const cashChangeBs =
    Number.isFinite(cashTenderNum) && cashTenderNum >= totalBsNumeric
      ? cashTenderNum - totalBsNumeric
      : null;

  function scrollToSection(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) {
      notify("Tu carrito está vacío.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const paymentNote =
        paymentChoice === "QR_SIMPLE"
          ? "Método elegido: QR Simple ClickTech"
          : paymentChoice === "CARD"
          ? `Método elegido: Tarjeta (Titular: ${cardHolder || guestName}, Terminación: ${cardNumber.slice(-4) || "DEMO"})`
          : `Método elegido: Efectivo${cashTenderBs ? ` (Paga con Bs ${cashTenderBs})` : ""}`;

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
              ? {
                  street: STORE_LOCATION.address,
                  reference: "Recojo en tienda central Calle Oruro",
                  city: "Potosí",
                  lat: STORE_LOCATION.lat,
                  lng: STORE_LOCATION.lng,
                }
              : {
                  street:
                    street ||
                    (deliveryMethod === "DELIVERY_QUOTE_REQUESTED"
                      ? `Destino Nacional: ${nationalDept}`
                      : "Dirección en Potosí"),
                  reference: reference || nationalTerminal,
                  city: deliveryMethod === "DELIVERY_QUOTE_REQUESTED" ? nationalDept : "Potosí",
                  department: deliveryMethod === "DELIVERY_QUOTE_REQUESTED" ? nationalDept : "Potosí",
                  lat: pinCoords?.lat,
                  lng: pinCoords?.lng,
                },
          paymentMethod: backendPaymentMethod,
          includeAssembly,
          notes: [
            guestCi ? `CI Receptor: ${guestCi}` : null,
            paymentNote,
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
      {/* Header + 3-Step Visual Wizard Bar */}
      <div className="space-y-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
            Finalizar Pedido ClickTech
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Atención oficial desde <strong style={{ color: "var(--accent-cyan)" }}>{STORE_LOCATION.address}</strong> · Precios y stock verificados en Bolivianos (Bs).
          </p>
        </div>

        <nav
          aria-label="Pasos del proceso de compra"
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          {[
            {
              num: 1,
              target: "chk-step-1",
              title: "Paso 1 · Lugar y Mapa",
              sub: deliveryMethod === "PICKUP_POTOSI" ? "Recojo Calle Oruro" : deliveryMethod === "LOCAL_DELIVERY" ? "Delivery Potosí" : `Envío ${nationalDept}`,
              done: step1Complete,
              Icon: MapPin,
            },
            {
              num: 2,
              target: "chk-step-2",
              title: "Paso 2 · Método de Pago",
              sub: paymentChoice === "QR_SIMPLE" ? "QR Simple Generado" : paymentChoice === "CARD" ? "Tarjeta Débito/Crédito" : "Efectivo en mano",
              done: step2Complete,
              Icon: QrCode,
            },
            {
              num: 3,
              target: "chk-step-3",
              title: "Paso 3 · Datos y Observaciones",
              sub: step3Complete ? "Titular completo" : "Faltan datos de contacto",
              done: step3Complete,
              Icon: UserCheck,
            },
          ].map((step) => {
            const Icon = step.Icon;
            return (
              <button
                key={step.num}
                type="button"
                onClick={() => scrollToSection(step.target)}
                className="ct-btn rounded-2xl border p-3.5 flex items-center gap-3 text-left"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: step.done ? "var(--border-strong)" : "var(--border-subtle)",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs"
                  style={{
                    backgroundColor: step.done ? "var(--accent-cyan-soft)" : "var(--bg-chassis)",
                    color: step.done ? "var(--accent-cyan)" : "var(--text-muted)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate" style={{ color: "var(--text-primary)" }}>
                    {step.title}
                  </p>
                  <p className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>
                    {step.sub}
                  </p>
                </div>
                {step.done && <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "var(--status-ok)" }} />}
              </button>
            );
          })}
        </nav>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          {/* PASO 1: LUGAR, ENTREGA Y MAPA DE GOOGLE MAPS */}
          <section
            id="chk-step-1"
            className="rounded-2xl border p-5 sm:p-6 space-y-4"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-subtle)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="flex items-center gap-2.5">
                <span
                  className="w-7 h-7 rounded-lg text-xs font-extrabold flex items-center justify-center"
                  style={{ backgroundColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }}
                >
                  1
                </span>
                <div>
                  <h2 className="font-heading text-lg font-bold flex items-center gap-2">
                    Paso 1: Lugar de Entrega y Mapa Potosí
                  </h2>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Atendemos en {STORE_LOCATION.address}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: "var(--accent-cyan-soft)", color: "var(--accent-cyan)" }}>
                {deliveryMethod === "PICKUP_POTOSI" ? "Recojo Bs 0" : deliveryMethod === "LOCAL_DELIVERY" ? `Envío ${formatBs(deliveryFeeCents)}` : "Encomienda Nacional"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <label
                className="flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer"
                style={{
                  backgroundColor: deliveryMethod === "PICKUP_POTOSI" ? "var(--accent-cyan-soft)" : "var(--bg-chassis)",
                  borderColor: deliveryMethod === "PICKUP_POTOSI" ? "var(--accent-cyan)" : "var(--border-subtle)",
                }}
              >
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="PICKUP_POTOSI"
                  checked={deliveryMethod === "PICKUP_POTOSI"}
                  onChange={() => setDeliveryMethod("PICKUP_POTOSI")}
                  className="mt-0.5 accent-[#00E5FF]"
                />
                <div>
                  <span className="font-bold flex items-center gap-1">
                    <Store className="w-3.5 h-3.5" /> Recojo Calle Oruro
                  </span>
                  <span className="block text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                    Gratis (Bs 0) · Atención inmediata
                  </span>
                </div>
              </label>

              <label
                className="flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer"
                style={{
                  backgroundColor: deliveryMethod === "LOCAL_DELIVERY" ? "var(--accent-cyan-soft)" : "var(--bg-chassis)",
                  borderColor: deliveryMethod === "LOCAL_DELIVERY" ? "var(--accent-cyan)" : "var(--border-subtle)",
                }}
              >
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="LOCAL_DELIVERY"
                  checked={deliveryMethod === "LOCAL_DELIVERY"}
                  onChange={() => setDeliveryMethod("LOCAL_DELIVERY")}
                  className="mt-0.5 accent-[#00E5FF]"
                />
                <div>
                  <span className="font-bold flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" /> Delivery Potosí
                  </span>
                  <span className="block text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                    Marca tu punto en el mapa
                  </span>
                </div>
              </label>

              <label
                className="flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer"
                style={{
                  backgroundColor: deliveryMethod === "DELIVERY_QUOTE_REQUESTED" ? "var(--accent-purple-soft)" : "var(--bg-chassis)",
                  borderColor: deliveryMethod === "DELIVERY_QUOTE_REQUESTED" ? "var(--accent-purple)" : "var(--border-subtle)",
                }}
              >
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="DELIVERY_QUOTE_REQUESTED"
                  checked={deliveryMethod === "DELIVERY_QUOTE_REQUESTED"}
                  onChange={() => {
                    setDeliveryMethod("DELIVERY_QUOTE_REQUESTED");
                    if (paymentChoice === "CASH") {
                      setPaymentChoice("QR_SIMPLE");
                    }
                  }}
                  className="mt-0.5 accent-[#00E5FF]"
                />
                <div>
                  <span className="font-bold flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> Envío Nacional
                  </span>
                  <span className="block text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                    A los 9 departamentos de Bolivia
                  </span>
                </div>
              </label>
            </div>

            {deliveryMethod === "DELIVERY_QUOTE_REQUESTED" && (
              <div
                className="space-y-3 p-4 rounded-xl border"
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
                  Tarifa estimada de encomienda: Bs 35 a Bs 55 según bulto. Coordinación por WhatsApp (+591 67605477) con foto del precinto.
                </p>
              </div>
            )}

            {deliveryMethod === "LOCAL_DELIVERY" && (
              <div className="space-y-3">
                <label className="block text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                  Zona tarifaria en Potosí:
                </label>
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
                  placeholder="Calle y zona (ej. Calle Oruro / Av. Universitaria)"
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
                  placeholder="Referencia visible (color de puerta, esquina)"
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

            {/* Interactive Potosi Pin-Drop Map + Google Maps Embed */}
            {deliveryMethod !== "DELIVERY_QUOTE_REQUESTED" && (
              <PotosiPinMap
                mode={deliveryMethod}
                selectedCoords={pinCoords}
                onSelectLocation={(loc) => {
                  setPinCoords({ lat: loc.lat, lng: loc.lng });
                  if (loc.suggestedStreet) setStreet(loc.suggestedStreet);
                  if (loc.zoneHint) {
                    const matched = zones.find(
                      (z) =>
                        z.feeCents !== null &&
                        (z.slug.toLowerCase().includes(loc.zoneHint ?? "") ||
                          z.name.toLowerCase().includes((loc.zoneHint ?? "").replace("-", " ")))
                    );
                    if (matched) setDeliveryZoneId(matched.id);
                  }
                }}
              />
            )}
          </section>

          {/* PASO 2: MÉTODO DE PAGO INTUITIVO (QR GENERADO / TARJETA / EFECTIVO) */}
          <section
            id="chk-step-2"
            className="rounded-2xl border p-5 sm:p-6 space-y-4"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-subtle)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b pb-3" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="flex items-center gap-2.5">
                <span
                  className="w-7 h-7 rounded-lg text-xs font-extrabold flex items-center justify-center"
                  style={{ backgroundColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }}
                >
                  2
                </span>
                <div>
                  <h2 className="font-heading text-lg font-bold">Paso 2: Método de Pago</h2>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Elige QR Simple generado al instante, Tarjeta o Efectivo
                  </p>
                </div>
              </div>
            </div>

            {!settings.qrConfigured && (
              <div
                className="rounded-xl border p-3 text-xs flex items-start gap-2"
                style={{
                  backgroundColor: "var(--bg-chassis)",
                  borderColor: "var(--status-warn)",
                  color: "var(--text-secondary)",
                }}
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--status-warn)" }} />
                <span>
                  {settings.demoPaymentSandboxEnabled
                    ? "Modo demostración activo: generamos tu QR operativo en Bs para prueba. Al enviar tu referencia el pedido pasa a revisión manual."
                    : "Transferencia/QR deshabilitado por administración hasta registrar cuenta bancaria real."}
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <button
                type="button"
                disabled={!settings.transferQrEnabled}
                onClick={() => setPaymentChoice("QR_SIMPLE")}
                className="ct-btn p-3.5 rounded-xl border text-left space-y-1.5 disabled:opacity-45"
                style={{
                  backgroundColor: paymentChoice === "QR_SIMPLE" ? "var(--accent-cyan-soft)" : "var(--bg-chassis)",
                  borderColor: paymentChoice === "QR_SIMPLE" ? "var(--accent-cyan)" : "var(--border-subtle)",
                }}
              >
                <div className="flex items-center justify-between">
                  <QrCode className="w-5 h-5" style={{ color: "var(--accent-cyan)" }} />
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: "rgba(16,185,129,0.14)", color: "var(--status-ok)" }}>
                    Instantáneo
                  </span>
                </div>
                <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Pago con QR</p>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>QR Simple Bolivia generado por {formatBs(totalEstimatedCents)}</p>
              </button>

              <button
                type="button"
                disabled={!settings.transferQrEnabled}
                onClick={() => setPaymentChoice("CARD")}
                className="ct-btn p-3.5 rounded-xl border text-left space-y-1.5 disabled:opacity-45"
                style={{
                  backgroundColor: paymentChoice === "CARD" ? "var(--accent-purple-soft)" : "var(--bg-chassis)",
                  borderColor: paymentChoice === "CARD" ? "var(--accent-purple)" : "var(--border-subtle)",
                }}
              >
                <div className="flex items-center justify-between">
                  <CreditCard className="w-5 h-5" style={{ color: "var(--accent-purple)" }} />
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--bg-surface)", color: "var(--text-muted)" }}>
                    Visa / MC
                  </span>
                </div>
                <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Tarjeta</p>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Débito o crédito con validación asistida</p>
              </button>

              <button
                type="button"
                disabled={deliveryMethod === "DELIVERY_QUOTE_REQUESTED"}
                onClick={() => setPaymentChoice("CASH")}
                className="ct-btn p-3.5 rounded-xl border text-left space-y-1.5 disabled:opacity-45"
                style={{
                  backgroundColor: paymentChoice === "CASH" ? "rgba(16,185,129,0.12)" : "var(--bg-chassis)",
                  borderColor: paymentChoice === "CASH" ? "var(--status-ok)" : "var(--border-subtle)",
                }}
              >
                <div className="flex items-center justify-between">
                  <Banknote className="w-5 h-5" style={{ color: "var(--status-ok)" }} />
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--bg-surface)", color: "var(--text-muted)" }}>
                    Potosí
                  </span>
                </div>
                <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Efectivo</p>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  {deliveryMethod === "PICKUP_POTOSI" ? "Al recoger en Calle Oruro" : "Contra entrega en Potosí"}
                </p>
              </button>
            </div>

            {/* Dynamic Panel per Selected Payment */}
            {paymentChoice === "QR_SIMPLE" && (
              <div
                className="rounded-xl border p-4 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center"
                style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-strong)" }}
              >
                <div className="sm:col-span-5 flex flex-col items-center gap-2">
                  <div className="bg-white p-2.5 rounded-xl border shadow-sm">
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="Código QR Simple ClickTech" className="w-40 h-40 object-contain" />
                    ) : (
                      <div className="w-40 h-40 flex items-center justify-center text-xs text-slate-500">Generando QR...</div>
                    )}
                  </div>
                  {qrDataUrl && (
                    <a
                      href={qrDataUrl}
                      download={`QR-ClickTech-${idempotencyKey.slice(0, 8)}.png`}
                      className="text-[11px] font-bold inline-flex items-center gap-1 hover:underline"
                      style={{ color: "var(--accent-cyan)" }}
                    >
                      <Download className="w-3.5 h-3.5" /> Descargar imagen QR
                    </a>
                  )}
                </div>
                <div className="sm:col-span-7 space-y-2 text-xs">
                  <p className="font-heading font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                    Escanea este QR desde tu app bancaria
                  </p>
                  <p style={{ color: "var(--text-secondary)" }}>
                    Importe exacto a transferir: <strong style={{ color: "var(--accent-cyan)" }}>{formatBs(totalEstimatedCents)}</strong>
                  </p>
                  <ul className="space-y-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
                    <li>• Titular: ClickTech Potosí ({STORE_LOCATION.shortName})</li>
                    <li>• Referencia automática: <span className="font-mono">{idempotencyKey.slice(0, 12).toUpperCase()}</span></li>
                    <li>• Luego de confirmar el pedido podrás adjuntar tu captura o número de operación.</li>
                  </ul>
                </div>
              </div>
            )}

            {paymentChoice === "CARD" && (
              <div
                className="rounded-xl border p-4 space-y-3"
                style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--accent-purple)" }}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold flex items-center gap-1.5" style={{ color: "var(--accent-purple)" }}>
                    <CreditCard className="w-4 h-4" /> Tarjeta de Débito o Crédito (Pre-autorización segura)
                  </span>
                  <span className="font-mono font-bold">{formatBs(totalEstimatedCents)}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={19}
                    placeholder="Número de tarjeta (ej. 4532 •••• •••• 1234)"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="sm:col-span-2 h-10 px-3 rounded-lg border font-mono"
                    style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
                  />
                  <input
                    type="text"
                    placeholder="Nombre impreso en la tarjeta"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="h-10 px-3 rounded-lg border"
                    style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      maxLength={5}
                      placeholder="MM/AA"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="h-10 px-3 rounded-lg border font-mono"
                      style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
                    />
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="CVV"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      className="h-10 px-3 rounded-lg border font-mono"
                      style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
                    />
                  </div>
                </div>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  Por tu seguridad, no almacenamos CVV ni datos bancarios en base de datos; al confirmar generamos tu orden protegida.
                </p>
              </div>
            )}

            {paymentChoice === "CASH" && (
              <div
                className="rounded-xl border p-4 space-y-2.5 text-xs"
                style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--status-ok)" }}
              >
                <p className="font-bold" style={{ color: "var(--status-ok)" }}>
                  Pago en Efectivo — {deliveryMethod === "PICKUP_POTOSI" ? "En mostrador Calle Oruro" : "Contra entrega en Potosí"}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <label htmlFor="chk-cash-tender" className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                    ¿Con cuánto pagarás? (para alistar tu cambio):
                  </label>
                  <input
                    id="chk-cash-tender"
                    type="number"
                    min={0}
                    placeholder="Ej. 500"
                    value={cashTenderBs}
                    onChange={(e) => setCashTenderBs(e.target.value)}
                    className="w-32 h-9 px-3 rounded-lg border text-xs tabular-nums"
                    style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
                  />
                  {cashChangeBs !== null && (
                    <span className="font-bold" style={{ color: "var(--accent-cyan)" }}>
                      Tu cambio: Bs {cashChangeBs.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* PASO 3: DATOS, SEGURIDAD ANTIFRAUDE Y OBSERVACIONES */}
          <section
            id="chk-step-3"
            className="rounded-2xl border p-5 sm:p-6 space-y-4"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-subtle)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="flex items-center gap-2.5">
                <span
                  className="w-7 h-7 rounded-lg text-xs font-extrabold flex items-center justify-center"
                  style={{ backgroundColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }}
                >
                  3
                </span>
                <h2 className="font-heading text-lg font-bold">Paso 3: Datos, Seguridad y Observaciones</h2>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded border flex items-center gap-1" style={{ borderColor: "rgba(16, 185, 129, 0.4)", color: "var(--status-ok)" }}>
                <ShieldCheck className="w-3.5 h-3.5" /> Compra protegida
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                backgroundColor: "var(--accent-cyan-soft)",
                borderColor: "var(--border-strong)",
              }}
            >
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--accent-cyan)" }} />
              <div className="space-y-0.5">
                <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  Protocolo de Seguridad y Despacho Antifraude
                </p>
                <p style={{ color: "var(--text-secondary)" }}>
                  Para evitar estafas y suplantación de identidad, cada despacho desde Calle Oruro se verifica telefónicamente antes de salir. El paquete viaja precintado con número de guía oficial verificable.
                </p>
              </div>
            </div>

            <label className="flex items-center gap-3 pt-1 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={includeAssembly}
                onChange={(e) => setIncludeAssembly(e.target.checked)}
                className="w-4 h-4 accent-[#00E5FF]"
              />
              <span>
                Incluir ensamblaje / instalación profesional en taller ({formatBs(assemblyFeeCents)})
              </span>
            </label>

            <div className="space-y-1">
              <label htmlFor="chk-notes" className="block text-xs font-medium">
                Observaciones para el repartidor o taller
              </label>
              <textarea
                id="chk-notes"
                rows={2}
                placeholder="Ej. Horario preferido, timbre, color de puerta o solicitud de pruebas antes de entregar..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 rounded-lg border text-xs"
                style={{
                  backgroundColor: "var(--bg-chassis)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          </section>
        </div>

        {/* Sticky Order Summary Sidebar */}
        <aside
          className="lg:col-span-5 lg:sticky lg:top-20 rounded-2xl border p-5 sm:p-6 space-y-4"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-strong)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border-subtle)" }}>
            <h2 className="font-heading text-lg font-bold">Resumen del pedido</h2>
            <span className="text-xs font-mono" style={{ color: "var(--accent-cyan)" }}>
              {items.reduce((acc, i) => acc + i.quantity, 0)} art.
            </span>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto divide-y text-xs" style={{ borderColor: "var(--border-subtle)" }}>
            {items.map((it) => (
              <div key={it.id} className="pt-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  {it.imageUrl && (
                    <img
                      src={it.imageUrl}
                      alt={it.name}
                      className="w-10 h-10 rounded-lg object-cover border shrink-0"
                      style={{ borderColor: "var(--border-subtle)" }}
                    />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{it.name}</p>
                    <p style={{ color: "var(--text-muted)" }}>
                      {it.quantity} x {formatBs(it.unitPriceCents)}
                    </p>
                  </div>
                </div>
                <span className="font-bold tabular-nums shrink-0">{formatBs(it.lineTotalCents)}</span>
              </div>
            ))}
          </div>

          <div
            className="rounded-xl border p-3 space-y-1 text-[11px]"
            style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)" }}
          >
            <div className="flex justify-between gap-2">
              <span style={{ color: "var(--text-muted)" }}>Modalidad:</span>
              <span className="font-semibold text-right">
                {deliveryMethod === "PICKUP_POTOSI"
                  ? "Recojo en Calle Oruro, Potosí"
                  : deliveryMethod === "LOCAL_DELIVERY"
                  ? "Delivery Potosí (con seguimiento)"
                  : `Envío Nacional (${nationalDept})`}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span style={{ color: "var(--text-muted)" }}>Pago elegido:</span>
              <span className="font-semibold" style={{ color: "var(--accent-cyan)" }}>
                {paymentChoice === "QR_SIMPLE"
                  ? "QR Simple ClickTech"
                  : paymentChoice === "CARD"
                  ? "Tarjeta Débito/Crédito"
                  : "Efectivo"}
              </span>
            </div>
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
            className="ct-btn w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
            style={{ backgroundColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }}
          >
            <CheckCircle2 className="w-4 h-4" />
            {submitting ? "Reservando stock y creando pedido..." : "Confirmar pedido y reservar stock"}
          </button>

          <p className="text-[11px] flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
            <Lock className="w-3.5 h-3.5 shrink-0" />
            La reserva temporal protege tu stock por 30 minutos y habilita el seguimiento en vivo de tu pedido.
          </p>
        </aside>
      </form>
    </div>
  );
}
