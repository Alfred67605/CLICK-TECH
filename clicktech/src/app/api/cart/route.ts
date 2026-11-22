import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  getExistingCartSessionToken,
  getOrCreateCartSessionToken,
} from "@/lib/domain/auth";
import { getAvailableStock } from "@/lib/domain/inventory-orders";
import { lineTotalCents, sumCents } from "@/lib/domain/money";

async function loadFormattedCart(sessionToken: string) {
  const cart = await prisma.cart.findUnique({
    where: { sessionToken },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        include: {
          product: {
            include: {
              brand: { select: { name: true } },
              category: { select: { name: true, slug: true } },
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
      },
    },
  });

  if (!cart) {
    return { items: [], subtotalCents: 0, itemCount: 0 };
  }

  let subtotalCents = 0;
  let itemCount = 0;
  const items = cart.items
    .filter((i) => i.product.isPublished)
    .map((i) => {
      const unitPriceCents = i.product.promoPriceCents ?? i.product.priceCents;
      const lineCents = lineTotalCents(unitPriceCents, i.quantity);
      subtotalCents = sumCents(subtotalCents, lineCents);
      itemCount += i.quantity;
      return {
        id: i.id,
        productId: i.productId,
        sku: i.product.sku,
        slug: i.product.slug,
        name: i.product.name,
        model: i.product.model,
        brandName: i.product.brand.name,
        categoryName: i.product.category.name,
        imageUrl: i.product.images[0]?.url ?? null,
        isIllustrative: i.product.images[0]?.isIllustrative ?? true,
        quantity: i.quantity,
        unitPriceCents,
        lineTotalCents: lineCents,
        stockAvailable: getAvailableStock(i.product),
      };
    });

  return { items, subtotalCents, itemCount };
}

export async function GET() {
  const sid = await getExistingCartSessionToken();
  if (!sid) {
    return NextResponse.json({ items: [], subtotalCents: 0, itemCount: 0 });
  }
  const data = await loadFormattedCart(sid);
  return NextResponse.json(data);
}

const addItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(20).default(1),
});

export async function POST(req: NextRequest) {
  const parsed = addItemSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Producto o cantidad inválida" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id: parsed.data.productId } });
  if (!product || !product.isPublished) {
    return NextResponse.json({ error: "Producto no disponible." }, { status: 404 });
  }

  const avail = getAvailableStock(product);
  const sid = await getOrCreateCartSessionToken();
  const user = await getCurrentUser();

  const cart = await prisma.cart.upsert({
    where: { sessionToken: sid },
    update: user ? { userId: user.id } : {},
    create: { sessionToken: sid, userId: user?.id ?? null },
  });

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId: product.id } },
  });

  const nextQty = (existing?.quantity ?? 0) + parsed.data.quantity;
  if (nextQty > avail) {
    return NextResponse.json(
      { error: `Stock disponible insuficiente (${avail} unidades disponibles).` },
      { status: 409 }
    );
  }

  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId: product.id } },
    update: { quantity: nextQty },
    create: { cartId: cart.id, productId: product.id, quantity: nextQty },
  });

  const data = await loadFormattedCart(sid);
  return NextResponse.json(data);
}

const patchItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(0).max(50),
});

export async function PATCH(req: NextRequest) {
  const parsed = patchItemSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Cantidad inválida" }, { status: 400 });
  }

  const sid = await getOrCreateCartSessionToken();
  const cart = await prisma.cart.findUnique({ where: { sessionToken: sid } });
  if (!cart) {
    return NextResponse.json({ items: [], subtotalCents: 0, itemCount: 0 });
  }

  if (parsed.data.quantity === 0) {
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id, productId: parsed.data.productId },
    });
  } else {
    const prod = await prisma.product.findUnique({ where: { id: parsed.data.productId } });
    const avail = prod ? getAvailableStock(prod) : 0;
    if (!prod || parsed.data.quantity > avail) {
      return NextResponse.json(
        { error: `Solo hay ${avail} unidad(es) disponibles.` },
        { status: 409 }
      );
    }
    await prisma.cartItem.updateMany({
      where: { cartId: cart.id, productId: parsed.data.productId },
      data: { quantity: parsed.data.quantity },
    });
  }

  const data = await loadFormattedCart(sid);
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const sid = await getExistingCartSessionToken();
  if (!sid) {
    return NextResponse.json({ items: [], subtotalCents: 0, itemCount: 0 });
  }
  const cart = await prisma.cart.findUnique({ where: { sessionToken: sid } });
  if (cart) {
    const productId = req.nextUrl.searchParams.get("productId");
    if (productId) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
    } else {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
  }
  const data = await loadFormattedCart(sid);
  return NextResponse.json(data);
}
