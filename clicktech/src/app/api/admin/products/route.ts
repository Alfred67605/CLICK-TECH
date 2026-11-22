import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AuthError, requireRole } from "@/lib/domain/auth";
import { recordAuditLog } from "@/lib/domain/audit";

const createProductSchema = z.object({
  sku: z.string().min(3),
  name: z.string().min(3),
  model: z.string().min(1),
  categoryId: z.string().min(1),
  brandId: z.string().min(1),
  description: z.string().min(5),
  shortSpecs: z.record(z.string(), z.string()).default({}),
  costCents: z.number().int().min(0),
  priceCents: z.number().int().min(1),
  promoPriceCents: z.number().int().min(1).nullable().optional(),
  promoLabel: z.string().nullable().optional(),
  stockOnHand: z.number().int().min(0).default(0),
  minStockAlert: z.number().int().min(0).default(2),
  warrantyMonths: z.number().int().min(0).nullable().optional(),
  warrantyTerms: z.string().optional(),
  imageUrl: z.string().optional(),
  isIllustrative: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(["ADMIN", "SALES"]);
    const parsed = createProductSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos de producto inválidos" },
        { status: 400 }
      );
    }
    const d = parsed.data;
    const sku = d.sku.trim().toUpperCase();
    const slug = `${sku.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          sku,
          slug,
          name: d.name.trim(),
          model: d.model.trim(),
          categoryId: d.categoryId,
          brandId: d.brandId,
          description: d.description.trim(),
          shortSpecsJson: d.shortSpecs as Prisma.InputJsonValue,
          costCents: d.costCents,
          priceCents: d.priceCents,
          promoPriceCents: d.promoPriceCents ?? null,
          promoLabel: d.promoLabel ?? null,
          stockOnHand: d.stockOnHand,
          minStockAlert: d.minStockAlert,
          warrantyMonths: d.warrantyMonths ?? null,
          warrantyTerms: d.warrantyTerms ?? null,
          isFeatured: d.isFeatured,
          isPublished: true,
          images: d.imageUrl
            ? {
                create: {
                  url: d.imageUrl,
                  altText: d.isIllustrative ? `Imagen ilustrativa — ${d.name}` : d.name,
                  isPrimary: true,
                  isIllustrative: d.isIllustrative,
                },
              }
            : undefined,
        },
        include: { images: true, category: true, brand: true },
      });

      await recordAuditLog(
        {
          actorId: user.id,
          actorRole: user.role,
          action: "PRODUCT_CREATED",
          entityType: "PRODUCT",
          entityId: created.id,
          afterJson: { sku: created.sku, priceCents: created.priceCents },
        },
        tx
      );
      return created;
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "No se pudo crear el producto (verifica SKU único)." }, { status: 400 });
  }
}

const patchProductSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).optional(),
  priceCents: z.number().int().min(1).optional(),
  costCents: z.number().int().min(0).optional(),
  promoPriceCents: z.number().int().min(1).nullable().optional(),
  promoLabel: z.string().nullable().optional(),
  minStockAlert: z.number().int().min(0).optional(),
  warrantyMonths: z.number().int().min(0).nullable().optional(),
  warrantyTerms: z.string().nullable().optional(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  primaryImageUrl: z.string().optional(),
  isIllustrative: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireRole(["ADMIN", "SALES"]);
    const parsed = patchProductSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    const d = parsed.data;
    const before = await prisma.product.findUnique({ where: { id: d.id } });
    if (!before) {
      return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.product.update({
        where: { id: d.id },
        data: {
          name: d.name ?? undefined,
          priceCents: d.priceCents ?? undefined,
          costCents: d.costCents ?? undefined,
          promoPriceCents: d.promoPriceCents === undefined ? undefined : d.promoPriceCents,
          promoLabel: d.promoLabel === undefined ? undefined : d.promoLabel,
          minStockAlert: d.minStockAlert ?? undefined,
          warrantyMonths: d.warrantyMonths === undefined ? undefined : d.warrantyMonths,
          warrantyTerms: d.warrantyTerms === undefined ? undefined : d.warrantyTerms,
          isPublished: d.isPublished ?? undefined,
          isFeatured: d.isFeatured ?? undefined,
        },
      });

      if (d.primaryImageUrl) {
        const existingPrimary = await tx.productImage.findFirst({
          where: { productId: p.id, isPrimary: true },
        });
        if (existingPrimary) {
          await tx.productImage.update({
            where: { id: existingPrimary.id },
            data: {
              url: d.primaryImageUrl,
              isIllustrative: d.isIllustrative ?? false,
            },
          });
        } else {
          await tx.productImage.create({
            data: {
              productId: p.id,
              url: d.primaryImageUrl,
              altText: p.name,
              isPrimary: true,
              isIllustrative: d.isIllustrative ?? false,
            },
          });
        }
      }

      await recordAuditLog(
        {
          actorId: user.id,
          actorRole: user.role,
          action: "PRODUCT_UPDATED",
          entityType: "PRODUCT",
          entityId: p.id,
          beforeJson: {
            priceCents: before.priceCents,
            costCents: before.costCents,
            isPublished: before.isPublished,
          },
          afterJson: {
            priceCents: p.priceCents,
            costCents: p.costCents,
            isPublished: p.isPublished,
          },
        },
        tx
      );
      return p;
    });

    return NextResponse.json({ product: updated });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "No se pudo actualizar el producto." }, { status: 500 });
  }
}
