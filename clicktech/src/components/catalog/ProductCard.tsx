"use client";

import React from "react";
import Link from "next/link";
import { Check, Scale, ShoppingCart, Sparkles } from "lucide-react";
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

  return (
    <article
      className="ct-card group relative rounded-2xl border flex flex-col overflow-hidden"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--border-subtle)",
      }}
    >
      {/* Top Media Showcase */}
      <Link
        href={`/producto/${product.slug}`}
        className="relative aspect-[4/3] w-full flex items-center justify-center p-6 overflow-hidden"
        style={{ backgroundColor: "var(--bg-card-media)" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,229,255,0.06)_0%,transparent_75%)] pointer-events-none" />

        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.imageAlt}
            loading="lazy"
            className="ct-zoom-media w-full h-full object-contain relative z-10"
          />
        ) : (
          <span className="text-xs relative z-10" style={{ color: "var(--text-muted)" }}>
            Sin fotografía registrada
          </span>
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 z-20">
          {product.isPrebuiltPc ? (
            <span
              className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase border backdrop-blur-md flex items-center gap-1"
              style={{
                backgroundColor: "color-mix(in srgb, var(--bg-chassis) 84%, transparent)",
                borderColor: "var(--border-strong)",
                color: "var(--accent-cyan)",
              }}
            >
              <Sparkles className="w-3 h-3" /> PC Completa
            </span>
          ) : (
            <span
              className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border backdrop-blur-md"
              style={{
                backgroundColor: "color-mix(in srgb, var(--bg-chassis) 82%, transparent)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-secondary)",
              }}
            >
              {product.brandName}
            </span>
          )}
        </div>

        <div className="absolute top-3 right-3 z-20">
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border backdrop-blur-md flex items-center gap-1.5"
            style={{
              backgroundColor: inStock
                ? "color-mix(in srgb, var(--bg-chassis) 84%, rgba(16, 185, 129, 0.2))"
                : "color-mix(in srgb, var(--bg-chassis) 84%, rgba(244, 63, 94, 0.2))",
              borderColor: inStock ? "rgba(16, 185, 129, 0.45)" : "rgba(244, 63, 94, 0.45)",
              color: inStock ? "var(--status-ok)" : "var(--status-danger)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: inStock ? "var(--status-ok)" : "var(--status-danger)" }}
            />
            {inStock ? `Stock: ${product.stockAvailable}` : "Agotado"}
          </span>
        </div>
      </Link>

      {/* Content Body - Clean & Spacious */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold tracking-wider uppercase truncate" style={{ color: "var(--accent-cyan)" }}>
            {product.categoryName}
          </div>

          <Link
            href={`/producto/${product.slug}`}
            className="font-heading font-bold text-base leading-snug line-clamp-2 hover:underline block"
            style={{ color: "var(--text-primary)" }}
          >
            {product.name}
          </Link>

          {highlightSpec && (
            <p className="text-xs font-mono truncate pt-0.5" style={{ color: "var(--text-muted)" }}>
              {highlightSpec}
            </p>
          )}
        </div>

        {/* Price & Action */}
        <div className="pt-3 border-t space-y-3" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <span
                className="font-heading text-xl sm:text-2xl font-black tabular-nums tracking-tight"
                style={{ color: "var(--text-primary)" }}
              >
                {formatBsCompact(activePrice)}
              </span>
              {product.promoPriceCents && product.promoPriceCents < product.priceCents && (
                <span className="ml-2 text-xs line-through tabular-nums" style={{ color: "var(--text-muted)" }}>
                  {formatBsCompact(product.priceCents)}
                </span>
              )}
            </div>
            {product.isPrebuiltPc && (
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border"
                style={{
                  backgroundColor: "rgba(16, 185, 129, 0.12)",
                  borderColor: "rgba(16, 185, 129, 0.35)",
                  color: "var(--status-ok)",
                }}
              >
                Bs 0 Mantenimiento
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
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
              className="ct-btn ct-btn-primary flex-1 h-10 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                backgroundColor: justAdded ? "var(--status-ok)" : "var(--accent-cyan)",
                color: justAdded ? "#ffffff" : "var(--accent-cyan-ink)",
              }}
            >
              {justAdded ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>¡Añadido!</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  <span>{inStock ? "Añadir al carrito" : "Agotado"}</span>
                </>
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
              className="ct-btn h-10 w-10 shrink-0 rounded-xl border flex items-center justify-center text-xs font-semibold"
              style={{
                borderColor: inCompare ? "var(--accent-cyan)" : "var(--border-subtle)",
                backgroundColor: inCompare ? "var(--accent-cyan-soft)" : "transparent",
                color: inCompare ? "var(--accent-cyan)" : "var(--text-secondary)",
              }}
            >
              {inCompare ? <Check className="w-4 h-4" /> : <Scale className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
