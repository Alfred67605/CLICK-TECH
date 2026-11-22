const { chromium } = require('playwright');

async function snap() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  
  // 1. Catalog wide screenshot
  const pageCat = await context.newPage();
  await pageCat.goto('http://localhost:3000/catalogo', { waitUntil: 'networkidle' });
  await pageCat.waitForTimeout(600);
  const catPath = 'C:/Users/llano/.gemini/antigravity/brain/e806ba45-72c6-4e4b-b33a-cc0b7adf25d7/catalogo-wide-1920.png';
  await pageCat.screenshot({ path: catPath });
  console.log('Saved catalog wide screenshot to:', catPath);

  // 2. Services wide screenshot
  const pageSrv = await context.newPage();
  await pageSrv.goto('http://localhost:3000/servicios', { waitUntil: 'networkidle' });
  await pageSrv.waitForTimeout(600);
  const srvPath = 'C:/Users/llano/.gemini/antigravity/brain/e806ba45-72c6-4e4b-b33a-cc0b7adf25d7/servicios-wide-1920.png';
  await pageSrv.screenshot({ path: srvPath });
  console.log('Saved services wide screenshot to:', srvPath);

  await browser.close();
}

snap().catch(console.error);
