"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Pause,
  Play,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";
import { useUISound } from "@/hooks/useUISound";
import { formatBsCompact } from "@/lib/domain/money";
import type { ProductCardData } from "@/components/catalog/ProductCard";
import { EmberParticlesCanvas } from "@/components/ui/EmberParticlesCanvas";
import { Interactive3DProduct } from "@/components/catalog/Interactive3DProduct";

gsap.registerPlugin(useGSAP);

type CarouselFilter = "all" | "black-friday";

export function CatalogCarousel({ products }: { products: ProductCardData[] }) {
  const { addToCart } = useStore();
  const { playClick, playHover } = useUISound();

  const stageRef = useRef<HTMLElement | null>(null);
  const directionRef = useRef<1 | -1>(1);

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

  const slides =
    campaignTab === "black-friday" && blackFridaySlides.length > 0 ? blackFridaySlides : allSlides;
  const safeIndex = slides.length > 0 ? activeIndex % slides.length : 0;
  const active = slides[safeIndex];

  // Auto-advance every 3 seconds unless paused or hovered
  useEffect(() => {
    if (slides.length <= 1 || isPaused || isHovered) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const timer = window.setInterval(() => {
      directionRef.current = 1;
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [slides.length, isPaused, isHovered]);

  // Pro directional GSAP transition choreography on slide change
  useGSAP(
    () => {
      if (!active) return;
      if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }
      const dir = directionRef.current;
      const staggerEls = gsap.utils.toArray<HTMLElement>("[data-carousel-stagger]");
      const mediaEl = stageRef.current?.querySelector<HTMLElement>("[data-carousel-hero-media]");

      const tl = gsap.timeline();
      if (staggerEls.length > 0) {
        tl.fromTo(
          staggerEls,
          { x: dir * -30, opacity: 0, y: 8 },
          {
            x: 0,
            opacity: 1,
            y: 0,
            duration: 0.52,
            stagger: 0.055,
            ease: "power3.out",
            clearProps: "transform",
          },
          0
        );
      }
      if (mediaEl) {
        tl.fromTo(
          mediaEl,
          { x: dir * 80, scale: 0.84, opacity: 0 },
          {
            x: 0,
            scale: 1,
            opacity: 1,
            duration: 0.72,
            ease: "expo.out",
            clearProps: "opacity",
          },
          0
        );
      }
    },
    { scope: stageRef, dependencies: [active?.id] }
  );

  // Live 3-second countdown progress bar synced cleanly with pause/hover state
  useGSAP(
    () => {
      if (!active) return;
      const barEl = stageRef.current?.querySelector<HTMLElement>("[data-carousel-progress]");
      if (!barEl) return;
      gsap.killTweensOf(barEl);

      if (
        isPaused ||
        isHovered ||
        slides.length <= 1 ||
        (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      ) {
        gsap.set(barEl, { scaleX: 0 });
        return;
      }

      gsap.fromTo(
        barEl,
        { scaleX: 0 },
        { scaleX: 1, duration: 3, ease: "none" }
      );
    },
    { scope: stageRef, dependencies: [active?.id, isPaused, isHovered, slides.length] }
  );

  if (!active) return null;

  const effectivePrice = active.promoPriceCents ?? active.priceCents;
  const hasDiscount = active.promoPriceCents !== null && active.promoPriceCents < active.priceCents;
  const isPromoHero = Boolean(active.promoLabel?.toUpperCase().includes("BLACK FRIDAY")) || hasDiscount;
  const discountPct = hasDiscount
    ? Math.max(1, Math.round(((active.priceCents - effectivePrice) / active.priceCents) * 100))
    : 0;
  const savingsCents = hasDiscount ? active.priceCents - effectivePrice : 0;
  const specsList = Object.entries((active.shortSpecsJson ?? {}) as Record<string, string>).slice(0, 3);

  const primaryRibbonGradient = isPromoHero
    ? "linear-gradient(90deg, #DC2626 0%, #991B1B 100%)"
    : "linear-gradient(90deg, #0284C7 0%, #0369A1 100%)";
  const accentColor = isPromoHero ? "#C8102E" : "#0284C7";
  const ctaGradient = isPromoHero
    ? "linear-gradient(90deg, #E11D48 0%, #B91C1C 60%, #7F1D1D 100%)"
    : "linear-gradient(90deg, #0EA5E9 0%, #0284C7 60%, #0369A1 100%)";

  function goPrev() {
    playClick();
    directionRef.current = -1;
    setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }

  function goNext() {
    playClick();
    directionRef.current = 1;
    setActiveIndex((prev) => (prev + 1) % slides.length);
  }

  return (
    <section
      ref={stageRef}
      aria-label="Vitrina Hero ClickTech y Ofertas Black Friday"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative rounded-3xl overflow-hidden transition-colors duration-300"
      style={{
        background: isPromoHero
          ? "linear-gradient(135deg, #FFFFFF 0%, #FFF5F5 46%, #E2E8F0 100%)"
          : "linear-gradient(135deg, #FFFFFF 0%, #EEF2F7 52%, #E2E8F0 100%)",
        border: isPromoHero ? "2px solid rgba(220, 38, 38, 0.45)" : "2px solid rgba(14, 165, 233, 0.35)",
        boxShadow: isPromoHero
          ? "0 24px 52px -18px rgba(200, 16, 46, 0.35)"
          : "0 22px 48px -18px rgba(2, 132, 199, 0.25)",
      }}
    >
      {/* Top Bar: Campaign Tabs & Live Counter */}
      <div
        className="relative z-30 px-4 sm:px-6 py-2.5 border-b flex flex-wrap items-center justify-between gap-3"
        style={{
          borderColor: "rgba(148, 163, 184, 0.3)",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-sound="none"
            onClick={() => {
              playClick();
              directionRef.current = 1;
              setCampaignTab("all");
              setActiveIndex(0);
            }}
            className="ct-btn h-8 px-3.5 rounded-full text-xs font-extrabold inline-flex items-center gap-1.5 border transition-colors"
            style={
              campaignTab === "all"
                ? {
                    backgroundColor: "#0F172A",
                    borderColor: "#0F172A",
                    color: "#FFFFFF",
                  }
                : {
                    backgroundColor: "#FFFFFF",
                    borderColor: "#CBD5E1",
                    color: "#334155",
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
                directionRef.current = 1;
                setCampaignTab("black-friday");
                setActiveIndex(0);
              }}
              className="ct-btn h-8 px-3.5 rounded-full text-xs font-extrabold inline-flex items-center gap-1.5 border transition-colors"
              style={
                campaignTab === "black-friday"
                  ? {
                      background: "linear-gradient(90deg, #DC2626 0%, #991B1B 100%)",
                      borderColor: "#991B1B",
                      color: "#FFFFFF",
                    }
                  : {
                      backgroundColor: "#FEF2F2",
                      borderColor: "#FECACA",
                      color: "#B91C1C",
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
            className="px-2.5 py-0.5 rounded-full border font-semibold"
            style={{
              borderColor: "#CBD5E1",
              backgroundColor: "#FFFFFF",
              color: "#334155",
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
            className="ct-btn h-8 px-3 rounded-full border inline-flex items-center gap-1 font-sans font-bold shadow-sm"
            style={{
              borderColor: "#CBD5E1",
              backgroundColor: "#FFFFFF",
              color: "#0F172A",
            }}
          >
            {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            <span>{isPaused ? "Reanudar" : "Pausar"}</span>
          </button>
        </div>
      </div>

      {/* Main Commercial Studio Banner Stage + Fire Embers / Sparks + Enlarged 3D Rotatable Product */}
      <div className="relative px-10 sm:px-14 py-5 sm:py-7 overflow-hidden">
        {/* Bottom Fire / Energy Ambient Aura */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background: isPromoHero
              ? "radial-gradient(ellipse at 65% 108%, rgba(239, 68, 68, 0.25) 0%, rgba(249, 115, 22, 0.12) 40%, transparent 72%)"
              : "radial-gradient(ellipse at 65% 108%, rgba(14, 165, 233, 0.2) 0%, rgba(56, 189, 248, 0.08) 42%, transparent 72%)",
          }}
        />

        {/* Floating Fire Embers / Tech Sparks Canvas */}
        <EmberParticlesCanvas
          variant={isPromoHero ? "fire" : "cyan"}
          density={46}
          className="absolute inset-0 z-10"
        />

        {/* Diagonal Graphic Corner Bars (Top-Right & Bottom-Left) */}
        <div aria-hidden="true" className="pointer-events-none absolute top-4 right-5 z-0 flex items-center gap-2 opacity-90">
          <span
            className="block w-8 sm:w-10 h-16 sm:h-20 -skew-x-[22deg]"
            style={{
              background: isPromoHero
                ? "linear-gradient(180deg, #DC2626 0%, rgba(220,38,38,0.08) 100%)"
                : "linear-gradient(180deg, #0284C7 0%, rgba(2,132,199,0.08) 100%)",
            }}
          />
          <span
            className="block w-5 sm:w-6 h-12 sm:h-16 -skew-x-[22deg] translate-y-4"
            style={{ background: "linear-gradient(180deg, #94A3B8 0%, rgba(148,163,184,0.1) 100%)" }}
          />
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-12 z-0 flex items-end gap-2 opacity-85">
          <span
            className="block w-24 sm:w-32 h-10 sm:h-12 skew-x-[32deg] translate-y-2"
            style={{ background: "linear-gradient(90deg, #CBD5E1 0%, rgba(203,213,225,0.35) 100%)" }}
          />
          <span
            className="block w-6 sm:w-8 h-10 sm:h-12 skew-x-[32deg] translate-y-2"
            style={{ background: primaryRibbonGradient }}
          />
        </div>

        {/* Left / Right Navigation Arrows */}
        <button
          type="button"
          data-sound="none"
          onClick={goPrev}
          aria-label="Producto anterior del carrusel"
          className="ct-btn absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-30 h-11 w-9 sm:h-14 sm:w-11 rounded-xl border flex items-center justify-center shadow-md"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.94)",
            borderColor: "#CBD5E1",
            color: "#0F172A",
          }}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          type="button"
          data-sound="none"
          onClick={goNext}
          aria-label="Siguiente producto del carrusel"
          className="ct-btn absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-30 h-11 w-9 sm:h-14 sm:w-11 rounded-xl border flex items-center justify-center shadow-md"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.94)",
            borderColor: "#CBD5E1",
            color: "#0F172A",
          }}
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Active Slide Content (5 cols Copy + 7 cols Large Interactive 3D Product) */}
        <div
          key={active.id}
          className="relative z-20 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-center"
        >
          {/* Left Copy, Dynamic Ribbon, Price Pill & CTA */}
          <div className="lg:col-span-5 space-y-3">
            {/* Slanted Commercial Ribbon + // bars */}
            <div data-carousel-stagger className="flex items-center gap-1.5">
              <span
                className="inline-flex items-center gap-1.5 px-4 py-1 -skew-x-12 text-xs sm:text-sm font-black uppercase tracking-wider text-white shadow-md"
                style={{ background: primaryRibbonGradient }}
              >
                <span className="skew-x-12 inline-flex items-center gap-1.5">
                  {isPromoHero ? <Flame className="w-3.5 h-3.5 fill-white" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {isPromoHero
                    ? `BLACK FRIDAY · -${discountPct}% OFF`
                    : `HERO OFFER · ${active.categoryName}`}
                </span>
              </span>
              <span
                aria-hidden="true"
                className="inline-block w-1.5 h-6 -skew-x-12 opacity-60"
                style={{ backgroundColor: accentColor }}
              />
              <span
                aria-hidden="true"
                className="inline-block w-1.5 h-6 -skew-x-12 opacity-30"
                style={{ backgroundColor: accentColor }}
              />
            </div>

            {/* Bold Brand & Product Title */}
            <Link data-carousel-stagger href={`/producto/${active.slug}`} className="block group space-y-1">
              <div className="font-display text-2xl sm:text-4xl font-black uppercase tracking-tight leading-none text-slate-950">
                {active.brandName}
              </div>
              <h2 className="font-heading text-lg sm:text-xl xl:text-2xl font-extrabold tracking-tight leading-snug text-slate-800 group-hover:underline">
                {active.name}
              </h2>
            </Link>

            {/* Accent Bar */}
            <div data-carousel-stagger className="flex items-center gap-2 pt-0.5">
              <span className="block h-1.5 w-14 rounded-full" style={{ backgroundColor: accentColor }} />
              <span className="block h-0.5 w-20 rounded-full bg-slate-300" />
            </div>

            {/* Crisp Specs Chips */}
            {specsList.length > 0 && (
              <div data-carousel-stagger className="flex flex-wrap gap-1.5">
                {specsList.map(([k, v]) => (
                  <span
                    key={k}
                    className="px-2.5 py-1 rounded-lg border text-xs font-medium bg-white/90 border-slate-300 text-slate-700 shadow-xs"
                  >
                    <strong className="font-bold text-slate-900">{k}:</strong> {v}
                  </span>
                ))}
              </div>
            )}

            {/* Dynamic White-Pill Price Display */}
            <div data-carousel-stagger className="pt-1 space-y-1.5">
              {hasDiscount && (
                <div className="flex flex-wrap items-center gap-2.5 text-sm">
                  <span className="font-medium text-slate-600">Antes</span>
                  <span
                    className="relative inline-block font-extrabold text-slate-700 tabular-nums"
                    style={{
                      textDecoration: "line-through",
                      textDecorationColor: "#DC2626",
                      textDecorationThickness: "2px",
                    }}
                  >
                    {formatBsCompact(active.priceCents)}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Ahorras {formatBsCompact(savingsCents)}
                  </span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <div
                  className="inline-flex items-center gap-2.5 px-5 py-2 rounded-2xl bg-white shadow-sm"
                  style={{ border: `2px solid ${accentColor}` }}
                >
                  {hasDiscount && (
                    <span
                      className="px-2.5 py-0.5 -skew-x-12 text-xs font-extrabold uppercase text-white"
                      style={{ backgroundColor: accentColor }}
                    >
                      <span className="inline-block skew-x-12">Ahora</span>
                    </span>
                  )}
                  <span
                    className="font-display text-2xl sm:text-4xl font-black tabular-nums tracking-tight"
                    style={{ color: isPromoHero ? "#C8102E" : "#0F172A" }}
                  >
                    {formatBsCompact(effectivePrice)}
                  </span>
                </div>
              </div>
            </div>

            {/* Pill Gradient CTA + Secondary Link (Zero "Añadir" word so E2E targets ProductCard cleanly) */}
            <div data-carousel-stagger className="pt-1 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                data-sound="none"
                onPointerEnter={() => playHover()}
                disabled={active.stockAvailable <= 0}
                onClick={() => addToCart(active.id, 1)}
                aria-label={`Agregar ${active.name} al carrito`}
                className="ct-btn h-11 px-5 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider text-white inline-flex items-center gap-2.5 shadow-lg transition-transform hover:scale-[1.02] disabled:opacity-45"
                style={{ background: ctaGradient }}
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="border-l border-white/35 pl-2.5">COMPRAR AHORA</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <Link
                href={`/producto/${active.slug}`}
                className="ct-btn h-11 px-4 rounded-full border border-slate-300 bg-white/95 text-xs sm:text-sm font-bold text-slate-800 hover:bg-white inline-flex items-center justify-center shadow-xs"
              >
                Ver ficha
              </Link>
            </div>
          </div>

          {/* Right Large Interactive 3D Product Showcase (7 cols, drag to spin 360°) */}
          <div className="lg:col-span-7">
            <Interactive3DProduct
              src={active.imageUrl}
              alt={active.name}
              variant={isPromoHero ? "fire" : "cyan"}
              size="hero"
              badgeText={`Stock: ${active.stockAvailable} en Calle Oruro`}
              productKey={active.id}
            />
          </div>
        </div>
      </div>

      {/* Live 3s Autoplay Progress Bar */}
      <div className="relative z-30 h-1 w-full bg-slate-200/80 overflow-hidden">
        <div
          data-carousel-progress
          className="h-full w-full origin-left"
          style={{
            background: isPromoHero
              ? "linear-gradient(90deg, #DC2626 0%, #F97316 100%)"
              : "linear-gradient(90deg, #0284C7 0%, #00E5FF 100%)",
          }}
        />
      </div>

      {/* Bottom Interactive Slide Dots + Status */}
      <div
        className="relative z-30 px-4 sm:px-6 py-2.5 border-t flex items-center justify-between gap-3 overflow-x-auto"
        style={{
          borderColor: "rgba(148, 163, 184, 0.3)",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
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
                  directionRef.current = idx >= safeIndex ? 1 : -1;
                  setActiveIndex(idx);
                }}
                className="h-2.5 rounded-full transition-all"
                style={{
                  width: isCurr ? "28px" : "10px",
                  backgroundColor: isCurr
                    ? slideBf
                      ? "#DC2626"
                      : "#0284C7"
                    : "#CBD5E1",
                }}
              />
            );
          })}
        </div>

        <span className="text-[11px] font-medium text-slate-600 truncate hidden sm:inline">
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
