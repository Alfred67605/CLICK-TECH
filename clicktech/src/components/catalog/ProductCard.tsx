"use client";

import React from "react";
import Link from "next/link";
import { Check, Scale, ShoppingCart } from "lucide-react";
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
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const { addToCart, compareItems, toggleCompare } = useStore();
  const inCompare = compareItems.some((c) => c.id === product.id);
  const activePrice = product.promoPriceCents ?? product.priceCents;
  const inStock = product.stockAvailable > 0;

  return (
    <article
      className="ct-card rounded-xl border flex flex-col overflow-hidden"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--border-subtle)",
      }}
    >
      <Link
        href={`/producto/${product.slug}`}
        className="relative aspect-[4/3] w-full flex items-center justify-center p-4 overflow-hidden"
        style={{ backgroundColor: "var(--bg-card-media)" }}
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.imageAlt}
            loading="lazy"
            className="ct-zoom-media w-full h-full object-contain"
          />
        ) : (
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            Sin fotografía registrada
          </span>
        )}
        <span
          className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[11px] font-medium border"
          style={{
            backgroundColor: "color-mix(in srgb, var(--bg-chassis) 85%, transparent)",
            borderColor: "var(--border-subtle)",
            color: "var(--text-secondary)",
          }}
        >
          {product.isIllustrative ? "Imagen ilustrativa" : "Foto del modelo"}
        </span>
        {product.promoLabel && product.promoPriceCents && (
          <span
            className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[11px] font-semibold"
            style={{
              backgroundColor: "var(--accent-purple)",
              color: "#ffffff",
            }}
          >
            {product.promoLabel}
          </span>
        )}
      </Link>

      <div className="p-4 flex-1 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-semibold uppercase tracking-wide" style={{ color: "var(--accent-cyan)" }}>
            {product.brandName}
          </span>
          <span className="tabular-nums" style={{ color: "var(--text-muted)" }}>
            {product.sku}
          </span>
        </div>

        <Link
          href={`/producto/${product.slug}`}
          className="font-heading font-semibold text-base leading-snug line-clamp-2 hover:underline"
          style={{ color: "var(--text-primary)" }}
        >
          {product.name}
        </Link>

        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {product.categoryName} · {product.model}
        </p>

        <div className="mt-auto pt-3 space-y-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <span className="font-heading text-xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                {formatBsCompact(activePrice)}
              </span>
              {product.promoPriceCents && product.promoPriceCents < product.priceCents && (
                <span className="ml-2 text-xs line-through tabular-nums" style={{ color: "var(--text-muted)" }}>
                  {formatBsCompact(product.priceCents)}
                </span>
              )}
            </div>
            <span
              className="text-xs font-semibold tabular-nums px-2 py-0.5 rounded"
              style={{
                backgroundColor: inStock ? "rgba(16, 185, 129, 0.14)" : "rgba(244, 63, 94, 0.14)",
                color: inStock ? "var(--status-ok)" : "var(--status-danger)",
              }}
            >
              {inStock ? `Stock: ${product.stockAvailable}` : "Agotado"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!inStock}
              onClick={() => addToCart(product.id, 1)}
              className="ct-btn flex-1 h-10 px-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-45 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "var(--accent-cyan)",
                color: "var(--accent-cyan-ink)",
              }}
            >
              <ShoppingCart className="w-4 h-4" />
              {inStock ? "Añadir" : "Sin stock"}
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
              className="ct-btn h-10 px-3 rounded-lg border flex items-center justify-center gap-1 text-xs font-medium"
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
