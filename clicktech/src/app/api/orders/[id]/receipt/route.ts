import { NextRequest, NextResponse } from "next/server";
import { authorizeOrderAccess } from "@/lib/domain/order-access";
import { formatBs } from "@/lib/domain/money";
import { formatDateLaPaz } from "@/lib/utils";
import {
  DELIVERY_METHOD_META,
  DELIVERY_STATUS_META,
  ORDER_STATUS_META,
  PAYMENT_STATUS_META,
  STORE_LOCATION,
} from "@/lib/domain/status-labels";
import { buildClickTechQrPayload, generateQrSvgString } from "@/lib/ui/qr-generator";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getPillColors(tone: string): { bg: string; fg: string; border: string } {
  switch (tone) {
    case "emerald":
      return { bg: "#dcfce7", fg: "#166534", border: "#86efac" };
    case "amber":
      return { bg: "#fef3c7", fg: "#92400e", border: "#fcd34d" };
    case "cyan":
      return { bg: "#e0f2fe", fg: "#0369a1", border: "#7dd3fc" };
    case "purple":
      return { bg: "#ede9fe", fg: "#5b21b6", border: "#c4b5fd" };
    case "danger":
      return { bg: "#ffe4e6", fg: "#9f1239", border: "#fda4af" };
    default:
      return { bg: "#f1f5f9", fg: "#334155", border: "#cbd5e1" };
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const code = req.nextUrl.searchParams.get("code");
  const authz = await authorizeOrderAccess(id, code);
  if (!authz.allowed || !authz.order) {
    return NextResponse.json({ error: "No autorizado." }, { status: authz.status });
  }

  const o = authz.order;
  const orderMeta = ORDER_STATUS_META[o.status] ?? { label: o.status, tone: "neutral" };
  const payMeta = PAYMENT_STATUS_META[o.paymentStatus] ?? { label: o.paymentStatus, tone: "neutral" };
  const delStatusMeta = DELIVERY_STATUS_META[o.deliveryStatus] ?? { label: o.deliveryStatus, tone: "neutral" };
  const delMethodInfo = DELIVERY_METHOD_META[o.deliveryMethod] ?? { label: o.deliveryMethod, shortLabel: o.deliveryMethod };

  const orderPill = getPillColors(orderMeta.tone);
  const payPill = getPillColors(payMeta.tone);
  const addr = (o.deliveryAddressSnapshot ?? null) as {
    street?: string;
    reference?: string;
    city?: string;
  } | null;

  const qrSvg = await generateQrSvgString(
    buildClickTechQrPayload({
      reference: o.orderNumber,
      totalCents: o.totalCents,
      detail: o.status,
    })
  );

  const origin = req.nextUrl.origin;

  const rowsHtml = o.items
    .map((it) => {
      const imgUrl = it.product?.images?.[0]?.url
        ? it.product.images[0].url.startsWith("http")
          ? it.product.images[0].url
          : `${origin}${it.product.images[0].url}`
        : null;
      return `
      <tr>
        <td class="sku">${escapeHtml(it.skuSnapshot)}</td>
        <td>
          <div class="prod-cell">
            ${imgUrl ? `<img src="${escapeHtml(imgUrl)}" alt="" class="thumb" />` : ""}
            <div>
              <div class="prod-name">${escapeHtml(it.productNameSnapshot)}</div>
              ${it.warrantyMonthsSnapshot ? `<div class="prod-sub">Garantía ClickTech: ${it.warrantyMonthsSnapshot} meses</div>` : ""}
            </div>
          </div>
        </td>
        <td style="text-align:center;font-weight:700">${it.quantity}</td>
        <td style="text-align:right;font-variant-numeric:tabular-nums">${escapeHtml(formatBs(it.unitPriceCentsSnapshot))}</td>
        <td style="text-align:right;font-weight:700;font-variant-numeric:tabular-nums">${escapeHtml(formatBs(it.lineTotalCents))}</td>
      </tr>`;
    })
    .join("");

  const backHref = `/pedido/${encodeURIComponent(o.id)}${code ? `?code=${encodeURIComponent(code)}` : ""}`;

  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Comprobante ${escapeHtml(o.orderNumber)} — ClickTech Potosí</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #0f172a; background: #f1f5f9; margin: 0; padding: 24px 16px; }
    .toolbar { max-width: 880px; margin: 0 auto 14px; display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 10px; font-size: 13px; font-weight: 700; text-decoration: none; cursor: pointer; border: 1px solid #cbd5e1; background: #ffffff; color: #0f172a; }
    .btn-primary { background: #0284c7; border-color: #0284c7; color: #ffffff; }
    .sheet { max-width: 880px; margin: 0 auto; background: #ffffff; border-radius: 18px; border: 1px solid #e2e8f0; box-shadow: 0 18px 40px -16px rgba(15, 23, 42, 0.16); overflow: hidden; }
    .hero { background: linear-gradient(135deg, #020617 0%, #0f172a 60%, #0369a1 100%); color: #f8fafc; padding: 26px 30px; display: flex; flex-wrap: wrap; justify-content: space-between; gap: 20px; align-items: center; }
    .brand-title { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em; }
    .brand-sub { margin: 4px 0 0; font-size: 13px; color: #bae6fd; }
    .hero-meta { display: flex; align-items: center; gap: 16px; }
    .qr-box { background: #ffffff; padding: 6px; border-radius: 10px; width: 92px; height: 92px; display: flex; align-items: center; justify-content: center; }
    .qr-box svg { width: 100%; height: 100%; }
    .body { padding: 26px 30px; }
    .badges { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
    .pill { display: inline-block; padding: 5px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; border: 1px solid; }
    .notice { background: #fffbeb; border: 1px solid #fcd34d; color: #78350f; border-radius: 12px; padding: 12px 16px; font-size: 12.5px; margin-bottom: 20px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; margin-bottom: 22px; }
    .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; font-size: 13px; line-height: 1.55; }
    .info-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; color: #64748b; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { background: #f1f5f9; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; padding: 10px 10px; text-align: left; border-bottom: 2px solid #cbd5e1; }
    td { border-bottom: 1px solid #e2e8f0; padding: 12px 10px; font-size: 13px; vertical-align: middle; }
    .sku { font-family: ui-monospace, monospace; font-size: 12px; color: #475569; white-space: nowrap; }
    .prod-cell { display: flex; align-items: center; gap: 10px; }
    .thumb { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; border: 1px solid #cbd5e1; flex-shrink: 0; }
    .prod-name { font-weight: 700; color: #0f172a; }
    .prod-sub { font-size: 11px; color: #64748b; margin-top: 2px; }
    .totals-wrap { display: flex; justify-content: flex-end; margin-top: 22px; }
    .totals { min-width: 290px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 18px; font-size: 13.5px; line-height: 1.85; }
    .total-row { display: flex; justify-content: space-between; gap: 20px; }
    .grand-total { border-top: 2px solid #0f172a; margin-top: 8px; padding-top: 8px; font-size: 17px; font-weight: 800; color: #0369a1; }
    .footer { margin-top: 26px; padding-top: 16px; border-top: 1px dashed #cbd5e1; font-size: 11.5px; color: #64748b; display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; }
    @media print {
      body { background: #ffffff; padding: 0; }
      .no-print { display: none !important; }
      .sheet { box-shadow: none; border: none; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="toolbar no-print">
    <a href="${escapeHtml(backHref)}" class="btn">← Volver al pedido</a>
    <button onclick="window.print()" class="btn btn-primary">🖨️ Imprimir / Guardar PDF</button>
  </div>

  <main class="sheet">
    <header class="hero">
      <div>
        <h1 class="brand-title">CLICKTECH POTOSÍ</h1>
        <p class="brand-sub">${escapeHtml(STORE_LOCATION.address)} · WhatsApp ${escapeHtml(STORE_LOCATION.whatsappDisplay)}</p>
        <p class="brand-sub">Comprobante de Pedido N° <strong style="color:#ffffff">${escapeHtml(o.orderNumber)}</strong></p>
      </div>
      <div class="hero-meta">
        <div style="text-align:right;font-size:12.5px;line-height:1.5">
          <div>Fecha (La Paz):</div>
          <strong style="font-size:14px">${escapeHtml(formatDateLaPaz(o.createdAt))}</strong>
        </div>
        <div class="qr-box" title="Código QR de verificación ClickTech">
          ${qrSvg}
        </div>
      </div>
    </header>

    <div class="body">
      <div class="badges">
        <span class="pill" style="background:${orderPill.bg};color:${orderPill.fg};border-color:${orderPill.border}">
          Pedido: ${escapeHtml(orderMeta.label)}
        </span>
        <span class="pill" style="background:${payPill.bg};color:${payPill.fg};border-color:${payPill.border}">
          Pago: ${escapeHtml(payMeta.label)}
        </span>
        <span class="pill" style="background:#f1f5f9;color:#334155;border-color:#cbd5e1">
          Entrega: ${escapeHtml(delStatusMeta.label)}
        </span>
      </div>

      <div class="notice">
        <strong>Documento de control operativo ClickTech:</strong> Detalla los productos, garantías e importes en Bolivianos (Bs). <strong>No constituye factura fiscal</strong> (integración tributaria pendiente de habilitación).
      </div>

      <div class="grid">
        <div class="info-card">
          <div class="info-label">Titular / Contacto</div>
          <div><strong>${escapeHtml(o.guestName ?? "Cliente registrado")}</strong></div>
          <div>${escapeHtml(o.guestEmail ?? "Correo registrado")}</div>
          <div>Tel / WhatsApp: ${escapeHtml(o.guestPhone ?? "Registrado en cuenta")}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Logística y Destino</div>
          <div><strong>${escapeHtml(delMethodInfo.label)}</strong></div>
          <div>${escapeHtml(addr?.street ? `${addr.street}${addr.reference ? ` (${addr.reference})` : ""}` : STORE_LOCATION.address)}</div>
          ${o.deliveryZone?.name ? `<div>Zona tarifaria: ${escapeHtml(o.deliveryZone.name)}</div>` : ""}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Producto</th>
            <th style="text-align:center">Cant.</th>
            <th style="text-align:right">Precio Unit.</th>
            <th style="text-align:right">Subtotal</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>

      <div class="totals-wrap">
        <div class="totals">
          <div class="total-row"><span>Subtotal productos</span><span>${escapeHtml(formatBs(o.subtotalCents))}</span></div>
          ${o.assemblyFeeCents > 0 ? `<div class="total-row"><span>Ensamblaje profesional</span><span>${escapeHtml(formatBs(o.assemblyFeeCents))}</span></div>` : ""}
          ${o.deliveryFeeCents > 0 ? `<div class="total-row"><span>Envío configurado</span><span>${escapeHtml(formatBs(o.deliveryFeeCents))}</span></div>` : ""}
          <div class="total-row grand-total"><span>Total del pedido</span><span>${escapeHtml(formatBs(o.totalCents))}</span></div>
        </div>
      </div>

      <footer class="footer">
        <span>ClickTech · Tecnología a tu medida · ${escapeHtml(STORE_LOCATION.address)}</span>
        <span>Atención técnica: ${escapeHtml(STORE_LOCATION.whatsappDisplay)}</span>
      </footer>
    </div>
  </main>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="comprobante-${o.orderNumber}.html"`,
    },
  });
}
