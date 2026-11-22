"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Send,
  Bot,
  Sparkles,
  ExternalLink,
  MessageCircle,
  Cpu,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: string;
  chips?: Array<{ label: string; actionText: string }>;
  link?: { href: string; label: string };
  isWhatsAppAction?: boolean;
}

const PRESET_TOPICS = [
  {
    icon: Cpu,
    label: "Compatibilidad RAM DDR4 y Placas A520/B550",
    query: "¿Qué placas madre son compatibles con RAM DDR4 y procesadores AM4?",
  },
  {
    icon: ShieldCheck,
    label: "Mantenimiento GRATIS si compraste tu PC",
    query: "¿La visita y mantenimiento es gratis para clientes ClickTech?",
  },
  {
    icon: MapPin,
    label: "Envíos en Potosí y a nivel nacional",
    query: "¿Cómo son los envíos en Potosí y a otros departamentos de Bolivia?",
  },
  {
    icon: Sparkles,
    label: "Asesoría para armar PC según presupuesto",
    query: "¿Cómo uso el configurador Arma tu PC para mi presupuesto?",
  },
  {
    icon: MessageCircle,
    label: "Chatear directo al WhatsApp (67605477)",
    query: "Quiero hablar directamente por WhatsApp con el técnico",
  },
];

function getBotReplyContent(query: string): {
  text: string;
  link?: { href: string; label: string };
  isWhatsAppAction?: boolean;
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
    return {
      text:
        "⚡ **Compatibilidad Directa:**\n\n" +
        "• **Memorias DDR4 (ej. 8GB o 16GB 3200MHz):** Funcionan con placas **AMD Socket AM4** (modelos como ASUS A520M, MSI B550M PRO-VDH, ASRock B450M) e Intel LGA1200 / LGA1700 DDR4.\n" +
        "• **Incompatibilidad crítica:** La memoria DDR4 **NO entra físicamente** en placas DDR5 (como AMD AM5 B650 ni Intel DDR5).\n\n" +
        "¿Quieres verificar tu configuración completa pieza por pieza?",
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
        "🛠️ **Política de Mantenimiento y Visitas en Potosí:**\n\n" +
        "• **¿Compraste tu equipo o te armaste la PC en ClickTech?** 👉 **¡La atención y visita técnica es 100% GRATUITA (Bs 0)!** Es parte de nuestra Garantía de Ensamblaje.\n" +
        "• **Clientes particulares («Cliente X»):** Tarifa de traslado transparente según zona (Bs 15 Centro, Bs 20 Zona Alta, Bs 25 Plan 40, Bs 30 Satélite/Cantumarca).\n\n" +
        "Puedes calcular la ruta exacta y solicitar la visita por WhatsApp:",
      link: { href: "/servicios#calculador-ruta", label: "Ver Calculador de Ruta Potosí" },
      isWhatsAppAction: true,
    };
  }

  // Shipping (Potosi and National)
  if (
    q.includes("envio") ||
    q.includes("envío") ||
    q.includes("nacional") ||
    q.includes("bolivia") ||
    q.includes("potosi") ||
    q.includes("potosí")
  ) {
    return {
      text:
        "📦 **Opciones de Envío ClickTech:**\n\n" +
        "1. **Potosí Local:** Recojo gratuito en nuestro taller central o entrega directa a domicilio por zona (Bs 15 - Bs 25).\n" +
        "2. **A todo Bolivia:** Envíos a La Paz, Cochabamba, Santa Cruz, Sucre, Oruro, Tarija, Beni y Pando por encomienda terrestre o courier certificado.\n" +
        "🔒 **Seguridad Antifraude:** Cada equipo viaja con precinto numerado de seguridad y confirmación telefónica directa previa.",
      link: { href: "/catalogo", label: "Explorar Catálogo y Pedidos" },
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
        "Puedes chatear de inmediato con nuestro técnico y asesor comercial al número:\n" +
        "👉 **+591 67605477** (Potosí, Bolivia)\n\n" +
        "Haz clic en el botón de abajo para iniciar la conversación en WhatsApp:",
      isWhatsAppAction: true,
    };
  }

  // Default response
  return {
    text:
      "Entendido. En ClickTech te asesoramos con hardware garantizado, armado de computadoras a medida y servicio técnico en Potosí.\n\n" +
      "¿Prefieres revisar el catálogo, armar una PC con nuestro asesor o escribirnos por WhatsApp al **67605477**?",
    chips: [
      { label: "Ver productos en Bs", actionText: "Ver catálogo" },
      { label: "Consultar compatibilidad", actionText: "¿Qué placas soportan RAM DDR4?" },
      { label: "Contacto WhatsApp", actionText: "Quiero hablar por WhatsApp" },
    ],
  };
}

let messageSeq = 100;
function generateMessageId(prefix: string): string {
  messageSeq += 1;
  return `${prefix}-${messageSeq}`;
}

export function ClickTechChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "bot",
      text: "¡Hola! 👋 Soy el asistente de ClickTech Potosí. Puedo ayudarte con compatibilidad de hardware, cotizaciones en Bolivianos (Bs), visitas a domicilio y envíos.",
      timestamp: "Ahora",
    },
    {
      id: "welcome-2",
      sender: "bot",
      text: "Elige una consulta rápida o escribe tu duda directamente:",
      timestamp: "Ahora",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = React.useCallback((textToSend?: string) => {
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

    setTimeout(() => {
      const replyData = getBotReplyContent(text);
      const replyMsg: ChatMessage = {
        id: generateMessageId("bot"),
        sender: "bot",
        text: replyData.text,
        timestamp: "Ahora",
        link: replyData.link,
        isWhatsAppAction: replyData.isWhatsAppAction,
        chips: replyData.chips,
      };
      setMessages((prev) => [...prev, replyMsg]);
    }, 450);
  }, [inputText]);

  return (
    <>
      {/* Floating launcher trigger */}
      {!isOpen && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3">
          <div
            className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full border shadow-2xl backdrop-blur-md animate-bounce"
            style={{
              backgroundColor: "rgba(2, 4, 10, 0.9)",
              borderColor: "var(--accent-cyan)",
              color: "var(--text-primary)",
            }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold">¿Dudas de compatibilidad o envíos?</span>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Abrir asistente ClickTech"
            className="ct-btn h-14 w-14 rounded-full flex items-center justify-center shadow-2xl relative border-2 transition-transform hover:scale-105"
            style={{
              backgroundColor: "var(--bg-chassis)",
              borderColor: "var(--accent-cyan)",
              boxShadow: "0 0 25px rgba(0, 229, 255, 0.35)",
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
          className="fixed bottom-4 right-4 z-50 w-[92vw] sm:w-[410px] h-[580px] max-h-[85vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200"
          style={{
            backgroundColor: "color-mix(in srgb, var(--bg-surface) 96%, transparent)",
            borderColor: "var(--border-strong)",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.7), 0 0 20px rgba(0, 229, 255, 0.15)",
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
                  backgroundColor: "rgba(0, 229, 255, 0.1)",
                  borderColor: "var(--accent-cyan)",
                }}
              >
                <Bot className="w-5 h-5" style={{ color: "var(--accent-cyan)" }} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm flex items-center gap-2">
                  ClickTech Assistant
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    En línea
                  </span>
                </h3>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  Potosí · Hardware, Armado y Soporte
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <a
                href="https://wa.me/59167605477?text=Hola%20ClickTech%2C%20estoy%20en%20la%20tienda%20web%20y%20deseo%20hacer%20una%20consulta."
                target="_blank"
                rel="noopener noreferrer"
                title="Abrir WhatsApp oficial (+591 67605477)"
                className="ct-btn p-2 rounded-lg text-emerald-400 hover:bg-emerald-500/10"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar chat"
                className="ct-btn p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
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
                      backgroundColor: "rgba(0, 229, 255, 0.1)",
                      borderColor: "var(--accent-cyan)",
                    }}
                  >
                    <Bot className="w-3.5 h-3.5" style={{ color: "var(--accent-cyan)" }} />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 space-y-2 border text-xs leading-relaxed ${
                    m.sender === "user" ? "rounded-tr-none" : "rounded-tl-none"
                  }`}
                  style={{
                    backgroundColor: m.sender === "user" ? "var(--accent-cyan)" : "var(--bg-chassis)",
                    color: m.sender === "user" ? "var(--accent-cyan-ink)" : "var(--text-primary)",
                    borderColor: m.sender === "user" ? "var(--accent-cyan)" : "var(--border-subtle)",
                  }}
                >
                  <p className="whitespace-pre-line">{m.text}</p>

                  {m.link && (
                    <Link
                      href={m.link.href}
                      onClick={() => setIsOpen(false)}
                      className="inline-flex items-center gap-1 font-bold underline text-[11px] pt-1"
                      style={{ color: "var(--accent-cyan)" }}
                    >
                      {m.link.label} <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}

                  {m.isWhatsAppAction && (
                    <a
                      href="https://wa.me/59167605477?text=Hola%20ClickTech%2C%20deseo%20coordinar%20soporte%20o%20hacer%20una%20consulta%20directa."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ct-btn mt-2 h-9 px-3.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2"
                      style={{ backgroundColor: "#25D366", color: "#FFFFFF" }}
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-white" />
                      Escribir al WhatsApp (+591 67605477)
                    </a>
                  )}

                  {m.chips && m.chips.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {m.chips.map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSend(chip.actionText)}
                          className="ct-btn px-2.5 py-1 rounded-full border text-[11px] font-semibold"
                          style={{
                            borderColor: "var(--accent-cyan)",
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
                  <Icon className="w-3 h-3 text-[#00E5FF]" />
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
              placeholder="Escribe tu consulta aquí..."
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
