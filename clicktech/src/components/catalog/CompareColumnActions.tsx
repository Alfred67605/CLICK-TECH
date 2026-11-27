"use client";

import React from "react";
import Link from "next/link";
import { ExternalLink, ShoppingCart } from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";

export function CompareColumnActions({
  productId,
  slug,
  name,
  inStock,
}: {
  productId: string;
  slug: string;
  name: string;
  inStock: boolean;
}) {
  const { addToCart } = useStore();

  return (
    <div className="flex flex-col sm:flex-row gap-1.5 pt-2">
      <button
        type="button"
        data-sound="none"
        disabled={!inStock}
        onClick={() => addToCart(productId, 1)}
        aria-label={`Añadir ${name} al carrito`}
        className="ct-btn flex-1 h-9 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-45"
        style={{
          backgroundColor: "var(--accent-cyan)",
          color: "var(--accent-cyan-ink)",
        }}
      >
        <ShoppingCart className="w-3.5 h-3.5" />
        {inStock ? "Añadir" : "Agotado"}
      </button>
      <Link
        href={`/producto/${slug}`}
        className="ct-btn h-9 px-3 rounded-lg border text-xs font-semibold inline-flex items-center justify-center gap-1"
        style={{
          borderColor: "var(--border-subtle)",
          backgroundColor: "var(--bg-chassis)",
          color: "var(--text-primary)",
        }}
      >
        <span>Ficha</span>
        <ExternalLink className="w-3 h-3" />
      </Link>
    </div>
  );
}
