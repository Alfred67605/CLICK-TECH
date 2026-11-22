import { NextRequest, NextResponse } from "next/server";
import { authorizeOrderAccess } from "@/lib/domain/order-access";
import { formatBs } from "@/lib/domain/money";
import { formatDateLaPaz } from "@/lib/utils";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
  const rowsHtml = o.items
    .map(
      (it) => `
      <tr>
        <td>${escapeHtml(it.skuSnapshot)}</td>
        <td>${escapeHtml(it.productNameSnapshot)}</td>
        <td style="text-align:center">${it.quantity}</td>
        <td style="text-align:right">${escapeHtml(formatBs(it.unitPriceCentsSnapshot))}</td>
        <td style="text-align:right">${escapeHtml(formatBs(it.lineTotalCents))}</td>
      </tr>`
    )
    .join("");

  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Comprobante de Pedido ${escapeHtml(o.orderNumber)} — ClickTech</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; margin: 32px; max-width: 800px; }
    .head { display: flex; justify-content: space-between; border-bottom: 2px solid #02040a; padding-bottom: 16px; margin-bottom: 20px; }
    .notice { background: #fef3c7; border: 1px solid #d97706; padding: 10px 14px; font-size: 13px; margin-bottom: 18px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { border-bottom: 1px solid #cbd5e1; padding: 8px 6px; font-size: 14px; text-align: left; }
    th { background: #f8fafc; }
    .totals { margin-top: 20px; text-align: right; font-size: 15px; line-height: 1.7; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="head">
    <div>
      <h1 style="margin:0">CLICKTECH — Potosí, Bolivia</h1>
      <p style="margin:4px 0 0;color:#475569">Tecnología a tu medida · Comprobante de Pedido</p>
    </div>
    <div style="text-align:right">
      <strong>Pedido: ${escapeHtml(o.orderNumber)}</strong><br/>
      <span>Fecha (La Paz): ${escapeHtml(formatDateLaPaz(o.createdAt))}</span><br/>
      <span>Estado pedido: ${escapeHtml(o.status)} · Pago: ${escapeHtml(o.paymentStatus)}</span>
    </div>
  </div>
  <div class="notice">
    <strong>Documento de control operativo:</strong> Este comprobante detalla el pedido y sus importes en Bs. <strong>No constituye factura fiscal</strong> (integración tributaria pendiente de habilitación).
  </div>
  <p><strong>Cliente / Contacto:</strong> ${escapeHtml(o.guestName ?? "Cliente registrado")} · ${escapeHtml(o.guestEmail ?? "")} · ${escapeHtml(o.guestPhone ?? "")}</p>
  <p><strong>Entrega:</strong> ${escapeHtml(o.deliveryMethod)} (${escapeHtml(o.deliveryStatus)})</p>
  <table>
    <thead>
      <tr><th>SKU</th><th>Producto</th><th style="text-align:center">Cant.</th><th style="text-align:right">Precio Unit.</th><th style="text-align:right">Subtotal</th></tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <div class="totals">
    <div>Subtotal productos: <strong>${escapeHtml(formatBs(o.subtotalCents))}</strong></div>
    ${o.assemblyFeeCents > 0 ? `<div>Servicio de ensamblaje: <strong>${escapeHtml(formatBs(o.assemblyFeeCents))}</strong></div>` : ""}
    ${o.deliveryFeeCents > 0 ? `<div>Envío configurado: <strong>${escapeHtml(formatBs(o.deliveryFeeCents))}</strong></div>` : ""}
    <div style="font-size:18px;margin-top:6px">Total del pedido: <strong>${escapeHtml(formatBs(o.totalCents))}</strong></div>
  </div>
  <p class="no-print" style="margin-top:24px"><button onclick="window.print()">Imprimir / Guardar PDF</button></p>
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
