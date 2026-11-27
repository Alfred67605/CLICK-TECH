export const STORE_LOCATION = {
  name: "ClickTech Potosí — Tienda y Taller Central",
  shortName: "ClickTech Calle Oruro",
  address: "Calle Oruro, Zona Central, Potosí, Bolivia",
  lat: -19.5886,
  lng: -65.7536,
  whatsapp: "59167605477",
  whatsappDisplay: "+591 67605477",
  schedule: "Lun a Sáb 09:00 – 19:30",
} as const;

export interface StatusBadgeMeta {
  label: string;
  description: string;
  tone: "cyan" | "emerald" | "amber" | "purple" | "danger" | "neutral";
}

export const ORDER_STATUS_META: Record<string, StatusBadgeMeta> = {
  PENDING_PAYMENT: {
    label: "Pendiente de pago",
    description: "Tu stock está reservado temporalmente esperando confirmación de pago.",
    tone: "amber",
  },
  PAYMENT_UNDER_REVIEW: {
    label: "Pago en revisión",
    description: "Recibimos tu comprobante y nuestro equipo lo está validando.",
    tone: "cyan",
  },
  PAID_CONFIRMED: {
    label: "Pago confirmado",
    description: "Pago verificado con éxito. Tu pedido pasa a alistado en tienda.",
    tone: "emerald",
  },
  PREPARING: {
    label: "Preparando equipo",
    description: "Estamos verificando hardware, pruebas y precinto de seguridad en Calle Oruro.",
    tone: "purple",
  },
  READY_FOR_PICKUP: {
    label: "Listo en tienda (Calle Oruro)",
    description: "Tu pedido está listo para recoger en ClickTech Calle Oruro, Potosí.",
    tone: "emerald",
  },
  OUT_FOR_DELIVERY: {
    label: "En camino con repartidor",
    description: "Nuestro repartidor salió de Calle Oruro hacia tu dirección en Potosí.",
    tone: "cyan",
  },
  DELIVERED: {
    label: "Entregado",
    description: "Pedido entregado satisfactoriamente con garantía ClickTech.",
    tone: "emerald",
  },
  CANCELLED: {
    label: "Cancelado",
    description: "Este pedido fue cancelado y las reservas fueron liberadas.",
    tone: "danger",
  },
  EXPIRED: {
    label: "Reserva expirada",
    description: "El tiempo de reserva temporal venció sin confirmación.",
    tone: "danger",
  },
};

export const PAYMENT_STATUS_META: Record<string, StatusBadgeMeta> = {
  UNPAID: {
    label: "Pendiente de abono",
    description: "Aún no se ha enviado comprobante de pago.",
    tone: "amber",
  },
  PAY_ON_PICKUP_PENDING: {
    label: "Pago al recoger / contra entrega",
    description: "Cancelarás al recibir tu equipo o recogerlo en Calle Oruro.",
    tone: "cyan",
  },
  PROOF_SUBMITTED: {
    label: "Comprobante enviado (en revisión)",
    description: "Comprobante recibido; verificación manual en proceso.",
    tone: "cyan",
  },
  APPROVED: {
    label: "Pago verificado",
    description: "Importe conciliado por ClickTech.",
    tone: "emerald",
  },
  REJECTED: {
    label: "Comprobante rechazado",
    description: "El comprobante no pudo validarse. Puedes subir uno nuevo.",
    tone: "danger",
  },
  REFUNDED: {
    label: "Reembolsado",
    description: "Importe devuelto al cliente.",
    tone: "neutral",
  },
};

export const DELIVERY_METHOD_META: Record<string, { label: string; shortLabel: string }> = {
  PICKUP_POTOSI: {
    label: "Recojo en tienda — Calle Oruro, Potosí",
    shortLabel: "Recojo en Calle Oruro",
  },
  LOCAL_DELIVERY: {
    label: "Delivery a domicilio en Potosí",
    shortLabel: "Delivery Potosí",
  },
  DELIVERY_QUOTE_REQUESTED: {
    label: "Envío nacional por courier / encomienda",
    shortLabel: "Envío Nacional",
  },
};

export const DELIVERY_STATUS_META: Record<string, StatusBadgeMeta> = {
  PENDING: {
    label: "Esperando confirmación",
    description: "Aguardando validación previa al despacho.",
    tone: "amber",
  },
  PREPARING: {
    label: "Empacando con precinto",
    description: "Alistando equipo y sellado antifraude en Calle Oruro.",
    tone: "purple",
  },
  READY: {
    label: "Listo para entrega / despacho",
    description: "Listo en mostrador Calle Oruro o asignado a courier.",
    tone: "emerald",
  },
  IN_TRANSIT: {
    label: "Repartidor en ruta",
    description: "En trayecto desde Calle Oruro hacia tu ubicación.",
    tone: "cyan",
  },
  DELIVERED: {
    label: "Entregado al cliente",
    description: "Entrega confirmada.",
    tone: "emerald",
  },
  CANCELLED: {
    label: "Cancelado",
    description: "Despacho cancelado.",
    tone: "danger",
  },
};

export function getToneStyles(tone: StatusBadgeMeta["tone"]) {
  switch (tone) {
    case "emerald":
      return {
        bg: "rgba(16, 185, 129, 0.14)",
        border: "rgba(16, 185, 129, 0.35)",
        text: "var(--status-ok)",
      };
    case "amber":
      return {
        bg: "rgba(245, 158, 11, 0.14)",
        border: "rgba(245, 158, 11, 0.35)",
        text: "var(--status-warn)",
      };
    case "purple":
      return {
        bg: "rgba(139, 92, 246, 0.14)",
        border: "rgba(139, 92, 246, 0.35)",
        text: "var(--accent-purple)",
      };
    case "danger":
      return {
        bg: "rgba(244, 63, 94, 0.14)",
        border: "rgba(244, 63, 94, 0.35)",
        text: "var(--status-danger)",
      };
    case "cyan":
      return {
        bg: "var(--accent-cyan-soft)",
        border: "var(--border-strong)",
        text: "var(--accent-cyan)",
      };
    default:
      return {
        bg: "var(--bg-chassis)",
        border: "var(--border-subtle)",
        text: "var(--text-secondary)",
      };
  }
}

export function getOrderProgressStep(status: string, deliveryStatus: string): number {
  if (status === "DELIVERED" || deliveryStatus === "DELIVERED") return 4;
  if (
    status === "OUT_FOR_DELIVERY" ||
    status === "READY_FOR_PICKUP" ||
    deliveryStatus === "IN_TRANSIT" ||
    deliveryStatus === "READY"
  ) {
    return 3;
  }
  if (status === "PREPARING" || deliveryStatus === "PREPARING") return 2;
  if (status === "PAID_CONFIRMED") return 1;
  return 0;
}

export function getEstimatedEtaText(deliveryMethod: string, status: string, deliveryStatus: string): string {
  if (status === "DELIVERED" || deliveryStatus === "DELIVERED") return "Entregado";
  if (status === "CANCELLED" || status === "EXPIRED") return "Detenido";
  if (deliveryMethod === "PICKUP_POTOSI") {
    return status === "READY_FOR_PICKUP" ? "Listo hoy en Calle Oruro" : "15–30 min tras confirmar";
  }
  if (deliveryMethod === "LOCAL_DELIVERY") {
    if (status === "OUT_FOR_DELIVERY" || deliveryStatus === "IN_TRANSIT") return "12–25 min (En ruta)";
    return "35–55 min desde Calle Oruro";
  }
  return "24–48 h (Encomienda segura)";
}
