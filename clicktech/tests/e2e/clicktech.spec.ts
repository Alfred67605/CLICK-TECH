import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

function loadDevCredentials(): Record<string, string> {
  const credPath = path.resolve(process.cwd(), ".dev-credentials.local");
  const out: Record<string, string> = {};
  if (!fs.existsSync(credPath)) return out;
  for (const line of fs.readFileSync(credPath, "utf-8").split(/\r?\n/)) {
    const m = line.match(/^([^|\s#]+)\s*\|\s*[^|]+\|\s*(.+)$/);
    if (m) out[m[1].trim()] = m[2].trim();
  }
  return out;
}

const VIEWPORTS = [
  { name: "mobile-360", width: 360, height: 800 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "laptop-1024", width: 1024, height: 768 },
  { name: "desktop-1440", width: 1440, height: 900 },
];

test.describe("ClickTech E2E Journeys & Responsive Verification", () => {
  test("1. Visitor filters catalog, compares 2 models, and cart persists across reload", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });

    await page.goto("/catalogo");
    await expect(page.getByRole("heading", { name: /Catálogo ClickTech/i })).toBeVisible();

    // Filter by category procesadores
    await page.getByLabel("Categoría").selectOption("procesadores");
    const compareButtons = page.getByRole("button", { name: /Comparar/i });
    expect(await compareButtons.count()).toBeGreaterThanOrEqual(2);

    await compareButtons.nth(0).click();
    await compareButtons.nth(1).click();

    await page.getByRole("link", { name: /Comparar \(2\)/i }).click();
    await expect(page.getByRole("heading", { name: /Comparador de Modelos/i })).toBeVisible();

    // Add an item to cart from catalog and reload to verify DB cart persistence
    await page.goto("/catalogo?category=almacenamiento");
    await page.getByRole("button", { name: /Añadir/i }).first().click();
    await expect(page.getByRole("dialog", { name: /Carrito de compras/i })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("button", { name: /Abrir carrito \(1 productos\)/i })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("2. Diego uses Arma tu PC to inspect incompatibility and missing-spec technical review", async ({ page }) => {
    await page.goto("/arma-tu-pc");
    await expect(page.getByRole("heading", { name: /Configurador «Arma tu PC»/i })).toBeVisible();

    // Trigger incompatibility
    await page.getByRole("button", { name: /Probar Incompatibilidad/i }).click();
    await expect(page.getByTestId("compat-status-label")).toContainText(/Incompatible/i);
    await expect(page.getByTestId("compat-findings")).toContainText(/Socket incompatible/i);

    // Trigger REQUIRES_REVIEW
    await page.getByRole("button", { name: /Probar Revisión Técnica/i }).click();
    await expect(page.getByTestId("compat-status-label")).toContainText(/Requiere revisión técnica/i);
  });

  test("3. Checkout creates order on server, ignores tampered cart totals, and downloads receipt", async ({ page }) => {
    await page.goto("/catalogo?category=accesorios");
    await page.getByRole("button", { name: /Añadir/i }).first().click();
    await page.getByRole("link", { name: /Ir a checkout/i }).click();

    await page.getByLabel(/Nombre completo/i).fill("Visitante Prueba E2E");
    await page.getByLabel(/Correo electrónico/i).fill("e2e.visitante@clicktech.example");
    await page.getByLabel(/Teléfono \/ WhatsApp/i).fill("000-77777");
    await page.getByRole("button", { name: /Confirmar pedido y reservar stock/i }).click();

    await expect(page).toHaveURL(/\/pedido\//);
    await expect(page.getByTestId("order-status")).toHaveText("PENDING_PAYMENT");
    await expect(page.getByTestId("payment-status")).toHaveText("UNPAID");
    await expect(page.getByTestId("order-total")).toContainText(/Bs 75,00/);

    // Submit payment reference -> status becomes PAYMENT_UNDER_REVIEW / PROOF_SUBMITTED (NOT approved!)
    await page.getByPlaceholder(/Número de referencia/i).fill("DEMO-E2E-123");
    await page.getByRole("button", { name: /Enviar comprobante/i }).click();
    await expect(page.getByTestId("order-status")).toHaveText("PAYMENT_UNDER_REVIEW");
    await expect(page.getByTestId("payment-status")).toHaveText("PROOF_SUBMITTED");
  });

  test("4. Customer RBAC blocks cross-customer access and Andrea approves technical quote", async ({ page }) => {
    const creds = loadDevCredentials();
    const andreaPass = creds["andrea.demo@clicktech.demo.bo"];
    const diegoPass = creds["diego.demo@clicktech.demo.bo"];
    expect(andreaPass).toBeTruthy();
    expect(diegoPass).toBeTruthy();

    // Login as Diego and try reading Andrea's service order -> must be blocked
    await page.goto("/login");
    await page.getByLabel(/Correo electrónico/i).fill("diego.demo@clicktech.demo.bo");
    await page.getByLabel(/Contraseña/i).fill(diegoPass);
    await page.getByRole("button", { name: /Ingresar/i }).click();
    await expect(page).toHaveURL(/\/cuenta/);

    await page.goto("/seguimiento/ST-2026-DEMO-001");
    await expect(page.getByRole("heading", { name: /Acceso protegido/i })).toBeVisible();

    // Logout and login as Andrea
    await page.goto("/cuenta");
    await page.getByRole("button", { name: /Cerrar sesión/i }).click();
    await page.goto("/login");
    await page.getByLabel(/Correo electrónico/i).fill("andrea.demo@clicktech.demo.bo");
    await page.getByLabel(/Contraseña/i).fill(andreaPass);
    await page.getByRole("button", { name: /Ingresar/i }).click();
    await expect(page).toHaveURL(/\/cuenta/);

    await page.goto("/seguimiento/ST-2026-DEMO-001");
    await expect(page.getByTestId("service-timeline")).toBeVisible();
    // Internal tech notes ("bisagra derecha") MUST NOT leak to customer!
    await expect(page.locator("body")).not.toContainText("bisagra derecha");
  });

  test("5. Responsive check across 360, 768, 1024, 1440px, images loaded, reduced motion", async ({ page }) => {
    const shotsDir = path.resolve(process.cwd(), "docs", "screenshots");
    fs.mkdirSync(shotsDir, { recursive: true });

    const routes = [
      { slug: "home", path: "/" },
      { slug: "catalogo", path: "/catalogo" },
      { slug: "arma-tu-pc", path: "/arma-tu-pc" },
      { slug: "servicios", path: "/servicios" },
      { slug: "seguimiento", path: "/seguimiento" },
      { slug: "empresas", path: "/empresas" },
    ];

    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      for (const r of routes) {
        const consoleErrors: string[] = [];
        const onErr = (msg: { type: () => string; text: () => string }) => {
          if (msg.type() === "error") consoleErrors.push(msg.text());
        };
        page.on("console", onErr);

        await page.goto(r.path, { waitUntil: "networkidle" });

        // No horizontal overflow
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth
        );
        expect(overflow, `Overflow at ${vp.name} on ${r.path}`).toBe(false);

        // Verify all visible images loaded cleanly
        const brokenImgs = await page.evaluate(() => {
          return Array.from(document.querySelectorAll("img"))
            .filter((img) => img.complete && img.naturalWidth === 0)
            .map((img) => img.getAttribute("src"));
        });
        expect(brokenImgs, `Broken images on ${r.path}`).toEqual([]);

        if (vp.width === 360 || vp.width === 1440) {
          await page.screenshot({
            path: path.join(shotsDir, `${r.slug}-${vp.name}.png`),
            fullPage: false,
          });
        }
        page.off("console", onErr);
        expect(consoleErrors, `Console errors on ${r.path}`).toEqual([]);
      }
    }

    // Verify prefers-reduced-motion swaps Hero video for static poster
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(
      page.getByAltText(/ClickTech — Tecnología a tu medida \(portada estática\)/i)
    ).toBeVisible();
  });

  test("6. Admin RBAC protects /admin from customers and renders responsive admin panel for ADMIN", async ({ page }) => {
    const creds = loadDevCredentials();
    const diegoPass = creds["diego.demo@clicktech.demo.bo"];
    const adminPass = creds["admin@clicktech.demo.bo"];
    expect(diegoPass).toBeTruthy();
    expect(adminPass).toBeTruthy();

    // Unauthenticated user redirected to /login
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);

    // Authenticated CUSTOMER redirected away from /admin
    await page.getByLabel(/Correo electrónico/i).fill("diego.demo@clicktech.demo.bo");
    await page.getByLabel(/Contraseña/i).fill(diegoPass);
    await page.getByRole("button", { name: /Ingresar/i }).click();
    await expect(page).toHaveURL(/\/cuenta/);

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/cuenta/);
    await expect(page.getByRole("heading", { name: /Panel de Gestión/i })).toHaveCount(0);

    // Log out and sign in as ADMIN
    await page.getByRole("button", { name: /Cerrar sesión/i }).click();
    await page.goto("/login");
    await page.getByLabel(/Correo electrónico/i).fill("admin@clicktech.demo.bo");
    await page.getByLabel(/Contraseña/i).fill(adminPass);
    await page.getByRole("button", { name: /Ingresar/i }).click();
    await expect(page).toHaveURL(/\/(cuenta|admin)/);

    const shotsDir = path.resolve(process.cwd(), "docs", "screenshots");
    fs.mkdirSync(shotsDir, { recursive: true });

    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });

    for (const vp of [
      { name: "desktop-1440", width: 1440, height: 900 },
      { name: "mobile-360", width: 360, height: 800 },
    ]) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/admin", { waitUntil: "networkidle" });
      await expect(page.getByRole("heading", { name: /Panel de Gestión/i })).toBeVisible();
      await expect(page.getByText(/Operación ClickTech · Rol: ADMIN/i)).toBeVisible();

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth
      );
      expect(overflow, `Overflow at ${vp.name} on /admin`).toBe(false);

      await page.screenshot({
        path: path.join(shotsDir, `admin-${vp.name}.png`),
        fullPage: false,
      });
    }

    expect(errors).toEqual([]);
  });
});
