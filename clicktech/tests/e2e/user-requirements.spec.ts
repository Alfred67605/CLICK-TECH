import { test, expect } from '@playwright/test';

test.describe('ClickTech Complete User Requirements Verification', () => {
  test('1. Catalog wide screen layout, 5-column grid and modern hardware photos', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000/catalogo', { waitUntil: 'networkidle' });

    // Verify WhatsApp number in top bar
    const whatsappTop = page.locator('header a[href*="wa.me/59167605477"]');
    await expect(whatsappTop.first()).toBeVisible();

    // Verify container uses expanded max width (.ct-container)
    const container = page.locator('.ct-container').first();
    await expect(container).toBeVisible();

    // Check product cards have high-res modern images
    const pcEstudioImg = page.locator('img[src*="ct-pc-estudio.webp"]').first();
    await expect(pcEstudioImg).toBeVisible();

    const pcGamerImg = page.locator('img[src*="ct-pc-equilibrada.webp"]').first();
    await expect(pcGamerImg).toBeVisible();

    // Take catalog screenshot
    await page.screenshot({ path: 'test-results/catalog-widescreen-1440.png', fullPage: false });
  });

  test('2. Product detail direct compatibility section & WhatsApp direct contact', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    // Go to Kingston Fury Beast DDR4 product
    await page.goto('http://localhost:3000/producto/kingston-fury-beast-16gb-ddr4', { waitUntil: 'networkidle' });

    // Verify Direct Compatibility block
    const compatSection = page.locator('text=Compatibilidad Directa — ¿Con qué funciona este componente?');
    await expect(compatSection).toBeVisible();

    // Verify AM4 / A520 / B550 mention
    const compatText = page.locator('text=ASUS A520M');
    await expect(compatText.first()).toBeVisible();

    // Verify WhatsApp direct consultation button
    const waBtn = page.locator('a[href*="wa.me/59167605477"]').first();
    await expect(waBtn).toBeVisible();

    await page.screenshot({ path: 'test-results/product-compatibility-ddr4.png', fullPage: false });
  });

  test('3. Home page: Google Maps Potosí Route Calculator with Bs 0 Free Maintenance', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000/#calculador-potosi', { waitUntil: 'networkidle' });

    // Verify Potosí Route Calculator header
    const calcHeader = page.locator('text=Calculador de Ruta y Mantenimiento en Potosí');
    await expect(calcHeader).toBeVisible();

    // Verify Google Maps iframe
    const mapsFrame = page.locator('iframe[title="Mapa de cobertura ClickTech en Potosí, Bolivia"]');
    await expect(mapsFrame).toBeVisible();

    // Verify GRATIS (Bs 0) for ClickTech PC buyers
    const freeBadge = page.locator('text=GRATIS (Bs 0)');
    await expect(freeBadge.first()).toBeVisible();

    // Switch to Cliente General (external)
    await page.click('text=Cliente General');
    await expect(page.locator('text=Bs 15').first()).toBeVisible();

    await page.screenshot({ path: 'test-results/potosi-maps-calculator.png', fullPage: false });
  });

  test('4. Floating Elegant Chatbot Widget interaction', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });

    // Trigger chatbot
    const chatBtn = page.locator('button[aria-label="Abrir asistente ClickTech"]');
    await expect(chatBtn).toBeVisible();
    await chatBtn.click();

    // Verify chatbot dialog opened
    const chatDialog = page.locator('div[role="dialog"][aria-label="Asistente Virtual ClickTech"]');
    await expect(chatDialog).toBeVisible();

    // Click quick chip about DDR4 compatibility
    const chip = page.locator('button:has-text("Compatibilidad RAM DDR4")');
    await chip.click();

    // Verify bot response appears
    await expect(page.locator('text=ASUS A520M').first()).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: 'test-results/chatbot-neon-dialog.png', fullPage: false });
  });

  test('5. Checkout: Anti-Fraud Form and National Bolivia Shipping', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000/catalogo', { waitUntil: 'networkidle' });

    // Add first available product to cart and wait for cart API response
    const cartPromise = page.waitForResponse((res) => res.url().includes('/api/cart') && res.status() === 200);
    const addBtn = page.locator('button:has-text("Añadir")').first();
    await addBtn.click();
    await cartPromise;

    // Go to checkout
    await page.goto('http://localhost:3000/checkout', { waitUntil: 'networkidle' });

    // Verify Anti-Fraud form fields (CI / NIT)
    const ciField = page.locator('input#chk-ci');
    await expect(ciField).toBeVisible();

    const antiFraudBanner = page.locator('text=Protocolo de Seguridad y Despacho Antifraude');
    await expect(antiFraudBanner).toBeVisible();

    // Select national shipping option
    const nationalRadio = page.locator('input[value="DELIVERY_QUOTE_REQUESTED"]');
    await nationalRadio.check();

    const deptSelect = page.locator('select#chk-national-dept');
    await expect(deptSelect).toBeVisible();

    await page.screenshot({ path: 'test-results/checkout-antifraud-national.png', fullPage: false });
  });
});
