"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bot,
  Cpu,
  ExternalLink,
  MapPin,
  MessageCircle,
  PackageSearch,
  Send,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Truck,
  X,
} from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";
import { formatBsCompact } from "@/lib/domain/money";
import { STORE_LOCATION } from "@/lib/domain/status-labels";

interface ChatProductMini {
  id: string;
  slug: string;
  sku: string;
  name: string;
  priceCents: number;
  promoPriceCents: number | null;
  stockAvailable: number;
  categoryName: string;
  imageUrl: string | null;
}

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: string;
  chips?: Array<{ label: string; actionText: string }>;
  link?: { href: string; label: string };
  products?: ChatProductMini[];
  isWhatsAppAction?: boolean;
  isMapAction?: boolean;
}

const PRESET_TOPICS = [
  {
    icon: Cpu,
    label: "Compatibilidad RAM DDR4 y Placas A520/B550",
    query: "¿Qué placas madre son compatibles con RAM DDR4 y procesadores AM4?",
  },
  {
    icon: Sparkles,
    label: "Ver PCs Armadas y Gráficas en Bs",
    query: "Recomiéndame PCs armadas o tarjetas gráficas disponibles",
  },
  {
    icon: MapPin,
    label: "Tienda Calle Oruro y envíos",
    query: "¿Dónde queda la tienda en Potosí y cómo hacen envíos?",
  },
  {
    icon: Truck,
    label: "Seguir mi pedido o servicio",
    query: "¿Cómo puedo seguir mi pedido como PedidosYa?",
  },
  {
    icon: ShieldCheck,
    label: "Mantenimiento GRATIS ClickTech",
    query: "¿La visita y mantenimiento es gratis para clientes ClickTech?",
  },
  {
    icon: MessageCircle,
    label: "WhatsApp Técnico (67605477)",
    query: "Quiero hablar directamente por WhatsApp con el técnico",
  },
];

function renderFormattedText(text: string): React.ReactNode {
  const lines = text.split("\n");
  return lines.map((line, lineIdx) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <React.Fragment key={lineIdx}>
        {parts.map((part, idx) => {
          if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
            return (
              <strong key={idx} className="font-bold">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return <React.Fragment key={idx}>{part}</React.Fragment>;
        })}
        {lineIdx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
}

function matchProductsFromCatalog(query: string, catalog: ChatProductMini[]): ChatProductMini[] {
  const q = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const budgetMatch = q.match(/(\d{3,5})\s*(bs|bolivianos)?/);
  const maxBudgetCents = budgetMatch ? Number(budgetMatch[1]) * 100 : null;

  const keywords = q
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !["para", "con", "que", "tienen", "hay", "ver", "quiero", "dame", "cual", "como", "bs", "bolivianos", "algo", "unos", "unas", "disponibles"].includes(w));

  const scored = catalog
    .map((p) => {
      const effective = p.promoPriceCents ?? p.priceCents;
      if (maxBudgetCents && effective > maxBudgetCents * 1.08) {
        return { p, score: -1 };
      }
      const hay = `${p.name} ${p.sku} ${p.categoryName}`
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      let score = 0;
      for (const kw of keywords) {
        if (hay.includes(kw)) score += 3;
      }
      if (q.includes("pc") && p.categoryName.toLowerCase().includes("pc")) score += 4;
      if ((q.includes("grafica") || q.includes("gpu") || q.includes("rtx") || q.includes("video")) && hay.includes("rtx")) score += 4;
      if ((q.includes("laptop") || q.includes("portatil")) && hay.includes("laptop")) score += 4;
      if ((q.includes("ram") || q.includes("memoria")) && hay.includes("ram")) score += 3;
      if ((q.includes("ssd") || q.includes("nvme") || q.includes("disco")) && (hay.includes("ssd") || hay.includes("nvme"))) score += 3;
      if (q.includes("barat") || q.includes("economic")) score += Math.max(1, 5 - Math.floor(effective / 150000));
      if (p.stockAvailable > 0) score += 1;
      return { p, score };
    })
    .filter((entry) => entry.score > 2)
    .sort((a, b) => b.score - a.score);

  if (scored.length > 0) {
    return scored.slice(0, 3).map((s) => s.p);
  }

  if (
    q.includes("recomend") ||
    q.includes("producto") ||
    q.includes("catalogo") ||
    q.includes("armada") ||
    q.includes("presupuesto") ||
    maxBudgetCents
  ) {
    return catalog
      .filter((p) => p.stockAvailable > 0)
      .slice(0, 3);
  }

  return [];
}

function getBotReplyContent(
  query: string,
  catalog: ChatProductMini[]
): {
  text: string;
  link?: { href: string; label: string };
  products?: ChatProductMini[];
  isWhatsAppAction?: boolean;
  isMapAction?: boolean;
  chips?: Array<{ label: string; actionText: string }>;
} {
  const q = query.toLowerCase();

  // Compatibility (RAM, DDR4, A520, B550, Socket)
  if (
    q.includes("ram") ||
    q.includes("ddr4") ||
    q.includes("a520") ||
    q.includes("b550") ||
    q.includes("compatible") ||
    q.includes("compatibilidad")
  ) {
    const matched = matchProductsFromCatalog("ram a520 b550", catalog);
    return {
      text:
        "⚡ **Compatibilidad Directa:**\n\n" +
        "• **Memorias DDR4 (8GB / 16GB / 32GB):** Funcionan con placas **AMD Socket AM4** (modelos como ASUS A520M, MSI B550M PRO-VDH, ASRock B450M) e Intel LGA1200 / LGA1700 DDR4.\n" +
        "• **Incompatibilidad crítica:** La memoria DDR4 **NO entra físicamente** en placas DDR5 (AMD AM5 B650 ni Intel DDR5).\n\n" +
        "Te muestro opciones reales en stock listas para tu equipo:",
      products: matched,
      link: { href: "/arma-tu-pc", label: "Abrir Configurador «Arma tu PC»" },
    };
  }

  // Maintenance / Customer benefit (free vs paid)
  if (
    q.includes("mantenimiento") ||
    q.includes("gratis") ||
    q.includes("visita") ||
    q.includes("servicio") ||
    q.includes("domicilio")
  ) {
    return {
      text:
        "🛠️ **Mantenimiento y Visitas desde Calle Oruro, Potosí:**\n\n" +
        "• **¿Compraste o armaste tu PC en ClickTech?** 👉 **¡La visita y atención técnica es 100% GRATUITA (Bs 0)!** Cubierto por nuestra Garantía de Ensamblaje.\n" +
        "• **Clientes particulares («Cliente X»):** Tarifa transparente desde Calle Oruro (Bs 15 Centro, Bs 20 Zona Alta, Bs 25 Plan 40, Bs 30 Satélite).\n\n" +
        "Calcula tu ruta o agenda por WhatsApp:",
      link: { href: "/#calculador-potosi", label: "Abrir Calculador de Ruta Potosí" },
      isWhatsAppAction: true,
    };
  }

  // PedidosYa tracking & Seguimiento
  if (
    q.includes("seguir") ||
    q.includes("seguimiento") ||
    q.includes("tracking") ||
    q.includes("donde esta") ||
    q.includes("dónde está") ||
    q.includes("pedidosya") ||
    q.includes("mi pedido")
  ) {
    return {
      text:
        "🛵 **Seguimiento en Vivo de Pedidos y Taller:**\n\n" +
        "• **Pedidos Web (CT-...):** Al confirmar tu compra puedes ver la línea de tiempo de 5 pasos y la ruta en mapa desde **Calle Oruro, Potosí** hasta tu ubicación.\n" +
        "• **Órdenes Técnicas (ST-...):** Consulta diagnóstico, pruebas de estabilidad y presupuesto aprobado al instante.",
      link: { href: "/seguimiento", label: "Ir al Centro de Seguimiento" },
      chips: [
        { label: "Ver mi cuenta y pedidos", actionText: "¿Dónde veo mis pedidos?" },
        { label: "Métodos de pago", actionText: "¿Cómo puedo pagar por QR, tarjeta o efectivo?" },
      ],
    };
  }

  // Payment methods
  if (
    q.includes("pagar") ||
    q.includes("pago") ||
    q.includes("qr") ||
    q.includes("tarjeta") ||
    q.includes("efectivo")
  ) {
    return {
      text:
        "💳 **Formas de Pago Disponibles en ClickTech:**\n\n" +
        "1. **QR Simple Bolivia:** Generamos un código QR escaneable al instante en el checkout con el monto exacto en Bs.\n" +
        "2. **Tarjeta de Débito/Crédito:** Interfaz guiada con autorización de pago verificable.\n" +
        "3. **Efectivo:** Al recoger en **Calle Oruro, Potosí** o contra entrega local (con cálculo de cambio).",
      link: { href: "/checkout", label: "Ir al Checkout Guiado" },
    };
  }

  // Store location & Shipping (Calle Oruro, Potosí and National)
  if (
    q.includes("donde") ||
    q.includes("dónde") ||
    q.includes("ubicacion") ||
    q.includes("ubicación") ||
    q.includes("oruro") ||
    q.includes("direccion") ||
    q.includes("dirección") ||
    q.includes("envio") ||
    q.includes("envío") ||
    q.includes("nacional") ||
    q.includes("bolivia") ||
    q.includes("potosi") ||
    q.includes("potosí")
  ) {
    return {
      text:
        `📍 **Tienda Central: ${STORE_LOCATION.address}**\n\n` +
        `• **Atención presencial y recojo gratis (Bs 0):** ${STORE_LOCATION.schedule}.\n` +
        "• **Delivery Potosí:** Marca tu punto exacto en el mapa del checkout para enviarlo desde Calle Oruro.\n" +
        "• **A todo Bolivia:** Envíos asegurados con precinto antifraude a los 9 departamentos.",
      link: { href: "/checkout", label: "Marcar ubicación en Checkout" },
      isMapAction: true,
    };
  }

  // WhatsApp / Contact
  if (
    q.includes("whatsapp") ||
    q.includes("cel") ||
    q.includes("telefono") ||
    q.includes("teléfono") ||
    q.includes("contacto") ||
    q.includes("67605477")
  ) {
    return {
      text:
        "📱 **Contacto Directo por WhatsApp:**\n\n" +
        "Chatea ahora con nuestro técnico y asesor comercial en Potosí:\n" +
        "👉 **+591 67605477** (**Calle Oruro, Potosí**)\n\n" +
        "Presiona el botón verde para abrir el chat directo:",
      isWhatsAppAction: true,
    };
  }

  // Catalog search
  const productMatches = matchProductsFromCatalog(query, catalog);
  if (productMatches.length > 0) {
    return {
      text:
        `🔍 Encontré **${productMatches.length} opciones** disponibles en nuestro catálogo en **Bolivianos (Bs)**:\n` +
        "Puedes ver su ficha técnica completa o añadirlas directo a tu carrito:",
      products: productMatches,
      link: { href: "/catalogo", label: "Explorar todo el catálogo" },
      chips: [
        { label: "Armar PC a medida", actionText: "Quiero usar Arma tu PC" },
        { label: "Formas de pago QR/Tarjeta", actionText: "¿Cómo puedo pagar?" },
      ],
    };
  }

  // Configurator
  if (q.includes("arma") || q.includes("configurador") || q.includes("ensambl")) {
    return {
      text:
        "🧩 **Configurador «Arma tu PC»:**\n\n" +
        "Elige tu presupuesto y uso (Estudio, Gaming 1080p, Edición Pro) o selecciona componente por componente con verificación automática de socket, RAM DDR4/DDR5 y potencia de fuente.",
      link: { href: "/arma-tu-pc", label: "Abrir Configurador Arma tu PC" },
    };
  }

  // Default response
  return {
    text:
      "¡Con gusto te ayudo! En **ClickTech Calle Oruro (Potosí)** puedes consultar stock real, armar tu PC sin errores de compatibilidad o seguir tu pedido en mapa.\n\n" +
      "Prueba preguntar por un componente (ej. **\"RTX 4060\"**, **\"PC hasta 4500 Bs\"**, **\"SSD NVMe\"**) o elige una opción:",
    chips: [
      { label: "PCs Armadas en Bs", actionText: "Recomiéndame PCs armadas" },
      { label: "Compatibilidad RAM DDR4", actionText: "¿Qué placas soportan RAM DDR4?" },
      { label: "Ubicación Calle Oruro", actionText: "¿Dónde está ubicada la tienda en Potosí?" },
      { label: "WhatsApp 67605477", actionText: "Quiero hablar por WhatsApp" },
    ],
  };
}

let messageSeq = 100;
function generateMessageId(prefix: string): string {
  messageSeq += 1;
  return `${prefix}-${messageSeq}`;
}

export function ClickTechChatBot() {
  const { addToCart, cartOpen, playSound } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [inputText, setInputText] = useState("");
  const [catalogCache, setCatalogCache] = useState<ChatProductMini[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "bot",
      text: "¡Hola! 👋 Soy el **Asistente Inteligente de ClickTech Potosí** (Calle Oruro). Busco productos reales del catálogo, verifico compatibilidad y te guío con envíos y seguimiento.",
      timestamp: "Ahora",
    },
    {
      id: "welcome-2",
      sender: "bot",
      text: "Elige una consulta rápida o escribe qué equipo o componente buscas (ej. **«PC Gamer»**, **«Laptop»**, **«hasta 4500 Bs»**):",
      timestamp: "Ahora",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && catalogCache.length === 0) {
      fetch("/api/products")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.products && Array.isArray(data.products)) {
            const mapped: ChatProductMini[] = data.products.map(
              (p: {
                id: string;
                slug: string;
                sku: string;
                name: string;
                priceCents: number;
                promoPriceCents: number | null;
                stockAvailable: number;
                category?: { name: string };
                images?: Array<{ url: string }>;
              }) => ({
                id: p.id,
                slug: p.slug,
                sku: p.sku,
                name: p.name,
                priceCents: p.priceCents,
                promoPriceCents: p.promoPriceCents,
                stockAvailable: p.stockAvailable,
                categoryName: p.category?.name ?? "Hardware",
                imageUrl: p.images?.[0]?.url ?? null,
              })
            );
            setCatalogCache(mapped);
          }
        })
        .catch(() => {
          // Non-blocking catalog preload
        });
    }
  }, [isOpen, catalogCache.length]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isTyping]);

  const handleSend = React.useCallback(
    (textToSend?: string) => {
      const text = (textToSend ?? inputText).trim();
      if (!text) return;

      const userMsg: ChatMessage = {
        id: generateMessageId("user"),
        sender: "user",
        text,
        timestamp: "Enviado",
      };

      setMessages((prev) => [...prev, userMsg]);
      if (!textToSend) setInputText("");
      setIsTyping(true);

      setTimeout(() => {
        const replyData = getBotReplyContent(text, catalogCache);
        const replyMsg: ChatMessage = {
          id: generateMessageId("bot"),
          sender: "bot",
          text: replyData.text,
          timestamp: "Ahora",
          link: replyData.link,
          products: replyData.products,
          isWhatsAppAction: replyData.isWhatsAppAction,
          isMapAction: replyData.isMapAction,
          chips: replyData.chips,
        };
        setIsTyping(false);
        setMessages((prev) => [...prev, replyMsg]);
        playSound("success");
      }, 380);
    },
    [inputText, playSound, catalogCache]
  );

  return (
    <>
      {/* Floating launcher trigger */}
      {!isOpen && !cartOpen && (
        <div className="fixed bottom-5 right-5 z-40 flex items-center gap-3">
          <div
            className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full border backdrop-blur-md"
            style={{
              backgroundColor: "color-mix(in srgb, var(--bg-surface) 92%, transparent)",
              borderColor: "var(--border-strong)",
              color: "var(--text-primary)",
              boxShadow: "var(--shadow-elevated)",
            }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold">¿Dudas de compatibilidad o envíos?</span>
          </div>

          <button
            type="button"
            data-sound="none"
            onClick={() => {
              playSound("open");
              setIsOpen(true);
            }}
            aria-label="Abrir asistente ClickTech"
            className="ct-btn h-14 w-14 rounded-full flex items-center justify-center relative border-2"
            style={{
              backgroundColor: "var(--bg-chassis)",
              borderColor: "var(--accent-cyan)",
              boxShadow: "var(--shadow-card-hover)",
            }}
          >
            <Bot className="w-7 h-7" style={{ color: "var(--accent-cyan)" }} />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-black flex items-center justify-center text-[9px] font-bold text-white">
              ✓
            </span>
          </button>
        </div>
      )}

      {/* Chat Window Dialog */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Asistente Virtual ClickTech"
          className="ct-dialog fixed bottom-4 right-4 z-[65] w-[94vw] sm:w-[430px] h-[610px] max-h-[86vh] rounded-2xl border flex flex-col overflow-hidden backdrop-blur-xl"
          style={{
            backgroundColor: "color-mix(in srgb, var(--bg-surface) 96%, transparent)",
            borderColor: "var(--border-strong)",
            boxShadow: "var(--shadow-elevated)",
          }}
        >
          {/* Header */}
          <div
            className="p-4 border-b flex items-center justify-between shrink-0"
            style={{
              backgroundColor: "var(--bg-chassis)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: "var(--accent-cyan-soft)",
                  borderColor: "var(--accent-cyan)",
                }}
              >
                <Bot className="w-5 h-5" style={{ color: "var(--accent-cyan)" }} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  ClickTech Assistant
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-semibold border"
                    style={{
                      backgroundColor: "rgba(16, 185, 129, 0.14)",
                      borderColor: "rgba(16, 185, 129, 0.35)",
                      color: "var(--status-ok)",
                    }}
                  >
                    Catálogo vivo
                  </span>
                </h3>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  Calle Oruro, Potosí · {catalogCache.length > 0 ? `${catalogCache.length} SKUs conectados` : "Soporte y Armado"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <a
                href="https://wa.me/59167605477?text=Hola%20ClickTech%2C%20estoy%20en%20la%20tienda%20web%20y%20deseo%20hacer%20una%20consulta."
                target="_blank"
                rel="noopener noreferrer"
                title="Abrir WhatsApp oficial (+591 67605477)"
                className="ct-btn p-2 rounded-lg"
                style={{ color: "#16A34A" }}
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <button
                type="button"
                data-sound="none"
                onClick={() => {
                  playSound("close");
                  setIsOpen(false);
                }}
                aria-label="Cerrar chat"
                className="ct-btn p-2 rounded-lg"
                style={{ color: "var(--text-muted)" }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.sender === "bot" && (
                  <div
                    className="w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      backgroundColor: "var(--accent-cyan-soft)",
                      borderColor: "var(--accent-cyan)",
                    }}
                  >
                    <Bot className="w-3.5 h-3.5" style={{ color: "var(--accent-cyan)" }} />
                  </div>
                )}

                <div
                  className={`max-w-[87%] rounded-2xl p-3.5 space-y-2.5 border text-xs leading-relaxed ${
                    m.sender === "user" ? "rounded-tr-none" : "rounded-tl-none"
                  }`}
                  style={{
                    backgroundColor: m.sender === "user" ? "var(--accent-cyan)" : "var(--bg-chassis)",
                    color: m.sender === "user" ? "var(--accent-cyan-ink)" : "var(--text-primary)",
                    borderColor: m.sender === "user" ? "var(--accent-cyan)" : "var(--border-subtle)",
                  }}
                >
                  <div className="leading-relaxed">{renderFormattedText(m.text)}</div>

                  {m.products && m.products.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {m.products.map((prod) => {
                        const eff = prod.promoPriceCents ?? prod.priceCents;
                        return (
                          <div
                            key={prod.id}
                            className="rounded-xl border p-2.5 flex items-center gap-2.5"
                            style={{
                              backgroundColor: "var(--bg-surface)",
                              borderColor: "var(--border-subtle)",
                            }}
                          >
                            <div
                              className="w-12 h-12 rounded-lg overflow-hidden border shrink-0 flex items-center justify-center"
                              style={{ backgroundColor: "var(--bg-card-media)", borderColor: "var(--border-subtle)" }}
                            >
                              {prod.imageUrl ? (
                                <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                              ) : (
                                <PackageSearch className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <Link
                                href={`/producto/${prod.slug}`}
                                onClick={() => setIsOpen(false)}
                                className="font-bold text-[11px] leading-tight line-clamp-2 hover:underline"
                                style={{ color: "var(--text-primary)" }}
                              >
                                {prod.name}
                              </Link>
                              <div className="flex items-center justify-between gap-2 mt-1">
                                <span className="font-heading font-extrabold text-xs tabular-nums" style={{ color: "var(--accent-cyan)" }}>
                                  {formatBsCompact(eff)}
                                </span>
                                <span
                                  className="text-[10px] font-semibold"
                                  style={{ color: prod.stockAvailable > 0 ? "var(--status-ok)" : "var(--status-danger)" }}
                                >
                                  {prod.stockAvailable > 0 ? `${prod.stockAvailable} disp.` : "Agotado"}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              data-sound="none"
                              disabled={prod.stockAvailable <= 0}
                              onClick={() => addToCart(prod.id, 1)}
                              title="Añadir al carrito"
                              className="ct-btn h-8 w-8 rounded-lg flex items-center justify-center shrink-0 disabled:opacity-40"
                              style={{ backgroundColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }}
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {m.link && (
                    <Link
                      href={m.link.href}
                      onClick={() => setIsOpen(false)}
                      className="inline-flex items-center gap-1 font-bold underline text-[11px]"
                      style={{ color: "var(--accent-cyan)" }}
                    >
                      {m.link.label} <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}

                  {m.isMapAction && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${STORE_LOCATION.lat},${STORE_LOCATION.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ct-btn h-9 px-3 rounded-lg border font-bold text-[11px] flex items-center justify-center gap-1.5"
                      style={{
                        borderColor: "var(--border-strong)",
                        backgroundColor: "var(--accent-cyan-soft)",
                        color: "var(--accent-cyan)",
                      }}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      Ver ClickTech Calle Oruro en Google Maps
                    </a>
                  )}

                  {m.isWhatsAppAction && (
                    <a
                      href="https://wa.me/59167605477?text=Hola%20ClickTech%2C%20deseo%20coordinar%20soporte%20o%20hacer%20una%20consulta%20directa."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ct-btn h-9 px-3.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2"
                      style={{ backgroundColor: "#25D366", color: "#FFFFFF" }}
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-white" />
                      Escribir al WhatsApp (+591 67605477)
                    </a>
                  )}

                  {m.chips && m.chips.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {m.chips.map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSend(chip.actionText)}
                          className="ct-btn px-2.5 py-1 rounded-full border text-[11px] font-semibold"
                          style={{
                            borderColor: "var(--border-strong)",
                            color: "var(--accent-cyan)",
                            backgroundColor: "var(--accent-cyan-soft)",
                          }}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  )}

                  <span className="block text-[9px] opacity-60 text-right">{m.timestamp}</span>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-2.5 justify-start" aria-label="Asistente escribiendo">
                <div
                  className="w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5"
                  style={{
                    backgroundColor: "var(--accent-cyan-soft)",
                    borderColor: "var(--accent-cyan)",
                  }}
                >
                  <Bot className="w-3.5 h-3.5" style={{ color: "var(--accent-cyan)" }} />
                </div>
                <div
                  className="rounded-2xl rounded-tl-none px-4 py-3 border flex items-center gap-1.5"
                  style={{
                    backgroundColor: "var(--bg-chassis)",
                    borderColor: "var(--border-subtle)",
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--accent-cyan)" }} />
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--accent-cyan)", animationDelay: "120ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--accent-cyan)", animationDelay: "240ms" }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Topics Pills */}
          <div
            className="p-2 border-t flex gap-1.5 overflow-x-auto shrink-0 no-scrollbar"
            style={{
              backgroundColor: "var(--bg-chassis)",
              borderColor: "var(--border-subtle)",
            }}
          >
            {PRESET_TOPICS.map((topic, i) => {
              const Icon = topic.icon;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSend(topic.query)}
                  className="ct-btn shrink-0 px-2.5 py-1 rounded-lg border text-[11px] font-medium flex items-center gap-1.5 whitespace-nowrap"
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <Icon className="w-3 h-3" style={{ color: "var(--accent-cyan)" }} />
                  {topic.label}
                </button>
              );
            })}
          </div>

          {/* Input form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 border-t flex items-center gap-2 shrink-0"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Busca un producto, presupuesto o duda..."
              className="flex-1 h-10 px-3 rounded-xl border text-xs"
              style={{
                backgroundColor: "var(--bg-chassis)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              aria-label="Enviar mensaje"
              className="ct-btn h-10 w-10 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-40"
              style={{
                backgroundColor: "var(--accent-cyan)",
                color: "var(--accent-cyan-ink)",
              }}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
