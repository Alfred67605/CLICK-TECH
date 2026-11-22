export type RuleSeverity = "COMPATIBLE" | "REQUIRES_REVIEW" | "INCOMPATIBLE";

export interface ComponentSpecInput {
  productId: string;
  sku: string;
  name: string;
  model: string;
  priceCents: number;
  stockAvailable: number;
  componentType:
    | "CPU"
    | "MOTHERBOARD"
    | "RAM"
    | "GPU"
    | "STORAGE"
    | "PSU"
    | "CASE"
    | "COOLER"
    | "MONITOR"
    | "PERIPHERAL"
    | "ACCESSORY"
    | "PREBUILT"
    | "LAPTOP";
  socket?: string | null;
  chipset?: string | null;
  biosVersionRequired?: string | null;
  supportedCpuSeries?: string[] | null;
  ramGeneration?: string | null;
  ramSlots?: number | null;
  ramModulesCount?: number | null;
  ramCapacityGb?: number | null;
  maxRamGb?: number | null;
  formFactor?: string | null;
  supportedFormFactors?: string[] | null;
  tdpWatts?: number | null;
  recommendedPsuWatts?: number | null;
  psuWatts?: number | null;
  pcie8PinConnectors?: number | null;
  pcie12Vhpwr?: boolean | null;
  gpuLengthMm?: number | null;
  caseMaxGpuLengthMm?: number | null;
  coolerHeightMm?: number | null;
  caseMaxCoolerHeightMm?: number | null;
  supportedSockets?: string[] | null;
  m2Slots?: number | null;
  sataPorts?: number | null;
  storageInterface?: string | null;
  hasIntegratedGraphics?: boolean | null;
}

export interface BuildSlotsSelection {
  cpu?: ComponentSpecInput | null;
  motherboard?: ComponentSpecInput | null;
  ram?: ComponentSpecInput | null;
  gpu?: ComponentSpecInput | null;
  storage?: ComponentSpecInput | null;
  psu?: ComponentSpecInput | null;
  pcCase?: ComponentSpecInput | null;
  cooler?: ComponentSpecInput | null;
  peripherals?: ComponentSpecInput[];
}

export interface CompatibilityFinding {
  code: string;
  title: string;
  severity: RuleSeverity;
  explanation: string;
  affectedSlots: string[];
}

export interface UpgradeStageProposal {
  stage: number;
  title: string;
  focus: string;
  explanation: string;
  estimatedAddOnCents: number;
  suggestedSku?: string;
  suggestedName?: string;
}

export interface CompatibilityEvaluation {
  status: RuleSeverity;
  statusLabel: string;
  findings: CompatibilityFinding[];
  estimatedWattage: number;
  recommendedPsuWatts: number;
  partsSubtotalCents: number;
  requiresHumanReview: boolean;
  missingCoreSlots: string[];
}

export function evaluateBuildCompatibility(
  selection: BuildSlotsSelection,
  mode: "NEW_PC" | "UPGRADE" = "NEW_PC"
): CompatibilityEvaluation {
  const findings: CompatibilityFinding[] = [];
  const { cpu, motherboard, ram, gpu, storage, psu, pcCase, cooler, peripherals = [] } = selection;

  const coreParts = [cpu, motherboard, ram, gpu, storage, psu, pcCase, cooler].filter(
    Boolean
  ) as ComponentSpecInput[];

  let partsSubtotalCents = 0;
  for (const item of coreParts) {
    partsSubtotalCents += Math.trunc(item.priceCents);
  }
  for (const p of peripherals) {
    partsSubtotalCents += Math.trunc(p.priceCents);
  }

  // Missing core slots check (for NEW_PC)
  const missingCoreSlots: string[] = [];
  if (mode === "NEW_PC") {
    if (!cpu) missingCoreSlots.push("Procesador (CPU)");
    if (!motherboard) missingCoreSlots.push("Placa Madre");
    if (!ram) missingCoreSlots.push("Memoria RAM");
    if (!storage) missingCoreSlots.push("Almacenamiento");
    if (!psu) missingCoreSlots.push("Fuente de Poder");
    if (!pcCase) missingCoreSlots.push("Gabinete");
  }

  // 1. CPU <-> Motherboard socket and BIOS check
  if (cpu && motherboard) {
    if (!cpu.socket || !motherboard.socket) {
      findings.push({
        code: "CPU_MB_SOCKET_UNKNOWN",
        title: "Socket sin confirmar entre CPU y Placa Madre",
        severity: "REQUIRES_REVIEW",
        explanation:
          "Falta el dato estructurado de socket en uno de los componentes seleccionados. Un técnico debe confirmar compatibilidad física antes de confirmar.",
        affectedSlots: ["cpu", "motherboard"],
      });
    } else if (cpu.socket !== motherboard.socket) {
      findings.push({
        code: "CPU_MB_SOCKET_MISMATCH",
        title: `Socket incompatible (${cpu.socket} vs ${motherboard.socket})`,
        severity: "INCOMPATIBLE",
        explanation: `El procesador ${cpu.name} utiliza socket ${cpu.socket}, pero la placa ${motherboard.name} es socket ${motherboard.socket}. No es posible instalarlos juntos.`,
        affectedSlots: ["cpu", "motherboard"],
      });
    } else {
      findings.push({
        code: "CPU_MB_SOCKET_OK",
        title: `Socket ${cpu.socket} compatible`,
        severity: "COMPATIBLE",
        explanation: `Tanto el procesador (${cpu.socket}) como la placa madre (${motherboard.socket}) coinciden en socket.`,
        affectedSlots: ["cpu", "motherboard"],
      });

      // Check BIOS requirement (e.g., B450 + Ryzen 5000 series)
      if (motherboard.biosVersionRequired) {
        findings.push({
          code: "MB_BIOS_CHECK",
          title: `Posible actualización de BIOS requerida (${motherboard.biosVersionRequired})`,
          severity: "REQUIRES_REVIEW",
          explanation: `La placa ${motherboard.name} (${motherboard.chipset ?? "chipset"}) puede venir de fábrica con una BIOS anterior a ${motherboard.biosVersionRequired}. Nuestro taller verificará y actualizará la BIOS antes del ensamblaje.`,
          affectedSlots: ["cpu", "motherboard"],
        });
      }
    }
  }

  // 2. Display output check (CPU without integrated graphics + no GPU)
  if (cpu && !gpu) {
    if (cpu.hasIntegratedGraphics === false) {
      findings.push({
        code: "NO_DISPLAY_OUTPUT",
        title: "Falta tarjeta gráfica dedicada para dar video",
        severity: "INCOMPATIBLE",
        explanation: `El procesador ${cpu.name} no incluye gráficos integrados. Para obtener señal de video necesitas añadir una tarjeta gráfica dedicada (GPU) o elegir un procesador con gráficos integrados (como Ryzen 5 5600G).`,
        affectedSlots: ["cpu", "gpu"],
      });
    } else if (cpu.hasIntegratedGraphics === null || cpu.hasIntegratedGraphics === undefined) {
      findings.push({
        code: "IGPU_UNKNOWN",
        title: "Gráficos integrados sin confirmar",
        severity: "REQUIRES_REVIEW",
        explanation:
          "No consta en catálogo si este procesador incluye gráficos integrados. Requiere revisión técnica si no se instala GPU dedicada.",
        affectedSlots: ["cpu", "gpu"],
      });
    } else {
      findings.push({
        code: "IGPU_OK",
        title: "Video integrado disponible",
        severity: "COMPATIBLE",
        explanation: `${cpu.name} incluye gráficos integrados, por lo que puede operar sin GPU dedicada y permite agregar una tarjeta gráfica en una etapa posterior.`,
        affectedSlots: ["cpu"],
      });
    }
  }

  // 3. RAM <-> Motherboard generation, slots & max capacity
  if (ram && motherboard) {
    if (!ram.ramGeneration || !motherboard.ramGeneration) {
      findings.push({
        code: "RAM_GEN_UNKNOWN",
        title: "Generación de memoria RAM sin verificar",
        severity: "REQUIRES_REVIEW",
        explanation:
          "Falta especificar la generación DDR de la placa madre o del kit RAM. Requiere revisión técnica.",
        affectedSlots: ["ram", "motherboard"],
      });
    } else if (ram.ramGeneration !== motherboard.ramGeneration) {
      findings.push({
        code: "RAM_GEN_MISMATCH",
        title: `Generación de RAM incompatible (${ram.ramGeneration} vs ${motherboard.ramGeneration})`,
        severity: "INCOMPATIBLE",
        explanation: `La placa ${motherboard.name} solo admite memoria ${motherboard.ramGeneration}, mientras que el kit seleccionado es ${ram.ramGeneration}. Las ranuras físicas son distintas.`,
        affectedSlots: ["ram", "motherboard"],
      });
    } else if (
      ram.ramModulesCount &&
      motherboard.ramSlots &&
      ram.ramModulesCount > motherboard.ramSlots
    ) {
      findings.push({
        code: "RAM_SLOTS_EXCEEDED",
        title: "Cantidad de módulos RAM excede las ranuras",
        severity: "INCOMPATIBLE",
        explanation: `El kit incluye ${ram.ramModulesCount} módulos, pero la placa madre cuenta con ${motherboard.ramSlots} ranuras DIMM.`,
        affectedSlots: ["ram", "motherboard"],
      });
    } else if (
      ram.ramCapacityGb &&
      motherboard.maxRamGb &&
      ram.ramCapacityGb > motherboard.maxRamGb
    ) {
      findings.push({
        code: "RAM_MAX_CAP_EXCEEDED",
        title: "Capacidad de RAM supera el máximo de la placa",
        severity: "INCOMPATIBLE",
        explanation: `El kit suma ${ram.ramCapacityGb} GB y la placa soporta hasta ${motherboard.maxRamGb} GB.`,
        affectedSlots: ["ram", "motherboard"],
      });
    } else {
      findings.push({
        code: "RAM_COMPATIBLE",
        title: `Memoria ${ram.ramGeneration} compatible`,
        severity: "COMPATIBLE",
        explanation: `Generación ${ram.ramGeneration} y cantidad de módulos (${ram.ramModulesCount ?? "?"}) compatibles con la placa madre.`,
        affectedSlots: ["ram", "motherboard"],
      });
    }
  }

  // 4. Motherboard Form Factor <-> Case Supported Form Factors
  if (motherboard && pcCase) {
    const mbForm = motherboard.formFactor;
    const supported = pcCase.supportedFormFactors;
    if (!mbForm || !supported || supported.length === 0) {
      findings.push({
        code: "CASE_FORM_UNKNOWN",
        title: "Factor de forma de gabinete/placa sin confirmar",
        severity: "REQUIRES_REVIEW",
        explanation:
          "No están registrados todos los formatos soportados por el gabinete o el formato de la placa.",
        affectedSlots: ["motherboard", "case"],
      });
    } else if (!supported.includes(mbForm)) {
      findings.push({
        code: "CASE_FORM_MISMATCH",
        title: `La placa ${mbForm} no cabe en este gabinete`,
        severity: "INCOMPATIBLE",
        explanation: `El gabinete ${pcCase.name} admite únicamente formatos ${supported.join(", ")}, y la placa seleccionada es ${mbForm}.`,
        affectedSlots: ["motherboard", "case"],
      });
    } else {
      findings.push({
        code: "CASE_FORM_OK",
        title: `Formato ${mbForm} compatible con el gabinete`,
        severity: "COMPATIBLE",
        explanation: `El gabinete ${pcCase.name} soporta placas ${mbForm}.`,
        affectedSlots: ["motherboard", "case"],
      });
    }
  }

  // 5. GPU physical length <-> Case max GPU clearance
  if (gpu && pcCase) {
    if (gpu.gpuLengthMm == null || pcCase.caseMaxGpuLengthMm == null) {
      findings.push({
        code: "GPU_CLEARANCE_UNKNOWN",
        title: "Holgura física de tarjeta gráfica sin confirmar",
        severity: "REQUIRES_REVIEW",
        explanation: `Falta el dato exacto de longitud de GPU (${gpu.gpuLengthMm ?? "no registrado"} mm) o espacio máximo del gabinete (${pcCase.caseMaxGpuLengthMm ?? "no registrado"} mm). Requiere verificación física en taller antes de ensamblar.`,
        affectedSlots: ["gpu", "case"],
      });
    } else if (gpu.gpuLengthMm > pcCase.caseMaxGpuLengthMm) {
      findings.push({
        code: "GPU_TOO_LONG",
        title: `GPU demasiado larga (${gpu.gpuLengthMm} mm > ${pcCase.caseMaxGpuLengthMm} mm)`,
        severity: "INCOMPATIBLE",
        explanation: `La tarjeta gráfica mide ${gpu.gpuLengthMm} mm de largo y supera el máximo de ${pcCase.caseMaxGpuLengthMm} mm del gabinete ${pcCase.name}.`,
        affectedSlots: ["gpu", "case"],
      });
    } else {
      findings.push({
        code: "GPU_CLEARANCE_OK",
        title: `Espacio para GPU verificado (${gpu.gpuLengthMm} mm / ${pcCase.caseMaxGpuLengthMm} mm)`,
        severity: "COMPATIBLE",
        explanation: `La tarjeta gráfica (${gpu.gpuLengthMm} mm) entra con margen dentro del gabinete (${pcCase.caseMaxGpuLengthMm} mm máx.).`,
        affectedSlots: ["gpu", "case"],
      });
    }
  }

  // 6. Cooler socket & height <-> CPU socket & Case max cooler height
  if (cooler) {
    if (cpu?.socket && cooler.supportedSockets && cooler.supportedSockets.length > 0) {
      if (!cooler.supportedSockets.includes(cpu.socket)) {
        findings.push({
          code: "COOLER_SOCKET_MISMATCH",
          title: `Disipador sin anclaje para socket ${cpu.socket}`,
          severity: "INCOMPATIBLE",
          explanation: `El disipador ${cooler.name} soporta ${cooler.supportedSockets.join(", ")}, pero tu procesador es ${cpu.socket}.`,
          affectedSlots: ["cooler", "cpu"],
        });
      }
    } else if (cpu) {
      findings.push({
        code: "COOLER_SOCKET_UNKNOWN",
        title: "Compatibilidad de anclaje del disipador sin confirmar",
        severity: "REQUIRES_REVIEW",
        explanation: "Falta lista de sockets verificados en el disipador o CPU.",
        affectedSlots: ["cooler", "cpu"],
      });
    }

    if (pcCase) {
      if (cooler.coolerHeightMm == null || pcCase.caseMaxCoolerHeightMm == null) {
        findings.push({
          code: "COOLER_HEIGHT_UNKNOWN",
          title: "Altura máxima de disipador en gabinete sin confirmar",
          severity: "REQUIRES_REVIEW",
          explanation: `Falta altura del disipador (${cooler.coolerHeightMm ?? "N/D"} mm) o límite del gabinete (${pcCase.caseMaxCoolerHeightMm ?? "N/D"} mm).`,
          affectedSlots: ["cooler", "case"],
        });
      } else if (cooler.coolerHeightMm > pcCase.caseMaxCoolerHeightMm) {
        findings.push({
          code: "COOLER_TOO_TALL",
          title: `Disipador excede altura del gabinete (${cooler.coolerHeightMm} mm > ${pcCase.caseMaxCoolerHeightMm} mm)`,
          severity: "INCOMPATIBLE",
          explanation: `El panel lateral del gabinete ${pcCase.name} no cerraría con un disipador de ${cooler.coolerHeightMm} mm.`,
          affectedSlots: ["cooler", "case"],
        });
      }
    }
  }

  // 7. Storage interface <-> Motherboard ports
  if (storage && motherboard) {
    const iface = storage.storageInterface ?? "";
    if (iface.startsWith("NVMe")) {
      if (motherboard.m2Slots == null) {
        findings.push({
          code: "STORAGE_M2_UNKNOWN",
          title: "Ranuras M.2 de placa sin especificar",
          severity: "REQUIRES_REVIEW",
          explanation: "No se registraron cuántas ranuras M.2 tiene la placa seleccionada.",
          affectedSlots: ["storage", "motherboard"],
        });
      } else if (motherboard.m2Slots < 1) {
        findings.push({
          code: "STORAGE_NO_M2",
          title: "La placa madre no tiene ranura M.2 NVMe",
          severity: "INCOMPATIBLE",
          explanation: `El SSD ${storage.name} requiere ranura M.2 NVMe y la placa no dispone de una.`,
          affectedSlots: ["storage", "motherboard"],
        });
      }
    } else if (iface.startsWith("SATA")) {
      if (motherboard.sataPorts != null && motherboard.sataPorts < 1) {
        findings.push({
          code: "STORAGE_NO_SATA",
          title: "Sin puertos SATA disponibles en placa",
          severity: "INCOMPATIBLE",
          explanation: "La placa seleccionada no reporta puertos SATA libres.",
          affectedSlots: ["storage", "motherboard"],
        });
      }
    }
  }

  // 8. PSU Wattage & Connectors <-> System TDP & GPU requirement
  const cpuTdp = cpu?.tdpWatts ?? (cpu ? 65 : 0);
  const gpuTdp = gpu?.tdpWatts ?? 0;
  const baseSystemWatts = cpu || motherboard ? 75 : 0;
  const estimatedWattage = cpuTdp + gpuTdp + baseSystemWatts;
  const calculatedRecommended = Math.max(
    gpu?.recommendedPsuWatts ?? 0,
    estimatedWattage > 0 ? Math.ceil((estimatedWattage * 1.35) / 50) * 50 : 0
  );

  if (psu) {
    if (psu.psuWatts == null) {
      findings.push({
        code: "PSU_WATTAGE_UNKNOWN",
        title: "Capacidad real en Watts de la fuente sin confirmar",
        severity: "REQUIRES_REVIEW",
        explanation: "La fuente seleccionada no tiene potencia nominal estructurada en el catálogo.",
        affectedSlots: ["psu"],
      });
    } else if (calculatedRecommended > 0 && psu.psuWatts < calculatedRecommended) {
      findings.push({
        code: "PSU_UNDERPOWERED",
        title: `Fuente insuficiente (${psu.psuWatts}W vs ${calculatedRecommended}W recomendados)`,
        severity: "INCOMPATIBLE",
        explanation: `El consumo pico estimado más margen de seguridad requiere al menos ${calculatedRecommended}W (considerando la recomendación de la GPU/CPU), pero la fuente ${psu.name} entrega ${psu.psuWatts}W.`,
        affectedSlots: ["psu", "gpu", "cpu"],
      });
    } else {
      findings.push({
        code: "PSU_WATTAGE_OK",
        title: `Potencia de fuente adecuada (${psu.psuWatts}W para ~${estimatedWattage}W estimados)`,
        severity: "COMPATIBLE",
        explanation: `La fuente ${psu.name} cubre la demanda estimada del sistema y deja margen estable.`,
        affectedSlots: ["psu"],
      });
    }

    // Check GPU connectors (PCIe 8-pin / 12VHPWR)
    if (gpu) {
      const req8Pin = gpu.pcie8PinConnectors ?? 0;
      const psu8Pin = psu.pcie8PinConnectors;
      if (gpu.pcie12Vhpwr && psu.pcie12Vhpwr === false) {
        if (psu8Pin != null && psu8Pin >= 2) {
          findings.push({
            code: "PSU_12VHPWR_ADAPTER",
            title: "GPU usa conector 12VHPWR mediante adaptador PCIe",
            severity: "REQUIRES_REVIEW",
            explanation: `La GPU ${gpu.name} utiliza entrada 12VHPWR y la fuente ${psu.name} no es ATX 3.0 nativa; requiere verificar adaptador doble de 8 pines incluido y curva de cable en gabinete.`,
            affectedSlots: ["psu", "gpu"],
          });
        } else {
          findings.push({
            code: "PSU_CONNECTORS_INSUFFICIENT",
            title: "Conectores PCIe de alimentación insuficientes",
            severity: "INCOMPATIBLE",
            explanation: `La fuente ${psu.name} no posee conector 12VHPWR ni suficientes líneas PCIe de 8 pines para alimentar esta GPU con seguridad.`,
            affectedSlots: ["psu", "gpu"],
          });
        }
      } else if (req8Pin > 0) {
        if (psu8Pin == null) {
          findings.push({
            code: "PSU_CONNECTORS_UNKNOWN",
            title: "Conectores PCIe de fuente sin especificar",
            severity: "REQUIRES_REVIEW",
            explanation: `La GPU requiere ${req8Pin} conector(es) PCIe de 8 pines, pero ese dato falta en la fuente.`,
            affectedSlots: ["psu", "gpu"],
          });
        } else if (psu8Pin < req8Pin) {
          findings.push({
            code: "PSU_8PIN_MISMATCH",
            title: `Faltan conectores PCIe de 8 pines (${psu8Pin} disponibles / ${req8Pin} requeridos)`,
            severity: "INCOMPATIBLE",
            explanation: `La GPU requiere ${req8Pin} conector(es) PCIe 8-pin y la fuente solo incluye ${psu8Pin}.`,
            affectedSlots: ["psu", "gpu"],
          });
        }
      }
    }
  }

  // Stock availability warning (does not make hardware incompatible, but flags review if 0 stock)
  for (const item of coreParts) {
    if (item.stockAvailable <= 0) {
      findings.push({
        code: `OUT_OF_STOCK_${item.sku}`,
        title: `Sin stock inmediato: ${item.name}`,
        severity: "REQUIRES_REVIEW",
        explanation: `El componente ${item.name} (${item.sku}) tiene 0 unidades disponibles actualmente. Requiere confirmar pedido a proveedor o elegir alternativa.`,
        affectedSlots: [item.componentType.toLowerCase()],
      });
    }
  }

  if (missingCoreSlots.length > 0 && coreParts.length > 0) {
    findings.push({
      code: "INCOMPLETE_BUILD",
      title: `Faltan ${missingCoreSlots.length} componente(s) base para PC completa`,
      severity: "REQUIRES_REVIEW",
      explanation: `Faltan por seleccionar: ${missingCoreSlots.join(", ")}. Si es una actualización parcial, cambia el modo a "Actualización de equipo".`,
      affectedSlots: [],
    });
  }

  const hasIncompatible = findings.some((f) => f.severity === "INCOMPATIBLE");
  const hasReview = findings.some((f) => f.severity === "REQUIRES_REVIEW");

  let status: RuleSeverity = "COMPATIBLE";
  let statusLabel = "Compatible según los datos registrados";

  if (coreParts.length === 0) {
    status = "REQUIRES_REVIEW";
    statusLabel = "Selecciona componentes para verificar compatibilidad";
  } else if (hasIncompatible) {
    status = "INCOMPATIBLE";
    statusLabel = "Incompatible — revisa los conflictos detectados";
  } else if (hasReview) {
    status = "REQUIRES_REVIEW";
    statusLabel = "Requiere revisión técnica";
  }

  return {
    status,
    statusLabel,
    findings,
    estimatedWattage,
    recommendedPsuWatts: calculatedRecommended,
    partsSubtotalCents,
    requiresHumanReview: status !== "COMPATIBLE",
    missingCoreSlots,
  };
}

export function generateUpgradeStages(
  selection: BuildSlotsSelection,
  budgetCents: number,
  primaryUse: "GAMING" | "STUDY_WORK" | "CONTENT_CREATION" | "OFFICE_PYME",
  allComponents: ComponentSpecInput[]
): UpgradeStageProposal[] {
  const stages: UpgradeStageProposal[] = [];

  stages.push({
    stage: 1,
    title: "Etapa 1 — Base funcional equilibrada",
    focus: "Estabilidad, arranque rápido y compatibilidad comprobada",
    explanation:
      primaryUse === "GAMING" && !selection.gpu
        ? "Prioriza procesador con gráficos integrados, placa madre actualizable y fuente certificada para iniciar sin exceder tu presupuesto."
        : "Asegura placa, procesador, RAM en doble canal y SSD NVMe verificados para responder con fluidez desde el primer día.",
    estimatedAddOnCents: selection.cpu ? 0 : Math.min(budgetCents, 450000),
  });

  if (!selection.gpu && primaryUse === "GAMING") {
    const entryGpu = allComponents
      .filter((c) => c.componentType === "GPU" && c.stockAvailable > 0)
      .sort((a, b) => a.priceCents - b.priceCents)[0];
    stages.push({
      stage: 2,
      title: "Etapa 2 — Incorporación de tarjeta gráfica dedicada",
      focus: "Rendimiento gráfico 3D en juegos competitivos y AAA",
      explanation:
        "Al haber dejado una fuente de al menos 550W–650W y gabinete con holgura suficiente, puedes añadir una GPU dedicada sin cambiar placa ni fuente.",
      estimatedAddOnCents: entryGpu?.priceCents ?? 260000,
      suggestedSku: entryGpu?.sku,
      suggestedName: entryGpu?.name,
    });
  } else if (selection.ram && (selection.ram.ramCapacityGb ?? 16) < 32) {
    const ram32 = allComponents.find(
      (c) =>
        c.componentType === "RAM" &&
        c.ramGeneration === selection.ram?.ramGeneration &&
        (c.ramCapacityGb ?? 0) >= 32
    );
    stages.push({
      stage: 2,
      title: "Etapa 2 — Expansión de memoria RAM a 32 GB",
      focus: "Multitarea pesada, streaming, compilación o edición",
      explanation:
        "Amplía la capacidad de memoria sin reemplazar el procesador ni el almacenamiento actual cuando tus proyectos o juegos exijan mayor carga en paralelo.",
      estimatedAddOnCents: ram32?.priceCents ?? 85000,
      suggestedSku: ram32?.sku,
      suggestedName: ram32?.name,
    });
  }

  const betterCooler = allComponents.find(
    (c) => c.componentType === "COOLER" && c.sku !== selection.cooler?.sku
  );
  stages.push({
    stage: 3,
    title: "Etapa 3 — Refrigeración dedicada y almacenamiento secundario",
    focus: "Menores temperaturas sostenidas y espacio para biblioteca",
    explanation:
      "Mejora el control térmico en sesiones prolongadas y añade un segundo SSD cuando tu biblioteca de juegos o archivos crezca.",
    estimatedAddOnCents: betterCooler?.priceCents ?? 35000,
    suggestedSku: betterCooler?.sku,
    suggestedName: betterCooler?.name,
  });

  return stages;
}

export function recommendBuildByBudget(
  budgetCents: number,
  primaryUse: "GAMING" | "STUDY_WORK" | "CONTENT_CREATION" | "OFFICE_PYME",
  allComponents: ComponentSpecInput[]
): {
  selection: BuildSlotsSelection;
  note: string;
} {
  const byType = (type: ComponentSpecInput["componentType"]) =>
    allComponents
      .filter((c) => c.componentType === type && c.stockAvailable > 0)
      .sort((a, b) => a.priceCents - b.priceCents);

  const pickBySku = (sku: string) => allComponents.find((c) => c.sku === sku) ?? null;

  // High budget gamer (>= 8500 Bs -> 850000 cents)
  if (budgetCents >= 850000 && (primaryUse === "GAMING" || primaryUse === "CONTENT_CREATION")) {
    return {
      selection: {
        cpu: pickBySku("CT-CPU-R5-7600") ?? byType("CPU")[0] ?? null,
        motherboard: pickBySku("CT-MB-B650M-A-WIFI") ?? byType("MOTHERBOARD")[0] ?? null,
        ram: pickBySku("CT-RAM-FURY-32-D5") ?? byType("RAM")[0] ?? null,
        gpu: pickBySku("CT-GPU-RTX4070S-DUAL") ?? byType("GPU")[0] ?? null,
        storage: pickBySku("CT-SSD-980-1TB") ?? byType("STORAGE")[0] ?? null,
        psu: pickBySku("CT-PSU-RM750E") ?? byType("PSU")[0] ?? null,
        pcCase: pickBySku("CT-CASE-H5-FLOW") ?? byType("CASE")[0] ?? null,
        cooler: pickBySku("CT-COOL-PA120SE") ?? byType("COOLER")[0] ?? null,
        peripherals: [],
      },
      note: "Propuesta plataforma AM5 + DDR5 y GPU de gama media-alta acorde a tu presupuesto; verifica dimensiones en el panel de compatibilidad.",
    };
  }

  // Mid budget gamer (5500 - 8499 Bs)
  if (budgetCents >= 550000) {
    return {
      selection: {
        cpu: pickBySku("CT-CPU-R5-5600") ?? byType("CPU")[0] ?? null,
        motherboard: pickBySku("CT-MB-B550M-PRO-VDH") ?? byType("MOTHERBOARD")[0] ?? null,
        ram: pickBySku("CT-RAM-FURY-16-D4") ?? byType("RAM")[0] ?? null,
        gpu: pickBySku("CT-GPU-RTX4060-VENTUS") ?? byType("GPU")[0] ?? null,
        storage: pickBySku("CT-SSD-NV2-1TB") ?? byType("STORAGE")[0] ?? null,
        psu: pickBySku("CT-PSU-A650BN") ?? byType("PSU")[0] ?? null,
        pcCase: pickBySku("CT-CASE-VERSA-H18") ?? byType("CASE")[0] ?? null,
        cooler: pickBySku("CT-COOL-AK400") ?? byType("COOLER")[0] ?? null,
        peripherals: [],
      },
      note: "Propuesta equilibrada AM4 con placa B550, 16 GB DDR4, SSD NVMe 1 TB y RTX 4060 pensada para 1080p sin cuellos de botella en fuente.",
    };
  }

  // Tight budget (< 5500 Bs) -> APU build ready for Etapa 2 GPU upgrade
  return {
    selection: {
      cpu: pickBySku("CT-CPU-R5-5600G") ?? byType("CPU")[0] ?? null,
      motherboard: pickBySku("CT-MB-B550M-PRO-VDH") ?? byType("MOTHERBOARD")[0] ?? null,
      ram: pickBySku("CT-RAM-FURY-16-D4") ?? byType("RAM")[0] ?? null,
      gpu: null,
      storage: pickBySku("CT-SSD-NV2-1TB") ?? byType("STORAGE")[0] ?? null,
      psu: pickBySku("CT-PSU-A650BN") ?? byType("PSU")[0] ?? null,
      pcCase: pickBySku("CT-CASE-VERSA-H18") ?? byType("CASE")[0] ?? null,
      cooler: pickBySku("CT-COOL-AK400") ?? byType("COOLER")[0] ?? null,
      peripherals: [],
    },
    note: "Para cuidar tu presupuesto inicial sin sacrificar calidad de placa ni fuente, esta base usa Ryzen 5 5600G con gráficos integrados y deja lista la actualización de GPU dedicada para la Etapa 2.",
  };
}
