import { prisma } from "@/lib/prisma";

export interface PublicBusinessSettings {
  demoMode: boolean;
  whatsappNumber: string;
  publicPhone: string;
  publicEmail: string;
  physicalAddress: string;
  city: string;
  businessHours: string;
  legalName: string;
  nit: string;
  electronicInvoicingEnabled: boolean;
  demoPaymentSandboxEnabled: boolean;
  transferQrEnabled: boolean;
  payOnPickupEnabled: boolean;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  qrConfigured: boolean;
  pendingKeys: string[];
}

export async function getPublicBusinessSettings(): Promise<PublicBusinessSettings> {
  const rows = await prisma.businessConfig.findMany();
  const map = new Map(rows.map((r) => [r.key, r]));

  const contacts = (map.get("pending_business_contacts")?.valueJson ?? {}) as Record<string, unknown>;
  const fiscal = (map.get("pending_fiscal_legal")?.valueJson ?? {}) as Record<string, unknown>;
  const pay = (map.get("payment_settings")?.valueJson ?? {}) as Record<string, unknown>;

  const pendingKeys = rows.filter((r) => r.isPendingRealData).map((r) => r.key);

  return {
    demoMode: process.env.DEMO_MODE !== "false",
    whatsappNumber: String(process.env.WHATSAPP_NUMBER || contacts.whatsappNumber || "59167605477").trim(),
    publicPhone: String(contacts.publicPhone || "67605477").trim(),
    publicEmail: String(contacts.publicEmail || "contacto@clicktech.demo.bo").trim(),
    physicalAddress: String(contacts.physicalAddress || "Centro Histórico (cercanías Plaza 10 de Noviembre / Calle Hoyos), Potosí, Bolivia").trim(),
    city: String(contacts.city || "Potosí, Bolivia"),
    businessHours: String(contacts.businessHours || "Lunes a Sábado: 09:00 - 19:30 (America/La_Paz)"),
    legalName: String(fiscal.legalName || "ClickTech"),
    nit: String(fiscal.nit || "").trim(),
    electronicInvoicingEnabled: Boolean(fiscal.electronicInvoicingEnabled),
    demoPaymentSandboxEnabled: pay.demoPaymentSandboxEnabled !== false,
    transferQrEnabled: pay.transferQrEnabled !== false,
    payOnPickupEnabled: pay.payOnPickupEnabled !== false,
    bankName: String(pay.bankName || "Pendiente de configuración"),
    accountNumber: String(pay.accountNumber || "").trim(),
    accountHolder: String(pay.accountHolder || "").trim(),
    qrConfigured: Boolean(pay.qrConfigured),
    pendingKeys,
  };
}
