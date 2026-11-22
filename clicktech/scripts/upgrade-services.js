const fs = require('fs');
const { execSync } = require('child_process');

const serviceImages = {
  // Diagnóstico integral: Modern hardware diagnosis lab setup
  'srv-diagnostico.webp': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=85',
  // Mantenimiento preventivo: Clean modern PC hardware workstation
  'srv-mantenimiento.webp': 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=1200&q=85',
  // Reparación laptop: Sleek modern laptop repair
  'srv-laptop.webp': 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=85',
  // Ensamblaje PC: High-end custom RGB PC assembly
  'srv-ensamblaje.webp': 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1200&q=85',
  // Soporte B2B empresas: Modern datacenter & enterprise hardware
  'srv-b2b.webp': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=85'
};

async function run() {
  for (const [k, u] of Object.entries(serviceImages)) {
    const res = await fetch(u);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync('temp-srv.jpg', buf);
    execSync(`ffmpeg -y -i temp-srv.jpg -vf "scale=800:450:force_original_aspect_ratio=increase,crop=800:450" -q:v 85 "public/images/services/${k}"`, { stdio: 'ignore' });
    if (fs.existsSync('temp-srv.jpg')) fs.unlinkSync('temp-srv.jpg');
    console.log('Upgraded service image:', k);
  }
}

run();
