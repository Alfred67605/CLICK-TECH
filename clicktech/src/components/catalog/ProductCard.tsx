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

  // Bold vivid theme palettes: Fire Obsidian for Black Friday / Royal Cobalt Blue for regular catalog
  const cardBackground = isPromo
    ? "linear-gradient(180deg, #06060A 0%, #190706 46%, #410F06 84%, #1A0605 100%)"
    : product.isPrebuiltPc
    ? "linear-gradient(180deg, #070B22 0%, #131F5C 48%, #1E3296 84%, #0C1440 100%)"
    : "linear-gradient(180deg, #030C1E 0%, #082354 46%, #0E3E8C 84%, #071D47 100%)";

  const cardBorder = isPromo
    ? "1.5px solid rgba(249, 115, 22, 0.58)"
    : product.isPrebuiltPc
    ? "1.5px solid rgba(96, 165, 250, 0.6)"
    : "1.5px solid rgba(56, 189, 248, 0.55)";

  const accentColor = isPromo ? "#F97316" : "#38BDF8";
  const ribbonGradient = isPromo
    ? "linear-gradient(90deg, #EF4444 0%, #EA580C 100%)"
    : product.isPrebuiltPc
    ? "linear-gradient(90deg, #2563EB 0%, #00B4D8 100%)"
    : "linear-gradient(90deg, #0284C7 0%, #00E5FF 100%)";

  return (
    <article
      className="ct-card group relative min-w-0 w-full rounded-2xl flex flex-col overflow-hidden p-3.5 sm:p-4 transition-all"
      style={{
        background: cardBackground,
        border: cardBorder,
        boxShadow: isPromo
          ? "0 16px 34px -16px rgba(234, 88, 12, 0.45)"
          : "0 16px 32px -16px rgba(2, 132, 199, 0.38)",
      }}
    >
      {/* Incandescent Fire Ash / Electric Spark Overlay */}
      <svg
        aria-hidden="true"
        viewBox="0 0 300 420"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 w-full h-full z-0 opacity-80"
      >
        <defs>
          <linearGradient id={`glow-${product.id}`} x1="0" y1="1" x2="0" y2="0.45">
            <stop offset="0%" stopColor={isPromo ? "#EA580C" : "#0284C7"} stopOpacity="0.34" />
            <stop offset="100%" stopColor={isPromo ? "#EA580C" : "#0284C7"} stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="300" height="420" fill={`url(#glow-${product.id})`} />
        {isPromo ? (
          <g fill="#FDBA74" opacity="0.72">
            <rect x="28" y="340" width="2.5" height="12" rx="1" transform="rotate(-14 28 340)" fill="#FEF08A" />
            <rect x="64" y="290" width="2" height="10" rx="1" transform="rotate(12 64 290)" fill="#FB923C" />
            <rect x="115" y="370" width="3" height="14" rx="1" transform="rotate(-8 115 370)" fill="#FDE047" />
            <rect x="195" y="325" width="2.2" height="11" rx="1" transform="rotate(18 195 325)" fill="#F97316" />
            <rect x="248" y="352" width="2.5" height="13" rx="1" transform="rotate(-16 248 352)" fill="#FEF08A" />
            <rect x="44" y="210" width="1.8" height="8" rx="1" transform="rotate(9 44 210)" fill="#FB923C" />
            <rect x="268" y="235" width="2" height="9" rx="1" transform="rotate(-12 268 235)" fill="#FDE047" />
            <circle cx="88" cy="248" r="1.7" fill="#FEF08A" />
            <circle cx="222" cy="272" r="1.5" fill="#FB923C" />
            <circle cx="152" cy="395" r="2" fill="#FDE047" />
          </g>
        ) : (
          <g fill="#7DD3FC" opacity="0.65">
            <rect x="30" y="345" width="2" height="11" rx="1" transform="rotate(-14 30 345)" fill="#E0F2FE" />
            <rect x="78" y="305" width="2" height="9" rx="1" transform="rotate(12 78 305)" fill="#38BDF8" />
            <rect x="210" y="335" width="2.2" height="11" rx="1" transform="rotate(16 210 335)" fill="#7DD3FC" />
            <rect x="255" y="362" width="2" height="10" rx="1" transform="rotate(-16 255 362)" fill="#E0F2FE" />
            <circle cx="52" cy="225" r="1.5" fill="#7DD3FC" />
            <circle cx="262" cy="240" r="1.6" fill="#E0F2FE" />
            <circle cx="145" cy="390" r="1.8" fill="#38BDF8" />
          </g>
        )}
      </svg>

      {/* Top-Right & Bottom-Left Diagonal Flyer Accents */}
      <div aria-hidden="true" className="pointer-events-none absolute top-2.5 right-2.5 z-0 flex items-center gap-1.5 opacity-95">
        <span
          className="block w-3.5 h-11 -skew-x-[22deg]"
          style={{
            background: isPromo
              ? "linear-gradient(180deg, #F97316 0%, rgba(220,38,38,0.12) 100%)"
              : "linear-gradient(180deg, #00E5FF 0%, rgba(2,132,199,0.12) 100%)",
          }}
        />
        <span
          className="block w-2.5 h-9 -skew-x-[22deg] translate-y-2"
          style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.06) 100%)" }}
        />
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-2 z-0 flex items-end gap-1.5 opacity-90">
        <span
          className="block w-5 h-7 skew-x-[22deg] translate-y-1"
          style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.08) 100%)" }}
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
            className="inline-flex items-center gap-1 px-3 py-0.5 -skew-x-12 text-[10px] font-black uppercase tracking-wider shadow-sm truncate max-w-full"
            style={{
              background: ribbonGradient,
              color: !isPromo && !product.isPrebuiltPc ? "#020617" : "#FFFFFF",
            }}
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
            className="inline-block w-1 h-4 -skew-x-12 opacity-80 shrink-0"
            style={{ backgroundColor: accentColor }}
          />
          <span
            aria-hidden="true"
            className="inline-block w-1 h-4 -skew-x-12 opacity-40 shrink-0"
            style={{ backgroundColor: accentColor }}
          />
        </div>

        {/* Brand & Centered Product Name */}
        <div className="w-full min-w-0 space-y-0.5 px-1">
          <div className="font-display text-base font-black uppercase tracking-tight text-white leading-none truncate">
            {product.brandName}
          </div>
          <Link
            href={`/producto/${product.slug}`}
            className="font-heading font-bold text-sm leading-snug line-clamp-2 min-h-[2.45rem] hover:underline block text-slate-100"
          >
            {product.name}
          </Link>
        </div>

        {/* Short Accent Divider + Specs */}
        <div className="w-full min-w-0 flex flex-col items-center gap-1">
          <div className="flex items-center gap-1.5">
            <span className="block w-8 h-1 rounded-full" style={{ backgroundColor: accentColor }} />
            <span className="block w-12 h-[1px] bg-white/30" />
          </div>
          {highlightSpec && (
            <p className="text-[11px] font-medium text-slate-300 truncate w-full px-1">
              {highlightSpec}
            </p>
          )}
        </div>
      </div>

      {/* Center Showcase: Illuminated Studio Spotlight + Pedestal so Black Hardware Pops */}
      <Link
        href={`/producto/${product.slug}`}
        className="relative z-10 my-1.5 h-48 sm:h-52 w-full flex items-center justify-center"
      >
        {/* Bright Radial Backlight Halo behind Product */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isPromo
              ? "radial-gradient(circle at 50% 46%, rgba(255,255,255,0.94) 0%, rgba(255,237,213,0.5) 38%, rgba(249,115,22,0.14) 60%, transparent 74%)"
              : "radial-gradient(circle at 50% 46%, rgba(255,255,255,0.94) 0%, rgba(224,242,254,0.52) 38%, rgba(56,189,248,0.15) 60%, transparent 74%)",
          }}
        />

        {/* Circular Luminous Ring */}
        <div
          aria-hidden="true"
          className="absolute top-2 w-40 h-40 rounded-full pointer-events-none"
          style={{
            border: "2px solid rgba(255, 255, 255, 0.85)",
            boxShadow: isPromo
              ? "0 0 24px rgba(255,255,255,0.45), 0 0 20px rgba(249, 115, 22, 0.25)"
              : "0 0 24px rgba(255,255,255,0.45), 0 0 20px rgba(56, 189, 248, 0.25)",
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
              boxShadow: "0 10px 20px -4px rgba(0, 0, 0, 0.55), 0 0 12px rgba(255,255,255,0.5)",
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
            className="relative z-10 w-[90%] h-[90%] -translate-y-2 object-contain transition-transform duration-300 ease-out group-hover:-translate-y-3 group-hover:scale-105"
            style={{ filter: "drop-shadow(0 14px 18px rgba(0, 0, 0, 0.4))" }}
          />
        ) : (
          <span className="text-xs relative z-10 text-slate-200">
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
                <span className="font-medium text-slate-300">Antes</span>
                <span
                  className="font-bold text-slate-200 tabular-nums"
                  style={{
                    textDecoration: "line-through",
                    textDecorationColor: "#FB7185",
                    textDecorationThickness: "2px",
                  }}
                >
                  {formatBsCompact(product.priceCents)}
                </span>
              </div>
              <div
                className="w-full px-2.5 py-1.5 rounded-xl bg-white flex items-center justify-center gap-2 shadow-lg min-w-0"
                style={{ border: "2px solid #EF4444" }}
              >
                <span className="px-2 py-0.5 -skew-x-12 text-[10px] font-extrabold uppercase text-white bg-[#DC2626] shrink-0">
                  <span className="inline-block skew-x-12">Ahora</span>
                </span>
                <span className="font-display text-lg sm:text-xl xl:text-[22px] font-black tabular-nums tracking-tight text-[#C8102E] truncate">
                  {formatBsCompact(activePrice)}
                </span>
              </div>
            </>
          ) : (
            <div
              className="w-full px-2.5 py-1.5 rounded-xl bg-white flex items-center justify-center gap-2 shadow-lg min-w-0"
              style={{ border: "2px solid #38BDF8" }}
            >
              <span className="font-display text-lg sm:text-xl xl:text-[22px] font-black tabular-nums tracking-tight text-[#031942] truncate">
                {formatBsCompact(activePrice)}
              </span>
            </div>
          )}
        </div>

        {/* Action Pill Row ("Añadir" keyword preserved for E2E tests) */}
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
            className="ct-btn flex-1 min-w-0 h-10 px-3 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-wide flex items-center justify-center gap-1.5 shadow-lg transition-transform hover:scale-[1.02] whitespace-nowrap disabled:opacity-45 disabled:cursor-not-allowed"
            style={{
              background: justAdded
                ? "linear-gradient(90deg, #059669 0%, #047857 100%)"
                : isPromo
                ? "linear-gradient(90deg, #F97316 0%, #DC2626 55%, #991B1B 100%)"
                : "linear-gradient(90deg, #00E5FF 0%, #0284C7 60%, #1D4ED8 100%)",
              color: !justAdded && !isPromo ? "#020617" : "#FFFFFF",
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
                <span className="border-l border-current/30 pl-1.5 truncate">AÑADIR AHORA</span>
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
            className="ct-btn h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-full border flex items-center justify-center text-xs font-semibold shadow-sm"
            style={{
              borderColor: inCompare ? "#00E5FF" : "rgba(255, 255, 255, 0.28)",
              backgroundColor: inCompare ? "rgba(0, 229, 255, 0.2)" : "rgba(255, 255, 255, 0.1)",
              color: inCompare ? "#00E5FF" : "#FFFFFF",
            }}
          >
            {inCompare ? <Check className="w-4 h-4" /> : <Scale className="w-4 h-4" />}
          </button>
        </div>

        {/* Footer Line + Prebuilt Badge */}
        <div className="pt-0.5 space-y-1 text-center">
          <div className="flex items-center justify-center gap-2 text-[11px]">
            <span className="flex-1 h-[1px] bg-white/25" />
            <span
              className="italic font-semibold whitespace-nowrap"
              style={{
                color: !inStock ? "#FCA5A5" : lowStock ? "#FDE047" : "#CBD5E1",
              }}
            >
              {!inStock
                ? "Agotado"
                : lowStock
                ? `Stock limitado (${product.stockAvailable})`
                : `Stock: ${product.stockAvailable} disponibles`}
            </span>
            <span className="flex-1 h-[1px] bg-white/25" />
          </div>

          {product.isPrebuiltPc && (
            <div className="flex justify-center">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-emerald-400/50 bg-emerald-950/75 text-emerald-200">
                Bs 0 Mantenimiento
              </span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
