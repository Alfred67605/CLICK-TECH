# Resultados de Verificación Empírica — ClickTech

Fecha de validación: 2026-11-20  
Entorno local: Windows 11, Node.js, PostgreSQL 18.6 (`127.0.0.1:5544`), Next.js `16.4.6` (`--webpack`), Vitest `4.1.0`, Playwright Chromium (`1.65.1`).

---

## 1. Compilación, Tipado y Linter

| Verificación | Comando | Resultado | Detalle observado |
|---|---|---|---|
| TypeScript | `npx tsc --noEmit` | Exited `0` | Sin errores de tipos tras la última edición. |
| ESLint | `npm run lint` | Exited `0` | `0 errors`, `13 warnings` (`@next/next/no-img-element` por imágenes locales WebP sin optimizar en runtime). |
| Build de producción | `npm run build` (`next build --webpack`) | Exited `0` | Compilación completa de todas las rutas App Router y API (`✓ Compiled successfully in 5.6s`, `Finished TypeScript in 5.4s`). Los archivos fuente en `src/` no se modificaron después de este build. |

---

## 2. Pieza Audiovisual HyperFrames

- Proyecto: `brand-video/index.html` (8.0 s, 1920x1080, 30 fps, fuentes locales SIL OFL `Orbitron` y `Space Grotesk`, sin pistas de audio falsas).
- Validación CLI verificada en sesión:
  - `npx hyperframes lint`: `0 errors` (`5 warnings`).
  - `npx hyperframes check --json`: `ok: true`, `errorCount: 0`.
- Artefactos generados y verificados con `ffprobe`:
  - `public/media/brand/clicktech-brand.mp4` (`5,614,431` bytes, `8.000000` s)
  - `public/media/brand/clicktech-brand.webm` (`300,727` bytes, `8.000000` s)
  - `public/media/brand/clicktech-brand-poster.webp` y `public/media/brand/clicktech-brand-poster.jpg` (inspección visual OK).

---

## 3. Pruebas de Integración (Vitest + PostgreSQL real)

Comando: `npm run test:integration` (`vitest run`)  
Resultado tras última edición: **`1 passed (1)` archivo, `5 passed (5)` pruebas** en `tests/integration/business-rules.test.ts` (`291ms` tests / `703ms` total, exit `0`).

Cobertura verificada contra reglas de negocio reales:
1. Cálculo monetario en centavos exactos de Bolivianos (`Bs`) e integridad decimal.
2. Evaluación de compatibilidad PC: detección de socket incompatible, insuficiencia de potencia y estado `REQUIRES_REVIEW` cuando falta un dato técnico crítico (sin falsos verdes).
3. Restricción de roles para costos internos (`CUSTOMER` y `TECH` sin acceso a costos de compra/margen).
4. Maquina de estados e historial público/privado en órdenes de servicio técnico (`internalNotes` excluido de la vista cliente).
5. Generación de códigos de verificación y flujo de cotizaciones.

---

## 4. Pruebas End-to-End y Responsive en Navegador Real (Playwright)

Comando: `npx playwright test --reporter=list` contra `http://127.0.0.1:3000` (`next start`)  
Resultado tras última edición: **`6 passed (27.9s)`**, exit `0`:

1. **`1. Visitor filters catalog, compares 2 models, and cart persists across reload`** (`1.1s`)
   - Filtro por categoría `procesadores` en `/catalogo`, selección de 2 modelos hacia `/comparar`, agregado de producto en `almacenamiento` y recarga persistiendo `Abrir carrito (1 productos)` en base de datos, con 0 errores de consola.
2. **`2. Diego uses Arma tu PC to inspect incompatibility and missing-spec technical review`** (`444ms`)
   - Validación real en servidor desde `/arma-tu-pc` para estados `Incompatible` (`Socket incompatible`) y `Requiere revisión técnica`.
3. **`3. Checkout creates order on server, ignores tampered cart totals, and downloads receipt`** (`5.3s`)
   - Creación de pedido en `/checkout` con total recalculado en servidor (`Bs 75,00`, `PENDING_PAYMENT`, `UNPAID`) y envío de comprobante (`DEMO-E2E-123`) pasando a `PAYMENT_UNDER_REVIEW` / `PROOF_SUBMITTED`.
4. **`4. Customer RBAC blocks cross-customer access and Andrea approves technical quote`** (`1.2s`)
   - Bloqueo cruzado de cliente (`diego.demo` bloqueado en `ST-2026-DEMO-001` con `Acceso protegido`), acceso correcto para propietaria (`andrea.demo`) con línea de tiempo visible y nota interna técnica (`bisagra derecha`) oculta.
5. **`5. Responsive check across 360, 768, 1024, 1440px, images loaded, reduced motion`** (`16.4s`)
   - Rutas verificadas: `/`, `/catalogo`, `/arma-tu-pc`, `/servicios`, `/seguimiento`, `/empresas` en `360x800`, `768x1024`, `1024x768` y `1440x900`:
     - Cero desbordamiento horizontal (`scrollWidth <= window.innerWidth`).
     - Cero imágenes rotas (`naturalWidth === 0`).
     - Cero errores de consola.
   - Con `prefers-reduced-motion: reduce` en `/`, el reproductor Hero reemplaza el video por el póster estático (`ClickTech — Tecnología a tu medida (portada estática)`).
6. **`6. Admin RBAC protects /admin from customers and renders responsive admin panel for ADMIN`** (`2.5s`)
   - Acceso anónimo a `/admin` redirige a `/login`.
   - Cliente autenticado (`CUSTOMER`) redirigido fuera de `/admin` hacia `/cuenta`.
   - Administrador (`ADMIN`) accede a `/admin` (`Panel de Gestión`, `Operación ClickTech · Rol: ADMIN`) sin errores de consola ni desbordamiento en `1440x900` y `360x800`.

---

## 5. Inspección Visual de Capturas Generadas

Capturas inspeccionadas manualmente en `docs/screenshots/`:
- `home-desktop-1440.png` y `home-mobile-360.png`
- `catalogo-desktop-1440.png` y `catalogo-mobile-360.png`
- `arma-tu-pc-desktop-1440.png` y `arma-tu-pc-mobile-360.png`
- `servicios-desktop-1440.png` y `servicios-mobile-360.png` (se detectaron y reemplazaron 2 imágenes de fachadas en `srv-ensamblaje.webp` y `srv-laptop.webp` por fotografías reales de ensamblaje interno de PC y placa base/refrigeración de laptop abierta; re-verificadas tras nuevo Playwright).
- `seguimiento-desktop-1440.png`
- `empresas-desktop-1440.png`
- `admin-desktop-1440.png` y `admin-mobile-360.png`
