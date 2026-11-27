import { prisma } from "@/lib/prisma";
import { getCurrentUser, sha256 } from "@/lib/domain/auth";

export async function authorizeOrderAccess(
  orderId: string,
  guestCode?: string | null
) {
  const user = await getCurrentUser();
  const order = await prisma.order.findFirst({
    where: { OR: [{ id: orderId }, { orderNumber: orderId }] },
    include: {
      items: {
        include: {
          product: {
            select: {
              slug: true,
              images: {
                orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
                take: 1,
                select: { url: true, altText: true },
              },
            },
          },
        },
      },
      payments: { orderBy: { createdAt: "desc" } },
      deliveryZone: true,
      reservations: true,
    },
  });

  if (!order) return { allowed: false, status: 404 as const, order: null, user };

  const isStaff = user && (user.role === "ADMIN" || user.role === "SALES");
  const isOwner = Boolean(user && order.userId && order.userId === user.id);
  const isGuestWithCode = Boolean(
    guestCode &&
      order.guestVerificationCodeHash &&
      sha256(guestCode.trim().toUpperCase()) === order.guestVerificationCodeHash
  );

  if (!isStaff && !isOwner && !isGuestWithCode) {
    return { allowed: false, status: user ? (403 as const) : (401 as const), order: null, user };
  }

  return { allowed: true, status: 200 as const, order, user };
}
