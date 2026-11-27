"use client";

import React, { useState } from "react";
import { Check, Heart, MessageSquare, Scale, ShoppingCart } from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";

export function ProductDetailActions({
  product,
  whatsappNumber,
}: {
  product: {
    id: string;
    slug: string;
    sku: string;
    name: string;
    categorySlug: string;
    categoryName: string;
    imageUrl: string | null;
    priceCents: number;
    stockAvailable: number;
  };
  whatsappNumber: string;
}) {
  const { addToCart, compareItems, toggleCompare, favorites, toggleFavorite, notify } = useStore();
  const [qty, setQty] = useState(1);
  const [showConsultForm, setShowConsultForm] = useState(false);
  const [subject, setSubject] = useState(`Asesoría sobre ${product.name}`);
  const [message, setMessage] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const inCompare = compareItems.some((c) => c.id === product.id);
  const isFav = favorites.includes(product.id);
  const inStock = product.stockAvailable > 0;

  async function submitConsultation(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          message,
          customerName: guestName || undefined,
          customerEmail: guestEmail || undefined,
          productId: product.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error ?? "No se pudo enviar la consulta.", "error");
      } else {
        notify("Consulta registrada. Nuestro equipo responderá desde tu cuenta.", "success");
        setShowConsultForm(false);
        setMessage("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center border rounded-lg h-12" style={{ borderColor: "var(--border-subtle)" }}>
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="w-10 h-full font-bold"
            aria-label="Reducir cantidad"
          >
            -
          </button>
          <span className="w-10 text-center font-semibold tabular-nums">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(Math.max(1, product.stockAvailable), q + 1))}
            className="w-10 h-full font-bold"
            aria-label="Aumentar cantidad"
          >
            +
          </button>
        </div>

        <button
          type="button"
          data-sound="none"
          disabled={!inStock}
          onClick={() => addToCart(product.id, qty)}
          className="ct-btn ct-btn-primary flex-1 min-w-[180px] h-12 px-5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-45"
          style={{ backgroundColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }}
        >
          <ShoppingCart className="w-4 h-4" />
          {inStock ? "Añadir al carrito" : "Sin stock disponible"}
        </button>

        <button
          type="button"
          data-sound="none"
          onClick={() =>
            toggleCompare({
              id: product.id,
              slug: product.slug,
              sku: product.sku,
              name: product.name,
              categorySlug: product.categorySlug,
              categoryName: product.categoryName,
              imageUrl: product.imageUrl,
              priceCents: product.priceCents,
            })
          }
          className="ct-btn h-12 px-4 rounded-xl border text-sm font-medium flex items-center gap-1.5"
          style={{
            borderColor: inCompare ? "var(--accent-cyan)" : "var(--border-subtle)",
            color: inCompare ? "var(--accent-cyan)" : "var(--text-secondary)",
          }}
        >
          {inCompare ? <Check className="w-4 h-4" /> : <Scale className="w-4 h-4" />}
          Comparar
        </button>

        <button
          type="button"
          data-sound="none"
          onClick={() => toggleFavorite(product.id)}
          aria-label="Guardar en favoritos"
          className="ct-btn h-12 w-12 rounded-xl border flex items-center justify-center"
          style={{
            borderColor: isFav ? "var(--accent-purple)" : "var(--border-subtle)",
            color: isFav ? "var(--accent-purple)" : "var(--text-secondary)",
          }}
        >
          <Heart className={`w-4 h-4 ${isFav ? "fill-current" : ""}`} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={() => setShowConsultForm((v) => !v)}
          className="ct-btn h-10 px-4 rounded-lg border text-xs font-semibold flex items-center gap-1.5"
          style={{ borderColor: "var(--border-strong)", color: "var(--accent-cyan)" }}
        >
          <MessageSquare className="w-4 h-4" />
          Solicitar asesoría
        </button>

        {(() => {
          const cleanNum = (whatsappNumber || "59167605477").replace(/[^0-9]/g, "");
          return (
            <a
              href={`https://wa.me/${cleanNum}?text=${encodeURIComponent(
                `Hola ClickTech (+591 67605477), consulto por el producto ${product.name} (SKU: ${product.sku}).`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ct-btn h-10 px-4 rounded-lg border text-xs font-semibold flex items-center gap-1.5"
              style={{
                borderColor: "#25D366",
                color: "#25D366",
                backgroundColor: "rgba(37, 211, 102, 0.08)",
              }}
            >
              Consultar por WhatsApp (67605477)
            </a>
          );
        })()}
      </div>

      {showConsultForm && (
        <form
          onSubmit={submitConsultation}
          className="rounded-xl border p-4 space-y-3"
          style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)" }}
        >
          <h3 className="font-heading font-semibold text-sm">Asesoría directa sobre {product.sku}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Tu nombre (si no iniciaste sesión)"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="h-10 px-3 rounded-lg border text-xs"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            />
            <input
              type="email"
              placeholder="Tu correo de contacto"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              className="h-10 px-3 rounded-lg border text-xs"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          <input
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border text-xs"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-subtle)",
              color: "var(--text-primary)",
            }}
          />
          <textarea
            required
            rows={3}
            placeholder="Cuéntanos tu equipo actual, juegos o duda de compatibilidad..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-3 rounded-lg border text-xs"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-subtle)",
              color: "var(--text-primary)",
            }}
          />
          <button
            type="submit"
            disabled={submitting}
            className="ct-btn h-10 px-4 rounded-lg text-xs font-semibold"
            style={{ backgroundColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }}
          >
            {submitting ? "Enviando..." : "Enviar consulta"}
          </button>
        </form>
      )}
    </div>
  );
}
