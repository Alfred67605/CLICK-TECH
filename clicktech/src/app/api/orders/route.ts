import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertRateLimit, AuthError, getCurrentUser, getExistingCartSessionToken } from "@/lib/domain/auth";
import { createOrderTransactional, DomainRuleError } from "@/lib/domain/inventory-orders";

const createOrderSchema = z.object({
  idempotencyKey: z.string().min(8),
  guestName: z.string().min(2).optional(),
  guestEmail: z.string().email().optional(),
  guestPhone: z.string().min(5).optional(),
  deliveryMethod: z.enum(["PICKUP_POTOSI", "LOCAL_DELIVERY", "DELIVERY_QUOTE_REQUESTED"]),
  deliveryZoneId: z.string().nullable().optional(),
  deliveryAddress: z
    .object({
      street: z.string().optional(),
      reference: z.string().optional(),
      city: z.string().optional(),
    })
    .nullable()
    .optional(),
  paymentMethod: z.enum(["TRANSFER_QR_MANUAL", "PAY_ON_PICKUP"]),
  includeAssembly: z.boolean().default(false),
  sourceQuoteId: z.string().nullable().optional(),
  notes: z.string().max(1000).optional(),
  clearCart: z.boolean().default(true),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(50),
      })
    )
    .min(1),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "local";
    assertRateLimit(`orders:${ip}`, 25, 60_000);

    const parsed = createOrderSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos de pedido inválidos" },
        { status: 400 }
      );
    }

    const user = await getCurrentUser();
    const d = parsed.data;
    if (!user && (!d.guestName || !d.guestEmail || !d.guestPhone)) {
      return NextResponse.json(
        { error: "Como invitado debes ingresar nombre, correo y teléfono de contacto." },
        { status: 400 }
      );
    }

    const result = await createOrderTransactional({
      idempotencyKey: d.idempotencyKey,
      userId: user?.id ?? null,
      guestName: d.guestName ?? user?.name ?? null,
      guestEmail: d.guestEmail ?? user?.email ?? null,
      guestPhone: d.guestPhone ?? user?.phone ?? null,
      deliveryMethod: d.deliveryMethod,
      deliveryZoneId: d.deliveryZoneId ?? null,
      deliveryAddressSnapshot: d.deliveryAddress ?? null,
      paymentMethod: d.paymentMethod,
      includeAssembly: d.includeAssembly,
      sourceQuoteId: d.sourceQuoteId ?? null,
      notes: d.notes ?? null,
      items: d.items,
    });

    if (d.clearCart) {
      const sid = await getExistingCartSessionToken();
      if (sid) {
        const cart = await prisma.cart.findUnique({ where: { sessionToken: sid } });
        if (cart) {
          await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
        }
      }
    }

    return NextResponse.json(
      {
        order: result.order,
        guestAccessCode: result.guestAccessCode,
        deduplicated: result.deduplicated,
      },
      { status: result.deduplicated ? 200 : 201 }
    );
  } catch (err) {
    if (err instanceof DomainRuleError || err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "No se pudo crear el pedido." }, { status: 500 });
  }
}
