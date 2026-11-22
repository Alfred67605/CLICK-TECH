"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Printer,
  Save,
  Share2,
  ShoppingCart,
  Sparkles,
  Wrench,
  XCircle,
} from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";
import { formatBsCompact } from "@/lib/domain/money";
import type {
  CompatibilityEvaluation,
  UpgradeStageProposal,
} from "@/lib/domain/compatibility";

export interface BuilderCatalogOption {
  id: string;
  sku: string;
  name: string;
  model: string;
  brandName: string;
  priceCents: number;
  stockAvailable: number;
  componentType: string;
  socket: string | null;
  chipset: string | null;
  biosVersionRequired: string | null;
  ramGeneration: string | null;
  formFactor: string | null;
  gpuLengthMm: number | null;
  caseMaxGpuLengthMm: number | null;
  psuWatts: number | null;
  hasIntegratedGraphics: boolean | null;
}

interface SlotsState {
  cpuId: string;
  motherboardId: string;
  ramId: string;
  gpuId: string;
  storageId: string;
  psuId: string;
  caseId: string;
  coolerId: string;
}

const EMPTY_SLOTS: SlotsState = {
  cpuId: "",
  motherboardId: "",
  ramId: "",
  gpuId: "",
  storageId: "",
  psuId: "",
  caseId: "",
  coolerId: "",
};

export function PcConfiguratorClient({
  components,
  assemblyFeeCents,
  initialShareConfig,
}: {
  components: BuilderCatalogOption[];
  assemblyFeeCents: number;
  initialShareConfig?: {
    name: string;
    buildMode: "NEW_PC" | "UPGRADE";
    primaryUse: "GAMING" | "STUDY_WORK" | "CONTENT_CREATION" | "OFFICE_PYME";
    budgetCents: number;
    gamesOrPrograms: string;
    currentEquipmentNotes: string;
    slots: Partial<SlotsState>;
  } | null;
}) {
  const { addToCart, notify } = useStore();

  const [buildMode, setBuildMode] = useState<"NEW_PC" | "UPGRADE">(
    initialShareConfig?.buildMode ?? "NEW_PC"
  );
  const [primaryUse, setPrimaryUse] = useState<
    "GAMING" | "STUDY_WORK" | "CONTENT_CREATION" | "OFFICE_PYME"
  >(initialShareConfig?.primaryUse ?? "GAMING");
  const [budgetBs, setBudgetBs] = useState(
    initialShareConfig ? String(Math.round(initialShareConfig.budgetCents / 100)) : "5500"
  );
  const [gamesOrPrograms, setGamesOrPrograms] = useState(
    initialShareConfig?.gamesOrPrograms ?? "Valorant, CS2, edición ligera"
  );
  const [currentEquipmentNotes, setCurrentEquipmentNotes] = useState(
    initialShareConfig?.currentEquipmentNotes ?? ""
  );
  const [includeAssembly, setIncludeAssembly] = useState(true);
  const [configName, setConfigName] = useState(
    initialShareConfig?.name ?? "Mi PC a medida ClickTech"
  );
  const [slots, setSlots] = useState<SlotsState>({
    ...EMPTY_SLOTS,
    ...(initialShareConfig?.slots ?? {}),
  });

  const [advisorNote, setAdvisorNote] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<CompatibilityEvaluation | null>(null);
  const [upgradeStages, setUpgradeStages] = useState<UpgradeStageProposal[]>([]);
  const [totalCents, setTotalCents] = useState(0);
  const [budgetDiffCents, setBudgetDiffCents] = useState(0);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [createdQuoteNumber, setCreatedQuoteNumber] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const byType = (t: string) => components.filter((c) => c.componentType === t);

  const runServerEvaluation = useCallback(
    async (
      nextSlots: SlotsState,
      action: "evaluate" | "recommend" = "evaluate",
      overrideBudgetBs?: string,
      overrideUse?: typeof primaryUse
    ) => {
      setLoading(true);
      try {
        const bVal = Number(overrideBudgetBs ?? budgetBs);
        const safeBudgetCents = Number.isFinite(bVal) && bVal >= 1000 ? Math.round(bVal * 100) : 550000;
        const res = await fetch("/api/pc-builder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            buildMode,
            primaryUse: overrideUse ?? primaryUse,
            budgetCents: safeBudgetCents,
            gamesOrPrograms,
            currentEquipmentNotes,
            includeAssembly,
            name: configName,
            slots: {
              cpuId: nextSlots.cpuId || null,
              motherboardId: nextSlots.motherboardId || null,
              ramId: nextSlots.ramId || null,
              gpuId: nextSlots.gpuId || null,
              storageId: nextSlots.storageId || null,
              psuId: nextSlots.psuId || null,
              caseId: nextSlots.caseId || null,
              coolerId: nextSlots.coolerId || null,
            },
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          notify(data.error ?? "No se pudo evaluar la configuración.", "error");
          return;
        }
        if (action === "recommend" && data.selection) {
          setSlots({
            cpuId: data.selection.cpu?.productId ?? "",
            motherboardId: data.selection.motherboard?.productId ?? "",
            ramId: data.selection.ram?.productId ?? "",
            gpuId: data.selection.gpu?.productId ?? "",
            storageId: data.selection.storage?.productId ?? "",
            psuId: data.selection.psu?.productId ?? "",
            caseId: data.selection.pcCase?.productId ?? "",
            coolerId: data.selection.cooler?.productId ?? "",
          });
          setAdvisorNote(data.advisorNote ?? null);
        }
        setEvaluation(data.evaluation);
        setUpgradeStages(data.upgradeStages ?? []);
        setTotalCents(data.totalCents ?? 0);
        setBudgetDiffCents(data.budgetDifferenceCents ?? 0);
      } finally {
        setLoading(false);
      }
    },
    [budgetBs, buildMode, primaryUse, gamesOrPrograms, currentEquipmentNotes, includeAssembly, configName, notify]
  );

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) {
        void runServerEvaluation(slots, initialShareConfig ? "evaluate" : "recommend");
      }
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSlotChange(field: keyof SlotsState, value: string) {
    const updated = { ...slots, [field]: value };
    setSlots(updated);
    setAdvisorNote(null);
    runServerEvaluation(updated, "evaluate");
  }

  function applyDemoScenario(kind: "diego-budget" | "incompatible" | "needs-review") {
    const findSku = (sku: string) => components.find((c) => c.sku === sku)?.id ?? "";
    if (kind === "diego-budget") {
      setBuildMode("NEW_PC");
      setPrimaryUse("GAMING");
      setBudgetBs("3600");
      runServerEvaluation(slots, "recommend", "3600", "GAMING");
      return;
    }
    if (kind === "incompatible") {
      // AM4 CPU + AM5 Motherboard + DDR4 RAM + no GPU on non-iGPU CPU
      const badSlots: SlotsState = {
        cpuId: findSku("CT-CPU-R5-5600"),
        motherboardId: findSku("CT-MB-B650M-A-WIFI"),
        ramId: findSku("CT-RAM-FURY-16-D4"),
        gpuId: "",
        storageId: findSku("CT-SSD-NV2-1TB"),
        psuId: findSku("CT-PSU-CV550"),
        caseId: findSku("CT-CASE-VERSA-H18"),
        coolerId: findSku("CT-COOL-AK400"),
      };
      setSlots(badSlots);
      runServerEvaluation(badSlots, "evaluate");
      return;
    }
    // B450 BIOS check + H5 Flow unknown GPU clearance -> REQUIRES_REVIEW
    const reviewSlots: SlotsState = {
      cpuId: findSku("CT-CPU-R5-5600"),
      motherboardId: findSku("CT-MB-B450M-STEEL"),
      ramId: findSku("CT-RAM-FURY-16-D4"),
      gpuId: findSku("CT-GPU-RTX4060-VENTUS"),
      storageId: findSku("CT-SSD-NV2-1TB"),
      psuId: findSku("CT-PSU-A650BN"),
      caseId: findSku("CT-CASE-H5-FLOW"),
      coolerId: findSku("CT-COOL-AK400"),
    };
    setSlots(reviewSlots);
    runServerEvaluation(reviewSlots, "evaluate");
  }

  async function saveOrRequestQuote(requestTechnicalReview: boolean) {
    setLoading(true);
    try {
      const bVal = Number(budgetBs);
      const res = await fetch("/api/pc-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          buildMode,
          primaryUse,
          budgetCents: Number.isFinite(bVal) ? Math.round(bVal * 100) : 550000,
          gamesOrPrograms,
          currentEquipmentNotes,
          includeAssembly,
          name: configName,
          requestTechnicalReview,
          customerName: customerName || undefined,
          customerEmail: customerEmail || undefined,
          customerPhone: customerPhone || undefined,
          slots: {
            cpuId: slots.cpuId || null,
            motherboardId: slots.motherboardId || null,
            ramId: slots.ramId || null,
            gpuId: slots.gpuId || null,
            storageId: slots.storageId || null,
            psuId: slots.psuId || null,
            caseId: slots.caseId || null,
            coolerId: slots.coolerId || null,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error ?? "No se pudo guardar la configuración.", "error");
        return;
      }
      setShareUrl(data.shareUrl);
      if (data.quote) {
        setCreatedQuoteNumber(data.quote.quoteNumber);
        notify(`Cotización ${data.quote.quoteNumber} enviada para revisión técnica.`, "success");
      } else {
        notify("Configuración guardada. Ya puedes copiar el enlace para compartir.", "success");
      }
    } finally {
      setLoading(false);
    }
  }

  async function addSelectedToCart() {
    const ids = Object.values(slots).filter(Boolean);
    if (ids.length === 0) {
      notify("Selecciona al menos un componente.", "error");
      return;
    }
    for (const id of ids) {
      await addToCart(id, 1);
    }
  }

  const slotRows: Array<{
    key: keyof SlotsState;
    label: string;
    type: string;
    optional?: boolean;
  }> = [
    { key: "cpuId", label: "Procesador (CPU)", type: "CPU" },
    { key: "motherboardId", label: "Placa Madre", type: "MOTHERBOARD" },
    { key: "ramId", label: "Memoria RAM", type: "RAM" },
    { key: "gpuId", label: "Tarjeta Gráfica (GPU)", type: "GPU", optional: true },
    { key: "storageId", label: "Almacenamiento (SSD)", type: "STORAGE" },
    { key: "psuId", label: "Fuente de Poder", type: "PSU" },
    { key: "caseId", label: "Gabinete / Chasis", type: "CASE" },
    { key: "coolerId", label: "Refrigeración CPU", type: "COOLER", optional: true },
  ];

  const statusColor =
    evaluation?.status === "COMPATIBLE"
      ? "var(--status-ok)"
      : evaluation?.status === "INCOMPATIBLE"
      ? "var(--status-danger)"
      : "var(--status-warn)";

  return (
    <div className="ct-container py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-display text-2xl sm:text-3xl font-bold flex items-center gap-2.5">
            <Cpu className="w-7 h-7" style={{ color: "var(--accent-cyan)" }} />
            Configurador «Arma tu PC»
          </h1>
          <p className="text-sm max-w-3xl" style={{ color: "var(--text-secondary)" }}>
            Escuchamos tu presupuesto en Bs y uso real para proponer componentes compatibles. Si algún dato físico o BIOS falta en catálogo, solicitamos revisión técnica antes de confirmar.
          </p>
        </div>

        {/* Scenario presets for quick verification */}
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            onClick={() => applyDemoScenario("diego-budget")}
            className="ct-btn h-9 px-3 rounded-lg border font-medium"
            style={{ borderColor: "var(--border-strong)", color: "var(--accent-cyan)" }}
          >
            Preset Presupuesto Ajustado
          </button>
          <button
            type="button"
            onClick={() => applyDemoScenario("incompatible")}
            className="ct-btn h-9 px-3 rounded-lg border font-medium"
            style={{ borderColor: "var(--status-danger)", color: "var(--status-danger)" }}
          >
            Probar Incompatibilidad
          </button>
          <button
            type="button"
            onClick={() => applyDemoScenario("needs-review")}
            className="ct-btn h-9 px-3 rounded-lg border font-medium"
            style={{ borderColor: "var(--status-warn)", color: "var(--status-warn)" }}
          >
            Probar Revisión Técnica
          </button>
        </div>
      </div>

      {/* Step 1: Listen (Escuchar) */}
      <section
        className="rounded-2xl border p-5 space-y-4"
        style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
      >
        <h2 className="font-heading text-lg font-bold">1. Cuéntanos tu necesidad y presupuesto</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="cfg-mode" className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
              Tipo de proyecto
            </label>
            <select
              id="cfg-mode"
              value={buildMode}
              onChange={(e) => setBuildMode(e.target.value as "NEW_PC" | "UPGRADE")}
              className="w-full h-10 px-3 rounded-lg border text-sm"
              style={{
                backgroundColor: "var(--bg-chassis)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            >
              <option value="NEW_PC">PC nueva desde cero</option>
              <option value="UPGRADE">Actualización de equipo existente</option>
            </select>
          </div>

          <div>
            <label htmlFor="cfg-use" className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
              Uso principal
            </label>
            <select
              id="cfg-use"
              value={primaryUse}
              onChange={(e) =>
                setPrimaryUse(
                  e.target.value as "GAMING" | "STUDY_WORK" | "CONTENT_CREATION" | "OFFICE_PYME"
                )
              }
              className="w-full h-10 px-3 rounded-lg border text-sm"
              style={{
                backgroundColor: "var(--bg-chassis)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            >
              <option value="GAMING">Gaming y esports</option>
              <option value="STUDY_WORK">Estudio universitario y trabajo</option>
              <option value="CONTENT_CREATION">Edición, diseño y streaming</option>
              <option value="OFFICE_PYME">Oficina / PyME</option>
            </select>
          </div>

          <div>
            <label htmlFor="cfg-budget" className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
              Presupuesto objetivo (Bs)
            </label>
            <input
              id="cfg-budget"
              type="number"
              min={1000}
              step={100}
              value={budgetBs}
              onChange={(e) => setBudgetBs(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border text-sm tabular-nums"
              style={{
                backgroundColor: "var(--bg-chassis)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              disabled={loading}
              onClick={() => runServerEvaluation(slots, "recommend")}
              className="ct-btn w-full h-10 px-4 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
              style={{ backgroundColor: "var(--accent-purple)", color: "#ffffff" }}
            >
              <Sparkles className="w-4 h-4" />
              Proponer por presupuesto
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="cfg-apps" className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
              Juegos o programas que utilizarás
            </label>
            <input
              id="cfg-apps"
              type="text"
              value={gamesOrPrograms}
              onChange={(e) => setGamesOrPrograms(e.target.value)}
              placeholder="Ej. Valorant, AutoCAD, VS Code, Premiere..."
              className="w-full h-10 px-3 rounded-lg border text-sm"
              style={{
                backgroundColor: "var(--bg-chassis)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          <div>
            <label htmlFor="cfg-current" className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
              {buildMode === "UPGRADE"
                ? "Componentes de tu equipo actual (para evaluar compatibilidad)"
                : "Preferencias (silencio, tamaño, sin RGB, etc.)"}
            </label>
            <input
              id="cfg-current"
              type="text"
              value={currentEquipmentNotes}
              onChange={(e) => setCurrentEquipmentNotes(e.target.value)}
              placeholder="Ej. Tengo fuente 500W genérica o busco gabinete compacto..."
              className="w-full h-10 px-3 rounded-lg border text-sm"
              style={{
                backgroundColor: "var(--bg-chassis)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            />
          </div>
        </div>

        {advisorNote && (
          <div
            className="rounded-lg border px-4 py-3 text-xs sm:text-sm"
            style={{
              backgroundColor: "var(--accent-cyan-soft)",
              borderColor: "var(--border-strong)",
              color: "var(--text-primary)",
            }}
          >
            <strong>Criterio del asesor:</strong> {advisorNote}
          </div>
        )}
      </section>

      {/* Main 2-col Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Component Slots */}
        <div className="lg:col-span-7 space-y-3">
          <div
            className="rounded-2xl border p-5 space-y-4"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
          >
            <h2 className="font-heading text-lg font-bold">2. Selección de componentes</h2>
            <div className="space-y-3">
              {slotRows.map((row) => {
                const options = byType(row.type);
                const selected = options.find((o) => o.id === slots[row.key]);
                return (
                  <div
                    key={row.key}
                    className="rounded-xl border p-3.5 space-y-2"
                    style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)" }}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <label htmlFor={`slot-${row.key}`} className="font-semibold" style={{ color: "var(--text-primary)" }}>
                        {row.label}{" "}
                        {row.optional && (
                          <span style={{ color: "var(--text-muted)" }}>(opcional)</span>
                        )}
                      </label>
                      {selected && (
                        <span className="font-bold tabular-nums" style={{ color: "var(--accent-cyan)" }}>
                          {formatBsCompact(selected.priceCents)} ·{" "}
                          {selected.stockAvailable > 0
                            ? `Stock: ${selected.stockAvailable}`
                            : "Sin stock"}
                        </span>
                      )}
                    </div>
                    <select
                      id={`slot-${row.key}`}
                      value={slots[row.key]}
                      onChange={(e) => handleSlotChange(row.key, e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border text-sm"
                      style={{
                        backgroundColor: "var(--bg-surface)",
                        borderColor: "var(--border-subtle)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <option value="">-- Sin seleccionar --</option>
                      {options.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.name} — {formatBsCompact(opt.priceCents)} (
                          {opt.stockAvailable > 0 ? `${opt.stockAvailable} disp.` : "Agotado"})
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}

              <label className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer text-sm" style={{ borderColor: "var(--border-subtle)" }}>
                <input
                  type="checkbox"
                  checked={includeAssembly}
                  onChange={(e) => {
                    setIncludeAssembly(e.target.checked);
                    setTimeout(() => runServerEvaluation(slots, "evaluate"), 0);
                  }}
                  className="w-4 h-4 accent-[#00E5FF]"
                />
                <span className="flex-1">
                  Incluir servicio profesional de ensamblaje, cableado y pruebas de estabilidad
                </span>
                <span className="font-bold tabular-nums" style={{ color: "var(--accent-cyan)" }}>
                  {formatBsCompact(assemblyFeeCents)}
                </span>
              </label>
            </div>
          </div>

          {/* Staged Upgrades */}
          {upgradeStages.length > 0 && (
            <div
              className="rounded-2xl border p-5 space-y-4"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
            >
              <h2 className="font-heading text-lg font-bold">Plan de mejoras por etapas</h2>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Alternativas progresivas para cuidar tu inversión sin promesas irreales de rendimiento.
              </p>
              <div className="space-y-3">
                {upgradeStages.map((st) => (
                  <div
                    key={st.stage}
                    className="rounded-xl border p-4 space-y-1"
                    style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)" }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-heading font-bold text-sm" style={{ color: "var(--accent-cyan)" }}>
                        {st.title}
                      </h3>
                      {st.estimatedAddOnCents > 0 && (
                        <span className="text-xs font-semibold tabular-nums" style={{ color: "var(--text-secondary)" }}>
                          Ref: +{formatBsCompact(st.estimatedAddOnCents)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                      Objetivo: {st.focus}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      {st.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sticky Summary + Compatibility Verdict */}
        <aside className="lg:col-span-5 space-y-4">
          <div
            className="rounded-2xl border p-5 space-y-4"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: statusColor,
            }}
          >
            <div className="flex items-start gap-3">
              {evaluation?.status === "COMPATIBLE" ? (
                <CheckCircle2 className="w-6 h-6 shrink-0" style={{ color: "var(--status-ok)" }} />
              ) : evaluation?.status === "INCOMPATIBLE" ? (
                <XCircle className="w-6 h-6 shrink-0" style={{ color: "var(--status-danger)" }} />
              ) : (
                <AlertTriangle className="w-6 h-6 shrink-0" style={{ color: "var(--status-warn)" }} />
              )}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: statusColor }}>
                  Verificación estructurada
                </p>
                <h2 className="font-heading text-lg font-bold" data-testid="compat-status-label">
                  {evaluation?.statusLabel ?? "Evaluando compatibilidad..."}
                </h2>
              </div>
            </div>

            {evaluation && (
              <div
                className="grid grid-cols-2 gap-2 text-xs p-3 rounded-xl border"
                style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)" }}
              >
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Consumo estimado:</span>{" "}
                  <strong className="tabular-nums">{evaluation.estimatedWattage} W</strong>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Fuente sugerida:</span>{" "}
                  <strong className="tabular-nums">{evaluation.recommendedPsuWatts || "—"} W</strong>
                </div>
              </div>
            )}

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1" data-testid="compat-findings">
              {evaluation?.findings.map((f) => {
                const c =
                  f.severity === "COMPATIBLE"
                    ? "var(--status-ok)"
                    : f.severity === "INCOMPATIBLE"
                    ? "var(--status-danger)"
                    : "var(--status-warn)";
                return (
                  <div
                    key={f.code}
                    className="rounded-lg border p-3 text-xs space-y-1"
                    style={{
                      backgroundColor: "var(--bg-chassis)",
                      borderColor: c,
                    }}
                  >
                    <div className="font-semibold" style={{ color: c }}>
                      {f.title}
                    </div>
                    <p style={{ color: "var(--text-secondary)" }}>{f.explanation}</p>
                  </div>
                );
              })}
            </div>

            {/* Price breakdown */}
            <div className="pt-3 border-t space-y-2 text-sm" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="flex justify-between">
                <span style={{ color: "var(--text-secondary)" }}>Subtotal componentes</span>
                <span className="font-semibold tabular-nums">
                  {formatBsCompact(evaluation?.partsSubtotalCents ?? 0)}
                </span>
              </div>
              {includeAssembly && (
                <div className="flex justify-between">
                  <span style={{ color: "var(--text-secondary)" }}>Ensamblaje y pruebas</span>
                  <span className="font-semibold tabular-nums">{formatBsCompact(assemblyFeeCents)}</span>
                </div>
              )}
              <div className="flex justify-between text-base pt-2 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                <span className="font-bold">Total estimado</span>
                <span className="font-heading text-xl font-extrabold tabular-nums" style={{ color: "var(--accent-cyan)" }}>
                  {formatBsCompact(totalCents)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: "var(--text-muted)" }}>Diferencia vs presupuesto</span>
                <span
                  className="font-semibold tabular-nums"
                  style={{ color: budgetDiffCents >= 0 ? "var(--status-ok)" : "var(--status-warn)" }}
                >
                  {budgetDiffCents >= 0
                    ? `${formatBsCompact(budgetDiffCents)} dentro de tu meta`
                    : `${formatBsCompact(Math.abs(budgetDiffCents))} por encima`}
                </span>
              </div>
            </div>

            {/* Save / Review / Cart actions */}
            <div className="space-y-3 pt-2 border-t" style={{ borderColor: "var(--border-subtle)" }}>
              <input
                type="text"
                value={configName}
                onChange={(e) => setConfigName(e.target.value)}
                aria-label="Nombre de la configuración"
                placeholder="Nombre para guardar esta configuración"
                className="w-full h-10 px-3 rounded-lg border text-xs"
                style={{
                  backgroundColor: "var(--bg-chassis)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => saveOrRequestQuote(false)}
                  className="ct-btn h-10 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5"
                  style={{ borderColor: "var(--border-strong)", color: "var(--accent-cyan)" }}
                >
                  <Save className="w-4 h-4" />
                  Guardar y compartir
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="ct-btn h-10 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5"
                  style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}
                >
                  <Printer className="w-4 h-4" />
                  Imprimir / PDF
                </button>
              </div>

              {/* Request Human Technical Review */}
              <div
                className="rounded-xl border p-3 space-y-2"
                style={{ backgroundColor: "var(--bg-chassis)", borderColor: "var(--border-subtle)" }}
              >
                <p className="text-xs font-semibold flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5" style={{ color: "var(--accent-purple)" }} />
                  Solicitar revisión técnica y cotización formal
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Tu nombre (opcional si iniciaste sesión)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="h-9 px-2.5 rounded border text-xs"
                    style={{
                      backgroundColor: "var(--bg-surface)",
                      borderColor: "var(--border-subtle)",
                      color: "var(--text-primary)",
                    }}
                  />
                  <input
                    type="email"
                    placeholder="Tu correo"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="h-9 px-2.5 rounded border text-xs"
                    style={{
                      backgroundColor: "var(--bg-surface)",
                      borderColor: "var(--border-subtle)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Teléfono / WhatsApp de contacto"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full h-9 px-2.5 rounded border text-xs"
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-primary)",
                  }}
                />
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => saveOrRequestQuote(true)}
                  className="ct-btn w-full h-10 rounded-lg text-xs font-semibold"
                  style={{ backgroundColor: "var(--accent-purple)", color: "#ffffff" }}
                >
                  Enviar a revisión técnica y cotización
                </button>
              </div>

              <button
                type="button"
                disabled={evaluation?.status === "INCOMPATIBLE"}
                onClick={addSelectedToCart}
                className="ct-btn w-full h-11 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-45"
                style={{ backgroundColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }}
              >
                <ShoppingCart className="w-4 h-4" />
                {evaluation?.status === "INCOMPATIBLE"
                  ? "Resuelve conflictos para pasar al carrito"
                  : "Llevar componentes al carrito"}
              </button>

              {shareUrl && (
                <div
                  className="rounded-lg border p-3 text-xs space-y-1"
                  style={{ borderColor: "var(--status-ok)", backgroundColor: "rgba(16,185,129,0.1)" }}
                >
                  <div className="font-semibold flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5" />
                    Enlace guardado:{" "}
                    <Link href={shareUrl} className="underline">
                      {shareUrl}
                    </Link>
                  </div>
                  {createdQuoteNumber && (
                    <p>
                      Cotización generada: <strong>{createdQuoteNumber}</strong> (visible en Ventas/Admin y en tu cuenta).
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
