"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Plus,
  ShieldAlert,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";
import { formatBsCompact } from "@/lib/domain/money";
import { PotosiRouteCalculator } from "@/components/maps/PotosiRouteCalculator";

export interface ServiceCatalogItem {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  scope: string;
  pricingType: "FIXED" | "SUBJECT_TO_DIAGNOSIS";
  basePriceCents: number | null;
  estimatedDurationHours: number;
  conditions: string;
  imageUrl: string | null;
}

const SERVICE_THEMES = [
  {
    accent: "#06B6D4",
    gradient: "linear-gradient(135deg, #06B6D4 0%, #2563EB 100%)",
    softBg: "rgba(6, 182, 212, 0.14)",
    border: "rgba(6, 182, 212, 0.48)",
    pillText: "#FFFFFF",
  },
  {
    accent: "#10B981",
    gradient: "linear-gradient(135deg, #10B981 0%, #0D9488 100%)",
    softBg: "rgba(16, 185, 129, 0.14)",
    border: "rgba(16, 185, 129, 0.48)",
    pillText: "#FFFFFF",
  },
  {
    accent: "#F97316",
    gradient: "linear-gradient(135deg, #F97316 0%, #E11D48 100%)",
    softBg: "rgba(249, 115, 22, 0.14)",
    border: "rgba(249, 115, 22, 0.48)",
    pillText: "#FFFFFF",
  },
  {
    accent: "#8B5CF6",
    gradient: "linear-gradient(135deg, #8B5CF6 0%, #4F46E5 100%)",
    softBg: "rgba(139, 92, 246, 0.14)",
    border: "rgba(139, 92, 246, 0.48)",
    pillText: "#FFFFFF",
  },
  {
    accent: "#F59E0B",
    gradient: "linear-gradient(135deg, #F59E0B 0%, #EA580C 100%)",
    softBg: "rgba(245, 158, 11, 0.14)",
    border: "rgba(245, 158, 11, 0.48)",
    pillText: "#FFFFFF",
  },
  {
    accent: "#3B82F6",
    gradient: "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)",
    softBg: "rgba(59, 130, 246, 0.14)",
    border: "rgba(59, 130, 246, 0.48)",
    pillText: "#FFFFFF",
  },
];

export function ServiceIntakeClient({
  services,
  initialSlug,
  currentUser,
}: {
  services: ServiceCatalogItem[];
  initialSlug: string;
  currentUser: { name: string; email: string; phone: string | null } | null;
}) {
  const router = useRouter();
  const { notify } = useStore();

  const defaultService =
    services.find((s) => s.slug === initialSlug) ?? services[0] ?? null;

  const [serviceCatalogId, setServiceCatalogId] = useState(defaultService?.id ?? "");
  const [modalOpen, setModalOpen] = useState(Boolean(initialSlug));
  const [customerName, setCustomerName] = useState(currentUser?.name ?? "");
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email ?? "");
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone ?? "");
  const [deviceType, setDeviceType] = useState<
    "LAPTOP" | "DESKTOP" | "COMPONENT" | "PERIPHERAL" | "OTHER"
  >("LAPTOP");
  const [deviceBrandModel, setDeviceBrandModel] = useState("");
  const [deviceSerial, setDeviceSerial] = useState("");
  const [reportedSymptoms, setReportedSymptoms] = useState("");
  const [preferredSchedule, setPreferredSchedule] = useState("");
  const [deliveryModality, setDeliveryModality] = useState<
    "DROP_OFF_POINT" | "COORDINATED_PICKUP"
  >("DROP_OFF_POINT");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedService =
    services.find((s) => s.id === serviceCatalogId) ?? defaultService;
  const selectedTheme =
    SERVICE_THEMES[
      Math.max(0, services.findIndex((s) => s.id === serviceCatalogId)) % SERVICE_THEMES.length
    ];

  useEffect(() => {
    if (!modalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalOpen]);

  function openServiceModal(serviceId?: string) {
    if (serviceId) setServiceCatalogId(serviceId);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.set("serviceCatalogId", serviceCatalogId);
      fd.set("customerName", customerName);
      fd.set("customerEmail", customerEmail);
      fd.set("customerPhone", customerPhone);
      fd.set("deviceType", deviceType);
      fd.set("deviceBrandModel", deviceBrandModel);
      if (deviceSerial) fd.set("deviceSerial", deviceSerial);
      fd.set("reportedSymptoms", reportedSymptoms);
      if (preferredSchedule) fd.set("preferredSchedule", preferredSchedule);
      fd.set("deliveryModality", deliveryModality);
      if (photoFile) fd.set("photo", photoFile);

      const res = await fetch("/api/services", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error ?? "No se pudo registrar la solicitud.", "error");
        return;
      }
      const ticket = data.serviceOrder.ticketNumber;
      notify(`Orden técnica ${ticket} registrada correctamente.`, "success");
      setModalOpen(false);
      router.push(
        `/seguimiento/${encodeURIComponent(ticket)}?email=${encodeURIComponent(customerEmail)}`
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ct-container py-8 space-y-10">
      {/* Vibrant Header Hero */}
      <section
        className="rounded-3xl border p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, rgba(6,182,212,0.12) 0%, rgba(139,92,246,0.12) 50%, var(--bg-surface) 100%)",
          borderColor: "var(--border-strong)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="space-y-2.5 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-extrabold uppercase tracking-wider"
            style={{
              backgroundColor: "var(--accent-cyan-soft)",
              borderColor: "var(--border-strong)",
              color: "var(--accent-cyan)",
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Taller Técnico Certificado · Calle Oruro, Potosí
          </div>
          <h1 className="font-display text-2xl sm:text-4xl font-black tracking-tight flex items-center gap-3" style={{ color: "var(--text-primary)" }}>
            <span
              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-white shadow-md"
              style={{ background: "linear-gradient(135deg, #06B6D4 0%, #2563EB 100%)" }}
            >
              <Wrench className="w-5 h-5" />
            </span>
            Servicios Técnicos ClickTech
          </h1>
          <p className="text-sm sm:text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Elige el servicio que necesita tu equipo para abrir la ventana de registro inmediato sin desplazarte hasta el final. Todo cambio de alcance o repuesto se cotiza por versión con tu aprobación previa.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openServiceModal()}
          className="ct-btn h-12 px-6 rounded-2xl text-sm font-black text-white inline-flex items-center justify-center gap-2 shadow-lg shrink-0 transition-transform hover:scale-[1.02]"
          style={{ background: "linear-gradient(135deg, #06B6D4 0%, #2563EB 100%)" }}
        >
          <Plus className="w-4 h-4" />
          Registrar equipo ahora
        </button>
      </section>

      {/* Vibrant Service Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {services.map((s, idx) => {
          const theme = SERVICE_THEMES[idx % SERVICE_THEMES.length];
          const isSelected = s.id === serviceCatalogId;
          return (
            <button
              key={s.id}
              type="button"
              data-sound="toggleOn"
              onClick={() => openServiceModal(s.id)}
              className="ct-card group text-left rounded-2xl border overflow-hidden flex flex-col cursor-pointer transition-all hover:-translate-y-1"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: isSelected ? theme.accent : "var(--border-subtle)",
                boxShadow: isSelected
                  ? `0 16px 34px -16px ${theme.accent}`
                  : "var(--shadow-card)",
              }}
            >
              {/* Top Gradient Accent Bar */}
              <div className="h-1.5 w-full" style={{ background: theme.gradient }} />

              <div className="p-4 flex-1 flex flex-col gap-3 w-full">
                {s.imageUrl && (
                  <div
                    className="aspect-[16/9] w-full rounded-xl overflow-hidden relative border"
                    style={{
                      backgroundColor: "var(--bg-card-media)",
                      borderColor: theme.border,
                    }}
                  >
                    <img
                      src={s.imageUrl}
                      alt={s.name}
                      className="ct-zoom-media w-full h-full object-cover"
                    />
                    <div
                      className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold tracking-wide shadow-md flex items-center gap-1"
                      style={{
                        backgroundColor: "rgba(5, 8, 18, 0.85)",
                        borderColor: theme.accent,
                        color: "#FFFFFF",
                        borderWidth: "1px",
                      }}
                    >
                      <Clock className="w-3 h-3" style={{ color: theme.accent }} />
                      ~{s.estimatedDurationHours} h
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 w-full">
                  <span
                    className="font-display font-black text-base px-2.5 py-1 rounded-lg border"
                    style={{
                      backgroundColor: theme.softBg,
                      borderColor: theme.border,
                      color: theme.accent,
                    }}
                  >
                    {s.pricingType === "FIXED" && s.basePriceCents
                      ? formatBsCompact(s.basePriceCents)
                      : "Sujeto a diagnóstico"}
                  </span>
                  {isSelected && (
                    <span
                      className="text-[11px] font-bold inline-flex items-center gap-1"
                      style={{ color: theme.accent }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Activo
                    </span>
                  )}
                </div>

                <h2
                  className="font-heading font-extrabold text-base sm:text-[17px] leading-snug"
                  style={{ color: "var(--text-primary)" }}
                >
                  {s.name}
                </h2>

                <p
                  className="text-xs sm:text-[13px] leading-relaxed line-clamp-3"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {s.description}
                </p>

                <div
                  className="mt-auto pt-3 border-t w-full space-y-2.5"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  <p className="text-[11px] line-clamp-1" style={{ color: "var(--text-muted)" }}>
                    {s.conditions}
                  </p>
                  <div
                    className="w-full h-9 rounded-xl px-3 text-xs font-extrabold text-white flex items-center justify-center gap-1.5 shadow-sm transition-transform group-hover:scale-[1.01]"
                    style={{ background: theme.gradient }}
                  >
                    <span>Solicitar este servicio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Overlay Modal Dialog for Fast Service Registration */}
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
            aria-labelledby="srv-modal-title"
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border shadow-2xl"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: selectedTheme.border,
            }}
          >
            {/* Colorful Modal Header */}
            <div
              className="p-5 sm:p-6 text-white flex items-start justify-between gap-4 sticky top-0 z-20"
              style={{ background: selectedTheme.gradient }}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {selectedService?.imageUrl ? (
                  <img
                    src={selectedService.imageUrl}
                    alt={selectedService.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-white/60 shrink-0 shadow-md"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                    <Wrench className="w-6 h-6" />
                  </div>
                )}
                <div className="min-w-0 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-white/90">
                    <span>Orden de Servicio Técnico</span>
                    {selectedService && (
                      <span className="px-2 py-0.5 rounded-full bg-black/25">
                        {selectedService.pricingType === "FIXED" && selectedService.basePriceCents
                          ? formatBsCompact(selectedService.basePriceCents)
                          : "Sujeto a diagnóstico"}{" "}
                        · ~{selectedService.estimatedDurationHours}h
                      </span>
                    )}
                  </div>
                  <h2 id="srv-modal-title" className="font-display text-lg sm:text-xl font-black truncate">
                    {selectedService?.name ?? "Registrar solicitud de servicio"}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                data-sound="close"
                aria-label="Cerrar ventana de servicio"
                onClick={() => setModalOpen(false)}
                className="w-9 h-9 rounded-full bg-black/25 hover:bg-black/40 text-white flex items-center justify-center shrink-0 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-5">
              <div
                className="rounded-xl border p-3 text-xs flex items-start gap-2.5"
                style={{
                  backgroundColor: "var(--bg-chassis)",
                  borderColor: "var(--status-warn)",
                  color: "var(--text-secondary)",
                }}
              >
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--status-warn)" }} />
                <span>
                  <strong>Seguridad de tus datos:</strong> Nunca solicitamos contraseñas, PIN ni claves de acceso a tu sistema operativo en formularios web.
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="srv-select" className="block text-xs font-bold mb-1">
                    Servicio solicitado
                  </label>
                  <select
                    id="srv-select"
                    value={serviceCatalogId}
                    onChange={(e) => setServiceCatalogId(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border text-sm font-medium"
                    style={{
                      backgroundColor: "var(--bg-chassis)",
                      borderColor: "var(--border-subtle)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (
                        {s.pricingType === "FIXED" && s.basePriceCents
                          ? formatBsCompact(s.basePriceCents)
                          : "Sujeto a diagnóstico"}
                        )
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="srv-name" className="block text-xs font-bold mb-1">
                      Nombre completo
                    </label>
                    <input
                      id="srv-name"
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border text-sm"
                      style={{
                        backgroundColor: "var(--bg-chassis)",
                        borderColor: "var(--border-subtle)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>
                  <div>
                    <label htmlFor="srv-email" className="block text-xs font-bold mb-1">
                      Correo electrónico
                    </label>
                    <input
                      id="srv-email"
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border text-sm"
                      style={{
                        backgroundColor: "var(--bg-chassis)",
                        borderColor: "var(--border-subtle)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>
                  <div>
                    <label htmlFor="srv-phone" className="block text-xs font-bold mb-1">
                      Teléfono / WhatsApp
                    </label>
                    <input
                      id="srv-phone"
                      type="text"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border text-sm"
                      style={{
                        backgroundColor: "var(--bg-chassis)",
                        borderColor: "var(--border-subtle)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="srv-device-type" className="block text-xs font-bold mb-1">
                      Tipo de equipo
                    </label>
                    <select
                      id="srv-device-type"
                      value={deviceType}
                      onChange={(e) =>
                        setDeviceType(
                          e.target.value as "LAPTOP" | "DESKTOP" | "COMPONENT" | "PERIPHERAL" | "OTHER"
                        )
                      }
                      className="w-full h-10 px-3 rounded-xl border text-sm"
                      style={{
                        backgroundColor: "var(--bg-chassis)",
                        borderColor: "var(--border-subtle)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <option value="LAPTOP">Laptop / Notebook</option>
                      <option value="DESKTOP">PC de escritorio</option>
                      <option value="COMPONENT">Componente suelto</option>
                      <option value="PERIPHERAL">Monitor / Periférico</option>
                      <option value="OTHER">Otro equipo</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="srv-model" className="block text-xs font-bold mb-1">
                      Marca y modelo
                    </label>
                    <input
                      id="srv-model"
                      type="text"
                      required
                      placeholder="Ej. Lenovo IdeaPad 3 / PC AM4"
                      value={deviceBrandModel}
                      onChange={(e) => setDeviceBrandModel(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border text-sm"
                      style={{
                        backgroundColor: "var(--bg-chassis)",
                        borderColor: "var(--border-subtle)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>
                  <div>
                    <label htmlFor="srv-serial" className="block text-xs font-bold mb-1">
                      Número de serie (opcional)
                    </label>
                    <input
                      id="srv-serial"
                      type="text"
                      value={deviceSerial}
                      onChange={(e) => setDeviceSerial(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border text-sm"
                      style={{
                        backgroundColor: "var(--bg-chassis)",
                        borderColor: "var(--border-subtle)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="srv-symptoms" className="block text-xs font-bold mb-1">
                    Síntomas observados o mejora deseada
                  </label>
                  <textarea
                    id="srv-symptoms"
                    required
                    rows={3}
                    placeholder="Ej. Se calienta después de 20 minutos, demora en abrir archivos, o deseo cambiar disco a SSD NVMe..."
                    value={reportedSymptoms}
                    onChange={(e) => setReportedSymptoms(e.target.value)}
                    className="w-full p-3 rounded-xl border text-sm"
                    style={{
                      backgroundColor: "var(--bg-chassis)",
                      borderColor: "var(--border-subtle)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="srv-date" className="block text-xs font-bold mb-1">
                      Fecha preferida (America/La_Paz)
                    </label>
                    <input
                      id="srv-date"
                      type="datetime-local"
                      value={preferredSchedule}
                      onChange={(e) => setPreferredSchedule(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border text-sm"
                      style={{
                        backgroundColor: "var(--bg-chassis)",
                        borderColor: "var(--border-subtle)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>
                  <div>
                    <label htmlFor="srv-modality" className="block text-xs font-bold mb-1">
                      Modalidad de entrega en Potosí
                    </label>
                    <select
                      id="srv-modality"
                      value={deliveryModality}
                      onChange={(e) =>
                        setDeliveryModality(
                          e.target.value as "DROP_OFF_POINT" | "COORDINATED_PICKUP"
                        )
                      }
                      className="w-full h-10 px-3 rounded-xl border text-sm"
                      style={{
                        backgroundColor: "var(--bg-chassis)",
                        borderColor: "var(--border-subtle)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <option value="DROP_OFF_POINT">Entrega en Calle Oruro (coordinado)</option>
                      <option value="COORDINATED_PICKUP">Solicitar recojo a domicilio (Potosí)</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="srv-photo" className="block text-xs font-bold mb-1">
                      Foto opcional (PNG/JPG/WEBP)
                    </label>
                    <input
                      id="srv-photo"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                      className="w-full text-xs pt-2"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                  <span className="text-xs flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                    <AlertCircle className="w-3.5 h-3.5" style={{ color: selectedTheme.accent }} />
                    Genera código de seguimiento en vivo inmediato
                  </span>
                  <div className="flex items-center gap-2.5">
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
                      style={{ background: selectedTheme.gradient }}
                    >
                      {submitting ? "Registrando solicitud..." : "Registrar orden de servicio"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </section>
        </div>
      )}

      {/* Calculador de ruta y visitas a domicilio */}
      <section id="calculador-ruta" className="space-y-4 pt-4 border-t" style={{ borderColor: "var(--border-subtle)" }}>
        <PotosiRouteCalculator />
      </section>
    </div>
  );
}
