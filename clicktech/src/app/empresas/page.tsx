"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Headphones,
  Keyboard,
  Monitor,
  Mouse,
  Plus,
  ShieldCheck,
  Sparkles,
  Volume2,
  X,
} from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";

interface B2BPackageSuggestion {
  id: string;
  tier: string;
  title: string;
  subtitle: string;
  unitBs: string;
  recommendedQty: string;
  imageUrl: string;
  gradient: string;
  border: string;
  badgeColor: string;
  includes: Array<{ label: string; kind: "monitor" | "kb" | "mouse" | "audio" | "shield" }>;
  summarySpec: string;
}

const B2B_PACKAGES: B2BPackageSuggestion[] = [
  {
    id: "oficina-total",
    tier: "PACK OFICINA & CONTABILIDAD",
    title: "Estación Administrativa Completa",
    subtitle: "Lista para facturación, ERP, Office y videoconferencias",
    unitBs: "Bs 5.190",
    recommendedQty: "5",
    imageUrl: "/images/products/ct-pc-estudio.webp",
    gradient: "linear-gradient(135deg, #0EA5E9 0%, #2563EB 100%)",
    border: "rgba(56, 189, 248, 0.5)",
    badgeColor: "#38BDF8",
    includes: [
      { label: "Monitor 24\" IPS Full HD", kind: "monitor" },
      { label: "Teclado Español", kind: "kb" },
      { label: "Mouse Óptico", kind: "mouse" },
      { label: "Parlantes Estéreo", kind: "audio" },
      { label: "Estabilizador + Garantía 12m", kind: "shield" },
    ],
    summarySpec:
      "Pack Oficina & Contabilidad: PC Ryzen 5 5600G + 16GB RAM + SSD 1TB NVMe + Monitor 24\" IPS + Teclado + Mouse + Parlantes Estéreo + Estabilizador de voltaje + Instalación lista en Potosí.",
  },
  {
    id: "ingenieria-cad",
    tier: "PACK ARQUITECTURA & DISEÑO PRO",
    title: "Workstation CAD, Render & 3D",
    subtitle: "Potencia gráfica dedicada para AutoCAD, Revit, Premiere y Blender",
    unitBs: "Bs 8.290",
    recommendedQty: "3",
    imageUrl: "/images/products/ct-pc-equilibrada.webp",
    gradient: "linear-gradient(135deg, #8B5CF6 0%, #4F46E5 100%)",
    border: "rgba(139, 92, 246, 0.52)",
    badgeColor: "#A78BFA",
    includes: [
      { label: "Monitor 27\" Alta Definición", kind: "monitor" },
      { label: "Teclado Mecánico", kind: "kb" },
      { label: "Mouse Precisión", kind: "mouse" },
      { label: "Parlantes + Headset", kind: "audio" },
      { label: "Mantenimiento Bs 0", kind: "shield" },
    ],
    summarySpec:
      "Pack Ingeniería & Diseño: PC Ryzen 5 5600 + RTX 4060 8GB + 32GB RAM + SSD 1TB NVMe + Monitor 27\" IPS + Teclado Mecánico + Mouse + Parlantes/Audífonos + Mantenimiento gratuito en Potosí.",
  },
  {
    id: "aulas-laboratorio",
    tier: "PACK COLEGIOS & INSTITUCIONES",
    title: "Equipamiento de Aulas & Labs",
    subtitle: "Costo optimizado por lote con soporte preventivo programado",
    unitBs: "Bs 4.390",
    recommendedQty: "10",
    imageUrl: "/images/products/ct-pc-inicial.webp",
    gradient: "linear-gradient(135deg, #10B981 0%, #0D9488 100%)",
    border: "rgba(16, 185, 129, 0.5)",
    badgeColor: "#34D399",
    includes: [
      { label: "Monitor 24\" IPS", kind: "monitor" },
      { label: "Kit Teclado y Mouse", kind: "kb" },
      { label: "Mouse Pad Corporativo", kind: "mouse" },
      { label: "Parlantes / Diadema Audio", kind: "audio" },
      { label: "Red + Soporte Anual", kind: "shield" },
    ],
    summarySpec:
      "Pack Aulas & Laboratorios: PC completa Ryzen 5 + 16GB RAM + SSD NVMe + Monitor 24\" + Teclado + Mouse + Parlantes + Cableado/configuración de red local + Garantía institucional.",
  },
  {
    id: "gerencia-movil",
    tier: "PACK GERENCIA & EJECUTIVOS",
    title: "Movilidad Corporativa Total",
    subtitle: "Equipos portátiles listos para viajes, gerencia y reuniones",
    unitBs: "Bs 5.290",
    recommendedQty: "4",
    imageUrl: "/images/products/ct-lap-ideapad-slim3.webp",
    gradient: "linear-gradient(135deg, #F97316 0%, #E11D48 100%)",
    border: "rgba(249, 115, 22, 0.52)",
    badgeColor: "#FB923C",
    includes: [
      { label: "Pantalla Full HD 15.6\"", kind: "monitor" },
      { label: "Teclado Numérico Integrado", kind: "kb" },
      { label: "Mouse Inalámbrico", kind: "mouse" },
      { label: "Audífonos + Micrófono HD", kind: "audio" },
      { label: "Mochila + Hub USB-C", kind: "shield" },
    ],
    summarySpec:
      "Pack Gerencia Ejecutiva: Laptop IdeaPad Slim 3 + Mouse inalámbrico + Audífonos con micrófono para reuniones + Hub USB-C + Mochila acolchada corporativa.",
  },
];

function IncludeIcon({ kind }: { kind: "monitor" | "kb" | "mouse" | "audio" | "shield" }) {
  if (kind === "monitor") return <Monitor className="w-3.5 h-3.5 shrink-0" />;
  if (kind === "kb") return <Keyboard className="w-3.5 h-3.5 shrink-0" />;
  if (kind === "mouse") return <Mouse className="w-3.5 h-3.5 shrink-0" />;
  if (kind === "audio") return <Volume2 className="w-3.5 h-3.5 shrink-0" />;
  return <ShieldCheck className="w-3.5 h-3.5 shrink-0" />;
}

export default function EmpresasPage() {
  const { notify } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPackTitle, setSelectedPackTitle] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [taxIdNit, setTaxIdNit] = useState("");
  const [quantityEstimate, setQuantityEstimate] = useState("5");
  const [requirements, setRequirements] = useState("");
  const [createdQuote, setCreatedQuote] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  function openPackQuoteModal(pack?: B2BPackageSuggestion) {
    if (pack) {
      setSelectedPackTitle(pack.title);
      setQuantityEstimate(pack.recommendedQty);
      setRequirements(pack.summarySpec);
    } else {
      setSelectedPackTitle(null);
    }
    setCreatedQuote(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/b2b/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          contactName,
          email,
          phone,
          taxIdNit,
          quantityEstimate: Math.max(1, Number(quantityEstimate) || 1),
          requirements,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error ?? "No se pudo registrar la solicitud B2B.", "error");
        return;
      }
      setCreatedQuote(data.quote.quoteNumber);
      notify(`Solicitud B2B ${data.quote.quoteNumber} registrada.`, "success");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ct-container py-8 space-y-10">
      {/* Corporate Banner Hero */}
      <section
        className="rounded-3xl border p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, rgba(139,92,246,0.16) 0%, rgba(14,165,233,0.12) 55%, var(--bg-surface) 100%)",
          borderColor: "var(--border-strong)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="space-y-2.5 max-w-3xl">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-extrabold uppercase tracking-wider"
            style={{
              backgroundColor: "var(--accent-purple-soft)",
              borderColor: "rgba(139,92,246,0.45)",
              color: "var(--accent-purple)",
            }}
          >
            <Building2 className="w-3.5 h-3.5" />
            Atención Corporativa B2B · Potosí & Bolivia
          </div>
          <h1 className="font-display text-2xl sm:text-4xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
            Soluciones B2B para Empresas e Instituciones
          </h1>
          <p className="text-sm sm:text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Elige uno de nuestros equipos completos sugeridos (con monitor, teclado, mouse y audio incluidos) o arma tu lote a medida. Haz clic en cualquier paquete para cotizar en una ventana rápida.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openPackQuoteModal()}
          className="ct-btn h-12 px-6 rounded-2xl text-sm font-black text-white inline-flex items-center justify-center gap-2 shadow-lg shrink-0 transition-transform hover:scale-[1.02]"
          style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #4F46E5 100%)" }}
        >
          <Plus className="w-4 h-4" />
          Cotización personalizada B2B
        </button>
      </section>

      {createdQuote && !modalOpen && (
        <div
          className="rounded-2xl border p-5 flex flex-wrap items-center justify-between gap-4"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--status-ok)" }}
        >
          <div className="space-y-1">
            <h2 className="font-heading text-lg font-bold flex items-center gap-2" style={{ color: "var(--status-ok)" }}>
              <CheckCircle2 className="w-5 h-5" />
              Solicitud comercial registrada: {createdQuote}
            </h2>
            <p className="text-xs sm:text-sm" style={{ color: "var(--text-secondary)" }}>
              Nuestro equipo de Ventas revisará las cantidades y preparará tu proforma formal.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openPackQuoteModal()}
            className="ct-btn h-10 px-4 rounded-xl text-xs font-bold text-white"
            style={{ backgroundColor: "var(--accent-purple)" }}
          >
            Nueva solicitud
          </button>
        </div>
      )}

      {/* Suggested Complete Enterprise Turnkey Packages */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider" style={{ color: "var(--accent-cyan)" }}>
              <Sparkles className="w-4 h-4" />
              Equipos Completos Llave en Mano
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-black mt-0.5" style={{ color: "var(--text-primary)" }}>
              Sugerencias Completas para Empresas (Monitor + Teclado + Mouse + Parlantes)
            </h2>
          </div>
          <span className="text-xs font-medium px-3 py-1 rounded-full border" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
            Precios referenciales por estación · Descuentos por volumen
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {B2B_PACKAGES.map((pack) => (
            <article
              key={pack.id}
              className="ct-card rounded-2xl border overflow-hidden flex flex-col"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: pack.border,
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div className="h-1.5 w-full" style={{ background: pack.gradient }} />

              <div className="p-4 sm:p-5 flex-1 flex flex-col gap-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white"
                    style={{ background: pack.gradient }}
                  >
                    {pack.tier}
                  </span>
                  <span className="text-[11px] font-mono font-bold" style={{ color: "var(--text-muted)" }}>
                    Lote: {pack.recommendedQty}+ uds
                  </span>
                </div>

                {/* Product Showcase */}
                <div
                  className="h-44 rounded-xl border p-3 flex items-center justify-center relative overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, #06122B 0%, #0E316D 100%)",
                    borderColor: pack.border,
                  }}
                >
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.35) 45%, transparent 74%)",
                    }}
                  />
                  <img
                    src={pack.imageUrl}
                    alt={pack.title}
                    className="relative z-10 w-[85%] h-[85%] object-contain"
                  />
                  <span
                    className="absolute bottom-2 right-2 z-20 px-2.5 py-0.5 rounded-full text-xs font-black bg-white shadow-md"
                    style={{ color: "#031942" }}
                  >
                    {pack.unitBs} / u.
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-heading font-extrabold text-base sm:text-lg leading-snug" style={{ color: "var(--text-primary)" }}>
                    {pack.title}
                  </h3>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {pack.subtitle}
                  </p>
                </div>

                {/* Included Peripherals Chips */}
                <ul className="space-y-1.5 pt-1 text-xs">
                  {pack.includes.map((inc) => (
                    <li
                      key={inc.label}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border"
                      style={{
                        backgroundColor: "var(--bg-chassis)",
                        borderColor: "var(--border-subtle)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <span style={{ color: pack.badgeColor }}>
                        <IncludeIcon kind={inc.kind} />
                      </span>
                      <span className="font-semibold truncate">{inc.label}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => openPackQuoteModal(pack)}
                  className="ct-btn mt-auto w-full h-11 px-4 rounded-xl text-xs font-black uppercase tracking-wider text-white flex items-center justify-center gap-2 shadow-md transition-transform hover:scale-[1.02]"
                  style={{ background: pack.gradient }}
                >
                  <span>Cotizar este paquete</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Why ClickTech B2B Benefits Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border p-4 flex items-start gap-3" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
          <Monitor className="w-6 h-6 shrink-0 mt-0.5" style={{ color: "var(--accent-cyan)" }} />
          <div>
            <h3 className="font-heading font-bold text-sm" style={{ color: "var(--text-primary)" }}>Estaciones 100% Completas</h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>Entregamos CPU/Laptop + Monitor + Teclado + Mouse + Parlantes o Headset configurados y probados.</p>
          </div>
        </div>
        <div className="rounded-2xl border p-4 flex items-start gap-3" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
          <Headphones className="w-6 h-6 shrink-0 mt-0.5" style={{ color: "var(--accent-purple)" }} />
          <div>
            <h3 className="font-heading font-bold text-sm" style={{ color: "var(--text-primary)" }}>Mantenimiento Programado</h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>Soporte técnico directo en Potosí desde nuestra sede en Calle Oruro con historial por equipo.</p>
          </div>
        </div>
        <div className="rounded-2xl border p-4 flex items-start gap-3" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
          <ShieldCheck className="w-6 h-6 shrink-0 mt-0.5" style={{ color: "var(--status-ok)" }} />
          <div>
            <h3 className="font-heading font-bold text-sm" style={{ color: "var(--text-primary)" }}>Proforma Formal y NIT</h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>Cotizaciones versionadas con respaldo de garantía por número de serie en hardware y periféricos.</p>
          </div>
        </div>
      </section>

      {/* Overlay Modal Dialog for Fast B2B Quote Request */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[65] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="b2b-modal-title"
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border shadow-2xl"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "rgba(139, 92, 246, 0.55)",
            }}
          >
            <div
              className="p-5 sm:p-6 text-white flex items-start justify-between gap-4 sticky top-0 z-20"
              style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #4F46E5 100%)" }}
            >
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/85">
                  Cotización Formal Corporativa B2B
                </span>
                <h2 id="b2b-modal-title" className="font-display text-lg sm:text-xl font-black">
                  {selectedPackTitle ? `Cotizar: ${selectedPackTitle}` : "Solicitar Proforma Empresarial"}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Cerrar ventana B2B"
                onClick={() => setModalOpen(false)}
                className="w-9 h-9 rounded-full bg-black/25 hover:bg-black/40 text-white flex items-center justify-center shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6">
              {createdQuote ? (
                <div className="space-y-4 text-center py-6">
                  <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(16,185,129,0.16)", color: "var(--status-ok)" }}>
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="font-heading text-xl font-bold" style={{ color: "var(--status-ok)" }}>
                    Solicitud comercial registrada: {createdQuote}
                  </h3>
                  <p className="text-sm max-w-md mx-auto" style={{ color: "var(--text-secondary)" }}>
                    Nuestro equipo comercial revisará tu requerimiento y emitirá la proforma formal para tu institución o empresa.
                  </p>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="ct-btn h-11 px-6 rounded-xl text-sm font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #4F46E5 100%)" }}
                  >
                    Cerrar ventana
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="b2b-company" className="block text-xs font-bold mb-1">
                        Empresa / Institución
                      </label>
                      <input
                        id="b2b-company"
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border text-sm"
                        style={{
                          backgroundColor: "var(--bg-chassis)",
                          borderColor: "var(--border-subtle)",
                          color: "var(--text-primary)",
                        }}
                      />
                    </div>
                    <div>
                      <label htmlFor="b2b-contact" className="block text-xs font-bold mb-1">
                        Persona de contacto
                      </label>
                      <input
                        id="b2b-contact"
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border text-sm"
                        style={{
                          backgroundColor: "var(--bg-chassis)",
                          borderColor: "var(--border-subtle)",
                          color: "var(--text-primary)",
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="b2b-email" className="block text-xs font-bold mb-1">
                        Correo institucional / contacto
                      </label>
                      <input
                        id="b2b-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border text-sm"
                        style={{
                          backgroundColor: "var(--bg-chassis)",
                          borderColor: "var(--border-subtle)",
                          color: "var(--text-primary)",
                        }}
                      />
                    </div>
                    <div>
                      <label htmlFor="b2b-phone" className="block text-xs font-bold mb-1">
                        Teléfono
                      </label>
                      <input
                        id="b2b-phone"
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border text-sm"
                        style={{
                          backgroundColor: "var(--bg-chassis)",
                          borderColor: "var(--border-subtle)",
                          color: "var(--text-primary)",
                        }}
                      />
                    </div>
                    <div>
                      <label htmlFor="b2b-qty" className="block text-xs font-bold mb-1">
                        Cantidad estimada de equipos
                      </label>
                      <input
                        id="b2b-qty"
                        type="number"
                        min={1}
                        value={quantityEstimate}
                        onChange={(e) => setQuantityEstimate(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border text-sm tabular-nums"
                        style={{
                          backgroundColor: "var(--bg-chassis)",
                          borderColor: "var(--border-subtle)",
                          color: "var(--text-primary)",
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="b2b-nit" className="block text-xs font-bold mb-1">
                      NIT (opcional)
                    </label>
                    <input
                      id="b2b-nit"
                      type="text"
                      value={taxIdNit}
                      onChange={(e) => setTaxIdNit(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border text-sm"
                      style={{
                        backgroundColor: "var(--bg-chassis)",
                        borderColor: "var(--border-subtle)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>

                  <div>
                    <label htmlFor="b2b-req" className="block text-xs font-bold mb-1">
                      Detalle de equipos, monitores o periféricos requeridos
                    </label>
                    <textarea
                      id="b2b-req"
                      required
                      rows={4}
                      value={requirements}
                      onChange={(e) => setRequirements(e.target.value)}
                      placeholder="Ej. 5 estaciones completas con monitor 24'', teclado, mouse, parlantes y estabilizador..."
                      className="w-full p-3 rounded-xl border text-sm"
                      style={{
                        backgroundColor: "var(--bg-chassis)",
                        borderColor: "var(--border-subtle)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="ct-btn h-11 px-4 rounded-xl border text-xs font-bold"
                      style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="ct-btn h-11 px-6 rounded-xl text-sm font-black text-white shadow-lg"
                      style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #4F46E5 100%)" }}
                    >
                      {submitting ? "Registrando solicitud..." : "Enviar solicitud B2B"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
