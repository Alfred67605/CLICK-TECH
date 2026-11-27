"use client";

import React, { useMemo, useState } from "react";
import { Crosshair, ExternalLink, MapPin, Navigation, Store } from "lucide-react";
import { STORE_LOCATION } from "@/lib/domain/status-labels";

interface LandmarkPreset {
  id: string;
  label: string;
  street: string;
  lat: number;
  lng: number;
  xPct: number;
  yPct: number;
  zoneHint: string;
}

const POTOSI_PRESETS: LandmarkPreset[] = [
  {
    id: "oruro",
    label: "Calle Oruro (Tienda ClickTech)",
    street: "Calle Oruro, Zona Central",
    lat: -19.5886,
    lng: -65.7536,
    xPct: 50,
    yPct: 52,
    zoneHint: "centro",
  },
  {
    id: "plaza-10",
    label: "Plaza 10 de Noviembre / Casco Histórico",
    street: "Plaza 10 de Noviembre esq. Bolívar",
    lat: -19.5892,
    lng: -65.7531,
    xPct: 62,
    yPct: 72,
    zoneHint: "centro",
  },
  {
    id: "san-roque",
    label: "San Roque / Zona Alta",
    street: "Plaza El Minero / Barrio San Roque",
    lat: -19.5822,
    lng: -65.7605,
    xPct: 28,
    yPct: 36,
    zoneHint: "zona-alta",
  },
  {
    id: "plan-40",
    label: "Plan 40 / Av. Universitaria",
    street: "Av. Universitaria esq. Plan 40",
    lat: -19.5748,
    lng: -65.7488,
    xPct: 68,
    yPct: 28,
    zoneHint: "plan-40",
  },
  {
    id: "satelite",
    label: "Ciudad Satélite / UATF",
    street: "Ciudad Satélite / Campus UATF",
    lat: -19.5635,
    lng: -65.7642,
    xPct: 22,
    yPct: 16,
    zoneHint: "satelite",
  },
  {
    id: "delicias",
    label: "Las Delicias / Villa Copacabana",
    street: "Av. Las Delicias",
    lat: -19.569,
    lng: -65.741,
    xPct: 82,
    yPct: 22,
    zoneHint: "delicias",
  },
];

function calcDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  const km = 2 * 6371 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.max(0.2, Math.round(km * 10) / 10);
}

export function PotosiPinMap({
  mode,
  selectedCoords,
  onSelectLocation,
}: {
  mode: "PICKUP_POTOSI" | "LOCAL_DELIVERY" | "DELIVERY_QUOTE_REQUESTED";
  selectedCoords: { lat: number; lng: number } | null;
  onSelectLocation: (loc: { lat: number; lng: number; suggestedStreet?: string; zoneHint?: string }) => void;
}) {
  const [pinPct, setPinPct] = useState<{ x: number; y: number }>({ x: 56, y: 44 });
  const [gpsLoading, setGpsLoading] = useState(false);

  const activeLat = selectedCoords?.lat ?? -19.5865;
  const activeLng = selectedCoords?.lng ?? -65.7512;

  const distanceKm = useMemo(
    () => calcDistanceKm(STORE_LOCATION.lat, STORE_LOCATION.lng, activeLat, activeLng),
    [activeLat, activeLng]
  );
  const etaMins = Math.max(8, Math.round(distanceKm * 5.2 + 6));

  const mapEmbedUrl =
    mode === "PICKUP_POTOSI"
      ? `https://maps.google.com/maps?q=${STORE_LOCATION.lat},${STORE_LOCATION.lng}&hl=es&z=16&output=embed`
      : `https://maps.google.com/maps?saddr=${STORE_LOCATION.lat},${STORE_LOCATION.lng}&daddr=${activeLat},${activeLng}&hl=es&output=embed`;

  function handlePadClick(e: React.MouseEvent<HTMLDivElement>) {
    if (mode !== "LOCAL_DELIVERY") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = Math.min(94, Math.max(6, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.min(92, Math.max(8, ((e.clientY - rect.top) / rect.height) * 100));
    setPinPct({ x: xPct, y: yPct });

    // Map visual pad centered on Calle Oruro (-19.5886, -65.7536) across Potosi urban radius
    const newLat = Number((-19.5886 + ((50 - yPct) / 100) * 0.042).toFixed(5));
    const newLng = Number((-65.7536 + ((xPct - 50) / 100) * 0.042).toFixed(5));
    const dKm = calcDistanceKm(STORE_LOCATION.lat, STORE_LOCATION.lng, newLat, newLng);
    const zoneHint =
      dKm <= 1.6 ? "centro" : dKm <= 2.9 ? "zona-alta" : dKm <= 4.5 ? "plan-40" : "satelite";

    onSelectLocation({
      lat: newLat,
      lng: newLng,
      suggestedStreet: `Punto marcado en mapa Potosí (${newLat.toFixed(4)}, ${newLng.toFixed(4)})`,
      zoneHint,
    });
  }

  function useCurrentGps() {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        const lat = Number(pos.coords.latitude.toFixed(5));
        const lng = Number(pos.coords.longitude.toFixed(5));
        onSelectLocation({
          lat,
          lng,
          suggestedStreet: `Ubicación GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        });
      },
      () => {
        setGpsLoading(false);
      },
      { timeout: 6000 }
    );
  }

  return (
    <div
      className="rounded-xl border p-4 space-y-3"
      style={{
        backgroundColor: "var(--bg-chassis)",
        borderColor: "var(--border-subtle)",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold" style={{ color: "var(--text-primary)" }}>
          <Store className="w-4 h-4" style={{ color: "var(--accent-cyan)" }} />
          <span>
            {mode === "PICKUP_POTOSI"
              ? "Ubicación oficial de retiro: ClickTech Calle Oruro, Potosí"
              : "Mapa de ruta desde ClickTech (Calle Oruro, Potosí)"}
          </span>
        </div>

        <a
          href={
            mode === "PICKUP_POTOSI"
              ? `https://www.google.com/maps/search/?api=1&query=${STORE_LOCATION.lat},${STORE_LOCATION.lng}`
              : `https://www.google.com/maps/dir/${STORE_LOCATION.lat},${STORE_LOCATION.lng}/${activeLat},${activeLng}`
          }
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-bold inline-flex items-center gap-1 underline"
          style={{ color: "var(--accent-cyan)" }}
        >
          Abrir en Google Maps <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {mode === "LOCAL_DELIVERY" && (
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]" style={{ color: "var(--text-secondary)" }}>
            <span>Haz clic en el plano de Potosí o elige un punto cercano para fijar tu pin de entrega:</span>
            <button
              type="button"
              onClick={useCurrentGps}
              disabled={gpsLoading}
              className="ct-btn px-2.5 py-1 rounded-lg border font-semibold inline-flex items-center gap-1"
              style={{
                borderColor: "var(--border-strong)",
                backgroundColor: "var(--accent-cyan-soft)",
                color: "var(--accent-cyan)",
              }}
            >
              <Crosshair className="w-3 h-3" />
              {gpsLoading ? "Buscando GPS..." : "Usar mi ubicación"}
            </button>
          </div>

          {/* Interactive Clickable Potosi Urban Pin-Drop Pad */}
          <div
            onClick={handlePadClick}
            role="button"
            tabIndex={0}
            aria-label="Plano interactivo de Potosí para marcar punto de entrega desde Calle Oruro"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                onSelectLocation({ lat: -19.5892, lng: -65.7531, suggestedStreet: "Plaza 10 de Noviembre, Potosí", zoneHint: "centro" });
              }
            }}
            className="relative h-44 w-full rounded-xl border overflow-hidden cursor-crosshair select-none"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-strong)",
              backgroundImage:
                "linear-gradient(to right, var(--grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          >
            {/* Dashed route line from Calle Oruro store (50%, 52%) to user pin */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              <line
                x1="50"
                y1="52"
                x2={pinPct.x}
                y2={pinPct.y}
                stroke="#00E5FF"
                strokeWidth="0.9"
                strokeDasharray="2.2 1.8"
              />
            </svg>

            {/* Preset clickable landmarks */}
            {POTOSI_PRESETS.slice(1).map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={(ev) => {
                  ev.stopPropagation();
                  setPinPct({ x: preset.xPct, y: preset.yPct });
                  onSelectLocation({
                    lat: preset.lat,
                    lng: preset.lng,
                    suggestedStreet: preset.street,
                    zoneHint: preset.zoneHint,
                  });
                }}
                style={{ left: `${preset.xPct}%`, top: `${preset.yPct}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded-full border text-[10px] font-medium whitespace-nowrap hover:scale-105 transition-transform"
                title={`Marcar ${preset.label}`}
              >
                <span
                  className="px-1.5 py-0.5 rounded-full border"
                  style={{
                    backgroundColor: "var(--bg-chassis)",
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {preset.label.split("/")[0].trim()}
                </span>
              </button>
            ))}

            {/* Origin Store Marker: ClickTech Calle Oruro */}
            <div
              style={{ left: "50%", top: "52%" }}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center"
            >
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-extrabold shadow-md whitespace-nowrap"
                style={{ backgroundColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }}
              >
                🏪 ClickTech Calle Oruro
              </span>
            </div>

            {/* Destination Pin Marker */}
            <div
              style={{ left: `${pinPct.x}%`, top: `${pinPct.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-full pointer-events-none flex flex-col items-center"
            >
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white shadow">
                📍 Tu entrega
              </span>
              <MapPin className="w-5 h-5 text-rose-500 drop-shadow" />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] px-2 py-1.5 rounded-lg border" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
            <span className="flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
              <Navigation className="w-3.5 h-3.5" style={{ color: "var(--accent-cyan)" }} />
              Origen: <strong>Calle Oruro</strong> → Destino: <strong>{activeLat.toFixed(4)}, {activeLng.toFixed(4)}</strong>
            </span>
            <span className="font-bold" style={{ color: "var(--accent-cyan)" }}>
              ~{distanceKm} km · {etaMins} min aprox.
            </span>
          </div>
        </div>
      )}

      {/* Embedded Live Google Map */}
      <div
        className="rounded-xl border overflow-hidden h-52 sm:h-60 relative"
        style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}
      >
        <iframe
          title="Mapa Google Maps ClickTech Calle Oruro Potosí"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={mapEmbedUrl}
        />
      </div>
    </div>
  );
}
