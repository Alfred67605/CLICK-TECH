"use client";

import React, { useState } from "react";
import { Building2, CheckCircle2 } from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";

export default function EmpresasPage() {
  const { notify } = useStore();
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [taxIdNit, setTaxIdNit] = useState("");
  const [quantityEstimate, setQuantityEstimate] = useState("5");
  const [requirements, setRequirements] = useState("");
  const [createdQuote, setCreatedQuote] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/b2b/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          contactName,
          email,
          phone,
          taxIdNit,
          quantityEstimate: Math.max(1, Number(quantityEstimate) || 1),
          requirements,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error ?? "No se pudo registrar la solicitud B2B.", "error");
        return;
      }
      setCreatedQuote(data.quote.quoteNumber);
      notify(`Solicitud B2B ${data.quote.quoteNumber} registrada.`, "success");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-2xl sm:text-3xl font-bold flex items-center gap-2.5">
          <Building2 className="w-7 h-7" style={{ color: "var(--accent-purple)" }} />
          Soluciones B2B para Empresas e Instituciones
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Cotizaciones formales por lote de computadoras, renovación de almacenamiento/RAM y mantenimiento preventivo programado en Potosí. No asumimos contratos previos: cada solicitud se registra en gestión comercial para elaborar una propuesta a medida.
        </p>
      </div>

      {createdQuote ? (
        <div
          className="rounded-2xl border p-6 space-y-3"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--status-ok)" }}
        >
          <h2 className="font-heading text-xl font-bold flex items-center gap-2" style={{ color: "var(--status-ok)" }}>
            <CheckCircle2 className="w-5 h-5" />
            Solicitud comercial registrada: {createdQuote}
          </h2>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Nuestro equipo de Ventas revisará las cantidades requeridas y emitirá una cotización versionada.
          </p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border p-6 space-y-4"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="b2b-company" className="block text-xs font-medium mb-1">
                Empresa / Institución
              </label>
              <input
                id="b2b-company"
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border text-sm"
                style={{
                  backgroundColor: "var(--bg-chassis)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
            <div>
              <label htmlFor="b2b-contact" className="block text-xs font-medium mb-1">
                Persona de contacto
              </label>
              <input
                id="b2b-contact"
                type="text"
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border text-sm"
                style={{
                  backgroundColor: "var(--bg-chassis)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="b2b-email" className="block text-xs font-medium mb-1">
                Correo institucional / contacto
              </label>
              <input
                id="b2b-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border text-sm"
                style={{
                  backgroundColor: "var(--bg-chassis)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
            <div>
              <label htmlFor="b2b-phone" className="block text-xs font-medium mb-1">
                Teléfono
              </label>
              <input
                id="b2b-phone"
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border text-sm"
                style={{
                  backgroundColor: "var(--bg-chassis)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
            <div>
              <label htmlFor="b2b-qty" className="block text-xs font-medium mb-1">
                Cantidad estimada de equipos
              </label>
              <input
                id="b2b-qty"
                type="number"
                min={1}
                value={quantityEstimate}
                onChange={(e) => setQuantityEstimate(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border text-sm tabular-nums"
                style={{
                  backgroundColor: "var(--bg-chassis)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          </div>

          <div>
            <label htmlFor="b2b-nit" className="block text-xs font-medium mb-1">
              NIT (opcional)
            </label>
            <input
              id="b2b-nit"
              type="text"
              value={taxIdNit}
              onChange={(e) => setTaxIdNit(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border text-sm"
              style={{
                backgroundColor: "var(--bg-chassis)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          <div>
            <label htmlFor="b2b-req" className="block text-xs font-medium mb-1">
              Detalle de equipos o soporte técnico requerido
            </label>
            <textarea
              id="b2b-req"
              required
              rows={4}
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Ej. 6 computadoras de oficina + 2 laptops + mantenimiento preventivo trimestral..."
              className="w-full p-3 rounded-lg border text-sm"
              style={{
                backgroundColor: "var(--bg-chassis)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="ct-btn h-11 px-6 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: "var(--accent-purple)", color: "#ffffff" }}
          >
            {submitting ? "Registrando solicitud..." : "Enviar solicitud B2B"}
          </button>
        </form>
      )}
    </div>
  );
}
