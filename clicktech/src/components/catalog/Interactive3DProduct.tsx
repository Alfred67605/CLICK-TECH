"use client";

import React, { useEffect, useRef, useState } from "react";
import { Rotate3d, RotateCcw } from "lucide-react";

interface Interactive3DProductProps {
  src: string | null;
  alt: string;
  variant?: "fire" | "cyan";
  size?: "hero" | "detail";
  badgeText?: string;
  productKey?: string;
}

export function Interactive3DProduct({
  src,
  alt,
  variant = "cyan",
  size = "hero",
  badgeText,
  productKey,
}: Interactive3DProductProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [rotY, setRotY] = useState(0);
  const [rotX, setRotX] = useState(0);
  const [hoverTiltX, setHoverTiltX] = useState(0);
  const [hoverTiltY, setHoverTiltY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [autoSpin, setAutoSpin] = useState(false);

  const dragStartRef = useRef<{ x: number; y: number; baseY: number; baseX: number } | null>(null);

  // Smooth continuous Y-axis spin when toggled by the user
  useEffect(() => {
    if (!autoSpin || isDragging) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let rafId = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      setRotY((prev) => (prev + dt * 42) % 360);
      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [autoSpin, isDragging]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      baseY: rotY,
      baseX: rotX,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (isDragging && dragStartRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setRotY(dragStartRef.current.baseY + dx * 0.72);
      const nextX = Math.max(-16, Math.min(16, dragStartRef.current.baseX - dy * 0.25));
      setRotX(nextX);
      return;
    }

    if (rect) {
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      setHoverTiltY(nx * 10);
      setHoverTiltX(-ny * 6);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore if already released
      }
    }
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handlePointerLeave = () => {
    if (!isDragging) {
      setHoverTiltX(0);
      setHoverTiltY(0);
    }
  };

  const totalY = rotY + hoverTiltY;
  const totalX = rotX + hoverTiltX;
  const isModified = Math.abs(rotY) > 1 || Math.abs(rotX) > 1;

  const isHero = size === "hero";

  return (
    <div
      ref={containerRef}
      data-product-key={productKey}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      className={`relative w-full flex items-center justify-center select-none touch-none ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      } ${isHero ? "h-[310px] sm:h-[360px] lg:h-[410px]" : "h-[330px] sm:h-[420px]"}`}
      style={{ perspective: "1100px" }}
    >
      {/* Ambient Fire / Tech Energy Glow under Pedestal */}
      <div
        aria-hidden="true"
        className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[90%] max-w-[460px] h-28 rounded-full blur-2xl pointer-events-none"
        style={{
          background:
            variant === "fire"
              ? "radial-gradient(ellipse at center, rgba(239, 68, 68, 0.34) 0%, rgba(249, 115, 22, 0.2) 48%, transparent 76%)"
              : "radial-gradient(ellipse at center, rgba(14, 165, 233, 0.28) 0%, rgba(56, 189, 248, 0.14) 50%, transparent 76%)",
        }}
      />

      {/* Luminous Circular Studio Ring Halo */}
      <div
        aria-hidden="true"
        className={`absolute top-3 rounded-full pointer-events-none ${
          isHero ? "w-64 h-64 sm:w-80 sm:h-80" : "w-64 h-64 sm:w-80 sm:h-80"
        }`}
        style={{
          border:
            variant === "fire"
              ? "3px solid rgba(255, 255, 255, 0.96)"
              : "3px solid rgba(255, 255, 255, 0.96)",
          boxShadow:
            variant === "fire"
              ? "0 0 40px rgba(255, 255, 255, 0.95), 0 0 28px rgba(249, 115, 22, 0.26), inset 0 0 28px rgba(255, 255, 255, 0.72)"
              : "0 0 40px rgba(255, 255, 255, 0.95), 0 0 24px rgba(14, 165, 233, 0.2), inset 0 0 28px rgba(255, 255, 255, 0.72)",
          background:
            "radial-gradient(circle, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0) 72%)",
        }}
      />

      {/* 3D Cylindrical Silver Pedestal */}
      <div
        aria-hidden="true"
        className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[88%] max-w-[440px] h-16 pointer-events-none"
      >
        <div
          className="absolute bottom-0 inset-x-0 h-11 rounded-[50%]"
          style={{
            background:
              "linear-gradient(90deg, #94A3B8 0%, #E2E8F0 34%, #FFFFFF 52%, #CBD5E1 74%, #94A3B8 100%)",
            boxShadow:
              variant === "fire"
                ? "0 14px 28px -6px rgba(185, 28, 28, 0.34), 0 0 20px rgba(255,255,255,0.85)"
                : "0 14px 28px -6px rgba(15, 23, 42, 0.25), 0 0 20px rgba(255,255,255,0.85)",
          }}
        />
        <div
          className="absolute top-0 inset-x-0 h-11 rounded-[50%] border border-white"
          style={{
            background: "linear-gradient(180deg, #FFFFFF 0%, #E2E8F0 68%, #CBD5E1 100%)",
          }}
        />
      </div>

      {/* 3D Rotatable Product Stage */}
      <div
        data-carousel-hero-media="true"
        className="relative z-10 w-full h-full flex items-center justify-center pointer-events-none"
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${totalX.toFixed(2)}deg) rotateY(${totalY.toFixed(2)}deg)`,
          transition: isDragging || autoSpin ? "none" : "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            draggable={false}
            className={`object-contain -translate-y-3 select-none pointer-events-none ${
              isHero
                ? "w-[92%] h-[92%] max-h-[345px]"
                : "w-[92%] h-[92%] max-h-[370px]"
            }`}
            style={{
              filter: "drop-shadow(0 22px 26px rgba(15, 23, 42, 0.32))",
            }}
          />
        ) : (
          <span className="text-xs text-slate-500">Sin imagen</span>
        )}
      </div>

      {/* Interactive 360 Controls */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5">
        {isModified && (
          <button
            type="button"
            data-sound="none"
            onClick={() => {
              setRotY(0);
              setRotX(0);
              setAutoSpin(false);
            }}
            aria-label="Restablecer ángulo 3D"
            className="ct-btn h-8 px-2.5 rounded-full border border-slate-300 bg-white/90 text-[11px] font-bold text-slate-800 inline-flex items-center gap-1 shadow-sm hover:bg-white"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
        <button
          type="button"
          data-sound="none"
          onClick={() => setAutoSpin((s) => !s)}
          aria-pressed={autoSpin}
          aria-label={autoSpin ? "Detener giro 360°" : "Girar producto en 360°"}
          className="ct-btn h-8 px-3 rounded-full border text-[11px] font-extrabold inline-flex items-center gap-1.5 shadow-sm transition-colors"
          style={
            autoSpin
              ? {
                  backgroundColor: variant === "fire" ? "#C8102E" : "#0284C7",
                  borderColor: variant === "fire" ? "#991B1B" : "#0369A1",
                  color: "#FFFFFF",
                }
              : {
                  backgroundColor: "rgba(255, 255, 255, 0.92)",
                  borderColor: "#CBD5E1",
                  color: "#0F172A",
                }
          }
        >
          <Rotate3d className={`w-3.5 h-3.5 ${autoSpin ? "animate-spin" : ""}`} />
          <span>360° Girar</span>
        </button>
      </div>

      {/* Bottom Interactive Hint */}
      <span className="absolute bottom-1.5 left-2 z-20 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border border-slate-300 bg-white/88 text-slate-700 shadow-xs pointer-events-none">
        Arrastra para girar en su eje
      </span>

      {/* Optional Stock Badge */}
      {badgeText && (
        <span
          className="absolute bottom-1.5 right-2 z-20 px-2.5 py-1 rounded-full text-[11px] font-bold shadow-sm border pointer-events-none"
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.9)",
            color: "#34D399",
            borderColor: "rgba(52, 211, 153, 0.45)",
          }}
        >
          {badgeText}
        </span>
      )}
    </div>
  );
}
