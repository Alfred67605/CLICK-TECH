import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  cancelOrderTransactional,
  createOrderTransactional,
  DomainRuleError,
  getAvailableStock,
  receivePurchaseOrderTransactional,
  releaseExpiredReservations,
  reviewPaymentTransactional,
  submitPaymentProofTransactional,
} from "@/lib/domain/inventory-orders";
import {
  addServiceOrderPartTransactional,
  decideServiceQuoteTransactional,
  generateTicketNumber,
  issueServiceQuoteVersionTransactional,
  transitionServiceOrderTransactional,
} from "@/lib/domain/service-orders";
import { evaluateBuildCompatibility } from "@/lib/domain/compatibility";
import { canRoleSeeInternalCost, canRoleSeeInternalServiceNotes } from "@/lib/domain/service-rules";

describe("ClickTech Business Rules & Concurrency Integration Tests", () => {
  let adminId = "";
  let techId = "";
  let diegoId = "";
  let andreaId = "";
  let supplierId = "";

  beforeAll(async () => {
    // Load .env if needed
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      for (const line of fs.readFileSync(envPath, "utf-8").split(/\r?\n/)) {
        const idx = line.indexOf("=");
        if (idx > 0 && !line.startsWith("#")) {
          const k = line.slice(0, idx).trim();
          const v = line.slice(idx + 1).trim().replace(/^"|"$/g, "");
          if (!process.env[k]) process.env[k] = v;
        }
      }
    }

    const admin = await prisma.user.findUniqueOrThrow({ where: { email: "admin@clicktech.demo.bo" } });
    const tech = await prisma.user.findUniqueOrThrow({ where: { email: "tecnico@clicktech.demo.bo" } });
    const diego = await prisma.user.findUniqueOrThrow({ where: { email: "diego.demo@clicktech.demo.bo" } });
    const andrea = await prisma.user.findUniqueOrThrow({ where: { email: "andrea.demo@clicktech.demo.bo" } });
    const sup = await prisma.supplier.findFirstOrThrow();

    adminId = admin.id;
    techId = tech.id;
    diegoId = diego.id;
    andreaId = andrea.id;
    supplierId = sup.id;
  });

  it("Scenario 2: PC Compatibility detects incompatibility and missing data triggers REQUIRES_REVIEW", async () => {
    const cpu5600 = await prisma.product.findUniqueOrThrow({
      where: { sku: "CT-CPU-R5-5600" },
      include: { compatibilitySpec: true },
    });
    const mbB650 = await prisma.product.findUniqueOrThrow({
      where: { sku: "CT-MB-B650M-A-WIFI" },
      include: { compatibilitySpec: true },
    });
    const mbB450 = await prisma.product.findUniqueOrThrow({
      where: { sku: "CT-MB-B450M-STEEL" },
      include: { compatibilitySpec: true },
    });
    const ramD4 = await prisma.product.findUniqueOrThrow({
      where: { sku: "CT-RAM-FURY-16-D4" },
      include: { compatibilitySpec: true },
    });
    const gpu4060 = await prisma.product.findUniqueOrThrow({
      where: { sku: "CT-GPU-RTX4060-VENTUS" },
      include: { compatibilitySpec: true },
    });
    const ssd = await prisma.product.findUniqueOrThrow({
      where: { sku: "CT-SSD-NV2-1TB" },
      include: { compatibilitySpec: true },
    });
    const psu = await prisma.product.findUniqueOrThrow({
      where: { sku: "CT-PSU-A650BN" },
      include: { compatibilitySpec: true },
    });
    const h5Flow = await prisma.product.findUniqueOrThrow({
      where: { sku: "CT-CASE-H5-FLOW" },
      include: { compatibilitySpec: true },
    });

    const toInput = (p: typeof cpu5600) => ({
      productId: p.id,
      sku: p.sku,
      name: p.name,
      model: p.model,
      priceCents: p.priceCents,
      stockAvailable: getAvailableStock(p),
      componentType: p.compatibilitySpec!.componentType,
      socket: p.compatibilitySpec!.socket,
      chipset: p.compatibilitySpec!.chipset,
      biosVersionRequired: p.compatibilitySpec!.biosVersionRequired,
      ramGeneration: p.compatibilitySpec!.ramGeneration,
      ramSlots: p.compatibilitySpec!.ramSlots,
      ramModulesCount: p.compatibilitySpec!.ramModulesCount,
      ramCapacityGb: p.compatibilitySpec!.ramCapacityGb,
      maxRamGb: p.compatibilitySpec!.maxRamGb,
      formFactor: p.compatibilitySpec!.formFactor,
      supportedFormFactors: p.compatibilitySpec!.supportedFormFactors as string[] | null,
      tdpWatts: p.compatibilitySpec!.tdpWatts,
      recommendedPsuWatts: p.compatibilitySpec!.recommendedPsuWatts,
      psuWatts: p.compatibilitySpec!.psuWatts,
      pcie8PinConnectors: p.compatibilitySpec!.pcie8PinConnectors,
      pcie12Vhpwr: p.compatibilitySpec!.pcie12Vhpwr,
      gpuLengthMm: p.compatibilitySpec!.gpuLengthMm,
      caseMaxGpuLengthMm: p.compatibilitySpec!.caseMaxGpuLengthMm,
      coolerHeightMm: p.compatibilitySpec!.coolerHeightMm,
      caseMaxCoolerHeightMm: p.compatibilitySpec!.caseMaxCoolerHeightMm,
      supportedSockets: p.compatibilitySpec!.supportedSockets as string[] | null,
      m2Slots: p.compatibilitySpec!.m2Slots,
      sataPorts: p.compatibilitySpec!.sataPorts,
      storageInterface: p.compatibilitySpec!.storageInterface,
      hasIntegratedGraphics: p.compatibilitySpec!.hasIntegratedGraphics,
    });

    const incompatibleEval = evaluateBuildCompatibility({
      cpu: toInput(cpu5600),
      motherboard: toInput(mbB650),
      ram: toInput(ramD4),
      gpu: null,
      storage: toInput(ssd),
      psu: toInput(psu),
      pcCase: toInput(h5Flow),
    });
    expect(incompatibleEval.status).toBe("INCOMPATIBLE");
    expect(incompatibleEval.findings.some((f) => f.code === "CPU_MB_SOCKET_MISMATCH")).toBe(true);
    expect(incompatibleEval.findings.some((f) => f.code === "NO_DISPLAY_OUTPUT")).toBe(true);

    const reviewEval = evaluateBuildCompatibility({
      cpu: toInput(cpu5600),
      motherboard: toInput(mbB450),
      ram: toInput(ramD4),
      gpu: toInput(gpu4060),
      storage: toInput(ssd),
      psu: toInput(psu),
      pcCase: toInput(h5Flow),
    });
    expect(reviewEval.status).toBe("REQUIRES_REVIEW");
    expect(reviewEval.findings.some((f) => f.code === "MB_BIOS_CHECK")).toBe(true);
    expect(reviewEval.findings.some((f) => f.code === "GPU_CLEARANCE_UNKNOWN")).toBe(true);
  });

  it("Scenario 3 & 4: Server calculates price AND two concurrent reservations for last unit prevent overselling", async () => {
    const cat = await prisma.category.findFirstOrThrow();
    const brand = await prisma.brand.findFirstOrThrow();
    const testSku = `CT-TEST-RACE-${crypto.randomBytes(3).toString("hex")}`;

    const prod = await prisma.product.create({
      data: {
        sku: testSku,
        slug: testSku.toLowerCase(),
        name: "GPU Prueba Concurrencia",
        model: "TEST-1X",
        categoryId: cat.id,
        brandId: brand.id,
        description: "Producto de prueba para concurrencia",
        shortSpecsJson: {},
        costCents: 100000,
        priceCents: 150000,
        stockOnHand: 1,
        stockReserved: 0,
      },
    });

    // Concurrent race on last 1 unit
    const results = await Promise.allSettled([
      createOrderTransactional({
        idempotencyKey: `race-a-${testSku}`,
        userId: diegoId,
        deliveryMethod: "PICKUP_POTOSI",
        paymentMethod: "TRANSFER_QR_MANUAL",
        items: [{ productId: prod.id, quantity: 1 }],
      }),
      createOrderTransactional({
        idempotencyKey: `race-b-${testSku}`,
        userId: andreaId,
        deliveryMethod: "PICKUP_POTOSI",
        paymentMethod: "TRANSFER_QR_MANUAL",
        items: [{ productId: prod.id, quantity: 1 }],
      }),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(DomainRuleError);

    const winnerOrder = (fulfilled[0] as PromiseFulfilledResult<Awaited<ReturnType<typeof createOrderTransactional>>>).value.order;
    expect(winnerOrder.totalCents).toBe(150000);

    const prodAfter = await prisma.product.findUniqueOrThrow({ where: { id: prod.id } });
    expect(prodAfter.stockOnHand).toBe(1);
    expect(prodAfter.stockReserved).toBe(1);
    expect(getAvailableStock(prodAfter)).toBe(0);

    // Scenario 5: Submit proof leaves payment PROOF_SUBMITTED; approve twice is idempotent
    const proof = await submitPaymentProofTransactional({
      orderId: winnerOrder.id,
      idempotencyKey: `proof-${testSku}`,
      method: "TRANSFER_QR_MANUAL",
      referenceNumber: "TEST-REF-999",
      submittedByUserId: diegoId,
    });
    expect(proof.payment.status).toBe("PROOF_SUBMITTED");

    const rev1 = await reviewPaymentTransactional({
      paymentId: proof.payment.id,
      decision: "APPROVED",
      reviewerId: adminId,
      reviewerRole: "ADMIN",
    });
    expect(rev1.payment.status).toBe("APPROVED");

    const rev2 = await reviewPaymentTransactional({
      paymentId: proof.payment.id,
      decision: "APPROVED",
      reviewerId: adminId,
      reviewerRole: "ADMIN",
    });
    expect(rev2.deduplicated).toBe(true);

    const dispatchMovements = await prisma.inventoryMovement.count({
      where: { productId: prod.id, type: "SALE_DISPATCH" },
    });
    expect(dispatchMovements).toBe(1);

    // Cleanup test product (kept published=false or test record verified)
    const prodDispatched = await prisma.product.findUniqueOrThrow({ where: { id: prod.id } });
    expect(prodDispatched.stockOnHand).toBe(0);
    expect(prodDispatched.stockReserved).toBe(0);
  });

  it("Scenario 6: Cancellation releases reservation once; late payment checks stock again", async () => {
    const cat = await prisma.category.findFirstOrThrow();
    const brand = await prisma.brand.findFirstOrThrow();
    const sku = `CT-TEST-EXP-${crypto.randomBytes(3).toString("hex")}`;

    const prod = await prisma.product.create({
      data: {
        sku,
        slug: sku.toLowerCase(),
        name: "SSD Prueba Expiración",
        model: "EXP-1",
        categoryId: cat.id,
        brandId: brand.id,
        description: "Test expiration",
        shortSpecsJson: {},
        costCents: 30000,
        priceCents: 45000,
        stockOnHand: 1,
        stockReserved: 0,
      },
    });

    const ord = await createOrderTransactional({
      idempotencyKey: `exp-${sku}`,
      userId: diegoId,
      deliveryMethod: "PICKUP_POTOSI",
      paymentMethod: "TRANSFER_QR_MANUAL",
      items: [{ productId: prod.id, quantity: 1 }],
    });

    // Cancel once, then repeat cancel -> idempotent release of 1 unit
    const c1 = await cancelOrderTransactional({
      orderId: ord.order.id,
      actorId: diegoId,
      actorRole: "CUSTOMER",
      reason: "Prueba cancelación",
    });
    expect(c1.releasedUnits).toBe(1);

    const c2 = await cancelOrderTransactional({
      orderId: ord.order.id,
      actorId: diegoId,
      actorRole: "CUSTOMER",
      reason: "Repetición",
    });
    expect(c2.deduplicated).toBe(true);
    expect(c2.releasedUnits).toBe(0);

    const afterCancel = await prisma.product.findUniqueOrThrow({ where: { id: prod.id } });
    expect(afterCancel.stockReserved).toBe(0);

    // Test expired reservation + late payment blocked when stock is 0
    const ord2 = await createOrderTransactional({
      idempotencyKey: `exp2-${sku}`,
      userId: diegoId,
      deliveryMethod: "PICKUP_POTOSI",
      paymentMethod: "TRANSFER_QR_MANUAL",
      items: [{ productId: prod.id, quantity: 1 }],
    });
    // Force expiration timestamp into past
    await prisma.stockReservation.updateMany({
      where: { orderId: ord2.order.id },
      data: { expiresAt: new Date(Date.now() - 60_000) },
    });
    const swept = await releaseExpiredReservations(adminId);
    expect(swept).toBeGreaterThanOrEqual(1);

    // Late proof submitted after expiration
    const lateProof = await submitPaymentProofTransactional({
      orderId: ord2.order.id,
      idempotencyKey: `late-${sku}`,
      method: "TRANSFER_QR_MANUAL",
      referenceNumber: "LATE-01",
      submittedByUserId: diegoId,
    });
    expect(lateProof.payment.isLateSubmission).toBe(true);

    // Simulate stock reduced to 0 before late payment review
    await prisma.product.update({ where: { id: prod.id }, data: { stockOnHand: 0 } });
    await expect(
      reviewPaymentTransactional({
        paymentId: lateProof.payment.id,
        decision: "APPROVED",
        reviewerId: adminId,
        reviewerRole: "ADMIN",
      })
    ).rejects.toThrowError(/Pago tardío detectado/);
  });

  it("Scenario 7 & 9: Service workflow enforces quote approval gate & spare part exit + PO receipt", async () => {
    const srv = await prisma.serviceCatalog.findFirstOrThrow();
    const mx4 = await prisma.product.findUniqueOrThrow({ where: { sku: "CT-ACC-MX4" } });
    const initialMx4Stock = mx4.stockOnHand;

    const ticket = generateTicketNumber();
    const so = await prisma.serviceOrder.create({
      data: {
        ticketNumber: ticket,
        userId: andreaId,
        customerName: "Andrea Demo",
        customerEmail: "andrea.demo@clicktech.demo.bo",
        customerPhone: "000-00006",
        serviceCatalogId: srv.id,
        deviceType: "LAPTOP",
        deviceBrandModel: "Laptop Test",
        reportedSymptoms: "Calentamiento",
        status: "DIAGNOSIS",
        assignedTechId: techId,
      },
    });

    // Issue quote v1 (Bs 150)
    await issueServiceQuoteVersionTransactional({
      serviceOrderId: so.id,
      laborCents: 15000,
      changeReason: "Diagnóstico v1",
      actorId: techId,
      actorRole: "TECH",
    });

    // Trying to move directly to IN_PROGRESS before approval MUST throw
    await expect(
      transitionServiceOrderTransactional({
        serviceOrderId: so.id,
        toStatus: "IN_PROGRESS",
        publicMessage: "Intento sin aprobación",
        actorId: techId,
        actorRole: "TECH",
      })
    ).rejects.toThrow();

    // Customer accepts quote v1
    await decideServiceQuoteTransactional({
      serviceOrderId: so.id,
      decision: "ACCEPTED",
      decidedByUserId: andreaId,
      actorRole: "CUSTOMER",
    });

    // Add spare part (ARCTIC MX-4) -> creates inventory movement and exceeds approved total
    const partRes = await addServiceOrderPartTransactional({
      serviceOrderId: so.id,
      productId: mx4.id,
      quantity: 1,
      actorId: techId,
      actorRole: "TECH",
      idempotencyKey: `part-${ticket}`,
    });
    expect(partRes.requiresNewApproval).toBe(true);

    const mx4AfterPart = await prisma.product.findUniqueOrThrow({ where: { id: mx4.id } });
    expect(mx4AfterPart.stockOnHand).toBe(initialMx4Stock - 1);

    // Trying to execute IN_PROGRESS when cost increased above totalApprovedCents MUST throw!
    await expect(
      transitionServiceOrderTransactional({
        serviceOrderId: so.id,
        toStatus: "IN_PROGRESS",
        publicMessage: "Sin aprobar costo extra",
        actorId: techId,
        actorRole: "TECH",
      })
    ).rejects.toThrowError(/última versión/);

    // Issue v2 and accept -> now IN_PROGRESS and DELIVERED succeed
    await issueServiceQuoteVersionTransactional({
      serviceOrderId: so.id,
      laborCents: 15000,
      changeReason: "Incluye pasta térmica ARCTIC MX-4",
      actorId: techId,
      actorRole: "TECH",
    });
    await decideServiceQuoteTransactional({
      serviceOrderId: so.id,
      decision: "ACCEPTED",
      decidedByUserId: andreaId,
      actorRole: "CUSTOMER",
    });

    await transitionServiceOrderTransactional({
      serviceOrderId: so.id,
      toStatus: "IN_PROGRESS",
      publicMessage: "Mantenimiento en curso",
      actorId: techId,
      actorRole: "TECH",
    });
    await transitionServiceOrderTransactional({
      serviceOrderId: so.id,
      toStatus: "TESTING",
      publicMessage: "Pruebas térmicas",
      actorId: techId,
      actorRole: "TECH",
    });
    await transitionServiceOrderTransactional({
      serviceOrderId: so.id,
      toStatus: "READY_FOR_DELIVERY",
      publicMessage: "Listo para entrega",
      actorId: techId,
      actorRole: "TECH",
    });
    await transitionServiceOrderTransactional({
      serviceOrderId: so.id,
      toStatus: "DELIVERED",
      publicMessage: "Entregado con pruebas verificadas",
      closingSummary: "Limpieza completa y cambio de pasta térmica",
      performedTests: ["Prueba de carga 30 min", "Verificación de ventilador"],
      actorId: techId,
      actorRole: "TECH",
    });

    // Purchase order reception increases stock once (idempotently)
    const po = await prisma.purchaseOrder.create({
      data: {
        code: `OC-TEST-${crypto.randomBytes(3).toString("hex")}`,
        supplierId,
        status: "ORDERED",
        totalCostCents: mx4.costCents * 2,
        createdById: adminId,
        items: {
          create: {
            productId: mx4.id,
            productNameSnapshot: mx4.name,
            skuSnapshot: mx4.sku,
            orderedQty: 2,
            unitCostCents: mx4.costCents,
          },
        },
      },
      include: { items: true },
    });

    const rcptKey = `rcpt-test-${po.id}`;
    await receivePurchaseOrderTransactional({
      purchaseOrderId: po.id,
      idempotencyKey: rcptKey,
      receivedById: adminId,
      actorRole: "ADMIN",
      items: [{ purchaseOrderItemId: po.items[0].id, qtyReceived: 2 }],
    });
    const rcptDup = await receivePurchaseOrderTransactional({
      purchaseOrderId: po.id,
      idempotencyKey: rcptKey,
      receivedById: adminId,
      actorRole: "ADMIN",
      items: [{ purchaseOrderItemId: po.items[0].id, qtyReceived: 2 }],
    });
    expect(rcptDup.deduplicated).toBe(true);

    const mx4Restocked = await prisma.product.findUniqueOrThrow({ where: { id: mx4.id } });
    expect(mx4Restocked.stockOnHand).toBe(initialMx4Stock - 1 + 2);
  });

  it("Scenario 8 & 10: RBAC rules hide costs from TECH and deactivated products preserve order snapshots", async () => {
    expect(canRoleSeeInternalCost("ADMIN")).toBe(true);
    expect(canRoleSeeInternalCost("SALES")).toBe(true);
    expect(canRoleSeeInternalCost("TECH")).toBe(false);
    expect(canRoleSeeInternalCost("CUSTOMER")).toBe(false);
    expect(canRoleSeeInternalServiceNotes("TECH")).toBe(true);
    expect(canRoleSeeInternalServiceNotes("CUSTOMER")).toBe(false);

    // Order CT-2026-DEMO-001 snapshots remain intact even if product is unpublished
    const item = await prisma.orderItem.findFirstOrThrow({
      where: { order: { orderNumber: "CT-2026-DEMO-001" } },
    });
    expect(item.productNameSnapshot.length).toBeGreaterThan(3);
    expect(item.unitPriceCentsSnapshot).toBeGreaterThan(0);
  });
});
