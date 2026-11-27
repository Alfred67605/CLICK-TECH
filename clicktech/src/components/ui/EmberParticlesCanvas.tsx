"use client";

import React, { useEffect, useRef } from "react";

interface EmberParticlesCanvasProps {
  variant?: "fire" | "cyan";
  density?: number;
  className?: string;
}

interface EmberSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  length: number;
  isMote: boolean;
  alpha: number;
  maxAlpha: number;
  phase: number;
  freq: number;
  colorIdx: 0 | 1 | 2;
  life: number;
  maxLife: number;
}

const FIRE_PALETTE: ReadonlyArray<{ outer: string; core: string }> = [
  { outer: "rgba(249, 115, 22, 0.55)", core: "rgba(254, 249, 195, 1)" },
  { outer: "rgba(239, 68, 68, 0.55)", core: "rgba(253, 224, 71, 1)" },
  { outer: "rgba(234, 88, 12, 0.5)", core: "rgba(251, 146, 60, 1)" },
];

const CYAN_PALETTE: ReadonlyArray<{ outer: string; core: string }> = [
  { outer: "rgba(14, 165, 233, 0.55)", core: "rgba(240, 249, 255, 1)" },
  { outer: "rgba(37, 99, 235, 0.52)", core: "rgba(125, 211, 252, 1)" },
  { outer: "rgba(0, 229, 255, 0.5)", core: "rgba(56, 189, 248, 1)" },
];

export function EmberParticlesCanvas({
  variant = "fire",
  density = 56,
  className = "",
}: EmberParticlesCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const palette = variant === "fire" ? FIRE_PALETTE : CYAN_PALETTE;

    let width = 0;
    let height = 0;
    let bottomGlowGrad: CanvasGradient | null = null;
    let rafId = 0;
    let lastFrameTime = 0;

    const createSpark = (startRandomY = false): EmberSpark => {
      const w = Math.max(width, 320);
      const h = Math.max(height, 220);
      const maxLife = 65 + Math.random() * 85;
      const isMote = Math.random() < 0.28;
      return {
        x: Math.random() * w,
        y: startRandomY ? Math.random() * h : h * (0.76 + Math.random() * 0.28),
        vx: (Math.random() - 0.5) * 1.15,
        vy: -(1.3 + Math.random() * 2.8),
        width: isMote ? 1.5 + Math.random() * 1.6 : 1.3 + Math.random() * 2.2,
        length: isMote ? 2.2 : 7 + Math.random() * 17,
        isMote,
        alpha: 0,
        maxAlpha: 0.55 + Math.random() * 0.45,
        phase: Math.random() * Math.PI * 2,
        freq: 0.05 + Math.random() * 0.06,
        colorIdx: Math.random() > 0.55 ? 0 : Math.random() > 0.5 ? 1 : 2,
        life: startRandomY ? Math.random() * maxLife : 0,
        maxLife,
      };
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      canvas.width = width;
      canvas.height = height;

      bottomGlowGrad = ctx.createLinearGradient(0, height, 0, height * 0.35);
      if (variant === "fire") {
        bottomGlowGrad.addColorStop(0, "rgba(234, 88, 12, 0.44)");
        bottomGlowGrad.addColorStop(0.45, "rgba(185, 28, 28, 0.2)");
        bottomGlowGrad.addColorStop(1, "rgba(185, 28, 28, 0)");
      } else {
        bottomGlowGrad.addColorStop(0, "rgba(14, 165, 233, 0.36)");
        bottomGlowGrad.addColorStop(0.45, "rgba(37, 99, 235, 0.18)");
        bottomGlowGrad.addColorStop(1, "rgba(37, 99, 235, 0)");
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const sparks: EmberSpark[] = Array.from({ length: density }, () =>
      createSpark(true)
    );

    const draw = (now: number) => {
      rafId = window.requestAnimationFrame(draw);

      if (typeof document !== "undefined" && document.hidden) return;
      if (now - lastFrameTime < 32) return; // Cap at ~30fps
      lastFrameTime = now;

      ctx.clearRect(0, 0, width, height);

      if (bottomGlowGrad) {
        ctx.fillStyle = bottomGlowGrad;
        ctx.fillRect(0, height * 0.35, width, height * 0.65);
      }

      for (let i = 0; i < sparks.length; i++) {
        const s = sparks[i];
        s.life += 1;
        s.phase += s.freq;

        const drift = Math.sin(s.phase) * 0.95;
        const stepX = s.vx + drift;
        const stepY = s.vy;
        s.x += stepX;
        s.y += stepY;

        const progress = s.life / s.maxLife;
        const fadeIn = Math.min(1, progress * 4.5);
        const fadeOut = Math.max(0, 1 - Math.max(0, (progress - 0.5) / 0.5));
        const flicker = 0.72 + 0.28 * Math.sin(s.phase * 2.4);
        s.alpha = s.maxAlpha * fadeIn * fadeOut * flicker;

        if (s.life >= s.maxLife || s.y < -24 || s.x < -24 || s.x > width + 24) {
          sparks[i] = createSpark(false);
          continue;
        }

        const c = palette[s.colorIdx];
        const angle = Math.atan2(stepY, stepX) + Math.PI / 2;

        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(angle);
        ctx.globalAlpha = s.alpha;

        if (s.isMote) {
          ctx.fillStyle = c.outer;
          ctx.beginPath();
          ctx.arc(0, 0, s.width * 1.6, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = c.core;
          ctx.beginPath();
          ctx.arc(0, 0, s.width * 0.85, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const curLen = s.length * (1.15 - progress * 0.45);
          // Outer incandescent halo stroke
          ctx.fillStyle = c.outer;
          ctx.fillRect(-s.width, -curLen * 0.6, s.width * 2, curLen * 1.2);
          // Crisp hot core ember streak
          ctx.fillStyle = c.core;
          ctx.fillRect(-s.width * 0.45, -curLen * 0.5, s.width * 0.9, curLen);
        }

        ctx.restore();
      }
      ctx.globalAlpha = 1;
    };

    rafId = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [variant, density]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none w-full h-full ${className}`}
    />
  );
}
