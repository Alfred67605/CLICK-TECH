import { writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

const targets = [
  {
    name: 'ct-pc-estudio.webp',
    url: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=1200&q=85&fit=crop'
  },
  {
    name: 'ct-pc-inicial.webp',
    url: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=1200&q=85&fit=crop'
  },
  {
    name: 'ct-pc-equilibrada.webp',
    url: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=1200&q=85&fit=crop'
  },
  {
    name: 'ct-lap-ideapad-slim3.webp',
    url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=1200&q=85&fit=crop'
  },
  {
    name: 'ct-per-k552.webp',
    url: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=1200&q=85&fit=crop'
  },
  {
    name: 'ct-ram-fury-32-d5.webp',
    url: 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=1200&q=85&fit=crop'
  }
];

const dir = resolve(process.cwd(), 'public/images/products');

async function run() {
  for (const item of targets) {
    console.log(`Fetching ${item.name}...`);
    try {
      const res = await fetch(item.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      if (!res.ok) {
        console.warn(`HTTP ${res.status} for ${item.url}`);
        continue;
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      const tempPath = resolve(dir, `temp_${item.name}.jpg`);
      writeFileSync(tempPath, buffer);
      const outPath = resolve(dir, item.name);
      execSync(`ffmpeg -y -i "${tempPath}" -vf "scale=800:800:force_original_aspect_ratio=decrease,pad=800:800:(ow-iw)/2:(oh-ih)/2:color=0x0b1120" -quality 85 "${outPath}"`);
      if (existsSync(tempPath)) unlinkSync(tempPath);
      console.log(`Successfully converted ${item.name}`);
    } catch (err) {
      console.error(`Error on ${item.name}:`, err.message);
    }
  }
}

run();
