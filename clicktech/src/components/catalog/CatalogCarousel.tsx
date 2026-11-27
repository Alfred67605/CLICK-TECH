"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Pause,
  Play,
  ShoppingCart,
  Sparkles,
  Tag,
} from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";
import { useUISound } from "@/hooks/useUISound";
import { formatBsCompact } from "@/lib/domain/money";
import type { ProductCardData } from "@/components/catalog/ProductCard";

type CarouselFilter = "all" | "black-friday";

export function CatalogCarousel({ products }: { products: ProductCardData[] }) {
  const { addToCart } = useStore();
  const { playClick, playHover } = useUISound();

  const [campaignTab, setCampaignTab] = useState<CarouselFilter>("all");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const blackFridaySlides = useMemo(
    () =>
      products.filter(
        (p) =>
          p.promoPriceCents !== null &&
          p.promoPriceCents < p.priceCents &&
          p.stockAvailable > 0
      ),
    [products]
  );

  // Build curated spotlight rotation: Black Friday deals first, followed by featured/diverse SKUs
  const allSlides = useMemo(() => {
    const seen = new Set<string>();
    const ordered: ProductCardData[] = [];
    for (const p of blackFridaySlides) {
      seen.add(p.id);
      ordered.push(p);
    }
    for (const p of products) {
      if (!seen.has(p.id) && p.stockAvailable > 0) {
        seen.add(p.id);
        ordered.push(p);
      }
      if (ordered.length >= 16) break;
    }
    return ordered.length > 0 ? ordered : products.slice(0, 12);
  }, [products, blackFridaySlides]);

  const slides = campaignTab === "black-friday" && blackFridaySlides.length > 0 ? blackFridaySlides : allSlides;
  const safeIndex = slides.length > 0 ? activeIndex % slides.length : 0;
  const active = slides[safeIndex];

  // Auto-advance every 3 seconds unless paused or hovered
  useEffect(() => {
    if (slides.length <= 1 || isPaused || isHovered) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [slides.length, isPaused, isHovered]);

  if (!active) return null;

  const effectivePrice = active.promoPriceCents ?? active.priceCents;
  const hasDiscount = active.promoPriceCents !== null && active.promoPriceCents < active.priceCents;
  const isBlackFriday = Boolean(active.promoLabel?.toUpperCase().includes("BLACK FRIDAY")) || hasDiscount;
  const discountPct = hasDiscount
    ? Math.max(1, Math.round(((active.priceCents - effectivePrice) / active.priceCents) * 100))
    : 0;
  const savingsCents = hasDiscount ? active.priceCents - effectivePrice : 0;
  const specsList = Object.entries((active.shortSpecsJson ?? {}) as Record<string, string>).slice(0, 3);

  function goPrev() {
    playClick();
    setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }

  function goNext() {
    playClick();
    setActiveIndex((prev) => (prev + 1) % slides.length);
  }

  return (
    <section
      aria-label="Vitrina Hero ClickTech y Ofertas Black Friday"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative rounded-3xl border overflow-hidden transition-colors duration-300"
      style={{
        backgroundColor: isBlackFriday ? "#090B12" : "var(--bg-surface)",
        borderColor: isBlackFriday ? "rgba(244, 63, 94, 0.55)" : "var(--border-strong)",
        boxShadow: isBlackFriday
          ? "0 20px 50px -16px rgba(244, 63, 94, 0.28)"
          : "var(--shadow-card)",
      }}
    >
      {/* Top Bar: Campaign Tabs & Live Counter */}
      <div
        className="px-4 sm:px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3"
        style={{
          borderColor: isBlackFriday ? "rgba(255,255,255,0.1)" : "var(--border-subtle)",
          backgroundColor: isBlackFriday ? "rgba(2, 4, 10, 0.72)" : "var(--bg-chassis)",
        }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-sound="none"
            onClick={() => {
              playClick();
              setCampaignTab("all");
              setActiveIndex(0);
            }}
            className="ct-btn h-8 px-3.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 border"
            style={
              campaignTab === "all"
                ? {
                    backgroundColor: "var(--accent-cyan)",
                    borderColor: "var(--accent-cyan)",
                    color: "var(--accent-cyan-ink)",
                  }
                : {
                    backgroundColor: "transparent",
                    borderColor: isBlackFriday ? "rgba(255,255,255,0.16)" : "var(--border-subtle)",
                    color: isBlackFriday ? "#CBD5E1" : "var(--text-secondary)",
                  }
            }
          >
            <Sparkles className="w-3.5 h-3.5" />
            Destacados ({allSlides.length})
          </button>

          {blackFridaySlides.length > 0 && (
            <button
              type="button"
              data-sound="none"
              onClick={() => {
                playClick();
                setCampaignTab("black-friday");
                setActiveIndex(0);
              }}
              className="ct-btn h-8 px-3.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 border"
              style={
                campaignTab === "black-friday"
                  ? {
                      backgroundColor: "#E11D48",
                      borderColor: "#FB7185",
                      color: "#FFFFFF",
                    }
                  : {
                      backgroundColor: "rgba(225, 29, 72, 0.14)",
                      borderColor: "rgba(244, 63, 94, 0.45)",
                      color: "#FB7185",
                    }
              }
            >
              <Flame className="w-3.5 h-3.5" />
              BLACK FRIDAY ({blackFridaySlides.length})
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 text-[11px] font-mono">
          <span
            className="px-2 py-0.5 rounded-full border"
            style={{
              borderColor: isBlackFriday ? "rgba(255,255,255,0.15)" : "var(--border-subtle)",
              color: isBlackFriday ? "#CBD5E1" : "var(--text-muted)",
            }}
          >
            {safeIndex + 1} / {slides.length} · Auto 3s
          </span>
          <button
            type="button"
            data-sound="none"
            onClick={() => {
              playClick();
              setIsPaused((p) => !p);
            }}
            aria-label={isPaused ? "Reanudar carrusel automático" : "Pausar carrusel automático"}
            className="ct-btn h-8 px-2.5 rounded-full border inline-flex items-center gap-1 font-sans font-semibold"
            style={{
              borderColor: isBlackFriday ? "rgba(255,255,255,0.18)" : "var(--border-subtle)",
              backgroundColor: isBlackFriday ? "rgba(255,255,255,0.06)" : "var(--bg-surface)",
              color: isBlackFriday ? "#F8FAFC" : "var(--text-primary)",
            }}
          >
            {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            <span>{isPaused ? "Reanudar" : "Pausar"}</span>
          </button>
        </div>
      </div>

      {/* Main 1-Product Hero Slide Stage (Amazon / eBay Banner Style) */}
      <div className="relative px-10 sm:px-14 py-6 sm:py-8">
        {/* Background Glow Accent */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isBlackFriday
              ? "radial-gradient(circle at 75% 45%, rgba(225, 29, 72, 0.24) 0%, rgba(245, 158, 11, 0.08) 38%, transparent 70%)"
              : "radial-gradient(circle at 75% 45%, rgba(0, 229, 255, 0.14) 0%, transparent 65%)",
          }}
        />

        {/* Large Left / Right Side Arrows (Amazon style) */}
        <button
          type="button"
          data-sound="none"
          onClick={goPrev}
          aria-label="Producto anterior del carrusel"
          className="ct-btn absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-20 h-11 w-9 sm:h-14 sm:w-11 rounded-xl border flex items-center justify-center backdrop-blur-md"
          style={{
            backgroundColor: isBlackFriday ? "rgba(15, 23, 42, 0.78)" : "color-mix(in srgb, var(--bg-surface) 88%, transparent)",
            borderColor: isBlackFriday ? "rgba(255,255,255,0.18)" : "var(--border-strong)",
            color: isBlackFriday ? "#FFFFFF" : "var(--text-primary)",
          }}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          type="button"
          data-sound="none"
          onClick={goNext}
          aria-label="Siguiente producto del carrusel"
          className="ct-btn absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-20 h-11 w-9 sm:h-14 sm:w-11 rounded-xl border flex items-center justify-center backdrop-blur-md"
          style={{
            backgroundColor: isBlackFriday ? "rgba(15, 23, 42, 0.78)" : "color-mix(in srgb, var(--bg-surface) 88%, transparent)",
            borderColor: isBlackFriday ? "rgba(255,255,255,0.18)" : "var(--border-strong)",
            color: isBlackFriday ? "#FFFFFF" : "var(--text-primary)",
          }}
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Active Slide Content */}
        <div
          key={active.id}
          className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
        >
          {/* Left Copy & Price Spotlight */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {isBlackFriday ? (
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider shadow-md"
                  style={{
                    background: "linear-gradient(90deg, #E11D48 0%, #F59E0B 100%)",
                    color: "#FFFFFF",
                  }}
                >
                  <Flame className="w-3.5 h-3.5 fill-white" />
                  BLACK FRIDAY · -{discountPct}% OFF
                </span>
              ) : (
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: "var(--accent-cyan-soft)",
                    borderColor: "var(--border-strong)",
                    color: "var(--accent-cyan)",
                  }}
                >
                  <Tag className="w-3.5 h-3.5" />
                  Destacado ClickTech
                </span>
              )}

              <span
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: isBlackFriday ? "#FDE047" : "var(--accent-cyan)" }}
              >
                {active.brandName} · {active.categoryName}
              </span>
            </div>

            <Link
              href={`/producto/${active.slug}`}
              className="block group"
            >
              <h2
                className="font-display text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight group-hover:underline"
                style={{ color: isBlackFriday ? "#FFFFFF" : "var(--text-primary)" }}
              >
                {active.name}
              </h2>
            </Link>

            {specsList.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {specsList.map(([k, v]) => (
                  <span
                    key={k}
                    className="px-2.5 py-1 rounded-lg border text-xs font-medium"
                    style={{
                      backgroundColor: isBlackFriday ? "rgba(255,255,255,0.06)" : "var(--bg-chassis)",
                      borderColor: isBlackFriday ? "rgba(255,255,255,0.14)" : "var(--border-subtle)",
                      color: isBlackFriday ? "#E2E8F0" : "var(--text-secondary)",
                    }}
                  >
                    <strong style={{ color: isBlackFriday ? "#38BDF8" : "var(--accent-cyan)" }}>{k}:</strong> {v}
                  </span>
                ))}
              </div>
            )}

            {/* Price & CTA */}
            <div className="pt-2 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="flex items-baseline gap-3">
                  <span
                    className="font-display text-3xl sm:text-4xl font-black tabular-nums tracking-tight"
                    style={{ color: isBlackFriday ? "#FDE047" : "var(--accent-cyan)" }}
                  >
                    {formatBsCompact(effectivePrice)}
                  </span>
                  {hasDiscount && (
                    <span
                      className="text-base sm:text-lg line-through tabular-nums"
                      style={{ color: isBlackFriday ? "#94A3B8" : "var(--text-muted)" }}
                    >
                      {formatBsCompact(active.priceCents)}
                    </span>
                  )}
                </div>
                {savingsCents > 0 && (
                  <p className="text-xs font-bold mt-0.5" style={{ color: "#34D399" }}>
                    Ahorras {formatBsCompact(savingsCents)} hoy · Stock disponible: {active.stockAvailable}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <Link
                  href={`/producto/${active.slug}`}
                  className="ct-btn h-11 px-5 rounded-xl border text-xs sm:text-sm font-bold inline-flex items-center justify-center"
                  style={{
                    backgroundColor: isBlackFriday ? "rgba(255,255,255,0.08)" : "var(--bg-chassis)",
                    borderColor: isBlackFriday ? "rgba(255,255,255,0.2)" : "var(--border-subtle)",
                    color: isBlackFriday ? "#FFFFFF" : "var(--text-primary)",
                  }}
                >
                  Ver ficha completa
                </Link>
                <button
                  type="button"
                  data-sound="none"
                  onPointerEnter={() => playHover()}
                  disabled={active.stockAvailable <= 0}
                  onClick={() => addToCart(active.id, 1)}
                  aria-label={`Agregar ${active.name} al carrito`}
                  className="ct-btn ct-btn-primary h-11 px-5 rounded-xl text-xs sm:text-sm font-extrabold inline-flex items-center justify-center gap-2 disabled:opacity-45"
                  style={{
                    backgroundColor: isBlackFriday ? "#F59E0B" : "var(--accent-cyan)",
                    color: "#02040A",
                  }}
                >
                  <ShoppingCart className="w-4 h-4" />
                  Al carrito
                </button>
              </div>
            </div>
          </div>

          {/* Right Large Product Image Showcase */}
          <div className="lg:col-span-5">
            <Link
              href={`/producto/${active.slug}`}
              className="block relative rounded-2xl border p-4 sm:p-6 h-56 sm:h-72 lg:h-80 flex items-center justify-center overflow-hidden group"
              style={{
                backgroundColor: isBlackFriday ? "#0F172A" : "var(--bg-card-media)",
                borderColor: isBlackFriday ? "rgba(251, 113, 133, 0.35)" : "var(--border-subtle)",
              }}
            >
              {active.imageUrl ? (
                <img
                  src={active.imageUrl}
                  alt={active.name}
                  className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Sin imagen
                </span>
              )}
              <span
                className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md"
                style={{
                  backgroundColor: "rgba(2, 4, 10, 0.78)",
                  color: "#34D399",
                  border: "1px solid rgba(52, 211, 153, 0.35)",
                }}
              >
                Stock: {active.stockAvailable} en Calle Oruro
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Interactive Slide Thumbnails / Dots + 3s Indicator */}
      <div
        className="px-4 sm:px-6 py-2.5 border-t flex items-center justify-between gap-3 overflow-x-auto"
        style={{
          borderColor: isBlackFriday ? "rgba(255,255,255,0.1)" : "var(--border-subtle)",
          backgroundColor: isBlackFriday ? "rgba(2, 4, 10, 0.65)" : "var(--bg-chassis)",
        }}
      >
        <div className="flex items-center gap-1.5">
          {slides.map((s, idx) => {
            const isCurr = idx === safeIndex;
            const slideBf = s.promoPriceCents !== null && s.promoPriceCents < s.priceCents;
            return (
              <button
                key={s.id}
                type="button"
                data-sound="none"
                aria-label={`Ver slide ${idx + 1}: ${s.name}`}
                onClick={() => {
                  playClick();
                  setActiveIndex(idx);
                }}
                className="h-2.5 rounded-full transition-all"
                style={{
                  width: isCurr ? "28px" : "10px",
                  backgroundColor: isCurr
                    ? slideBf
                      ? "#F59E0B"
                      : "var(--accent-cyan)"
                    : isBlackFriday
                    ? "rgba(255,255,255,0.22)"
                    : "var(--border-subtle)",
                }}
              />
            );
          })}
        </div>

        <span
          className="text-[11px] truncate hidden sm:inline"
          style={{ color: isBlackFriday ? "#CBD5E1" : "var(--text-muted)" }}
        >
          {isPaused
            ? "Auto-avance pausado"
            : isHovered
            ? "Pausado mientras exploras"
            : "Mostrando un modelo destacado cada 3 segundos"}
        </span>
      </div>
    </section>
  );
}
