import QRCode from "qrcode";
import { formatBs } from "@/lib/domain/money";
import { STORE_LOCATION } from "@/lib/domain/status-labels";

export function buildClickTechQrPayload(params: {
  reference: string;
  totalCents: number;
  detail?: string;
}): string {
  return [
    "BO|CLICKTECH|SIMPLEQR",
    `TIENDA:${STORE_LOCATION.address}`,
    `REF:${params.reference}`,
    `MONTO:${formatBs(params.totalCents)}`,
    params.detail ? `INFO:${params.detail}` : null,
  ]
    .filter(Boolean)
    .join("|");
}

export async function generateQrSvgString(payload: string): Promise<string> {
  return QRCode.toString(payload, {
    type: "svg",
    margin: 1,
    width: 168,
    color: {
      dark: "#0B1120",
      light: "#FFFFFF",
    },
    errorCorrectionLevel: "M",
  });
}

export async function generateQrDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    margin: 2,
    width: 240,
    color: {
      dark: "#0B1120",
      light: "#FFFFFF",
    },
    errorCorrectionLevel: "M",
  });
}
