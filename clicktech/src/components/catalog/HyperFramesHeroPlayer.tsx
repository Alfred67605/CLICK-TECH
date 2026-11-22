"use client";

import React, { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

export function HyperFramesHeroPlayer() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setReducedMotion(mq.matches);
      if (mq.matches && videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else if (!mq.matches && videoRef.current) {
        videoRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  function togglePlayback() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      v.pause();
      setIsPlaying(false);
    }
  }

  return (
    <div
      className="relative rounded-2xl border overflow-hidden shadow-2xl aspect-video w-full"
      style={{
        borderColor: "var(--border-strong)",
        backgroundColor: "#02040A",
      }}
    >
      {reducedMotion ? (
        <img
          src="/media/brand/clicktech-brand-poster.webp"
          alt="ClickTech — Tecnología a tu medida (portada estática)"
          className="w-full h-full object-cover"
        />
      ) : (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/media/brand/clicktech-brand-poster.webp"
          aria-label="Animación de marca ClickTech — Tecnología a tu medida"
          className="w-full h-full object-cover"
        >
          <source src="/media/brand/clicktech-brand.webm" type="video/webm" />
          <source src="/media/brand/clicktech-brand.mp4" type="video/mp4" />
        </video>
      )}

      {!reducedMotion && (
        <button
          type="button"
          onClick={togglePlayback}
          aria-label={isPlaying ? "Pausar animación de marca" : "Reproducir animación de marca"}
          className="ct-btn absolute bottom-3 right-3 h-10 px-3 rounded-lg border flex items-center gap-1.5 text-xs font-semibold backdrop-blur-md"
          style={{
            backgroundColor: "rgba(2, 4, 10, 0.78)",
            borderColor: "var(--border-strong)",
            color: "#ffffff",
          }}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {isPlaying ? "Pausar" : "Reproducir"}
        </button>
      )}
    </div>
  );
}
