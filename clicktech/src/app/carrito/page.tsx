"use client";

import React from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";
import { formatBs } from "@/lib/domain/money";

export default function CarritoPage() {
  const { items, subtotalCents, updateCartQty, removeFromCart } = useStore();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <h1 className="font-display text-2xl sm:text-3xl font-bold flex items-center gap-2.5">
        <ShoppingCart className="w-7 h-7" style={{ color: "var(--accent-cyan)" }} />
        Carrito de Compras
      </h1>

      {items.length === 0 ? (
        <div
          className="rounded-2xl border p-12 text-center space-y-4"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
        >
          <p className="text-base font-medium">Tu carrito está vacío actualmente.</p>
          <div className="flex justify-center gap-3">
            <Link
              href="/catalogo"
              className="ct-btn h-11 px-5 rounded-lg text-sm font-semibold inline-flex items-center"
              style={{ backgroundColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }}
            >
              Explorar catálogo
            </Link>
            <Link
              href="/arma-tu-pc"
              className="ct-btn h-11 px-5 rounded-lg border text-sm font-semibold inline-flex items-center"
              style={{ borderColor: "var(--border-strong)", color: "var(--accent-cyan)" }}
            >
              Ir a Arma tu PC
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center"
                style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
              >
                <div
                  className="w-20 h-20 rounded-lg p-1.5 shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: "var(--bg-card-media)" }}
                >
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <Link href={`/producto/${item.slug}`} className="font-heading font-bold hover:underline">
                    {item.name}
                  </Link>
                  <p className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                    {item.sku} · {formatBs(item.unitPriceCents)} c/u · Disponibles: {item.stockAvailable}
                  </p>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div className="flex items-center border rounded-lg h-9" style={{ borderColor: "var(--border-subtle)" }}>
                    <button
                      type="button"
                      onClick={() => updateCartQty(item.productId, item.quantity - 1)}
                      className="w-8 h-full flex items-center justify-center"
                      aria-label="Restar"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateCartQty(item.productId, item.quantity + 1)}
                      className="w-8 h-full flex items-center justify-center"
                      aria-label="Sumar"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="font-heading font-bold tabular-nums w-24 text-right" style={{ color: "var(--accent-cyan)" }}>
                    {formatBs(item.lineTotalCents)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.productId)}
                    aria-label="Quitar producto"
                    className="p-2"
                    style={{ color: "var(--status-danger)" }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <aside
            className="lg:col-span-4 rounded-2xl border p-5 space-y-4 h-fit"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-strong)" }}
          >
            <h2 className="font-heading text-lg font-bold">Resumen del carrito</h2>
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--text-secondary)" }}>Subtotal productos</span>
              <span className="font-bold tabular-nums">{formatBs(subtotalCents)}</span>
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              El carrito no reserva existencias hasta confirmar el pedido en checkout. Los totales finales, envío o ensamblaje se validan en servidor.
            </p>
            <Link
              href="/checkout"
              className="ct-btn w-full h-11 rounded-lg font-semibold text-sm flex items-center justify-center"
              style={{ backgroundColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }}
            >
              Continuar al checkout
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
