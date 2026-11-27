"use client";

import React from "react";
import Link from "next/link";
import { Check, ChevronRight, Flame, Scale, ShoppingCart, Sparkles } from "lucide-react";
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
  const hasDiscount = product.promoPriceCents !== null && product.promoPriceCents < product.priceCents;
  const isPromo = Boolean(product.promoLabel?.toUpperCase().includes("BLACK FRIDAY")) || hasDiscount;
  const discountPct = hasDiscount
    ? Math.max(1, Math.round(((product.priceCents - activePrice) / product.priceCents) * 100))
    : 0;
  const inStock = product.stockAvailable > 0;
  const lowStock = inStock && product.stockAvailable <= 3;

  const specs = (product.shortSpecsJson ?? {}) as Record<string, string>;
  let highlightSpec = "";
  if (product.isPrebuiltPc) {
    highlightSpec = [specs.CPU, specs.GPU, specs.RAM].filter(Boolean).join(" · ");
  } else if (product.socket) {
    highlightSpec = `Socket ${product.socket}${product.ramGeneration ? ` · ${product.ramGeneration}` : ""}`;
  } else if (product.ramGeneration) {
    highlightSpec = `${product.ramGeneration}${specs.Capacidad ? ` · ${specs.Capacidad}` : ""}`;
  } else if (specs.Capacidad || specs.VRAM || specs.Potencia) {
    highlightSpec = [specs.Capacidad, specs.VRAM, specs.Potencia].filter(Boolean).join(" · ");
  } else {
    highlightSpec = product.model;
  }

  const accentColor = isPromo ? "#C8102E" : "#0284C7";
  const ribbonGradient = isPromo
    ? "linear-gradient(90deg, #DC2626 0%, #991B1B 100%)"
    : product.isPrebuiltPc
    ? "linear-gradient(90deg, #0284C7 0%, #0369A1 100%)"
    : "linear-gradient(90deg, #0F172A 0%, #334155 100%)";

  return (
    <article
      className="ct-card group relative min-w-0 w-full rounded-2xl flex flex-col overflow-hidden p-3.5 sm:p-4 transition-all"
      style={{
        background: isPromo
          ? "linear-gradient(180deg, #FFFFFF 0%, #FFF5F5 48%, #FFFFFF 100%)"
          : "linear-gradient(180deg, #FFFFFF 0%, #F1F5F9 48%, #FFFFFF 100%)",
        border: isPromo ? "1.5px solid rgba(220, 38, 38, 0.44)" : "1.5px solid rgba(148, 163, 184, 0.42)",
        boxShadow: isPromo
          ? "0 14px 32px -16px rgba(200, 16, 46, 0.28)"
          : "0 14px 30px -16px rgba(15, 23, 42, 0.18)",
      }}
    >
      {/* Top-Right & Bottom-Left Diagonal Flyer Accents */}
      <div aria-hidden="true" className="pointer-events-none absolute top-2.5 right-2.5 z-0 flex items-center gap-1.5 opacity-90">
        <span
          className="block w-3.5 h-11 -skew-x-[22deg]"
          style={{
            background: isPromo
              ? "linear-gradient(180deg, #DC2626 0%, rgba(220,38,38,0.12) 100%)"
              : "linear-gradient(180deg, #0284C7 0%, rgba(2,132,199,0.12) 100%)",
          }}
        />
        <span
          className="block w-2.5 h-9 -skew-x-[22deg] translate-y-2"
          style={{ background: "linear-gradient(180deg, #CBD5E1 0%, rgba(203,213,225,0.15) 100%)" }}
        />
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-2 z-0 flex items-end gap-1.5 opacity-85">
        <span
          className="block w-5 h-7 skew-x-[22deg] translate-y-1"
          style={{ background: "linear-gradient(180deg, #CBD5E1 0%, #94A3B8 100%)" }}
        />
        <span
          className="block w-2.5 h-9 skew-x-[22deg] translate-y-1"
          style={{ background: ribbonGradient }}
        />
      </div>

      {/* Top Slanted Ribbon Header */}
      <div className="relative z-10 min-w-0 flex flex-col items-center text-center space-y-1.5">
        <div className="flex items-center justify-center gap-1 max-w-full">
          <span
            className="inline-flex items-center gap-1 px-3 py-0.5 -skew-x-12 text-[10px] font-black uppercase tracking-wider text-white shadow-sm truncate max-w-full"
            style={{ background: ribbonGradient }}
          >
            <span className="skew-x-12 inline-flex items-center gap-1 truncate">
              {isPromo ? (
                <>
                  <Flame className="w-3 h-3 fill-white shrink-0" />
                  {hasDiscount ? `BLACK FRIDAY -${discountPct}%` : "OFERTA ESPECIAL"}
                </>
              ) : product.isPrebuiltPc ? (
                <>
                  <Sparkles className="w-3 h-3 shrink-0" /> PC COMPLETA
                </>
              ) : (
                product.categoryName
              )}
            </span>
          </span>
          <span
            aria-hidden="true"
            className="inline-block w-1 h-4 -skew-x-12 opacity-65 shrink-0"
            style={{ backgroundColor: accentColor }}
          />
          <span
            aria-hidden="true"
            className="inline-block w-1 h-4 -skew-x-12 opacity-30 shrink-0"
            style={{ backgroundColor: accentColor }}
          />
        </div>

        {/* Brand & Centered Product Name */}
        <div className="w-full min-w-0 space-y-0.5 px-1">
          <div className="font-display text-base font-black uppercase tracking-tight text-slate-950 leading-none truncate">
            {product.brandName}
          </div>
          <Link
            href={`/producto/${product.slug}`}
            className="font-heading font-bold text-sm leading-snug line-clamp-2 min-h-[2.45rem] hover:underline block text-slate-900"
          >
            {product.name}
          </Link>
        </div>

        {/* Short Accent Divider + Specs */}
        <div className="w-full min-w-0 flex flex-col items-center gap-1">
          <div className="flex items-center gap-1.5">
            <span className="block w-8 h-1 rounded-full" style={{ backgroundColor: accentColor }} />
            <span className="block w-12 h-[1px] bg-slate-300" />
          </div>
          {highlightSpec && (
            <p className="text-[11px] font-medium text-slate-600 truncate w-full px-1">
              {highlightSpec}
            </p>
          )}
        </div>
      </div>

      {/* Center Showcase: Larger Product Photo over Ember Glow + Luminous Ring + 3D Silver Pedestal */}
      <Link
        href={`/producto/${product.slug}`}
        className="relative z-10 my-1.5 h-48 sm:h-52 w-full flex items-center justify-center"
        style={{ perspective: "900px" }}
      >
        {/* Subtle Fire / Cyan Ember Aura at Pedestal Base */}
        <div
          aria-hidden="true"
          className="absolute bottom-1 left-1/2 -translate-x-1/2 w-[82%] h-12 rounded-full blur-xl pointer-events-none"
          style={{
            background: isPromo
              ? "radial-gradient(ellipse at center, rgba(239, 68, 68, 0.28) 0%, rgba(249, 115, 22, 0.14) 55%, transparent 80%)"
              : "radial-gradient(ellipse at center, rgba(14, 165, 233, 0.2) 0%, transparent 78%)",
          }}
        />

        {/* Soft White Halo */}
        <div
          aria-hidden="true"
          className="absolute top-2 w-40 h-40 rounded-full pointer-events-none"
          style={{
            border: "2px solid rgba(255, 255, 255, 0.96)",
            boxShadow: isPromo
              ? "0 0 24px rgba(255, 255, 255, 0.95), 0 0 18px rgba(249, 115, 22, 0.18)"
              : "0 0 24px rgba(255, 255, 255, 0.95)",
          }}
        />

        {/* 3D Elliptical Silver Pedestal */}
        <div
          aria-hidden="true"
          className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-[84%] max-w-[235px] h-10 pointer-events-none"
        >
          <div
            className="absolute bottom-0 inset-x-0 h-7 rounded-[50%]"
            style={{
              background: "linear-gradient(90deg, #94A3B8 0%, #E2E8F0 35%, #FFFFFF 52%, #CBD5E1 75%, #94A3B8 100%)",
              boxShadow: isPromo
                ? "0 9px 18px -5px rgba(185, 28, 28, 0.28), 0 0 12px rgba(255,255,255,0.9)"
                : "0 8px 18px -5px rgba(15, 23, 42, 0.22), 0 0 12px rgba(255,255,255,0.9)",
            }}
          />
          <div
            className="absolute top-0 inset-x-0 h-7 rounded-[50%] border border-white"
            style={{
              background: "linear-gradient(180deg, #FFFFFF 0%, #E2E8F0 70%, #CBD5E1 100%)",
            }}
          />
        </div>

        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.imageAlt}
            loading="lazy"
            className="relative z-10 w-[90%] h-[90%] -translate-y-2 object-contain transition-transform duration-300 ease-out group-hover:-translate-y-3 group-hover:scale-[1.06] group-hover:[transform:translateY(-10px)_rotateY(8deg)_scale(1.06)]"
            style={{
              filter: "drop-shadow(0 14px 18px rgba(15, 23, 42, 0.24))",
            }}
          />
        ) : (
          <span className="text-xs relative z-10 text-slate-500">
            Sin fotografía registrada
          </span>
        )}
      </Link>

      {/* Bottom Pricing Pill + Actions + Stock Footer */}
      <div className="relative z-10 mt-auto pt-1 min-w-0 space-y-2">
        {/* Dynamic Price Block */}
        <div className="flex flex-col items-center gap-1 min-w-0">
          {hasDiscount ? (
            <>
              <div className="flex items-center justify-center gap-2 text-xs">
                <span className="font-medium text-slate-600">Antes</span>
                <span
                  className="font-bold text-slate-700 tabular-nums"
                  style={{
                    textDecoration: "line-through",
                    textDecorationColor: "#DC2626",
                    textDecorationThickness: "2px",
                  }}
                >
                  {formatBsCompact(product.priceCents)}
                </span>
              </div>
              <div
                className="w-full px-2.5 py-1.5 rounded-xl bg-white flex items-center justify-center gap-2 shadow-xs min-w-0"
                style={{ border: "2px solid #C8102E" }}
              >
                <span className="px-2 py-0.5 -skew-x-12 text-[10px] font-extrabold uppercase text-white bg-[#C8102E] shrink-0">
                  <span className="inline-block skew-x-12">Ahora</span>
                </span>
                <span className="font-display text-lg sm:text-xl xl:text-[22px] font-black tabular-nums tracking-tight text-[#C8102E] truncate">
                  {formatBsCompact(activePrice)}
                </span>
              </div>
            </>
          ) : (
            <div className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-300 flex items-center justify-center gap-2 shadow-xs min-w-0">
              <span className="font-display text-lg sm:text-xl xl:text-[22px] font-black tabular-nums tracking-tight text-slate-950 truncate">
                {formatBsCompact(activePrice)}
              </span>
            </div>
          )}
        </div>

        {/* Action Pill Row ("Añadir" keyword preserved for E2E tests, min-w-0 prevents right clipping) */}
        <div className="flex items-center gap-1.5 min-w-0 w-full">
          <button
            type="button"
            data-sound="none"
            disabled={!inStock}
            onClick={async () => {
              const ok = await addToCart(product.id, 1);
              if (ok) {
                setJustAdded(true);
                setTimeout(() => setJustAdded(false), 1400);
              }
            }}
            className="ct-btn flex-1 min-w-0 h-10 px-3 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-wide text-white flex items-center justify-center gap-1.5 shadow-md transition-transform hover:scale-[1.02] whitespace-nowrap disabled:opacity-45 disabled:cursor-not-allowed"
            style={{
              background: justAdded
                ? "linear-gradient(90deg, #059669 0%, #047857 100%)"
                : isPromo
                ? "linear-gradient(90deg, #E11D48 0%, #B91C1C 60%, #7F1D1D 100%)"
                : "linear-gradient(90deg, #0284C7 0%, #0369A1 100%)",
            }}
          >
            {justAdded ? (
              <>
                <Check className="w-4 h-4 shrink-0" />
                <span>¡Añadido!</span>
              </>
            ) : inStock ? (
              <>
                <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                <span className="border-l border-white/30 pl-1.5 truncate">AÑADIR AHORA</span>
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              </>
            ) : (
              <span>Agotado</span>
            )}
          </button>

          <button
            type="button"
            data-sound="none"
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
            className="ct-btn h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-full border flex items-center justify-center text-xs font-semibold shadow-xs"
            style={{
              borderColor: inCompare ? "#0284C7" : "#CBD5E1",
              backgroundColor: inCompare ? "#E0F2FE" : "#FFFFFF",
              color: inCompare ? "#0284C7" : "#334155",
            }}
          >
            {inCompare ? <Check className="w-4 h-4" /> : <Scale className="w-4 h-4" />}
          </button>
        </div>

        {/* Footer Line + Prebuilt Badge */}
        <div className="pt-0.5 space-y-1 text-center">
          <div className="flex items-center justify-center gap-2 text-[11px]">
            <span className="flex-1 h-[1px] bg-slate-300" />
            <span
              className="italic font-semibold whitespace-nowrap"
              style={{
                color: !inStock ? "#DC2626" : lowStock ? "#C8102E" : "#475569",
              }}
            >
              {!inStock
                ? "Agotado"
                : lowStock
                ? `Stock limitado (${product.stockAvailable})`
                : `Stock: ${product.stockAvailable} disponibles`}
            </span>
            <span className="flex-1 h-[1px] bg-slate-300" />
          </div>

          {product.isPrebuiltPc && (
            <div className="flex justify-center">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-emerald-300 bg-emerald-50 text-emerald-700">
                Bs 0 Mantenimiento
              </span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
