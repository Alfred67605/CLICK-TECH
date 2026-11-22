import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function run() {
  await p.productImage.updateMany({
    where: { url: '/images/products/ct-pc-estudio.webp' },
    data: {
      altText: 'Ensamble de PC Estudio y Trabajo Profesional',
      author: 'Unsplash Pro Hardware',
      license: 'Unsplash License',
      licenseUrl: 'https://unsplash.com/license',
      sourceUrl: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5'
    }
  });

  await p.productImage.updateMany({
    where: { url: '/images/products/ct-pc-inicial.webp' },
    data: {
      altText: 'PC Gamer Inicial 1080p en Gabinete Gamer Moderno',
      author: 'Unsplash Pro Hardware',
      license: 'Unsplash License',
      licenseUrl: 'https://unsplash.com/license',
      sourceUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7'
    }
  });

  await p.productImage.updateMany({
    where: { url: '/images/products/ct-pc-equilibrada.webp' },
    data: {
      altText: 'PC Gamer Equilibrada con Refrigeración y Vidrio Templado',
      author: 'Unsplash Pro Hardware',
      license: 'Unsplash License',
      licenseUrl: 'https://unsplash.com/license',
      sourceUrl: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b'
    }
  });

  await p.productImage.updateMany({
    where: { url: '/images/products/ct-lap-ideapad-slim3.webp' },
    data: {
      altText: 'Laptop Lenovo Slim moderna y portátil',
      author: 'Unsplash Pro Hardware',
      license: 'Unsplash License',
      licenseUrl: 'https://unsplash.com/license',
      sourceUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed'
    }
  });

  await p.productImage.updateMany({
    where: { url: '/images/products/ct-per-k552.webp' },
    data: {
      altText: 'Teclado Mecánico Gamer RGB',
      author: 'Unsplash Pro Hardware',
      license: 'Unsplash License',
      licenseUrl: 'https://unsplash.com/license',
      sourceUrl: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef'
    }
  });

  await p.productImage.updateMany({
    where: { url: '/images/products/ct-ram-fury-32-d5.webp' },
    data: {
      altText: 'Memoria RAM DDR5 con Disipador Térmico',
      author: 'Unsplash Pro Hardware',
      license: 'Unsplash License',
      licenseUrl: 'https://unsplash.com/license',
      sourceUrl: 'https://images.unsplash.com/photo-1562976540-1502c2145186'
    }
  });

  console.log('Product image metadata updated successfully!');
  await p.$disconnect();
}

run();
