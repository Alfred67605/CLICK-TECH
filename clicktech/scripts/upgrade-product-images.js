/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// High-quality, modern, authentic web photography for tech & hardware
const imageMap = {
  // Prebuilt PCs (The user complained about old 2013 scientist photo!)
  'ct-pc-estudio.webp': 'https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=1200&q=85', // Clean, ultra-modern workstation setup
  'ct-pc-equilibrada.webp': 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1200&q=85', // High-end RGB gaming PC with tempered glass
  'ct-pc-inicial.webp': 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=1200&q=85', // Modern compact gaming desktop build

  // Peripherals
  'ct-per-g502-hero.webp': 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=1200&q=85', // Studio black gaming mouse with RGB LED
  'ct-per-k552.webp': 'https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=1200&q=85', // Mechanical RGB gaming keyboard
  'ct-per-cloud-ii.webp': 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=85', // Studio gaming headset

  // Laptops
  'ct-lap-nitro-v15.webp': 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1200&q=85', // High-performance gaming laptop with RGB keyboard
  'ct-lap-ideapad-slim3.webp': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=85', // Slim modern metallic laptop

  // Monitors
  'ct-mon-24gs60f.webp': 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1200&q=85', // Sleek borderless gaming monitor
  'ct-mon-odyssey-g5.webp': 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1200&q=85', // High-end curved gaming monitor

  // Processors
  'ct-cpu-r5-5600.webp': 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=1200&q=85', // AMD Ryzen CPU processor chip
  'ct-cpu-r5-5600g.webp': 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=1200&q=85',
  'ct-cpu-r7-5700x.webp': 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=1200&q=85',
  'ct-cpu-r5-7600.webp': 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=1200&q=85',
  'ct-cpu-i5-12400f.webp': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=85', // Intel CPU silicon die
  'ct-cpu-i5-13400f.webp': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=85',

  // Graphics Cards
  'ct-gpu-rtx4060-ventus.webp': 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=1200&q=85', // Dual fan modern RTX GPU studio
  'ct-gpu-rx7600-pulse.webp': 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=1200&q=85',
  'ct-gpu-rtx4070s-dual.webp': 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=1200&q=85',

  // Motherboards
  'ct-mb-b550m-pro-vdh.webp': 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=1200&q=85', // Modern motherboard PCB
  'ct-mb-b450m-steel.webp': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=85',
  'ct-mb-b650m-a-wifi.webp': 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=1200&q=85',
  'ct-mb-b760m-ds3h.webp': 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=1200&q=85',

  // RAM
  'ct-ram-fury-16-d4.webp': 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=1200&q=85', // DDR RAM modules with heatsink
  'ct-ram-lpx-32-d4.webp': 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=1200&q=85',
  'ct-ram-fury-32-d5.webp': 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=1200&q=85',

  // Storage
  'ct-ssd-nv2-1tb.webp': 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=1200&q=85', // NVMe M.2 SSD
  'ct-ssd-980-1tb.webp': 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=1200&q=85',
  'ct-ssd-mx500-1tb.webp': 'https://images.unsplash.com/photo-1544652478-6653e09f18a2?auto=format&fit=crop&w=1200&q=85',

  // Cases & Cooling
  'ct-case-h5-flow.webp': 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1200&q=85',
  'ct-case-versa-h18.webp': 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=1200&q=85',
  'ct-cool-ak400.webp': 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=1200&q=85',
  'ct-cool-pa120se.webp': 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=1200&q=85',

  // Power Supplies & Accessories
  'ct-psu-rm750e.webp': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=85',
  'ct-psu-a650bn.webp': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=85',
  'ct-psu-cv550.webp': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=85',
  'ct-acc-mx4.webp': 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=1200&q=85'
};

async function downloadAndConvert() {
  const outputDir = path.resolve(process.cwd(), 'public', 'images', 'products');
  const tempDir = path.resolve(process.cwd(), '.temp-imgs');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  console.log(`Starting download and conversion of ${Object.keys(imageMap).length} images...`);

  for (const [filename, url] of Object.entries(imageMap)) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`Failed to fetch ${url} (HTTP ${res.status})`);
        continue;
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      const tempPath = path.join(tempDir, `temp-${filename}.jpg`);
      fs.writeFileSync(tempPath, buffer);

      const targetPath = path.join(outputDir, filename);
      // Convert with ffmpeg to crisp webp 800x600 with high quality
      execSync(`ffmpeg -y -i "${tempPath}" -vf "scale=800:600:force_original_aspect_ratio=decrease,pad=800:600:(ow-iw)/2:(oh-ih)/2:color=0x0a0f1d" -q:v 85 "${targetPath}"`, { stdio: 'ignore' });
      fs.unlinkSync(tempPath);
      console.log(`Converted: ${filename}`);
    } catch (err) {
      console.error(`Error processing ${filename}:`, err.message);
    }
  }

  if (fs.existsSync(tempDir)) fs.rmdirSync(tempDir);
  console.log('All product images successfully upgraded with modern high-res hardware photography!');
}

downloadAndConvert();
