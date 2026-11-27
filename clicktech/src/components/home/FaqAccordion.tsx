"use client";

import React, { useState } from "react";
import { ChevronDown, CheckCircle2 } from "lucide-react";

export interface FaqItem {
  q: string;
  a: string;
}

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
      {items.map((item, idx) => {
        const isOpen = openIdx === idx;
        return (
          <div
            key={item.q}
            className="rounded-xl border overflow-hidden transition-colors"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: isOpen ? "var(--border-strong)" : "var(--border-subtle)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <button
              type="button"
              data-sound={isOpen ? "toggleOff" : "toggleOn"}
              aria-expanded={isOpen}
              onClick={() => setOpenIdx(isOpen ? null : idx)}
              className="ct-btn w-full px-5 py-4 text-left flex items-start justify-between gap-3"
            >
              <span className="font-heading font-semibold text-sm flex items-start gap-2.5" style={{ color: "var(--text-primary)" }}>
                <CheckCircle2
                  className="w-4 h-4 shrink-0 mt-0.5"
                  style={{ color: isOpen ? "var(--accent-cyan)" : "var(--text-muted)" }}
                />
                <span>{item.q}</span>
              </span>
              <ChevronDown
                className="w-4 h-4 shrink-0 mt-0.5"
                style={{
                  color: "var(--accent-cyan)",
                  transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 200ms var(--ease-out)",
                }}
              />
            </button>

            {isOpen && (
              <div
                className="px-5 pb-4 pt-1 text-xs sm:text-sm leading-relaxed pl-11 border-t"
                style={{
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-secondary)",
                }}
              >
                {item.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
