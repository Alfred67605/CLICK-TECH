import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function run() {
  const prods = await p.product.findMany({
    select: { id: true, sku: true, name: true, images: true },
    where: { sku: { in: ['CT-PC-ESTUDIO', 'CT-PC-INICIAL', 'CT-PC-EQUILIBRADA', 'CT-LAP-IDEAPAD-SLIM3'] } }
  });
  console.log(JSON.stringify(prods, null, 2));
  await p.$disconnect();
}
run();
