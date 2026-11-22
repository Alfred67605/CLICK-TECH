# CLICK-TECH — Plataforma Digital de Hardware y Servicios Técnicos

> **ClickTech Potosí, Bolivia:** Solución integral de comercio electrónico de hardware de alta gama, configurador interactivo con validación estricta de compatibilidad pieza por pieza, calculador de cobertura con Google Maps, servicio técnico especializado y protocolo de despacho antifraude nacional.

---

## 🚀 Resumen del Proyecto

**CLICK-TECH** es una plataforma web desarrollada para transformar la experiencia de compra de computación, armado de equipos y soporte técnico en Potosí y a nivel nacional en Bolivia:

1. **Catálogo de Hardware en Bolivianos (Bs):**
   - Precios claros, stock en tiempo real y especificaciones técnicas verificadas.
   - Rejilla adaptativa completa (hasta 1720px y 5 columnas en monitores anchos).
   - Fotografías reales y modernas en alta resolución.
2. **Configurador Inteligente «Arma tu PC»:**
   - Detección automática de compatibilidad física y eléctrica (Socket AM4/AM5/LGA1700, RAM DDR4 vs DDR5 en placas A520M/B550M, potencia de fuente y espacio en gabinete).
3. **Ficha de Compatibilidad Directa:**
   - En cada producto se detalla de forma concisa y sin redundancias con qué placas y componentes funciona, advirtiendo incompatibilidades críticas (ej. incompatibilidad de DDR4 en ranuras DDR5).
4. **Calculador de Rutas y Mantenimiento en Potosí (Google Maps):**
   - Cobertura geolocalizada por zonas (Centro, Zona Alta, Plan 40, Ciudad Satélite/Cantumarca).
   - **Beneficio Exclusivo:** Clientes que compraron o armaron su PC en ClickTech tienen **visita y atención técnica 100% GRATUITA (Bs 0)**.
   - Clientes externos («Cliente X») reciben un desglose transparente del costo de traslado según la distancia y tiempo estimado.
5. **Chatbot Asistente Flotante (*ClickTech Assistant*):**
   - Diseño moderno gamer-tech con estética neón cian/púrpura y efecto glassmorphism.
   - Píldoras de preguntas rápidas y derivación directa a WhatsApp.
6. **Integración con WhatsApp Oficial (+591 67605477):**
   - Enlace directo a WhatsApp en barra superior, botón principal, fichas de producto, cálculo de rutas y soporte.
7. **Checkout con Despacho Antifraude y Cobertura Nacional:**
   - Verificación de identidad obligatoria (CI / NIT) y confirmación telefónica para evitar estafas.
   - Cobertura de envíos a los 9 departamentos de Bolivia (La Paz, Santa Cruz, Cochabamba, Sucre, Oruro, Tarija, Beni, Pando y Provincias de Potosí) vía encomienda terrestre precintada o courier.

---

## 📁 Estructura del Repositorio

```text
CLICK-TECH/
├── clicktech/                      # Aplicación Web Next.js 16 + TypeScript
│   ├── src/
│   │   ├── app/                    # App Router (Páginas y API Routes)
│   │   ├── components/             # Componentes modulares (UI, Maps, Chat, Builder, Catalog)
│   │   └── lib/                    # Lógica de dominio, Prisma Client, auth y validaciones
│   ├── prisma/                     # Modelos de base de datos relacional y scripts de Seed
│   ├── public/                     # Assets públicos e imágenes de productos en WebP
│   └── tests/                      # Suite de pruebas automatizadas E2E con Playwright
├── Documentacion/                  # Documentación académica, informes y manuales del proyecto
├── Storytelling/                   # Video comercial y material audiovisual de marca
├── ClickTech_Prompt_Maestro_Antigravity.md # Documento de especificación arquitectónica
└── README.md                       # Documentación principal
```

---

## 🛠️ Stack Tecnológico

- **Framework Web:** [Next.js](https://nextjs.org/) (App Router, Server Components y Server Actions)
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/)
- **Estilos y Diseño:** [Tailwind CSS](https://tailwindcss.com/) + Neumorfismo Gamer Dark Mode
- **Iconografía:** [Lucide React](https://lucide.dev/)
- **Base de Datos:** [PostgreSQL](https://www.postgresql.org/) gestionado con [Prisma ORM](https://www.prisma.io/)
- **Pruebas Automatizadas:** [Playwright](https://playwright.dev/) (End-to-End en navegador real Chromium)
- **Mapas:** Google Maps Embed API adaptado a Potosí, Bolivia (-19.5836, -65.7531)

---

## ⚙️ Puesta en Marcha Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/Alfred67605/CLICK-TECH.git
cd CLICK-TECH/clicktech
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea tu archivo `.env` basado en `.env.example`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5544/clicktech?schema=public"
NEXTAUTH_SECRET="tu-secreto-seguro"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Ejecutar migraciones y poblar datos iniciales
```bash
npx prisma migrate dev
npm run prisma:seed
```

### 5. Iniciar en modo desarrollo o producción
```bash
# Modo Desarrollo
npm run dev

# Modo Producción
npm run build
npm run start
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la plataforma en funcionamiento.

---

## 🧪 Pruebas Automatizadas (Playwright)

Para validar todas las funcionalidades clave (pantalla completa, compatibilidad, calculador de mapas, chatbot y checkout antifraude):
```bash
npx playwright test tests/e2e/user-requirements.spec.ts
```

---

## 📞 Contacto y Soporte

- **Ubicación:** Potosí, Bolivia
- **WhatsApp Oficial:** [+591 67605477](https://wa.me/59167605477)
- **Atención:** Hardware garantizado, ensamblaje personalizado y soporte técnico.
