"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ShieldAlert, Wrench } from "lucide-react";
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
  const [customerName, setCustomerName] = useState(currentUser?.name ?? "");
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email ?? "");
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone ?? "");
  const [deviceType, setDeviceType] = useState<"LAPTOP" | "DESKTOP" | "COMPONENT" | "PERIPHERAL" | "OTHER">("LAPTOP");
  const [deviceBrandModel, setDeviceBrandModel] = useState("");
  const [deviceSerial, setDeviceSerial] = useState("");
  const [reportedSymptoms, setReportedSymptoms] = useState("");
  const [preferredSchedule, setPreferredSchedule] = useState("");
  const [deliveryModality, setDeliveryModality] = useState<"DROP_OFF_POINT" | "COORDINATED_PICKUP">("DROP_OFF_POINT");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      router.push(
        `/seguimiento/${encodeURIComponent(ticket)}?email=${encodeURIComponent(customerEmail)}`
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ct-container py-8 space-y-10">
      <div className="space-y-2">
        <h1 className="font-display text-2xl sm:text-3xl font-bold flex items-center gap-2.5">
          <Wrench className="w-7 h-7" style={{ color: "var(--accent-cyan)" }} />
          Servicios Técnicos ClickTech
        </h1>
        <p className="text-sm max-w-3xl" style={{ color: "var(--text-secondary)" }}>
          Registra tu equipo para diagnóstico, mantenimiento preventivo, reparación, actualización o ensamblaje. Cada cambio de costo se cotiza por versión y requiere tu aprobación antes de ejecutarse.
        </p>
      </div>

      {/* Service cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((s) => {
          const isSelected = s.id === serviceCatalogId;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setServiceCatalogId(s.id)}
              className="ct-card text-left rounded-xl border p-4 flex flex-col gap-2"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: isSelected ? "var(--accent-cyan)" : "var(--border-subtle)",
              }}
            >
              {s.imageUrl && (
                <div className="aspect-[16/9] w-full rounded-lg overflow-hidden mb-1" style={{ backgroundColor: "var(--bg-card-media)" }}>
                  <img src={s.imageUrl} alt={s.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex items-center justify-between w-full text-xs">
                <span className="font-bold" style={{ color: "var(--accent-cyan)" }}>
                  {s.pricingType === "FIXED" && s.basePriceCents
                    ? formatBsCompact(s.basePriceCents)
                    : "Sujeto a diagnóstico"}
                </span>
                <span style={{ color: "var(--text-muted)" }}>~{s.estimatedDurationHours} h</span>
              </div>
              <h2 className="font-heading font-bold text-base">{s.name}</h2>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {s.description}
              </p>
              <p className="text-[11px] mt-auto pt-2 border-t w-full" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
                {s.conditions}
              </p>
            </button>
          );
        })}
      </div>

      {/* Intake Form */}
      <section
        className="rounded-2xl border p-6 space-y-5 max-w-4xl"
        style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-strong)" }}
      >
        <div className="space-y-1">
          <h2 className="font-heading text-xl font-bold">Registrar solicitud de servicio técnico</h2>
          <div
            className="rounded-lg border p-3 text-xs flex items-start gap-2"
            style={{
              backgroundColor: "var(--bg-chassis)",
              borderColor: "var(--status-warn)",
              color: "var(--text-secondary)",
            }}
          >
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--status-warn)" }} />
            <span>
              <strong>Seguridad de tus datos:</strong> Por tu privacidad, nunca solicitamos contraseñas, PIN ni claves de acceso a tu sistema operativo en formularios web.
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="srv-select" className="block text-xs font-medium mb-1">
              Servicio solicitado
            </label>
            <select
              id="srv-select"
              value={serviceCatalogId}
              onChange={(e) => setServiceCatalogId(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border text-sm"
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
              <label htmlFor="srv-name" className="block text-xs font-medium mb-1">
                Nombre completo
              </label>
              <input
                id="srv-name"
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border text-sm"
                style={{
                  backgroundColor: "var(--bg-chassis)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
            <div>
              <label htmlFor="srv-email" className="block text-xs font-medium mb-1">
                Correo electrónico
              </label>
              <input
                id="srv-email"
                type="email"
                required
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border text-sm"
                style={{
                  backgroundColor: "var(--bg-chassis)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
            <div>
              <label htmlFor="srv-phone" className="block text-xs font-medium mb-1">
                Teléfono / WhatsApp
              </label>
              <input
                id="srv-phone"
                type="text"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border text-sm"
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
              <label htmlFor="srv-device-type" className="block text-xs font-medium mb-1">
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
                className="w-full h-10 px-3 rounded-lg border text-sm"
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
              <label htmlFor="srv-model" className="block text-xs font-medium mb-1">
                Marca y modelo
              </label>
              <input
                id="srv-model"
                type="text"
                required
                placeholder="Ej. Lenovo IdeaPad 3 / PC AM4"
                value={deviceBrandModel}
                onChange={(e) => setDeviceBrandModel(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border text-sm"
                style={{
                  backgroundColor: "var(--bg-chassis)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
            <div>
              <label htmlFor="srv-serial" className="block text-xs font-medium mb-1">
                Número de serie (opcional)
              </label>
              <input
                id="srv-serial"
                type="text"
                value={deviceSerial}
                onChange={(e) => setDeviceSerial(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border text-sm"
                style={{
                  backgroundColor: "var(--bg-chassis)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          </div>

          <div>
            <label htmlFor="srv-symptoms" className="block text-xs font-medium mb-1">
              Síntomas observados o mejora deseada
            </label>
            <textarea
              id="srv-symptoms"
              required
              rows={3}
              placeholder="Ej. Se calienta después de 20 minutos, demora en abrir archivos, o deseo cambiar disco a SSD NVMe..."
              value={reportedSymptoms}
              onChange={(e) => setReportedSymptoms(e.target.value)}
              className="w-full p-3 rounded-lg border text-sm"
              style={{
                backgroundColor: "var(--bg-chassis)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="srv-date" className="block text-xs font-medium mb-1">
                Fecha preferida (America/La_Paz)
              </label>
              <input
                id="srv-date"
                type="datetime-local"
                value={preferredSchedule}
                onChange={(e) => setPreferredSchedule(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border text-sm"
                style={{
                  backgroundColor: "var(--bg-chassis)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
            <div>
              <label htmlFor="srv-modality" className="block text-xs font-medium mb-1">
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
                className="w-full h-10 px-3 rounded-lg border text-sm"
                style={{
                  backgroundColor: "var(--bg-chassis)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
              >
                <option value="DROP_OFF_POINT">Entrega en punto de atención coordinado</option>
                <option value="COORDINATED_PICKUP">Solicitar recojo a domicilio (según cobertura)</option>
              </select>
            </div>
            <div>
              <label htmlFor="srv-photo" className="block text-xs font-medium mb-1">
                Foto opcional (PNG/JPG/WEBP, máx 5 MB)
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

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="ct-btn h-11 px-6 rounded-lg text-sm font-semibold"
              style={{ backgroundColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }}
            >
              {submitting ? "Registrando solicitud..." : "Registrar orden de servicio"}
            </button>
            <span className="text-xs flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
              <AlertCircle className="w-3.5 h-3.5" /> Genera código de seguimiento inmediato
            </span>
          </div>
        </form>
      </section>

      {/* Calculador de ruta y visitas a domicilio */}
      <section id="calculador-ruta" className="space-y-4 pt-4 border-t" style={{ borderColor: "var(--border-subtle)" }}>
        <PotosiRouteCalculator />
      </section>
    </div>
  );
}
