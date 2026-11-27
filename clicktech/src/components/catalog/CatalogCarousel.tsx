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
          { x: dir * -28, opacity: 0, y: 8 },
          {
            x: 0,
            opacity: 1,
            y: 0,
            duration: 0.5,
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
          { x: dir * 75, scale: 0.86, opacity: 0 },
          {
            x: 0,
            scale: 1,
            opacity: 1,
            duration: 0.68,
            ease: "expo.out",
            clearProps: "opacity",
          },
          0
        );
      }
    },
    { scope: stageRef, dependencies: [active?.id] }
  );

  // Live 3-second countdown progress bar
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

      gsap.fromTo(barEl, { scaleX: 0 }, { scaleX: 1, duration: 3, ease: "none" });
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
    ? "linear-gradient(90deg, #EF4444 0%, #EA580C 100%)"
    : "linear-gradient(90deg, #0284C7 0%, #00B4D8 100%)";
  const accentColor = isPromoHero ? "#F97316" : "#38BDF8";
  const ctaGradient = isPromoHero
    ? "linear-gradient(90deg, #F97316 0%, #DC2626 55%, #991B1B 100%)"
    : "linear-gradient(90deg, #00E5FF 0%, #0284C7 55%, #1D4ED8 100%)";

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
          ? "linear-gradient(180deg, #050508 0%, #140505 52%, #330C05 86%, #4F1507 100%)"
          : "linear-gradient(135deg, #030A1A 0%, #071D45 48%, #0C3273 84%, #10449B 100%)",
        border: isPromoHero
          ? "2px solid rgba(249, 115, 22, 0.55)"
          : "2px solid rgba(56, 189, 248, 0.5)",
        boxShadow: isPromoHero
          ? "0 24px 54px -18px rgba(234, 88, 12, 0.45)"
          : "0 24px 52px -18px rgba(2, 132, 199, 0.4)",
      }}
    >
      {/* Top Bar: Campaign Tabs & Live Counter */}
      <div
        className="relative z-30 px-4 sm:px-6 py-2.5 border-b flex flex-wrap items-center justify-between gap-3"
        style={{
          borderColor: "rgba(255, 255, 255, 0.14)",
          backgroundColor: "rgba(5, 8, 18, 0.72)",
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
                    backgroundColor: "#00E5FF",
                    borderColor: "#00E5FF",
                    color: "#020617",
                  }
                : {
                    backgroundColor: "rgba(255,255,255,0.08)",
                    borderColor: "rgba(255,255,255,0.22)",
                    color: "#E2E8F0",
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
                      background: "linear-gradient(90deg, #F97316 0%, #DC2626 100%)",
                      borderColor: "#FB923C",
                      color: "#FFFFFF",
                    }
                  : {
                      backgroundColor: "rgba(220, 38, 38, 0.22)",
                      borderColor: "rgba(248, 113, 113, 0.45)",
                      color: "#FECACA",
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
              borderColor: "rgba(255,255,255,0.2)",
              backgroundColor: "rgba(255,255,255,0.08)",
              color: "#E2E8F0",
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
              borderColor: "rgba(255,255,255,0.25)",
              backgroundColor: "rgba(255,255,255,0.12)",
              color: "#FFFFFF",
            }}
          >
            {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            <span>{isPaused ? "Reanudar" : "Pausar"}</span>
          </button>
        </div>
      </div>

      {/* Main Bold Banner Stage with Sharp Fire Embers / Electric Sparks */}
      <div className="relative px-10 sm:px-14 py-6 sm:py-8 overflow-hidden">
        <EmberParticlesCanvas
          variant={isPromoHero ? "fire" : "cyan"}
          density={isPromoHero ? 64 : 52}
          className="absolute inset-0 z-10"
        />

        {/* Diagonal Graphic Corner Bars */}
        <div aria-hidden="true" className="pointer-events-none absolute top-4 right-5 z-0 flex items-center gap-2 opacity-90">
          <span
            className="block w-8 sm:w-10 h-16 sm:h-20 -skew-x-[22deg]"
            style={{
              background: isPromoHero
                ? "linear-gradient(180deg, #F97316 0%, rgba(220,38,38,0.1) 100%)"
                : "linear-gradient(180deg, #38BDF8 0%, rgba(2,132,199,0.1) 100%)",
            }}
          />
          <span
            className="block w-5 sm:w-6 h-12 sm:h-16 -skew-x-[22deg] translate-y-4"
            style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.05) 100%)" }}
          />
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-12 z-0 flex items-end gap-2 opacity-85">
          <span
            className="block w-24 sm:w-32 h-10 sm:h-12 skew-x-[32deg] translate-y-2"
            style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.06) 100%)" }}
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
          className="ct-btn absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-30 h-11 w-9 sm:h-14 sm:w-11 rounded-xl border flex items-center justify-center shadow-lg backdrop-blur-md"
          style={{
            backgroundColor: "rgba(9, 14, 28, 0.8)",
            borderColor: "rgba(255, 255, 255, 0.22)",
            color: "#FFFFFF",
          }}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          type="button"
          data-sound="none"
          onClick={goNext}
          aria-label="Siguiente producto del carrusel"
          className="ct-btn absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-30 h-11 w-9 sm:h-14 sm:w-11 rounded-xl border flex items-center justify-center shadow-lg backdrop-blur-md"
          style={{
            backgroundColor: "rgba(9, 14, 28, 0.8)",
            borderColor: "rgba(255, 255, 255, 0.22)",
            color: "#FFFFFF",
          }}
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Active Slide Content */}
        <div
          key={active.id}
          className="relative z-20 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
        >
          {/* Left Copy & Price Spotlight */}
          <div className="lg:col-span-6 space-y-3.5">
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
                className="inline-block w-1.5 h-6 -skew-x-12 opacity-80"
                style={{ backgroundColor: accentColor }}
              />
              <span
                aria-hidden="true"
                className="inline-block w-1.5 h-6 -skew-x-12 opacity-40"
                style={{ backgroundColor: accentColor }}
              />
            </div>

            <Link data-carousel-stagger href={`/producto/${active.slug}`} className="block group space-y-1">
              <div className="font-display text-2xl sm:text-4xl font-black uppercase tracking-tight leading-none text-white">
                {active.brandName}
              </div>
              <h2 className="font-heading text-lg sm:text-2xl font-extrabold tracking-tight leading-snug text-slate-100 group-hover:underline">
                {active.name}
              </h2>
            </Link>

            <div data-carousel-stagger className="flex items-center gap-2 pt-0.5">
              <span className="block h-1.5 w-14 rounded-full" style={{ backgroundColor: accentColor }} />
              <span className="block h-0.5 w-20 rounded-full bg-white/30" />
            </div>

            {specsList.length > 0 && (
              <div data-carousel-stagger className="flex flex-wrap gap-1.5">
                {specsList.map(([k, v]) => (
                  <span
                    key={k}
                    className="px-2.5 py-1 rounded-lg border text-xs font-medium bg-white/10 border-white/20 text-slate-100 backdrop-blur-xs"
                  >
                    <strong className="font-bold text-white">{k}:</strong> {v}
                  </span>
                ))}
              </div>
            )}

            <div data-carousel-stagger className="pt-1 space-y-2">
              {hasDiscount && (
                <div className="flex flex-wrap items-center gap-2.5 text-sm">
                  <span className="font-medium text-slate-300">Antes</span>
                  <span
                    className="font-extrabold text-slate-200 tabular-nums"
                    style={{
                      textDecoration: "line-through",
                      textDecorationColor: "#FB7185",
                      textDecorationThickness: "2px",
                    }}
                  >
                    {formatBsCompact(active.priceCents)}
                  </span>
                  <span className="text-xs font-bold text-emerald-200 bg-emerald-950/75 border border-emerald-400/40 px-2.5 py-0.5 rounded-full">
                    Ahorras {formatBsCompact(savingsCents)}
                  </span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <div
                  className="inline-flex items-center gap-2.5 px-5 py-2 rounded-2xl bg-white shadow-xl"
                  style={{ border: `2px solid ${accentColor}` }}
                >
                  {hasDiscount && (
                    <span
                      className="px-2.5 py-0.5 -skew-x-12 text-xs font-extrabold uppercase text-white"
                      style={{ backgroundColor: "#DC2626" }}
                    >
                      <span className="inline-block skew-x-12">Ahora</span>
                    </span>
                  )}
                  <span
                    className="font-display text-2xl sm:text-4xl font-black tabular-nums tracking-tight"
                    style={{ color: isPromoHero ? "#C8102E" : "#031942" }}
                  >
                    {formatBsCompact(effectivePrice)}
                  </span>
                </div>
              </div>
            </div>

            <div data-carousel-stagger className="pt-1 flex flex-wrap items-center gap-3">
              <button
                type="button"
                data-sound="none"
                onPointerEnter={() => playHover()}
                disabled={active.stockAvailable <= 0}
                onClick={() => addToCart(active.id, 1)}
                aria-label={`Agregar ${active.name} al carrito`}
                className="ct-btn h-12 px-6 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider text-white inline-flex items-center gap-2.5 shadow-lg transition-transform hover:scale-[1.02] disabled:opacity-45"
                style={{ background: ctaGradient }}
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="border-l border-white/35 pl-2.5">COMPRAR AHORA</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <Link
                href={`/producto/${active.slug}`}
                className="ct-btn h-11 px-4 rounded-full border border-white/25 bg-white/12 text-xs sm:text-sm font-bold text-white hover:bg-white/20 inline-flex items-center justify-center backdrop-blur-xs"
              >
                Ver ficha
              </Link>
            </div>
          </div>

          {/* Right Large Clean Product Spotlight (No 360 widget, illuminated halo for black hardware pop) */}
          <div className="lg:col-span-6">
            <Link
              href={`/producto/${active.slug}`}
              className="block relative h-68 sm:h-80 lg:h-[360px] flex items-center justify-center group"
            >
              {/* Luminous Studio Spotlight behind dark hardware */}
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: isPromoHero
                    ? "radial-gradient(circle at 50% 46%, rgba(255,255,255,0.92) 0%, rgba(255,237,213,0.48) 36%, rgba(249,115,22,0.12) 58%, transparent 74%)"
                    : "radial-gradient(circle at 50% 46%, rgba(255,255,255,0.92) 0%, rgba(224,242,254,0.48) 36%, rgba(56,189,248,0.14) 58%, transparent 74%)",
                }}
              />

              {/* Circular Halo Ring */}
              <div
                aria-hidden="true"
                className="absolute top-3 w-56 h-56 sm:w-72 sm:h-72 rounded-full pointer-events-none"
                style={{
                  border: "2.5px solid rgba(255, 255, 255, 0.9)",
                  boxShadow: isPromoHero
                    ? "0 0 36px rgba(255,255,255,0.55), 0 0 28px rgba(249,115,22,0.35)"
                    : "0 0 36px rgba(255,255,255,0.55), 0 0 28px rgba(56,189,248,0.35)",
                }}
              />

              {/* 3D Cylindrical Silver Pedestal */}
              <div
                aria-hidden="true"
                className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[84%] max-w-[400px] h-14 pointer-events-none"
              >
                <div
                  className="absolute bottom-0 inset-x-0 h-10 rounded-[50%]"
                  style={{
                    background: "linear-gradient(90deg, #94A3B8 0%, #E2E8F0 35%, #FFFFFF 52%, #CBD5E1 75%, #94A3B8 100%)",
                    boxShadow: "0 12px 26px -4px rgba(0, 0, 0, 0.55), 0 0 18px rgba(255,255,255,0.55)",
                  }}
                />
                <div
                  className="absolute top-0 inset-x-0 h-10 rounded-[50%] border border-white"
                  style={{
                    background: "linear-gradient(180deg, #FFFFFF 0%, #E2E8F0 70%, #CBD5E1 100%)",
                  }}
                />
              </div>

              {active.imageUrl ? (
                <img
                  data-carousel-hero-media
                  src={active.imageUrl}
                  alt={active.name}
                  className="relative z-10 w-[88%] h-[88%] max-h-[320px] -translate-y-2 object-contain transition-transform duration-500 group-hover:scale-105"
                  style={{ filter: "drop-shadow(0 18px 24px rgba(0, 0, 0, 0.45))" }}
                />
              ) : (
                <span className="relative z-10 text-xs text-slate-200">Sin imagen</span>
              )}

              <span
                className="absolute bottom-2 right-2 z-20 px-2.5 py-1 rounded-full text-[11px] font-bold shadow-md border"
                style={{
                  backgroundColor: "rgba(5, 8, 18, 0.88)",
                  color: "#34D399",
                  borderColor: "rgba(52, 211, 153, 0.45)",
                }}
              >
                Stock: {active.stockAvailable} en Calle Oruro
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Live 3s Autoplay Progress Bar */}
      <div className="relative z-30 h-1 w-full bg-white/10 overflow-hidden">
        <div
          data-carousel-progress
          className="h-full w-full origin-left"
          style={{
            background: isPromoHero
              ? "linear-gradient(90deg, #F97316 0%, #EF4444 100%)"
              : "linear-gradient(90deg, #00E5FF 0%, #38BDF8 100%)",
          }}
        />
      </div>

      {/* Bottom Interactive Slide Dots + Status */}
      <div
        className="relative z-30 px-4 sm:px-6 py-2.5 border-t flex items-center justify-between gap-3 overflow-x-auto"
        style={{
          borderColor: "rgba(255, 255, 255, 0.14)",
          backgroundColor: "rgba(5, 8, 18, 0.72)",
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
                      ? "#F97316"
                      : "#00E5FF"
                    : "rgba(255, 255, 255, 0.25)",
                }}
              />
            );
          })}
        </div>

        <span className="text-[11px] font-medium text-slate-300 truncate hidden sm:inline">
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
