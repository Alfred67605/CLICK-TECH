"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

interface AdminViewTransitionProps {
  viewKey: string;
  children: React.ReactNode;
  className?: string;
}

export function AdminViewTransition({
  viewKey,
  children,
  className = "",
}: AdminViewTransitionProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const container = containerRef.current;
      if (!container) return;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      gsap.fromTo(
        container,
        {
          clipPath: "inset(0% 0% 18% 0% round 20px)",
          opacity: 0.4,
        },
        {
          clipPath: "inset(0% 0% 0% 0% round 20px)",
          opacity: 1,
          duration: 0.42,
          ease: "power3.out",
          clearProps: "clipPath",
        }
      );

      const staggerItems = container.querySelectorAll(".admin-stagger-item");
      if (staggerItems.length > 0) {
        gsap.fromTo(
          staggerItems,
          { opacity: 0, y: 12 },
          {
            opacity: 1,
            y: 0,
            duration: 0.36,
            stagger: 0.08,
            ease: "power3.out",
            clearProps: "transform",
          }
        );
      }
    },
    { scope: containerRef, dependencies: [viewKey] }
  );

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}
