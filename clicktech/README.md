# ClickTech — Tienda Tecnológica, Configurador de PC y Servicio Técnico (Potosí, Bolivia)

Aplicación web full stack para **ClickTech** (*«Tecnología a tu medida»*), diseñada e implementada con comercio electrónico, asesoría por presupuesto, configurador de compatibilidad **«Arma tu PC»**, gestión de servicios técnicos en 10 etapas, cuentas de cliente y panel administrativo multirol.

> **Aviso de entorno de demostración:** Los precios en Bolivianos (**Bs**), costos internos, existencias, cuentas de usuario y movimientos precargados por el seed son **datos ficticios de demostración**. No representan cotizaciones comerciales vigentes ni ventas históricas reales.

---

## Stack y Versiones Verificadas

- **Runtime:** Node.js `v24.21.0` · npm `11.19.0`
- **Framework:** Next.js `16.4.6` (App Router + Webpack) · React `19.3.0` · TypeScript `5`
- **Estilos e iconos:** Tailwind CSS `4.3.3` (`@tailwindcss/postcss`) · `lucide-react` `1.77.0`
- **Base de datos y ORM:** PostgreSQL `18.6` · Prisma `6.19.3` (`@prisma/client`)
- **Validación y seguridad:** Zod `4.3.5` · `bcryptjs` `3.0.3` · `jose` `6.2.18`
- **Pieza audiovisual de marca:** HyperFrames `0.9.72` + FFmpeg
- **Pruebas:** Vitest `4.1.0` (integración/concurrencia) · Playwright `@playwright/test` `1.65.1` (E2E y responsive)

---

## Inicio Rápido desde Cero

1. **Variables de entorno:**
   Copia `.env.example` a `.env` y completa `DATABASE_URL` y `AUTH_SECRET`:
   ```powershell
   Copy-Item .env.example .env
   ```

2. **Base de datos PostgreSQL local (puerto 5544 en entorno local del proyecto):**
   ```powershell
   & "C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" -D ".\.pgdata" -o "-p 5544" -l ".\.pgdata\server.log" start
   ```

3. **Instalación de dependencias y migraciones:**
   ```powershell
   npm install
   npx prisma generate
   npx prisma migrate deploy
   npm run db:seed
   ```
   > El comando `npm run db:seed` crea 6 cuentas de demostración con contraseñas aleatorias y guarda los accesos en el archivo local gitignored `.dev-credentials.local`.

4. **Ejecución en desarrollo o producción:**
   ```powershell
   npm run build
   npm run start
   ```
   Abre `http://localhost:3000`.

---

## Scripts Disponibles

| Comando | Propósito |
| --- | --- |
| `npm run dev` | Inicia Next.js en modo desarrollo (`--webpack`) |
| `npm run build` | Compilación de producción (`next build --webpack`) |
| `npm run start` | Sirve el build de producción en puerto 3000 |
| `npm run db:seed` | Ejecuta el seed idempotente (`prisma/seed.ts`) |
| `npm run test:integration` | Pruebas de integración y concurrencia en PostgreSQL (`vitest run`) |
| `npm run test:e2e` | Pruebas E2E, RBAC y responsive (`playwright test`) |
| `npx tsc --noEmit` | Comprobación estricta de tipos TypeScript |

---

## Cómo Retirar el Seed de Demostración antes de Operar con Datos Reales

1. Conecta el cliente SQL o un script administrativo y elimina únicamente los registros de demostración (`email` terminados en `@clicktech.demo.bo`, pedidos `CT-2026-DEMO-*`, órdenes técnicas `ST-2026-DEMO-*` y cotizaciones `COT-*-DEMO-*`) **antes** o de forma selectiva por patrón, conservando categorías, marcas, zonas y productos reales ya editados.
2. Cambia `DEMO_MODE="false"` en `.env`, borra `.dev-credentials.local` y actualiza las contraseñas del administrador, ventas y técnico desde un entorno limpio.
3. Completa los campos pendientes en **Admin → Configuración** y revisa `docs/PENDING_BUSINESS_DATA.md`.

---

## Copia de Seguridad (Base de Datos y Archivos Privados)

Los comprobantes de pago y fotos de servicio se almacenan fuera de `/public` en `PRIVATE_STORAGE_DIR` (`./storage/private`). Un respaldo completo requiere ambos:

```powershell
# 1. Respaldo lógico de PostgreSQL
& "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" -h 127.0.0.1 -p 5544 -U postgres -Fc clicktech -f "backup-clicktech-$(Get-Date -Format yyyyMMdd-HHmm).dump"

# 2. Respaldo de archivos privados subidos por clientes
Compress-Archive -Path ".\storage\private" -DestinationPath "backup-private-files-$(Get-Date -Format yyyyMMdd-HHmm).zip"
```

---

## Integraciones Pendientes para Entorno Real

- **WhatsApp Business:** Configurar `WHATSAPP_NUMBER` en `.env` o desde **Admin → Configuración** para habilitar enlaces directos con contexto.
- **Correo electrónico (SMTP):** Configurar `SMTP_ADAPTER="smtp"` y credenciales `SMTP_*` en `.env` (actualmente usa `local-dev-log`).
- **Cobros y Facturación:** Los pagos funcionan con revisión manual de comprobantes. Una pasarela automática o facturación fiscal SIN requiere adaptador específico y NIT real.

---

## Documentación del Proyecto

- [DESIGN.md](DESIGN.md) — Sistema visual, decisiones de diseño y pieza HyperFrames
- [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) — Trazabilidad documental y criterios de aceptación
- [docs/DATA_MODEL.md](docs/DATA_MODEL.md) — Modelo relacional, reglas monetarias y reservas
- [docs/ASSETS.md](docs/ASSETS.md) — Registro completo de logotipos, fuentes y fotografías reales
- [docs/PENDING_BUSINESS_DATA.md](docs/PENDING_BUSINESS_DATA.md) — Campos comerciales pendientes de definición real
- [docs/SKILLS_USAGE.md](docs/SKILLS_USAGE.md) — Registro verificable de skills aplicadas
- [docs/GUIDES.md](docs/GUIDES.md) — Guías operativas (Cliente, Ventas/Admin y Técnico)
- [docs/TEST_RESULTS.md](docs/TEST_RESULTS.md) — Evidencia empírica de pruebas ejecutadas
