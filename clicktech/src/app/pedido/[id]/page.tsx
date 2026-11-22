import Link from "next/link";
import { authorizeOrderAccess } from "@/lib/domain/order-access";
import { OrderDetailClient } from "@/components/checkout/OrderDetailClient";

export const dynamic = "force-dynamic";

export default async function PedidoDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ code?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const authz = await authorizeOrderAccess(id, sp.code);

  if (!authz.allowed || !authz.order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-14 text-center space-y-4">
        <h1 className="font-heading text-xl font-bold">
          {authz.status === 404 ? "Pedido no encontrado" : "Acceso restringido a este pedido"}
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Solo la cuenta propietaria, personal autorizado o el invitado con código de verificación válido puede ver este pedido y sus comprobantes.
        </p>
        <Link
          href="/login"
          className="ct-btn h-10 px-5 rounded-lg text-sm font-semibold inline-flex items-center"
          style={{ backgroundColor: "var(--accent-cyan)", color: "var(--accent-cyan-ink)" }}
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  const o = authz.order;
  return (
    <OrderDetailClient
      guestCode={sp.code ?? null}
      order={{
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        paymentStatus: o.paymentStatus,
        deliveryMethod: o.deliveryMethod,
        deliveryStatus: o.deliveryStatus,
        paymentMethod: o.paymentMethod,
        subtotalCents: o.subtotalCents,
        assemblyFeeCents: o.assemblyFeeCents,
        deliveryFeeCents: o.deliveryFeeCents,
        totalCents: o.totalCents,
        reservationExpiresAt: o.reservationExpiresAt ? o.reservationExpiresAt.toISOString() : null,
        createdAt: o.createdAt.toISOString(),
        guestName: o.guestName,
        guestEmail: o.guestEmail,
        items: o.items,
        payments: o.payments.map((p) => ({
          id: p.id,
          status: p.status,
          amountCents: p.amountCents,
          referenceNumber: p.referenceNumber,
          proofFilePath: p.proofFilePath,
          isLateSubmission: p.isLateSubmission,
          reviewNotes: p.reviewNotes,
          createdAt: p.createdAt.toISOString(),
        })),
      }}
    />
  );
}
