const fs = require('fs');
const { execSync } = require('child_process');

const heroes = {
  'hero-1.webp': 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1200&q=85',
  'hero-2.webp': 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=1200&q=85',
  'hero-3.webp': 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=85'
};

async function run() {
  for (const [k, u] of Object.entries(heroes)) {
    const res = await fetch(u);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync('temp.jpg', buf);
    execSync(`ffmpeg -y -i temp.jpg -vf "scale=1200:800:force_original_aspect_ratio=decrease" -q:v 85 "public/images/hero/${k}"`, { stdio: 'ignore' });
    if (fs.existsSync('temp.jpg')) fs.unlinkSync('temp.jpg');
    console.log('Upgraded hero image:', k);
  }
}

run();
