/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const prods = await prisma.product.findMany({
    where: { sku: { startsWith: 'CT-TEST-' } },
    select: { id: true, sku: true },
  });
  console.log(`Found ${prods.length} test products to clean.`);
  for (const p of prods) {
    await prisma.stockReservation.deleteMany({ where: { productId: p.id } });
    await prisma.inventoryMovement.deleteMany({ where: { productId: p.id } });
    await prisma.orderItem.deleteMany({ where: { productId: p.id } });
    await prisma.cartItem.deleteMany({ where: { productId: p.id } });
    await prisma.compatibilitySpec.deleteMany({ where: { productId: p.id } });
    await prisma.productImage.deleteMany({ where: { productId: p.id } });
    await prisma.product.delete({ where: { id: p.id } });
  }
  const remaining = await prisma.product.count({ where: { isPublished: true } });
  console.log(`Cleaned up. Total active published products in catalog: ${remaining}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
