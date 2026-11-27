"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import {
  isSoundEffect,
  setGlobalSoundEnabled,
  triggerSound,
  type SoundEffect,
} from "@/lib/ui/sound-engine";

export interface CartItemClient {
  id: string;
  productId: string;
  sku: string;
  slug: string;
  name: string;
  model: string;
  brandName: string;
  categoryName: string;
  imageUrl: string | null;
  isIllustrative: boolean;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  stockAvailable: number;
}

export interface CompareItemClient {
  id: string;
  slug: string;
  sku: string;
  name: string;
  categorySlug: string;
  categoryName: string;
  imageUrl: string | null;
  priceCents: number;
}

interface ToastItem {
  id: string;
  message: string;
  tone: "info" | "success" | "error";
}

interface StoreContextValue {
  items: CartItemClient[];
  subtotalCents: number;
  itemCount: number;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  refreshCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<boolean>;
  updateCartQty: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  compareItems: CompareItemClient[];
  toggleCompare: (item: CompareItemClient) => void;
  clearCompare: () => void;
  favorites: string[];
  toggleFavorite: (productId: string) => void;
  theme: "dark" | "light";
  toggleTheme: () => void;
  soundEnabled: boolean;
  toggleSound: () => void;
  playSound: (effect: SoundEffect) => void;
  notify: (message: string, tone?: "info" | "success" | "error") => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItemClient[]>([]);
  const [subtotalCents, setSubtotalCents] = useState(0);
  const [itemCount, setItemCount] = useState(0);
  const [cartOpen, setCartOpenState] = useState(false);
  const [compareItems, setCompareItems] = useState<CompareItemClient[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const lastHoveredRef = useRef<HTMLElement | null>(null);

  const playSound = useCallback((effect: SoundEffect) => {
    triggerSound(effect);
  }, []);

  const notify = useCallback((message: string, tone: "info" | "success" | "error" = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-2), { id, message, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  }, []);

  const refreshCart = useCallback(async () => {
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items ?? []);
      setSubtotalCents(data.subtotalCents ?? 0);
      setItemCount(data.itemCount ?? 0);
    } catch {
      // ignore offline transient
    }
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (!active) return;
      void refreshCart();
      try {
        const savedCmp = localStorage.getItem("clicktech_compare");
        if (savedCmp) setCompareItems(JSON.parse(savedCmp));
        const savedFav = localStorage.getItem("clicktech_favorites");
        if (savedFav) setFavorites(JSON.parse(savedFav));
        const savedTheme = localStorage.getItem("clicktech_theme");
        if (savedTheme === "light" || savedTheme === "dark") {
          setTheme(savedTheme);
          document.documentElement.setAttribute("data-theme", savedTheme);
        }
        const savedSound = localStorage.getItem("clicktech_sound");
        if (savedSound === "off") {
          setSoundEnabled(false);
          setGlobalSoundEnabled(false);
        } else {
          setGlobalSoundEnabled(true);
        }
      } catch {
        // ignore storage failure
      }
    });
    return () => {
      active = false;
    };
  }, [refreshCart]);

  // Global delegated tactile sound listener for all buttons and primary links
  useEffect(() => {
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    function handlePointerDown(e: PointerEvent) {
      const target = e.target as HTMLElement | null;
      const el = target?.closest('button, a.ct-btn, [role="button"], [data-sound], nav a') as HTMLElement | null;
      if (!el) return;
      if ((el as HTMLButtonElement).disabled || el.getAttribute("aria-disabled") === "true") return;

      const ds = el.getAttribute("data-sound");
      if (ds === "none") return;
      if (isSoundEffect(ds)) {
        triggerSound(ds);
      } else {
        triggerSound("click");
      }
    }

    function handlePointerOver(e: PointerEvent) {
      if (!canHover) return;
      const target = e.target as HTMLElement | null;
      const el = target?.closest(".ct-btn, nav a") as HTMLElement | null;
      if (!el) {
        lastHoveredRef.current = null;
        return;
      }
      if (lastHoveredRef.current === el) return;
      lastHoveredRef.current = el;
      if ((el as HTMLButtonElement).disabled || el.getAttribute("aria-disabled") === "true") return;
      if (el.getAttribute("data-sound") === "none") return;
      triggerSound("hover");
    }

    document.addEventListener("pointerdown", handlePointerDown, { passive: true });
    document.addEventListener("pointerover", handlePointerOver, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("pointerover", handlePointerOver);
    };
  }, []);

  const setCartOpen = useCallback((open: boolean) => {
    setCartOpenState((prev) => {
      if (prev !== open) {
        triggerSound(open ? "open" : "close");
      }
      return open;
    });
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      if (next) {
        setGlobalSoundEnabled(true);
        triggerSound("toggleOn");
      } else {
        triggerSound("toggleOff");
        setGlobalSoundEnabled(false);
      }
      try {
        localStorage.setItem("clicktech_sound", next ? "on" : "off");
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      triggerSound(next === "light" ? "toggleOn" : "toggleOff");
      document.documentElement.setAttribute("data-theme", next);
      try {
        localStorage.setItem("clicktech_theme", next);
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const addToCart = useCallback(
    async (productId: string, quantity = 1) => {
      try {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, quantity }),
        });
        const data = await res.json();
        if (!res.ok) {
          triggerSound("error");
          notify(data.error ?? "No se pudo añadir al carrito.", "error");
          return false;
        }
        setItems(data.items ?? []);
        setSubtotalCents(data.subtotalCents ?? 0);
        setItemCount(data.itemCount ?? 0);
        setCartOpenState(true);
        triggerSound("success");
        notify("Producto añadido al carrito.", "success");
        return true;
      } catch {
        triggerSound("error");
        notify("Error de conexión al actualizar el carrito.", "error");
        return false;
      }
    },
    [notify]
  );

  const updateCartQty = useCallback(
    async (productId: string, quantity: number) => {
      const res = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity }),
      });
      const data = await res.json();
      if (!res.ok) {
        triggerSound("error");
        notify(data.error ?? "Cantidad no disponible.", "error");
        return;
      }
      setItems(data.items ?? []);
      setSubtotalCents(data.subtotalCents ?? 0);
      setItemCount(data.itemCount ?? 0);
    },
    [notify]
  );

  const removeFromCart = useCallback(
    async (productId: string) => {
      const res = await fetch(`/api/cart?productId=${encodeURIComponent(productId)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setItems(data.items ?? []);
        setSubtotalCents(data.subtotalCents ?? 0);
        setItemCount(data.itemCount ?? 0);
        triggerSound("close");
        notify("Producto retirado del carrito.", "info");
      }
    },
    [notify]
  );

  const toggleCompare = useCallback(
    (item: CompareItemClient) => {
      setCompareItems((prev) => {
        const exists = prev.some((x) => x.id === item.id);
        let next: CompareItemClient[];
        if (exists) {
          next = prev.filter((x) => x.id !== item.id);
          triggerSound("toggleOff");
        } else {
          if (prev.length > 0 && prev[0].categorySlug !== item.categorySlug) {
            triggerSound("error");
            notify(
              `Solo puedes comparar productos de la misma categoría (${prev[0].categoryName}). Limpia la comparación actual para cambiar.`,
              "error"
            );
            return prev;
          }
          if (prev.length >= 4) {
            triggerSound("error");
            notify("Máximo 4 productos simultáneos en comparación.", "error");
            return prev;
          }
          next = [...prev, item];
          triggerSound("toggleOn");
          notify(`${item.name} agregado a comparación (${next.length}/4).`, "success");
        }
        try {
          localStorage.setItem("clicktech_compare", JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    [notify]
  );

  const clearCompare = useCallback(() => {
    setCompareItems([]);
    triggerSound("close");
    try {
      localStorage.removeItem("clicktech_compare");
    } catch {
      // ignore
    }
  }, []);

  const toggleFavorite = useCallback((productId: string) => {
    setFavorites((prev) => {
      const adding = !prev.includes(productId);
      const next = adding ? [...prev, productId] : prev.filter((id) => id !== productId);
      triggerSound(adding ? "toggleOn" : "toggleOff");
      try {
        localStorage.setItem("clicktech_favorites", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return (
    <StoreContext.Provider
      value={{
        items,
        subtotalCents,
        itemCount,
        cartOpen,
        setCartOpen,
        refreshCart,
        addToCart,
        updateCartQty,
        removeFromCart,
        compareItems,
        toggleCompare,
        clearCompare,
        favorites,
        toggleFavorite,
        theme,
        toggleTheme,
        soundEnabled,
        toggleSound,
        playSound,
        notify,
      }}
    >
      {children}
      {/* Toast region — Emil Kowalski accessible stack */}
      <div
        aria-live="polite"
        className="fixed top-20 right-4 z-[80] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-3 sm:px-0"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="ct-toast pointer-events-auto rounded-xl border px-4 py-3 text-sm font-medium backdrop-blur-md flex items-center gap-2.5"
            style={{
              backgroundColor: "color-mix(in srgb, var(--bg-surface) 94%, transparent)",
              boxShadow: "var(--shadow-elevated)",
              borderColor:
                t.tone === "error"
                  ? "var(--status-danger)"
                  : t.tone === "success"
                  ? "var(--accent-cyan)"
                  : "var(--border-subtle)",
              color: "var(--text-primary)",
            }}
          >
            {t.tone === "success" && (
              <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "var(--accent-cyan)" }} />
            )}
            {t.tone === "error" && (
              <AlertCircle className="w-4 h-4 shrink-0" style={{ color: "var(--status-danger)" }} />
            )}
            {t.tone === "info" && (
              <Info className="w-4 h-4 shrink-0" style={{ color: "var(--text-muted)" }} />
            )}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore debe usarse dentro de StoreProvider");
  return ctx;
}
