import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function run() {
  const rams = await p.product.findMany({
    where: { sku: { startsWith: 'CT-RAM' } },
    select: { slug: true, name: true, sku: true, compatibilitySpec: true }
  });
  console.log(rams);
  await p.$disconnect();
}
run();
