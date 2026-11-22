const { chromium } = require('playwright');

async function snap() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto('http://localhost:3000/catalogo?category=memorias-ram', { waitUntil: 'networkidle' });
  await page.evaluate(() => window.scrollBy(0, 320));
  await page.waitForTimeout(500);
  const outPath = 'C:/Users/llano/.gemini/antigravity/brain/e806ba45-72c6-4e4b-b33a-cc0b7adf25d7/catalogo-ram-scroll.png';
  await page.screenshot({ path: outPath });
  console.log('RAM scroll screenshot saved to:', outPath);
  await browser.close();
}

snap().catch(console.error);
