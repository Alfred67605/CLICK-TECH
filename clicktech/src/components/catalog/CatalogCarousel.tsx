"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ShoppingCart, Sparkles, Tag } from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";
import { useUISound } from "@/hooks/useUISound";
import { formatBsCompact } from "@/lib/domain/money";
import type { ProductCardData } from "@/components/catalog/ProductCard";

export function CatalogCarousel({ products }: { products: ProductCardData[] }) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const { addToCart } = useStore();
  const { playClick, playHover } = useUISound();

  if (products.length === 0) return null;

  function scrollByAmount(direction: "prev" | "next") {
    const el = trackRef.current;
    if (!el) return;
    playClick();
    const step = Math.max(280, Math.round(el.clientWidth * 0.72));
    el.scrollBy({ left: direction === "next" ? step : -step, behavior: "smooth" });
  }

  return (
    <section
      aria-label="Carrusel completo de productos ClickTech"
      className="rounded-2xl border p-4 sm:p-5 space-y-4 overflow-hidden"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--border-subtle)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-9 h-9 rounded-xl border flex items-center justify-center shrink-0"
            style={{
              backgroundColor: "var(--accent-cyan-soft)",
              borderColor: "var(--border-strong)",
              color: "var(--accent-cyan)",
            }}
          >
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="font-heading text-sm sm:text-base font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <span>Vitrina Rápida ClickTech</span>
              <span
                className="text-[11px] font-mono px-2 py-0.5 rounded-full border"
                style={{
                  backgroundColor: "var(--bg-chassis)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--accent-cyan)",
                }}
              >
                {products.length} modelos
              </span>
            </h2>
            <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
              Desliza horizontalmente para recorrer todos los equipos, componentes y periféricos en stock.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            data-sound="none"
            onClick={() => scrollByAmount("prev")}
            aria-label="Desplazar carrusel a la izquierda"
            className="ct-btn h-9 w-9 rounded-xl border flex items-center justify-center"
            style={{
              backgroundColor: "var(--bg-chassis)",
              borderColor: "var(--border-subtle)",
              color: "var(--text-primary)",
            }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            data-sound="none"
            onClick={() => scrollByAmount("next")}
            aria-label="Desplazar carrusel a la derecha"
            className="ct-btn h-9 w-9 rounded-xl border flex items-center justify-center"
            style={{
              backgroundColor: "var(--bg-chassis)",
              borderColor: "var(--border-subtle)",
              color: "var(--text-primary)",
            }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="flex gap-3.5 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth"
      >
        {products.map((p) => {
          const effectivePrice = p.promoPriceCents ?? p.priceCents;
          const hasPromo = p.promoPriceCents !== null && p.promoPriceCents < p.priceCents;
          const inStock = p.stockAvailable > 0;

          return (
            <article
              key={p.id}
              onPointerEnter={() => playHover()}
              className="ct-card snap-start shrink-0 w-[235px] sm:w-[255px] rounded-xl border p-3 flex flex-col justify-between gap-2.5"
              style={{
                backgroundColor: "var(--bg-chassis)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <Link href={`/producto/${p.slug}`} className="block space-y-2.5">
                <div
                  className="relative aspect-[16/10] w-full rounded-lg overflow-hidden border flex items-center justify-center"
                  style={{
                    backgroundColor: "var(--bg-card-media)",
                    borderColor: "var(--border-subtle)",
                  }}
                >
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  ) : (
                    <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      Sin imagen
                    </span>
                  )}
                  <span
                    className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide backdrop-blur-sm"
                    style={{
                      backgroundColor: "rgba(2, 4, 10, 0.72)",
                      color: "#F8FAFC",
                    }}
                  >
                    {p.brandName}
                  </span>
                  {hasPromo && (
                    <span
                      className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5"
                      style={{ backgroundColor: "var(--accent-purple)", color: "#FFFFFF" }}
                    >
                      <Tag className="w-2.5 h-2.5" /> OFERTA
                    </span>
                  )}
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider truncate" style={{ color: "var(--accent-cyan)" }}>
                    {p.categoryName}
                  </p>
                  <h3
                    className="font-heading text-xs font-bold line-clamp-2 leading-snug mt-0.5"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {p.name}
                  </h3>
                </div>
              </Link>

              <div className="pt-1 border-t space-y-2" style={{ borderColor: "var(--border-subtle)" }}>
                <div className="flex items-baseline justify-between gap-2">
                  <div>
                    <span className="font-heading text-base font-extrabold tabular-nums" style={{ color: "var(--text-primary)" }}>
                      {formatBsCompact(effectivePrice)}
                    </span>
                    {hasPromo && (
                      <span className="block text-[10px] line-through tabular-nums" style={{ color: "var(--text-muted)" }}>
                        {formatBsCompact(p.priceCents)}
                      </span>
                    )}
                  </div>
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: inStock ? "rgba(16,185,129,0.14)" : "rgba(244,63,94,0.14)",
                      color: inStock ? "var(--status-ok)" : "var(--status-danger)",
                    }}
                  >
                    {inStock ? `Stock: ${p.stockAvailable}` : "Agotado"}
                  </span>
                </div>

                <div className="flex gap-1.5">
                  <Link
                    href={`/producto/${p.slug}`}
                    className="ct-btn flex-1 h-8 rounded-lg border text-[11px] font-semibold flex items-center justify-center"
                    style={{
                      borderColor: "var(--border-subtle)",
                      backgroundColor: "var(--bg-surface)",
                      color: "var(--text-primary)",
                    }}
                  >
                    Ver ficha
                  </Link>
                  <button
                    type="button"
                    data-sound="none"
                    disabled={!inStock}
                    onClick={() => addToCart(p.id, 1)}
                    aria-label={`Agregar ${p.name} al carrito`}
                    className="ct-btn h-8 px-2.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 disabled:opacity-45"
                    style={{
                      backgroundColor: "var(--accent-cyan)",
                      color: "var(--accent-cyan-ink)",
                    }}
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    Al carrito
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
