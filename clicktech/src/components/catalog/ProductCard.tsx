"use client";

import React from "react";
import Link from "next/link";
import { Check, Cpu, HardDrive, Layers, Scale, ShoppingCart, Sparkles, Wrench, Zap } from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";
import { formatBsCompact } from "@/lib/domain/money";

export interface ProductCardData {
  id: string;
  sku: string;
  slug: string;
  name: string;
  model: string;
  brandName: string;
  categorySlug: string;
  categoryName: string;
  imageUrl: string | null;
  imageAlt: string;
  isIllustrative: boolean;
  priceCents: number;
  promoPriceCents: number | null;
  promoLabel: string | null;
  stockAvailable: number;
  socket?: string | null;
  ramGeneration?: string | null;
  isPrebuiltPc?: boolean;
  shortSpecsJson?: Record<string, string> | null;
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const { addToCart, compareItems, toggleCompare } = useStore();
  const [justAdded, setJustAdded] = React.useState(false);
  const inCompare = compareItems.some((c) => c.id === product.id);
  const activePrice = product.promoPriceCents ?? product.priceCents;
  const inStock = product.stockAvailable > 0;

  // Extract key specs chips for quick glancing
  const specs = (product.shortSpecsJson ?? {}) as Record<string, string>;
  const specChips: string[] = [];

  if (product.isPrebuiltPc) {
    if (specs.CPU) specChips.push(specs.CPU);
    if (specs.GPU) specChips.push(specs.GPU);
    if (specs.RAM) specChips.push(specs.RAM);
  } else {
    if (product.socket) specChips.push(`Socket ${product.socket}`);
    else if (specs.Socket) specChips.push(`Socket ${specs.Socket}`);

    if (product.ramGeneration) specChips.push(product.ramGeneration);
    else if (specs.Tipo) specChips.push(specs.Tipo);

    if (specs.Núcleos) specChips.push(specs.Núcleos.split("/")[0].trim() + " Núcleos");
    if (specs.Capacidad) specChips.push(specs.Capacidad);
    if (specs.VRAM) specChips.push(specs.VRAM);
    if (specs.Potencia) specChips.push(specs.Potencia);
  }

  // Compatibility quick hint
  let compatHint: { icon: typeof Cpu; text: string; color: string } | null = null;
  if (product.isPrebuiltPc) {
    compatHint = {
      icon: Wrench,
      text: "Mantenimiento Bs 0 (Gratis de por vida)",
      color: "text-emerald-400 bg-emerald-950/40 border-emerald-500/30",
    };
  } else if (product.categorySlug === "memorias-ram" || product.ramGeneration) {
    const gen = product.ramGeneration || "DDR4";
    compatHint = {
      icon: Cpu,
      text: `Compatible con placas ${gen} (${gen === "DDR4" ? "A520, B550, B450, H610" : "AM5, B650, Z790"})`,
      color: "text-cyan-400 bg-cyan-950/40 border-cyan-500/30",
    };
  } else if (product.categorySlug === "procesadores" || product.socket) {
    const sock = product.socket || "AM4";
    compatHint = {
      icon: Cpu,
      text: `Compatible: Sockets ${sock} (${sock === "AM4" ? "Placas A520, B450, B550" : sock === "AM5" ? "Placas B650, X670" : "Placas B760, H610"})`,
      color: "text-cyan-400 bg-cyan-950/40 border-cyan-500/30",
    };
  } else if (product.categorySlug === "tarjetas-graficas") {
    compatHint = {
      icon: Zap,
      text: "Ranura PCIe x16 estándar (Fuente recomendada: 550W+)",
      color: "text-purple-300 bg-purple-950/40 border-purple-500/30",
    };
  } else if (product.categorySlug === "placas-madre") {
    compatHint = {
      icon: Layers,
      text: `Socket ${product.socket ?? "AM4"} · Soporta RAM ${product.ramGeneration ?? "DDR4"}`,
      color: "text-cyan-400 bg-cyan-950/40 border-cyan-500/30",
    };
  }

  return (
    <article
      className="ct-card group relative rounded-2xl border flex flex-col overflow-hidden transition-all duration-300 hover:border-cyan-400/60 hover:shadow-[0_0_28px_rgba(0,229,255,0.16)]"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--border-subtle)",
      }}
    >
      {/* Cyberpunk Top Neon Accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/40 group-hover:via-cyan-400 to-transparent transition-all duration-300 z-10" />

      {/* Media Link with Pedestal Glow */}
      <Link
        href={`/producto/${product.slug}`}
        className="relative aspect-[4/3] w-full flex items-center justify-center p-5 overflow-hidden transition-colors"
        style={{ backgroundColor: "var(--bg-card-media)" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,229,255,0.06)_0%,transparent_75%)] pointer-events-none" />

        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.imageAlt}
            loading="lazy"
            className="ct-zoom-media w-full h-full object-contain relative z-10 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="text-xs relative z-10" style={{ color: "var(--text-muted)" }}>
            Sin fotografía registrada
          </span>
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5">
          {product.isPrebuiltPc ? (
            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-cyan-950/85 text-cyan-300 border border-cyan-500/40 backdrop-blur-md flex items-center gap-1 shadow-sm">
              <Sparkles className="w-3 h-3 text-cyan-400" /> PC COMPLETA
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded text-[10px] font-medium tracking-wide uppercase bg-slate-900/80 text-slate-300 border border-slate-700/60 backdrop-blur-md shadow-sm">
              {product.isIllustrative ? "FOTO REFERENCIAL HD" : "FOTO DEL MODELO"}
            </span>
          )}
        </div>

        {/* Stock / Promo Badge */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
          {product.promoLabel && product.promoPriceCents ? (
            <span
              className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide shadow-sm"
              style={{
                backgroundColor: "var(--accent-purple)",
                color: "#ffffff",
              }}
            >
              {product.promoLabel}
            </span>
          ) : (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border backdrop-blur-md flex items-center gap-1.5 shadow-sm ${
                inStock
                  ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                  : "bg-rose-950/80 text-rose-300 border-rose-500/40"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  inStock ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
                }`}
              />
              {inStock ? `Stock: ${product.stockAvailable}` : "Agotado"}
            </span>
          )}
        </div>
      </Link>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col gap-3">
        {/* Brand & SKU */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-bold tracking-wider text-[11px] uppercase flex items-center gap-1.5" style={{ color: "var(--accent-cyan)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            {product.brandName}
          </span>
          <span className="font-mono text-[10px] tabular-nums px-1.5 py-0.5 rounded border" style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
            {product.sku}
          </span>
        </div>

        {/* Title */}
        <Link
          href={`/producto/${product.slug}`}
          className="font-heading font-bold text-base leading-snug line-clamp-2 transition-colors hover:text-cyan-300"
          style={{ color: "var(--text-primary)" }}
        >
          {product.name}
        </Link>

        {/* Subtitle / Model */}
        <p className="text-xs line-clamp-1" style={{ color: "var(--text-muted)" }}>
          {product.categoryName} · {product.model}
        </p>

        {/* Technical Micro-Chips */}
        {specChips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {specChips.slice(0, 3).map((chip, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded text-[10px] font-medium border font-mono tracking-tight"
                style={{
                  backgroundColor: "rgba(0, 229, 255, 0.05)",
                  borderColor: "rgba(0, 229, 255, 0.2)",
                  color: "var(--text-secondary)",
                }}
              >
                {chip}
              </span>
            ))}
          </div>
        )}

        {/* Compatibility Direct Hint */}
        {compatHint && (
          <div
            className={`flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded border line-clamp-1 ${compatHint.color}`}
          >
            <compatHint.icon className="w-3 h-3 shrink-0" />
            <span className="truncate">{compatHint.text}</span>
          </div>
        )}

        {/* Pricing and Actions Footer */}
        <div className="mt-auto pt-3 space-y-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <span className="font-heading text-xl sm:text-2xl font-black tabular-nums tracking-tight" style={{ color: "var(--text-primary)" }}>
                {formatBsCompact(activePrice)}
              </span>
              {product.promoPriceCents && product.promoPriceCents < product.priceCents && (
                <span className="ml-2 text-xs line-through tabular-nums" style={{ color: "var(--text-muted)" }}>
                  {formatBsCompact(product.priceCents)}
                </span>
              )}
            </div>
            <span
              className="text-[11px] font-semibold tabular-nums px-2 py-0.5 rounded"
              style={{
                backgroundColor: inStock ? "rgba(16, 185, 129, 0.12)" : "rgba(244, 63, 94, 0.12)",
                color: inStock ? "var(--status-ok)" : "var(--status-danger)",
              }}
            >
              {inStock ? "Disponible" : "Sin existencias"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!inStock}
              onClick={() => {
                addToCart(product.id, 1);
                setJustAdded(true);
                setTimeout(() => setJustAdded(false), 1400);
              }}
              className="ct-btn flex-1 h-10 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shadow-md transition-all active:scale-95"
              style={{
                backgroundColor: justAdded ? "var(--status-ok)" : "var(--accent-cyan)",
                color: justAdded ? "#ffffff" : "var(--accent-cyan-ink)",
              }}
            >
              {justAdded ? (
                <>
                  <Check className="w-4 h-4 animate-in zoom-in-75 duration-150" />
                  <span>¡Añadido!</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  <span>{inStock ? "Añadir" : "Agotado"}</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() =>
                toggleCompare({
                  id: product.id,
                  slug: product.slug,
                  sku: product.sku,
                  name: product.name,
                  categorySlug: product.categorySlug,
                  categoryName: product.categoryName,
                  imageUrl: product.imageUrl,
                  priceCents: activePrice,
                })
              }
              aria-label={inCompare ? "Quitar de comparación" : "Comparar modelo"}
              aria-pressed={inCompare}
              className="ct-btn h-10 px-3 rounded-xl border flex items-center justify-center gap-1 text-xs font-semibold active:scale-95 transition-all"
              style={{
                borderColor: inCompare ? "var(--accent-cyan)" : "var(--border-subtle)",
                backgroundColor: inCompare ? "var(--accent-cyan-soft)" : "transparent",
                color: inCompare ? "var(--accent-cyan)" : "var(--text-secondary)",
              }}
            >
              {inCompare ? <Check className="w-4 h-4" /> : <Scale className="w-4 h-4" />}
              <span className="sr-only sm:not-sr-only">Comparar</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
