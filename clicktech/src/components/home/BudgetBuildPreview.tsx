"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Cpu, HardDrive, Layers, ShieldCheck, ShoppingCart, Zap } from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";
import { formatBsCompact } from "@/lib/domain/money";

export interface PrebuiltPcSummary {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  prebuiltTier: string | null;
  imageUrl: string | null;
  imageAlt: string;
  specs: Record<string, string>;
  stockAvailable: number;
}

const TIER_META: Record<
  string,
  {
    shortLabel: string;
    audience: string;
    scores: { gaming: number; productivity: number; upgradeability: number };
  }
> = {
  INICIAL: {
    shortLabel: "Gamer Inicial",
    audience: "Esports 1080p y clases",
    scores: { gaming: 0.68, productivity: 0.78, upgradeability: 0.92 },
  },
  ESTUDIO_TRABAJO: {
    shortLabel: "Estudio y Trabajo",
    audience: "Multitarea 32GB y oficina",
    scores: { gaming: 0.58, productivity: 0.96, upgradeability: 0.9 },
  },
  ESTUDIO: {
    shortLabel: "Estudio y Trabajo",
    audience: "Multitarea 32GB y oficina",
    scores: { gaming: 0.58, productivity: 0.96, upgradeability: 0.9 },
  },
  EQUILIBRADA: {
    shortLabel: "Gamer RTX 4060",
    audience: "1080p/1440p Ultra + Streaming",
    scores: { gaming: 0.95, productivity: 0.9, upgradeability: 0.95 },
  },
};

export function BudgetBuildPreview({ pcs }: { pcs: PrebuiltPcSummary[] }) {
  const { addToCart } = useStore();
  const [activeIndex, setActiveIndex] = useState(() => (pcs.length > 1 ? 1 : 0));
  const [adding, setAdding] = useState(false);

  if (pcs.length === 0) return null;

  const activePc = pcs[activeIndex] ?? pcs[0];
  const tierKey = activePc.prebuiltTier ?? "INICIAL";
  const meta = TIER_META[tierKey] ?? TIER_META.INICIAL;
  const specEntries = Object.entries(activePc.specs).slice(0, 6);

  async function handleQuickAdd() {
    if (adding || activePc.stockAvailable <= 0) return;
    setAdding(true);
    await addToCart(activePc.id, 1);
    setAdding(false);
  }

  return (
    <section
      aria-label="Selector interactivo de PCs armadas"
      className="ct-container space-y-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
            Elige tu PC armada según tu presupuesto
          </h2>
          <p className="text-sm max-w-2xl" style={{ color: "var(--text-secondary)" }}>
            Compara cada configuración armada y probada en taller antes de personalizarla o añadirla directa a tu pedido.
          </p>
        </div>

        {/* Tier Tabs */}
        <div
          role="tablist"
          aria-label="Niveles de PC armada"
          className="inline-flex flex-wrap gap-1.5 p-1.5 rounded-xl border"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-subtle)",
          }}
        >
          {pcs.map((pc, idx) => {
            const isSelected = idx === activeIndex;
            const pcMeta = TIER_META[pc.prebuiltTier ?? "INICIAL"] ?? TIER_META.INICIAL;
            return (
              <button
                key={pc.id}
                role="tab"
                type="button"
                aria-selected={isSelected}
                data-sound="toggleOn"
                onClick={() => setActiveIndex(idx)}
                className="ct-btn h-10 px-4 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2"
                style={{
                  backgroundColor: isSelected ? "var(--accent-cyan)" : "transparent",
                  color: isSelected ? "var(--accent-cyan-ink)" : "var(--text-secondary)",
                }}
              >
                <span>{pcMeta.shortLabel}</span>
                <span
                  className="font-mono text-[11px] tabular-nums opacity-85"
                >
                  {formatBsCompact(pc.priceCents)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Showcase Card */}
      <div
        className="rounded-2xl border overflow-hidden grid grid-cols-1 lg:grid-cols-12"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {/* Left Visual Stage */}
        <div
          className="lg:col-span-5 relative p-6 sm:p-8 flex flex-col justify-between min-h-[280px] sm:min-h-[340px]"
          style={{ backgroundColor: "var(--bg-card-media)" }}
        >
          <div className="flex items-center justify-between gap-2 relative z-10">
            <span
              className="px-3 py-1 rounded-full text-xs font-bold border"
              style={{
                backgroundColor: "var(--accent-purple-soft)",
                borderColor: "var(--accent-purple)",
                color: "var(--text-primary)",
              }}
            >
              {meta.audience}
            </span>
            <span
              className="px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5"
              style={{
                backgroundColor: "rgba(16, 185, 129, 0.12)",
                borderColor: "rgba(16, 185, 129, 0.35)",
                color: "var(--status-ok)",
              }}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Mantenimiento Bs 0
            </span>
          </div>

          <div className="my-4 aspect-[16/10] w-full flex items-center justify-center overflow-hidden rounded-xl">
            {activePc.imageUrl ? (
              <img
                key={activePc.id}
                src={activePc.imageUrl}
                alt={activePc.imageAlt}
                className="w-full h-full object-contain ct-zoom-media"
              />
            ) : (
              <Cpu className="w-12 h-12 opacity-40" />
            )}
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
            <span>Ensamblaje y pruebas térmicas incluidas</span>
            <span className="font-mono font-semibold" style={{ color: activePc.stockAvailable > 0 ? "var(--status-ok)" : "var(--status-danger)" }}>
              {activePc.stockAvailable > 0 ? `${activePc.stockAvailable} en stock` : "Bajo pedido"}
            </span>
          </div>
        </div>

        {/* Right Specs & Performance Meters */}
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-1">
                <h3 className="font-heading text-xl sm:text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                  {activePc.name}
                </h3>
                <p className="text-sm leading-relaxed max-w-2xl" style={{ color: "var(--text-secondary)" }}>
                  {activePc.description}
                </p>
              </div>
              <div className="sm:text-right shrink-0">
                <span className="text-xs block" style={{ color: "var(--text-muted)" }}>
                  Precio total armado
                </span>
                <span className="font-heading text-2xl sm:text-3xl font-black tabular-nums" style={{ color: "var(--accent-cyan)" }}>
                  {formatBsCompact(activePc.priceCents)}
                </span>
              </div>
            </div>

            {/* Hardware Breakdown Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {specEntries.map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border px-3 py-2.5"
                  style={{
                    backgroundColor: "var(--bg-chassis)",
                    borderColor: "var(--border-subtle)",
                  }}
                >
                  <span className="text-[11px] block" style={{ color: "var(--text-muted)" }}>
                    {label}
                  </span>
                  <span className="text-xs font-semibold block truncate" title={value} style={{ color: "var(--text-primary)" }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* GPU-accelerated scaleX capability meters */}
            <div
              className="rounded-xl border p-4 grid grid-cols-1 sm:grid-cols-3 gap-4"
              style={{
                backgroundColor: "var(--bg-chassis)",
                borderColor: "var(--border-subtle)",
              }}
            >
              {[
                { label: "Gaming 1080p", value: meta.scores.gaming, icon: Zap, color: "var(--accent-cyan)" },
                { label: "Estudio y Productividad", value: meta.scores.productivity, icon: Layers, color: "var(--accent-purple)" },
                { label: "Margen de Mejora", value: meta.scores.upgradeability, icon: HardDrive, color: "var(--status-ok)" },
              ].map((meter) => {
                const Icon = meter.icon;
                const pct = Math.round(meter.value * 100);
                return (
                  <div key={meter.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-medium" style={{ color: "var(--text-secondary)" }}>
                        <Icon className="w-3.5 h-3.5" style={{ color: meter.color }} />
                        {meter.label}
                      </span>
                      <span className="font-mono font-bold tabular-nums" style={{ color: meter.color }}>
                        {pct}%
                      </span>
                    </div>
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: "var(--bg-elevated)" }}
                    >
                      <div
                        className="h-full rounded-full origin-left"
                        style={{
                          backgroundColor: meter.color,
                          transform: `scaleX(${meter.value})`,
                          transition: "transform 280ms var(--ease-out)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t" style={{ borderColor: "var(--border-subtle)" }}>
            <button
              type="button"
              data-sound="none"
              disabled={adding || activePc.stockAvailable <= 0}
              onClick={handleQuickAdd}
              className="ct-btn ct-btn-primary h-11 px-5 rounded-xl font-bold text-sm flex items-center gap-2 disabled:opacity-45"
              style={{
                backgroundColor: "var(--accent-cyan)",
                color: "var(--accent-cyan-ink)",
              }}
            >
              {adding ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
              {activePc.stockAvailable > 0 ? "Añadir PC al carrito" : "Consultar disponibilidad"}
            </button>

            <Link
              href={`/producto/${activePc.slug}`}
              className="ct-btn h-11 px-4 rounded-xl border text-sm font-semibold flex items-center gap-1.5"
              style={{
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            >
              Ver ficha técnica
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/arma-tu-pc"
              className="ct-btn h-11 px-4 rounded-xl border text-sm font-semibold flex items-center gap-1.5 ml-auto"
              style={{
                borderColor: "var(--accent-purple)",
                backgroundColor: "var(--accent-purple-soft)",
                color: "var(--text-primary)",
              }}
            >
              <Cpu className="w-4 h-4" style={{ color: "var(--accent-purple)" }} />
              Personalizar piezas
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
