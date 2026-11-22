import type { ServiceOrderStatus, Role } from "@prisma/client";

export const SERVICE_STAGE_ORDER: ServiceOrderStatus[] = [
  "REQUEST_RECEIVED",
  "COORDINATION",
  "EQUIPMENT_RECEIVED",
  "DIAGNOSIS",
  "QUOTE_PENDING_APPROVAL",
  "WORK_AUTHORIZED",
  "IN_PROGRESS",
  "TESTING",
  "READY_FOR_DELIVERY",
  "DELIVERED",
];

export const SERVICE_STATUS_LABELS: Record<ServiceOrderStatus, string> = {
  REQUEST_RECEIVED: "Solicitud recibida",
  COORDINATION: "Coordinación",
  EQUIPMENT_RECEIVED: "Equipo recibido",
  DIAGNOSIS: "Diagnóstico",
  QUOTE_PENDING_APPROVAL: "Cotización pendiente de aprobación",
  WORK_AUTHORIZED: "Trabajo autorizado",
  IN_PROGRESS: "En proceso",
  TESTING: "Pruebas",
  READY_FOR_DELIVERY: "Listo para entrega",
  DELIVERED: "Entregado",
  WAITING_PARTS: "Espera de repuestos",
  QUOTE_REJECTED: "Cotización rechazada",
  CANCELLED: "Cancelado",
};

export const ALLOWED_SERVICE_TRANSITIONS: Record<ServiceOrderStatus, ServiceOrderStatus[]> = {
  REQUEST_RECEIVED: ["COORDINATION", "EQUIPMENT_RECEIVED", "CANCELLED"],
  COORDINATION: ["EQUIPMENT_RECEIVED", "CANCELLED"],
  EQUIPMENT_RECEIVED: ["DIAGNOSIS", "CANCELLED"],
  DIAGNOSIS: ["QUOTE_PENDING_APPROVAL", "WORK_AUTHORIZED", "READY_FOR_DELIVERY", "CANCELLED"],
  QUOTE_PENDING_APPROVAL: ["WORK_AUTHORIZED", "QUOTE_REJECTED", "CANCELLED"],
  WORK_AUTHORIZED: ["IN_PROGRESS", "WAITING_PARTS", "CANCELLED"],
  IN_PROGRESS: ["WAITING_PARTS", "TESTING", "QUOTE_PENDING_APPROVAL", "CANCELLED"],
  WAITING_PARTS: ["IN_PROGRESS", "QUOTE_PENDING_APPROVAL", "CANCELLED"],
  TESTING: ["READY_FOR_DELIVERY", "IN_PROGRESS", "QUOTE_PENDING_APPROVAL"],
  READY_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: [],
  QUOTE_REJECTED: ["READY_FOR_DELIVERY", "QUOTE_PENDING_APPROVAL", "CANCELLED"],
  CANCELLED: [],
};

export const STATUSES_REQUIRING_APPROVED_QUOTE: ServiceOrderStatus[] = [
  "WORK_AUTHORIZED",
  "IN_PROGRESS",
  "TESTING",
  "READY_FOR_DELIVERY",
  "DELIVERED",
];

export function canTransitionServiceStatus(
  from: ServiceOrderStatus,
  to: ServiceOrderStatus
): boolean {
  if (from === to) return true;
  return ALLOWED_SERVICE_TRANSITIONS[from]?.includes(to) ?? false;
}

export function canRoleSeeInternalCost(role: Role | undefined | null): boolean {
  return role === "ADMIN" || role === "SALES";
}

export function canRoleSeeInternalServiceNotes(role: Role | undefined | null): boolean {
  return role === "ADMIN" || role === "SALES" || role === "TECH";
}
