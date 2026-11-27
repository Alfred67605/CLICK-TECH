"use client";

import React, { useEffect, useRef } from "react";

interface EmberParticlesCanvasProps {
  variant?: "fire" | "cyan";
  density?: number;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  maxAlpha: number;
  phase: number;
  freq: number;
  spriteIdx: 0 | 1;
  life: number;
  maxLife: number;
}

function createGlowSprite(coreRgb: string, midRgb: string, outerRgb: string): HTMLCanvasElement {
  const off = document.createElement("canvas");
  off.width = 32;
  off.height = 32;
  const octx = off.getContext("2d");
  if (octx) {
    const grad = octx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, `rgba(${coreRgb}, 1)`);
    grad.addColorStop(0.32, `rgba(${midRgb}, 0.85)`);
    grad.addColorStop(1, `rgba(${outerRgb}, 0)`);
    octx.fillStyle = grad;
    octx.fillRect(0, 0, 32, 32);
  }
  return off;
}

export function EmberParticlesCanvas({
  variant = "fire",
  density = 42,
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

    const sprites: [HTMLCanvasElement, HTMLCanvasElement] =
      variant === "fire"
        ? [
            createGlowSprite("254, 249, 195", "249, 115, 22", "185, 28, 28"),
            createGlowSprite("253, 224, 71", "239, 68, 68", "185, 28, 28"),
          ]
        : [
            createGlowSprite("240, 249, 255", "0, 229, 255", "2, 132, 199"),
            createGlowSprite("240, 249, 255", "14, 165, 233", "2, 132, 199"),
          ];

    let width = 0;
    let height = 0;
    let rafId = 0;
    let lastFrameTime = 0;

    const createParticle = (startRandomY = false): Particle => {
      const w = Math.max(width, 320);
      const h = Math.max(height, 240);
      const maxLife = 80 + Math.random() * 90;
      return {
        x: Math.random() * w,
        y: startRandomY ? Math.random() * h : h * (0.72 + Math.random() * 0.32),
        vx: (Math.random() - 0.5) * 0.55,
        vy: -(0.9 + Math.random() * 1.9),
        radius: 1.8 + Math.random() * 3.8,
        alpha: 0,
        maxAlpha: 0.45 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        freq: 0.035 + Math.random() * 0.045,
        spriteIdx: Math.random() > 0.45 ? 0 : 1,
        life: startRandomY ? Math.random() * maxLife : 0,
        maxLife,
      };
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      // dpr=1 saves 75% pixels with identical soft radial glow appearance
      canvas.width = width;
      canvas.height = height;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const particles: Particle[] = Array.from({ length: density }, () =>
      createParticle(true)
    );

    const draw = (now: number) => {
      rafId = window.requestAnimationFrame(draw);

      if (typeof document !== "undefined" && document.hidden) return;
      if (now - lastFrameTime < 32) return; // Cap at ~30fps
      lastFrameTime = now;

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.life += 1;
        p.phase += p.freq;
        p.x += p.vx + Math.sin(p.phase) * 0.65;
        p.y += p.vy;

        const progress = p.life / p.maxLife;
        const fadeIn = Math.min(1, progress * 4);
        const fadeOut = Math.max(0, 1 - Math.max(0, (progress - 0.55) / 0.45));
        const flicker = 0.78 + 0.22 * Math.sin(p.phase * 2.3);
        p.alpha = p.maxAlpha * fadeIn * fadeOut * flicker;

        if (p.life >= p.maxLife || p.y < -16 || p.x < -20 || p.x > width + 20) {
          particles[i] = createParticle(false);
          continue;
        }

        const size = p.radius * (1.2 - progress * 0.45) * 7.2;
        const half = size * 0.5;
        ctx.globalAlpha = p.alpha;
        ctx.drawImage(sprites[p.spriteIdx], p.x - half, p.y - half, size, size);
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
