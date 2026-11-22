"use client";

import React, { useState } from "react";
import {
  MapPin,
  Navigation,
  CheckCircle2,
  Clock,
  Car,
  ShieldCheck,
  MessageCircle,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { formatBs } from "@/lib/domain/money";

interface PotosiZone {
  id: string;
  name: string;
  distanceKm: number;
  estMinutes: number;
  regularFeeBs: number;
  description: string;
  coords: { lat: number; lng: number };
}

const POTOSI_ZONES: PotosiZone[] = [
  {
    id: "centro",
    name: "Centro / Casco Histórico",
    distanceKm: 1.0,
    estMinutes: 10,
    regularFeeBs: 15,
    description: "Plaza 10 de Noviembre, Calle Bolívar, Hoyos, Mercado Central y alrededores.",
    coords: { lat: -19.5888, lng: -65.7538 },
  },
  {
    id: "zona-alta",
    name: "Zona Alta / San Roque / San Pedro",
    distanceKm: 2.2,
    estMinutes: 15,
    regularFeeBs: 20,
    description: "Calles altas, Plaza El Minero, San Roque, San Pedro.",
    coords: { lat: -19.5815, lng: -65.7612 },
  },
  {
    id: "plan-40",
    name: "Plan 40 / San Gerardo / Villa Copacabana",
    distanceKm: 3.8,
    estMinutes: 20,
    regularFeeBs: 25,
    description: "Zona Plan 40, San Gerardo, avenidas principales y Villa Copacabana.",
    coords: { lat: -19.5742, lng: -65.7485 },
  },
  {
    id: "satelite",
    name: "Ciudad Satélite / Cantumarca",
    distanceKm: 6.2,
    estMinutes: 28,
    regularFeeBs: 30,
    description: "Ciudad Satélite, salida a Cantumarca, campus universitario UATF.",
    coords: { lat: -19.5621, lng: -65.7654 },
  },
  {
    id: "delicias",
    name: "Las Delicias / San Cristóbal / Periférica",
    distanceKm: 8.5,
    estMinutes: 35,
    regularFeeBs: 35,
    description: "Distrito Las Delicias, San Cristóbal, Karachipampa y accesos interprovinciales.",
    coords: { lat: -19.551, lng: -65.738 },
  },
];

export function PotosiRouteCalculator() {
  const [selectedZoneId, setSelectedZoneId] = useState<string>("centro");
  const [isClickTechBuyer, setIsClickTechBuyer] = useState<boolean>(true);
  const [customAddress, setCustomAddress] = useState<string>("");

  const currentZone = POTOSI_ZONES.find((z) => z.id === selectedZoneId) ?? POTOSI_ZONES[0];
  const finalFeeBs = isClickTechBuyer ? 0 : currentZone.regularFeeBs;

  const whatsappMessage = encodeURIComponent(
    `Hola ClickTech Potosí (+591 67605477). Deseo coordinar servicio técnico/mantenimiento a domicilio.\n` +
      `📍 Zona en Potosí: ${currentZone.name}\n` +
      `🏠 Dirección/Referencia: ${customAddress.trim() || "A coordinar"}\n` +
      `📏 Distancia estimada: ~${currentZone.distanceKm} km (~${currentZone.estMinutes} min)\n` +
      `👤 ¿Compré mi equipo/armé mi PC en ClickTech?: ${isClickTechBuyer ? "SÍ (Atención Gratuita Bs 0)" : `NO - Cliente particular (Tarifa traslado: Bs ${finalFeeBs})`}\n` +
      `¿Podemos confirmar fecha y hora?`
  );

  return (
    <div
      className="rounded-2xl border p-5 sm:p-7 space-y-6"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--border-subtle)",
      }}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5" style={{ borderColor: "var(--border-subtle)" }}>
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider mb-2" style={{ backgroundColor: "var(--accent-cyan-soft)", color: "var(--accent-cyan)" }}>
            <MapPin className="w-3.5 h-3.5" />
            Cobertura y Visitas a Domicilio · Potosí, Bolivia
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold">
            Calculador de Ruta y Mantenimiento en Potosí
          </h2>
          <p className="text-xs sm:text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Calcula la distancia desde nuestro taller central hasta tu domicilio, tiempo estimado y tarifa exacta.
          </p>
        </div>

        {/* Exclusive Benefit Banner */}
        <div
          className="p-3.5 rounded-xl border flex items-center gap-3 shrink-0"
          style={{
            backgroundColor: "rgba(0, 229, 255, 0.08)",
            borderColor: "var(--accent-cyan)",
          }}
        >
          <ShieldCheck className="w-7 h-7 shrink-0" style={{ color: "var(--accent-cyan)" }} />
          <div className="text-xs">
            <p className="font-bold" style={{ color: "var(--text-primary)" }}>
              ¿Armaste o compraste tu PC en ClickTech?
            </p>
            <p style={{ color: "var(--accent-cyan)" }}>
              ¡La visita y atención técnica es <strong>100% GRATUITA</strong> (Bs 0)!
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Controls Column */}
        <div className="lg:col-span-6 space-y-5">
          {/* Step 1: Customer Type Toggle */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              1. ¿Compraste tu PC o componentes en ClickTech?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setIsClickTechBuyer(true)}
                className="ct-btn p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all"
                style={{
                  backgroundColor: isClickTechBuyer ? "var(--accent-cyan-soft)" : "var(--bg-chassis)",
                  borderColor: isClickTechBuyer ? "var(--accent-cyan)" : "var(--border-subtle)",
                }}
              >
                <CheckCircle2
                  className="w-4 h-4 shrink-0 mt-0.5"
                  style={{ color: isClickTechBuyer ? "var(--accent-cyan)" : "var(--text-muted)" }}
                />
                <div>
                  <p className="text-xs font-bold" style={{ color: isClickTechBuyer ? "var(--accent-cyan)" : "var(--text-primary)" }}>
                    Sí, soy Cliente ClickTech
                  </p>
                  <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                    Visita y revisión cubierta por Garantía ClickTech.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsClickTechBuyer(false)}
                className="ct-btn p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all"
                style={{
                  backgroundColor: !isClickTechBuyer ? "var(--accent-purple-soft)" : "var(--bg-chassis)",
                  borderColor: !isClickTechBuyer ? "var(--accent-purple)" : "var(--border-subtle)",
                }}
              >
                <HelpCircle
                  className="w-4 h-4 shrink-0 mt-0.5"
                  style={{ color: !isClickTechBuyer ? "var(--accent-purple)" : "var(--text-muted)" }}
                />
                <div>
                  <p className="text-xs font-bold" style={{ color: !isClickTechBuyer ? "var(--accent-purple)" : "var(--text-primary)" }}>
                    Cliente General («Cliente X»)
                  </p>
                  <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                    Equipo adquirido externamente. Tarifa de traslado según zona.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Step 2: Zone Selector */}
          <div className="space-y-2">
            <label htmlFor="potosi-zone-select" className="block text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              2. Selecciona tu zona o barrio en Potosí
            </label>
            <select
              id="potosi-zone-select"
              value={selectedZoneId}
              onChange={(e) => setSelectedZoneId(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border text-sm font-medium"
              style={{
                backgroundColor: "var(--bg-chassis)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            >
              {POTOSI_ZONES.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name} (~{z.distanceKm} km · {z.estMinutes} min)
                </option>
              ))}
            </select>
            <p className="text-xs italic" style={{ color: "var(--text-muted)" }}>
              {currentZone.description}
            </p>
          </div>

          {/* Step 3: Exact Address or Landmark */}
          <div className="space-y-2">
            <label htmlFor="potosi-address-input" className="block text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              3. Calle, número o referencia (opcional)
            </label>
            <input
              id="potosi-address-input"
              type="text"
              value={customAddress}
              onChange={(e) => setCustomAddress(e.target.value)}
              placeholder="Ej. Calle Hoyos esq. Bustillos / Cerca al Colegio Pichincha"
              className="w-full h-10 px-3 rounded-lg border text-sm"
              style={{
                backgroundColor: "var(--bg-chassis)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Rate Summary Card */}
          <div
            className="rounded-xl border p-4 space-y-3"
            style={{
              backgroundColor: "var(--bg-chassis)",
              borderColor: isClickTechBuyer ? "rgba(0, 229, 255, 0.4)" : "var(--border-subtle)",
            }}
          >
            <div className="flex items-center justify-between text-xs border-b pb-2" style={{ borderColor: "var(--border-subtle)" }}>
              <span style={{ color: "var(--text-muted)" }}>Origen:</span>
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                🏬 Taller Central ClickTech (Potosí Centro)
              </span>
            </div>
            <div className="flex items-center justify-between text-xs border-b pb-2" style={{ borderColor: "var(--border-subtle)" }}>
              <span style={{ color: "var(--text-muted)" }}>Destino:</span>
              <span className="font-semibold" style={{ color: "var(--accent-cyan)" }}>
                📍 {currentZone.name}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                <Navigation className="w-3.5 h-3.5" style={{ color: "var(--accent-cyan)" }} />
                <span>Distancia: <strong>~{currentZone.distanceKm} km</strong></span>
              </div>
              <div className="flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                <Clock className="w-3.5 h-3.5" style={{ color: "var(--accent-purple)" }} />
                <span>Tiempo viaje: <strong>~{currentZone.estMinutes} min</strong></span>
              </div>
            </div>

            <div className="pt-2 flex items-baseline justify-between">
              <div>
                <span className="text-xs uppercase font-semibold block" style={{ color: "var(--text-muted)" }}>
                  Costo de traslado a domicilio:
                </span>
                <span className="text-[11px]" style={{ color: isClickTechBuyer ? "var(--status-ok)" : "var(--text-secondary)" }}>
                  {isClickTechBuyer ? "Bonificación de cliente ClickTech (100% libre)" : "Cubre costo logístico de ida y retorno en Potosí"}
                </span>
              </div>
              <div className="text-right">
                <span
                  className="font-display text-2xl font-black tabular-nums"
                  style={{ color: isClickTechBuyer ? "var(--status-ok)" : "var(--accent-cyan)" }}
                >
                  {isClickTechBuyer ? "GRATIS (Bs 0)" : formatBs(finalFeeBs * 100)}
                </span>
                {isClickTechBuyer && (
                  <span className="block text-[10px] line-through tabular-nums" style={{ color: "var(--text-muted)" }}>
                    Regular: Bs {currentZone.regularFeeBs},00
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Direct WhatsApp Call to Action */}
          <div className="space-y-2">
            <a
              href={`https://wa.me/59167605477?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ct-btn w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-transform"
              style={{
                backgroundColor: "#25D366",
                color: "#FFFFFF",
              }}
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              Solicitar visita técnica por WhatsApp (+591 67605477)
            </a>
            <p className="text-[11px] text-center" style={{ color: "var(--text-muted)" }}>
              También puedes traer tu equipo directamente a nuestro taller central sin costo de recepción.
            </p>
          </div>
        </div>

        {/* Interactive Google Maps View */}
        <div className="lg:col-span-6 space-y-3">
          <div
            className="rounded-xl border overflow-hidden relative aspect-[4/3] sm:aspect-[16/11]"
            style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-chassis)" }}
          >
            {/* Embedded Google Map of Potosi, Bolivia */}
            <iframe
              title="Mapa de cobertura ClickTech en Potosí, Bolivia"
              width="100%"
              height="100%"
              style={{ border: 0, filter: "invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%)" }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://maps.google.com/maps?q=${currentZone.coords.lat},${currentZone.coords.lng}&hl=es&z=14&output=embed`}
            />

            {/* Floating Map Route Overlay */}
            <div
              className="absolute top-3 left-3 right-3 p-3 rounded-lg border backdrop-blur-md shadow-lg flex items-center justify-between gap-3 text-xs"
              style={{
                backgroundColor: "rgba(2, 4, 10, 0.85)",
                borderColor: "var(--border-strong)",
                color: "var(--text-primary)",
              }}
            >
              <div className="flex items-center gap-2 truncate">
                <Car className="w-4 h-4 shrink-0" style={{ color: "var(--accent-cyan)" }} />
                <span className="truncate">
                  Ruta activa: <strong>Centro</strong> ➔ <strong>{currentZone.name}</strong>
                </span>
              </div>
              <a
                href={`https://www.google.com/maps/dir/-19.5888,-65.7538/${currentZone.coords.lat},${currentZone.coords.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-[11px] underline shrink-0"
                style={{ color: "var(--accent-cyan)" }}
              >
                Abrir en Google Maps <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Bottom route indicator */}
            <div
              className="absolute bottom-3 left-3 right-3 p-2.5 rounded-lg border backdrop-blur-md flex items-center justify-between text-xs"
              style={{
                backgroundColor: "rgba(10, 15, 29, 0.9)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                Potosí, Bolivia (3.900 a 4.100 msnm)
              </span>
              <span className="font-semibold text-[11px]" style={{ color: isClickTechBuyer ? "var(--status-ok)" : "var(--accent-cyan)" }}>
                {isClickTechBuyer ? "✓ Traslado bonificado (Bs 0)" : `Tarifa: Bs ${currentZone.regularFeeBs}`}
              </span>
            </div>
          </div>

          <div
            className="p-3 rounded-xl border text-xs space-y-1"
            style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)" }}
          >
            <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
              ¿Cómo funciona el servicio a domicilio en Potosí?
            </p>
            <ol className="list-decimal pl-4 space-y-1" style={{ color: "var(--text-secondary)" }}>
              <li>Envías tu ubicación exacta o zona por WhatsApp (+591 67605477).</li>
              <li>El técnico confirma turno de llegada (mismo día o programado).</li>
              <li>Se realiza diagnóstico in situ, limpieza profunda, cambio de pasta térmica o retiro seguro a taller si requiere micro-soldadura.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
