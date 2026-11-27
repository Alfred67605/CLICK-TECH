import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { PrismaClient, type ComponentType, type Role } from "@prisma/client";

const prisma = new PrismaClient();

interface ManifestImage {
  file: string;
  alt: string;
  exact: boolean;
  title: string;
  author: string;
  license: string;
  licenseUrl: string;
  sourceUrl: string;
}

interface ImageManifest {
  products: Record<string, ManifestImage[]>;
  categories: Record<string, ManifestImage>;
  hero: ManifestImage[];
  services: ManifestImage[];
}

function generateStrongDemoPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";
  const bytes = crypto.randomBytes(14);
  let out = "Ct!";
  for (let i = 0; i < 11; i++) {
    out += chars[bytes[i] % chars.length];
  }
  return out;
}

async function main() {
  const manifestPath = path.resolve(process.cwd(), "prisma", "seed-data", "images.json");
  const manifest: ImageManifest = JSON.parse(
    fs.readFileSync(manifestPath, "utf-8").replace(/^\uFEFF/, "")
  );

  console.log("Seeding ClickTech demo database (Potosí, Bolivia)...");

  // 1. Users & Role Accounts (never hardcode one universal password in source)
  const devCredPath = path.resolve(process.cwd(), ".dev-credentials.local");
  const roleSeeds: Array<{
    email: string;
    name: string;
    phone: string;
    role: Role;
    envVar: string;
  }> = [
    {
      email: "admin@clicktech.demo.bo",
      name: "Carlos Mendoza (Admin Demo)",
      phone: "000-00001",
      role: "ADMIN",
      envVar: "DEMO_ADMIN_PASS",
    },
    {
      email: "ventas@clicktech.demo.bo",
      name: "Lucía Quispe (Ventas Demo)",
      phone: "000-00002",
      role: "SALES",
      envVar: "DEMO_SALES_PASS",
    },
    {
      email: "tecnico@clicktech.demo.bo",
      name: "Marco Mamani (Técnico Demo)",
      phone: "000-00003",
      role: "TECH",
      envVar: "DEMO_TECH_PASS",
    },
    {
      email: "cliente@clicktech.demo.bo",
      name: "Cliente Demo Potosí",
      phone: "000-00004",
      role: "CUSTOMER",
      envVar: "DEMO_CUSTOMER_PASS",
    },
    {
      email: "diego.demo@clicktech.demo.bo",
      name: "Diego (Perfil Hipotético Gamer)",
      phone: "000-00005",
      role: "CUSTOMER",
      envVar: "DEMO_DIEGO_PASS",
    },
    {
      email: "andrea.demo@clicktech.demo.bo",
      name: "Andrea (Perfil Hipotético Estudio/Trabajo)",
      phone: "000-00006",
      role: "CUSTOMER",
      envVar: "DEMO_ANDREA_PASS",
    },
  ];

  // Reuse existing .dev-credentials.local passwords if already generated on previous seed
  const savedPasswords = new Map<string, string>();
  if (fs.existsSync(devCredPath)) {
    const lines = fs.readFileSync(devCredPath, "utf-8").split(/\r?\n/);
    for (const line of lines) {
      const m = line.match(/^([^|\s]+)\s*\|\s*[^|]+\|\s*(.+)$/);
      if (m) savedPasswords.set(m[1].trim(), m[2].trim());
    }
  }

  const credLines = [
    "# CREDENCIALES LOCALES DE DEMOSTRACIÓN CLICKTECH (EXCLUIDO DE GIT)",
    "# Cambia estas contraseñas antes de cualquier despliegue real.",
    "# Formato: email | rol | contraseña",
  ];

  const usersByEmail = new Map<string, { id: string; email: string; name: string; role: Role }>();

  for (const r of roleSeeds) {
    const plainPassword =
      process.env[r.envVar]?.trim() ||
      savedPasswords.get(r.email) ||
      generateStrongDemoPassword();
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const user = await prisma.user.upsert({
      where: { email: r.email },
      update: { name: r.name, role: r.role, passwordHash, isActive: true },
      create: {
        email: r.email,
        name: r.name,
        phone: r.phone,
        role: r.role,
        passwordHash,
        isActive: true,
        mustChangePassword: true,
      },
    });
    usersByEmail.set(r.email, user);
    credLines.push(`${r.email} | ${r.role} | ${plainPassword}`);
  }
  fs.writeFileSync(devCredPath, credLines.join("\n") + "\n", "utf-8");

  const adminUser = usersByEmail.get("admin@clicktech.demo.bo")!;
  const techUser = usersByEmail.get("tecnico@clicktech.demo.bo")!;
  const diegoUser = usersByEmail.get("diego.demo@clicktech.demo.bo")!;
  const andreaUser = usersByEmail.get("andrea.demo@clicktech.demo.bo")!;
  const customerUser = usersByEmail.get("cliente@clicktech.demo.bo")!;

  // Customer profiles & addresses
  for (const u of [customerUser, diegoUser, andreaUser]) {
    await prisma.customerProfile.upsert({
      where: { userId: u.id },
      update: {},
      create: {
        userId: u.id,
        notes: "Perfil ficticio de demostración para evaluación funcional en Potosí.",
      },
    });
  }

  // 2. Delivery Zones in Potosí
  const zones = [
    {
      slug: "potosi-centro",
      name: "Centro Histórico / Zona Central (Potosí)",
      city: "Potosí",
      feeCents: 1500, // Bs 15,00 (demo tarifa referencial)
      isAvailable: true,
      isPendingRealData: true,
      estimatedSchedule: "Coordinación el mismo día o siguiente día hábil",
    },
    {
      slug: "potosi-satelite-san-clemente",
      name: "Ciudad Satélite / San Clemente / Las Delicias",
      city: "Potosí",
      feeCents: 2000, // Bs 20,00 (demo)
      isAvailable: true,
      isPendingRealData: true,
      estimatedSchedule: "Coordinación en ventana de 24 horas",
    },
    {
      slug: "otras-zonas-cotizacion",
      name: "Otras zonas / Municipios cercanos (Tarifa por cotizar)",
      city: "Potosí y alrededores",
      feeCents: null,
      isAvailable: true,
      isPendingRealData: true,
      estimatedSchedule: "Sujeto a coordinación y tarifa de transporte",
    },
  ];
  for (const z of zones) {
    await prisma.deliveryZone.upsert({
      where: { slug: z.slug },
      update: z,
      create: z,
    });
  }

  // 3. Categories (13)
  const categoryDefs = [
    { slug: "pcs-armadas", name: "PCs Armadas", description: "Equipos ensamblados y testeados según uso y presupuesto.", sortOrder: 1 },
    { slug: "laptops", name: "Laptops", description: "Portátiles para gaming, estudio universitario y trabajo profesional.", sortOrder: 2 },
    { slug: "procesadores", name: "Procesadores", description: "CPUs AMD Ryzen e Intel Core de escritorio.", sortOrder: 3 },
    { slug: "placas-madre", name: "Placas Madre", description: "Motherboards AM4, AM5 y LGA1700 con chipset verificado.", sortOrder: 4 },
    { slug: "memorias-ram", name: "Memorias RAM", description: "Kits DDR4 y DDR5 de doble canal para rendimiento estable.", sortOrder: 5 },
    { slug: "tarjetas-graficas", name: "Tarjetas Gráficas", description: "GPUs NVIDIA GeForce RTX y AMD Radeon RX.", sortOrder: 6 },
    { slug: "almacenamiento", name: "Almacenamiento", description: "Unidades SSD M.2 NVMe y SATA de alta confiabilidad.", sortOrder: 7 },
    { slug: "fuentes", name: "Fuentes de Poder", description: "Fuentes certificadas 80 Plus con protecciones eléctricas.", sortOrder: 8 },
    { slug: "gabinetes", name: "Gabinetes", description: "Chasis con flujo de aire optimizado y compatibilidad declarada.", sortOrder: 9 },
    { slug: "refrigeracion", name: "Refrigeración", description: "Disipadores torre por aire para estabilidad térmica.", sortOrder: 10 },
    { slug: "monitores", name: "Monitores", description: "Pantallas de alta tasa de refresco y precisión visual.", sortOrder: 11 },
    { slug: "perifericos", name: "Periféricos", description: "Mouse gamer, teclados mecánicos y audífonos.", sortOrder: 12 },
    { slug: "accesorios", name: "Accesorios", description: "Pastas térmicas, cables y mantenimiento.", sortOrder: 13 },
  ];

  const categoriesBySlug = new Map<string, string>();
  for (const c of categoryDefs) {
    const img = manifest.categories[c.slug]?.file ?? null;
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description, imageUrl: img, sortOrder: c.sortOrder },
      create: { ...c, imageUrl: img },
    });
    categoriesBySlug.set(c.slug, cat.id);
  }

  // 4. Brands
  const brandNames = [
    "AMD",
    "Intel",
    "MSI",
    "ASRock",
    "ASUS",
    "Gigabyte",
    "Kingston",
    "Corsair",
    "Sapphire",
    "Samsung",
    "Crucial",
    "Thermaltake",
    "NZXT",
    "DeepCool",
    "Thermalright",
    "Acer",
    "Lenovo",
    "LG",
    "Logitech",
    "Redragon",
    "HyperX",
    "ARCTIC",
    "ClickTech",
    "HP",
    "AOC",
    "WD",
    "Razer",
  ];
  const brandsByName = new Map<string, string>();
  for (const bName of brandNames) {
    const slug = bName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const brand = await prisma.brand.upsert({
      where: { slug },
      update: { name: bName },
      create: { slug, name: bName },
    });
    brandsByName.set(bName, brand.id);
  }

  // 5. Products (37 real SKUs + Prebuilt PCs)
  interface ProductSeed {
    sku: string;
    slug: string;
    name: string;
    model: string;
    categorySlug: string;
    brandName: string;
    description: string;
    shortSpecs: Record<string, string>;
    costCents: number;
    priceCents: number;
    promoPriceCents?: number;
    promoLabel?: string;
    stockOnHand: number;
    minStockAlert: number;
    warrantyMonths: number | null;
    warrantyTerms: string;
    isFeatured?: boolean;
    isPrebuiltPc?: boolean;
    prebuiltTier?: string;
    compat: {
      componentType: ComponentType;
      socket?: string;
      chipset?: string;
      biosVersionRequired?: string;
      ramGeneration?: string;
      ramSlots?: number;
      ramModulesCount?: number;
      ramCapacityGb?: number;
      maxRamGb?: number;
      formFactor?: string;
      supportedFormFactors?: string[];
      tdpWatts?: number;
      recommendedPsuWatts?: number;
      psuWatts?: number;
      pcie8PinConnectors?: number;
      pcie12Vhpwr?: boolean;
      gpuLengthMm?: number;
      caseMaxGpuLengthMm?: number | null;
      coolerHeightMm?: number;
      caseMaxCoolerHeightMm?: number;
      supportedSockets?: string[];
      m2Slots?: number;
      sataPorts?: number;
      storageInterface?: string;
      hasIntegratedGraphics?: boolean;
    };
  }

  const productsSeed: ProductSeed[] = [
    // CPUs (6)
    {
      sku: "CT-CPU-R5-5600",
      slug: "amd-ryzen-5-5600",
      name: "Procesador AMD Ryzen 5 5600",
      model: "Ryzen 5 5600",
      categorySlug: "procesadores",
      brandName: "AMD",
      description: "6 núcleos / 12 hilos hasta 4.4 GHz para gaming en 1080p y multitarea eficiente en plataforma AM4. Requiere tarjeta gráfica dedicada.",
      shortSpecs: { Núcleos: "6 / 12 hilos", Reloj: "3.5 - 4.4 GHz", Socket: "AM4", Caché: "32 MB L3", TDP: "65 W", Gráficos: "Sin gráficos integrados" },
      costCents: 89000,
      priceCents: 109000,
      stockOnHand: 6,
      minStockAlert: 2,
      warrantyMonths: 12,
      warrantyTerms: "Garantía demo de 12 meses contra defectos de fábrica con sello y caja original.",
      isFeatured: true,
      compat: { componentType: "CPU", socket: "AM4", tdpWatts: 65, hasIntegratedGraphics: false },
    },
    {
      sku: "CT-CPU-R5-5600G",
      slug: "amd-ryzen-5-5600g",
      name: "Procesador AMD Ryzen 5 5600G",
      model: "Ryzen 5 5600G",
      categorySlug: "procesadores",
      brandName: "AMD",
      description: "6 núcleos / 12 hilos con gráficos integrados Radeon Vega 7. Ideal para armar una PC funcional sin GPU dedicada inicial y actualizar después.",
      shortSpecs: { Núcleos: "6 / 12 hilos", Reloj: "3.9 - 4.4 GHz", Socket: "AM4", Gráficos: "Radeon Graphics integrados", TDP: "65 W" },
      costCents: 84000,
      priceCents: 104000,
      stockOnHand: 5,
      minStockAlert: 2,
      warrantyMonths: 12,
      warrantyTerms: "Garantía demo de 12 meses en caja original.",
      compat: { componentType: "CPU", socket: "AM4", tdpWatts: 65, hasIntegratedGraphics: true },
    },
    {
      sku: "CT-CPU-R7-5700X",
      slug: "amd-ryzen-7-5700x",
      name: "Procesador AMD Ryzen 7 5700X",
      model: "Ryzen 7 5700X",
      categorySlug: "procesadores",
      brandName: "AMD",
      description: "8 núcleos / 16 hilos de bajo consumo (65W) para streaming, edición y juegos exigentes en plataforma AM4.",
      shortSpecs: { Núcleos: "8 / 16 hilos", Reloj: "3.4 - 4.6 GHz", Socket: "AM4", TDP: "65 W", Gráficos: "Requiere GPU dedicada" },
      costCents: 122000,
      priceCents: 148000,
      stockOnHand: 4,
      minStockAlert: 1,
      warrantyMonths: 12,
      warrantyTerms: "Garantía demo de 12 meses contra defectos de fabricación.",
      compat: { componentType: "CPU", socket: "AM4", tdpWatts: 65, hasIntegratedGraphics: false },
    },
    {
      sku: "CT-CPU-R5-7600",
      slug: "amd-ryzen-5-7600",
      name: "Procesador AMD Ryzen 5 7600",
      model: "Ryzen 5 7600",
      categorySlug: "procesadores",
      brandName: "AMD",
      description: "Arquitectura Zen 4 en socket AM5 con soporte DDR5 y PCIe 5.0 para equipos de última generación.",
      shortSpecs: { Núcleos: "6 / 12 hilos", Reloj: "3.8 - 5.1 GHz", Socket: "AM5", Memoria: "DDR5", Gráficos: "Radeon integrado básico", TDP: "65 W" },
      costCents: 149000,
      priceCents: 179000,
      stockOnHand: 4,
      minStockAlert: 1,
      warrantyMonths: 12,
      warrantyTerms: "Garantía demo de 12 meses en empaque sellado.",
      compat: { componentType: "CPU", socket: "AM5", tdpWatts: 65, hasIntegratedGraphics: true },
    },
    {
      sku: "CT-CPU-I5-12400F",
      slug: "intel-core-i5-12400f",
      name: "Procesador Intel Core i5-12400F",
      model: "Core i5-12400F",
      categorySlug: "procesadores",
      brandName: "Intel",
      description: "6 núcleos de rendimiento (12 hilos) para socket LGA1700. Excelente relación costo-rendimiento con tarjeta gráfica dedicada.",
      shortSpecs: { Núcleos: "6 P-Cores / 12 hilos", Boost: "4.4 GHz", Socket: "LGA1700", TDP: "65 W base", Gráficos: "Sin iGPU (requiere GPU)" },
      costCents: 91000,
      priceCents: 112000,
      stockOnHand: 5,
      minStockAlert: 2,
      warrantyMonths: 12,
      warrantyTerms: "Garantía demo de 12 meses contra defectos de fábrica.",
      compat: { componentType: "CPU", socket: "LGA1700", tdpWatts: 65, hasIntegratedGraphics: false },
    },
    {
      sku: "CT-CPU-I5-13400F",
      slug: "intel-core-i5-13400f",
      name: "Procesador Intel Core i5-13400F",
      model: "Core i5-13400F",
      categorySlug: "procesadores",
      brandName: "Intel",
      description: "10 núcleos híbridos (6P + 4E / 16 hilos) para productividad avanzada y gaming en socket LGA1700.",
      shortSpecs: { Núcleos: "10 (6P + 4E) / 16 hilos", Boost: "4.6 GHz", Socket: "LGA1700", Gráficos: "Sin iGPU (requiere GPU)" },
      costCents: 132000,
      priceCents: 162000,
      stockOnHand: 3,
      minStockAlert: 1,
      warrantyMonths: 12,
      warrantyTerms: "Garantía demo de 12 meses contra defectos de fabricación.",
      compat: { componentType: "CPU", socket: "LGA1700", tdpWatts: 65, hasIntegratedGraphics: false },
    },

    // Motherboards (4)
    {
      sku: "CT-MB-B550M-PRO-VDH",
      slug: "msi-b550m-pro-vdh-wifi",
      name: "Placa Madre MSI B550M PRO-VDH WIFI",
      model: "B550M PRO-VDH WIFI",
      categorySlug: "placas-madre",
      brandName: "MSI",
      description: "Placa Micro-ATX AM4 con Wi-Fi integrado, dos ranuras M.2 NVMe y cuatro ranuras DDR4.",
      shortSpecs: { Socket: "AM4", Chipset: "B550", Formato: "Micro-ATX", RAM: "4x DDR4 (máx 128 GB)", Almacenamiento: "2x M.2 + 4x SATA" },
      costCents: 84000,
      priceCents: 105000,
      stockOnHand: 5,
      minStockAlert: 2,
      warrantyMonths: 12,
      warrantyTerms: "Garantía demo de 12 meses sujeto a revisión de pines y VRM.",
      isFeatured: true,
      compat: {
        componentType: "MOTHERBOARD",
        socket: "AM4",
        chipset: "B550",
        ramGeneration: "DDR4",
        ramSlots: 4,
        maxRamGb: 128,
        formFactor: "Micro-ATX",
        m2Slots: 2,
        sataPorts: 4,
      },
    },
    {
      sku: "CT-MB-B450M-STEEL",
      slug: "asrock-b450m-steel-legend",
      name: "Placa Madre ASRock B450M Steel Legend",
      model: "B450M Steel Legend",
      categorySlug: "placas-madre",
      brandName: "ASRock",
      description: "Placa Micro-ATX AM4 robusta con VRM reforzado. Con procesadores Ryzen serie 5000 requiere verificar versión de BIOS en taller.",
      shortSpecs: { Socket: "AM4", Chipset: "B450", Formato: "Micro-ATX", RAM: "4x DDR4", NotaBIOS: "Verificar AGESA 1.2.0.7 para Ryzen 5000" },
      costCents: 68000,
      priceCents: 86000,
      stockOnHand: 4,
      minStockAlert: 1,
      warrantyMonths: 12,
      warrantyTerms: "Garantía demo de 12 meses; actualización de BIOS incluida en taller ClickTech.",
      compat: {
        componentType: "MOTHERBOARD",
        socket: "AM4",
        chipset: "B450",
        biosVersionRequired: "AGESA 1.2.0.7",
        ramGeneration: "DDR4",
        ramSlots: 4,
        maxRamGb: 64,
        formFactor: "Micro-ATX",
        m2Slots: 2,
        sataPorts: 4,
      },
    },
    {
      sku: "CT-MB-B650M-A-WIFI",
      slug: "asus-prime-b650m-a-wifi",
      name: "Placa Madre ASUS PRIME B650M-A WIFI",
      model: "PRIME B650M-A WIFI",
      categorySlug: "placas-madre",
      brandName: "ASUS",
      description: "Placa base Micro-ATX para plataforma AMD AM5 con soporte exclusivo de memoria DDR5 y Wi-Fi 6.",
      shortSpecs: { Socket: "AM5", Chipset: "B650", Formato: "Micro-ATX", RAM: "4x DDR5 (máx 128 GB)", M2: "2x M.2 PCIe" },
      costCents: 132000,
      priceCents: 162000,
      stockOnHand: 3,
      minStockAlert: 1,
      warrantyMonths: 12,
      warrantyTerms: "Garantía demo de 12 meses por defectos de fábrica.",
      compat: {
        componentType: "MOTHERBOARD",
        socket: "AM5",
        chipset: "B650",
        ramGeneration: "DDR5",
        ramSlots: 4,
        maxRamGb: 128,
        formFactor: "Micro-ATX",
        m2Slots: 2,
        sataPorts: 4,
      },
    },
    {
      sku: "CT-MB-B760M-DS3H",
      slug: "gigabyte-b760m-ds3h-ddr4",
      name: "Placa Madre Gigabyte B760M DS3H DDR4",
      model: "B760M DS3H DDR4",
      categorySlug: "placas-madre",
      brandName: "Gigabyte",
      description: "Placa Micro-ATX para procesadores Intel Core 12ª y 13ª generación (LGA1700) compatible con memoria DDR4 accesible.",
      shortSpecs: { Socket: "LGA1700", Chipset: "B760", Formato: "Micro-ATX", RAM: "4x DDR4 (máx 128 GB)", M2: "2x M.2 PCIe 4.0" },
      costCents: 92000,
      priceCents: 114000,
      stockOnHand: 4,
      minStockAlert: 1,
      warrantyMonths: 12,
      warrantyTerms: "Garantía demo de 12 meses por defectos de fábrica.",
      compat: {
        componentType: "MOTHERBOARD",
        socket: "LGA1700",
        chipset: "B760",
        ramGeneration: "DDR4",
        ramSlots: 4,
        maxRamGb: 128,
        formFactor: "Micro-ATX",
        m2Slots: 2,
        sataPorts: 4,
      },
    },

    // RAM (3)
    {
      sku: "CT-RAM-FURY-16-D4",
      slug: "kingston-fury-beast-16gb-ddr4",
      name: "Memoria RAM Kingston FURY Beast 16GB (2x8GB) DDR4-3200",
      model: "KF432C16BBK2/16",
      categorySlug: "memorias-ram",
      brandName: "Kingston",
      description: "Kit Dual Channel de 16 GB DDR4 a 3200 MT/s CL16 con disipador de perfil bajo.",
      shortSpecs: { Capacidad: "16 GB (2x8 GB)", Tipo: "DDR4", Velocidad: "3200 MT/s", Latencia: "CL16" },
      costCents: 34000,
      priceCents: 44000,
      stockOnHand: 8,
      minStockAlert: 3,
      warrantyMonths: 24,
      warrantyTerms: "Garantía demo de 24 meses contra fallos eléctricos.",
      compat: { componentType: "RAM", ramGeneration: "DDR4", ramModulesCount: 2, ramCapacityGb: 16 },
    },
    {
      sku: "CT-RAM-LPX-32-D4",
      slug: "corsair-vengeance-lpx-32gb-ddr4",
      name: "Memoria RAM Corsair Vengeance LPX 32GB (2x16GB) DDR4-3600",
      model: "CMK32GX4M2D3600C18",
      categorySlug: "memorias-ram",
      brandName: "Corsair",
      description: "Kit de 32 GB DDR4 a 3600 MHz pensado para edición, máquinas virtuales y gaming exigente.",
      shortSpecs: { Capacidad: "32 GB (2x16 GB)", Tipo: "DDR4", Velocidad: "3600 MT/s", Perfil: "Bajo (34 mm)" },
      costCents: 66000,
      priceCents: 84000,
      stockOnHand: 4,
      minStockAlert: 2,
      warrantyMonths: 24,
      warrantyTerms: "Garantía demo de 24 meses.",
      compat: { componentType: "RAM", ramGeneration: "DDR4", ramModulesCount: 2, ramCapacityGb: 32 },
    },
    {
      sku: "CT-RAM-FURY-32-D5",
      slug: "kingston-fury-beast-32gb-ddr5",
      name: "Memoria RAM Kingston FURY Beast 32GB (2x16GB) DDR5-5600",
      model: "KF556C36BBEK2-32",
      categorySlug: "memorias-ram",
      brandName: "Kingston",
      description: "Kit Dual Channel DDR5 de 32 GB optimizado para placas AM5 e Intel DDR5.",
      shortSpecs: { Capacidad: "32 GB (2x16 GB)", Tipo: "DDR5", Velocidad: "5600 MT/s", Perfil: "EXPO / XMP" },
      costCents: 98000,
      priceCents: 124000,
      stockOnHand: 4,
      minStockAlert: 2,
      warrantyMonths: 24,
      warrantyTerms: "Garantía demo de 24 meses.",
      compat: { componentType: "RAM", ramGeneration: "DDR5", ramModulesCount: 2, ramCapacityGb: 32 },
    },

    // GPUs (3)
    {
      sku: "CT-GPU-RTX4060-VENTUS",
      slug: "msi-rtx-4060-ventus-2x-8g",
      name: "Tarjeta Gráfica MSI GeForce RTX 4060 VENTUS 2X BLACK 8G OC",
      model: "RTX 4060 VENTUS 2X 8G OC",
      categorySlug: "tarjetas-graficas",
      brandName: "MSI",
      description: "GPU eficiente de doble ventilador con 8 GB GDDR6, DLSS 3 y bajo consumo (115W) compatible con chasis compactos.",
      shortSpecs: { Memoria: "8 GB GDDR6", Longitud: "199 mm", Conector: "1x 8-pin PCIe", FuenteRec: "550W+", TDP: "115 W" },
      costCents: 225000,
      priceCents: 269000,
      promoPriceCents: 215000,
      promoLabel: "BLACK FRIDAY -20%",
      stockOnHand: 4,
      minStockAlert: 1,
      warrantyMonths: 12,
      warrantyTerms: "Garantía demo de 12 meses (sin intervención de sello térmico).",
      isFeatured: true,
      compat: {
        componentType: "GPU",
        tdpWatts: 115,
        recommendedPsuWatts: 550,
        pcie8PinConnectors: 1,
        pcie12Vhpwr: false,
        gpuLengthMm: 199,
      },
    },
    {
      sku: "CT-GPU-RX7600-PULSE",
      slug: "sapphire-pulse-rx-7600-8gb",
      name: "Tarjeta Gráfica Sapphire PULSE Radeon RX 7600 8GB",
      model: "PULSE RX 7600 8G",
      categorySlug: "tarjetas-graficas",
      brandName: "Sapphire",
      description: "Arquitectura AMD RDNA 3 con 8 GB GDDR6 enfocada en juegos 1080p y buena relación precio-rendimiento.",
      shortSpecs: { Memoria: "8 GB GDDR6", Longitud: "240 mm", Conector: "1x 8-pin PCIe", FuenteRec: "550W+", TDP: "165 W" },
      costCents: 205000,
      priceCents: 245000,
      stockOnHand: 3,
      minStockAlert: 1,
      warrantyMonths: 12,
      warrantyTerms: "Garantía demo de 12 meses.",
      compat: {
        componentType: "GPU",
        tdpWatts: 165,
        recommendedPsuWatts: 550,
        pcie8PinConnectors: 1,
        pcie12Vhpwr: false,
        gpuLengthMm: 240,
      },
    },
    {
      sku: "CT-GPU-RTX4070S-DUAL",
      slug: "asus-dual-rtx-4070-super-12gb",
      name: "Tarjeta Gráfica ASUS Dual GeForce RTX 4070 SUPER OC 12GB",
      model: "DUAL-RTX4070S-O12G",
      categorySlug: "tarjetas-graficas",
      brandName: "ASUS",
      description: "GPU de gama media-alta con 12 GB GDDR6X para resolución QHD 1440p, renderizado y creación digital. Requiere conector 12VHPWR o adaptador doble 8-pin y fuente de 650W+.",
      shortSpecs: { Memoria: "12 GB GDDR6X", Longitud: "267 mm", Conector: "16-pin (12VHPWR)", FuenteRec: "650W+", TDP: "220 W" },
      costCents: 445000,
      priceCents: 519000,
      stockOnHand: 2,
      minStockAlert: 1,
      warrantyMonths: 12,
      warrantyTerms: "Garantía demo de 12 meses.",
      isFeatured: true,
      compat: {
        componentType: "GPU",
        tdpWatts: 220,
        recommendedPsuWatts: 650,
        pcie8PinConnectors: 2,
        pcie12Vhpwr: true,
        gpuLengthMm: 267,
      },
    },

    // Storage (3)
    {
      sku: "CT-SSD-NV2-1TB",
      slug: "kingston-nv2-1tb-nvme",
      name: "SSD Kingston NV2 1TB M.2 2280 NVMe PCIe 4.0",
      model: "SNV2S/1000G",
      categorySlug: "almacenamiento",
      brandName: "Kingston",
      description: "Unidad NVMe M.2 PCIe 4.0 de 1 TB ideal para sistema operativo, juegos y actualización rápida de laptops/desktops.",
      shortSpecs: { Capacidad: "1 TB", Formato: "M.2 2280", Interfaz: "PCIe 4.0 NVMe", Lectura: "Hasta 3.500 MB/s" },
      costCents: 42000,
      priceCents: 54000,
      promoPriceCents: 42000,
      promoLabel: "BLACK FRIDAY -22%",
      stockOnHand: 10,
      minStockAlert: 3,
      warrantyMonths: 12,
      warrantyTerms: "Garantía demo de 12 meses.",
      isFeatured: true,
      compat: { componentType: "STORAGE", storageInterface: "NVMe_PCIe4" },
    },
    {
      sku: "CT-SSD-980-1TB",
      slug: "samsung-980-1tb-nvme",
      name: "SSD Samsung 980 1TB M.2 NVMe PCIe 3.0",
      model: "MZ-V8V1T0BW",
      categorySlug: "almacenamiento",
      brandName: "Samsung",
      description: "Almacenamiento NVMe de alta estabilidad térmica y consistencia para estaciones de trabajo y gaming.",
      shortSpecs: { Capacidad: "1 TB", Formato: "M.2 2280", Interfaz: "PCIe 3.0 NVMe", Lectura: "Hasta 3.500 MB/s" },
      costCents: 55000,
      priceCents: 69000,
      stockOnHand: 6,
      minStockAlert: 2,
      warrantyMonths: 24,
      warrantyTerms: "Garantía demo de 24 meses.",
      compat: { componentType: "STORAGE", storageInterface: "NVMe_PCIe3" },
    },
    {
      sku: "CT-SSD-MX500-1TB",
      slug: "crucial-mx500-1tb-sata",
      name: "SSD Crucial MX500 1TB 2.5 pulgadas SATA",
      model: "CT1000MX500SSD1",
      categorySlug: "almacenamiento",
      brandName: "Crucial",
      description: "SSD SATA de 2.5\" con memoria DRAM caché integrada. Ideal para revivir laptops y PCs antiguas sin ranura M.2.",
      shortSpecs: { Capacidad: "1 TB", Formato: "2.5 pulgadas", Interfaz: "SATA III 6 Gb/s", Lectura: "560 MB/s" },
      costCents: 52000,
      priceCents: 65000,
      stockOnHand: 5,
      minStockAlert: 2,
      warrantyMonths: 24,
      warrantyTerms: "Garantía demo de 24 meses.",
      compat: { componentType: "STORAGE", storageInterface: "SATA_3" },
    },

    // PSUs (3)
    {
      sku: "CT-PSU-CV550",
      slug: "corsair-cv550-550w-bronze",
      name: "Fuente de Poder Corsair CV550 550W 80 Plus Bronze",
      model: "CP-9020210-NA",
      categorySlug: "fuentes",
      brandName: "Corsair",
      description: "FuenteATX de 550W reales 80 Plus Bronze con protecciones OVP/UVP/SCP para equipos de entrada y gama media.",
      shortSpecs: { Potencia: "550 W", Certificación: "80 Plus Bronze", PCIe8Pin: "2 conectores", Cableado: "No modular" },
      costCents: 38000,
      priceCents: 49000,
      stockOnHand: 6,
      minStockAlert: 2,
      warrantyMonths: 12,
      warrantyTerms: "Garantía demo de 12 meses contra defectos eléctricos.",
      compat: { componentType: "PSU", psuWatts: 550, pcie8PinConnectors: 2, pcie12Vhpwr: false },
    },
    {
      sku: "CT-PSU-A650BN",
      slug: "msi-mag-a650bn-650w-bronze",
      name: "Fuente de Poder MSI MAG A650BN 650W 80 Plus Bronze",
      model: "MAG A650BN",
      categorySlug: "fuentes",
      brandName: "MSI",
      description: "Fuente ATX de 650W reales con diseño DC-to-DC y dos conectores PCIe 6+2 pines.",
      shortSpecs: { Potencia: "650 W", Certificación: "80 Plus Bronze", PCIe8Pin: "2 conectores", Protección: "OCP/OVP/OPP/OTP/SCP" },
      costCents: 45000,
      priceCents: 57000,
      stockOnHand: 7,
      minStockAlert: 2,
      warrantyMonths: 24,
      warrantyTerms: "Garantía demo de 24 meses.",
      compat: { componentType: "PSU", psuWatts: 650, pcie8PinConnectors: 2, pcie12Vhpwr: false },
    },
    {
      sku: "CT-PSU-RM750E",
      slug: "corsair-rm750e-750w-gold",
      name: "Fuente Modular Corsair RM750e 750W 80 Plus Gold ATX 3.0",
      model: "CP-9020262-NA",
      categorySlug: "fuentes",
      brandName: "Corsair",
      description: "Fuente totalmente modular ATX 3.0 con soporte nativo PCIe 5.0 12VHPWR para tarjetas gráficas de nueva generación.",
      shortSpecs: { Potencia: "750 W", Certificación: "80 Plus Gold", Estándar: "ATX 3.0 / 12VHPWR", Cableado: "100% Modular" },
      costCents: 82000,
      priceCents: 102000,
      stockOnHand: 4,
      minStockAlert: 1,
      warrantyMonths: 36,
      warrantyTerms: "Garantía demo de 36 meses.",
      compat: { componentType: "PSU", psuWatts: 750, pcie8PinConnectors: 3, pcie12Vhpwr: true },
    },

    // Cases (2)
    {
      sku: "CT-CASE-VERSA-H18",
      slug: "thermaltake-versa-h18-matx",
      name: "Gabinete Thermaltake Versa H18 Micro-ATX",
      model: "CA-1J4-00S1WN-01",
      categorySlug: "gabinetes",
      brandName: "Thermaltake",
      description: "Chasis compacto Micro-ATX con panel frontal mallado para flujo de aire, ventana lateral y espacio para GPU hasta 350 mm.",
      shortSpecs: { Placas: "Micro-ATX / Mini-ITX", MaxGPU: "350 mm", MaxCooler: "155 mm", Frontal: "Mesh ventilado" },
      costCents: 35000,
      priceCents: 45000,
      stockOnHand: 5,
      minStockAlert: 2,
      warrantyMonths: 6,
      warrantyTerms: "Garantía demo de 6 meses en puertos frontales y estructura.",
      compat: {
        componentType: "CASE",
        supportedFormFactors: ["Micro-ATX", "Mini-ITX"],
        caseMaxGpuLengthMm: 350,
        caseMaxCoolerHeightMm: 155,
      },
    },
    {
      sku: "CT-CASE-H5-FLOW",
      slug: "nzxt-h5-flow-atx",
      name: "Gabinete NZXT H5 Flow ATX Vidrio Templado",
      model: "CC-H51FB-01",
      categorySlug: "gabinetes",
      brandName: "NZXT",
      description: "Gabinete Mid-Tower ATX con panel frontal perforado y ventilador dedicado inferior. Nota: validar holgura de GPU si se instala radiador frontal.",
      shortSpecs: { Placas: "ATX / Micro-ATX / Mini-ITX", Vidrio: "Templado lateral", Ventilación: "Alta circulación", Nota: "Holgura con radiador por revisar" },
      costCents: 68000,
      priceCents: 86000,
      stockOnHand: 4,
      minStockAlert: 1,
      warrantyMonths: 12,
      warrantyTerms: "Garantía demo de 12 meses en panel I/O y ventiladores.",
      compat: {
        componentType: "CASE",
        supportedFormFactors: ["ATX", "Micro-ATX", "Mini-ITX"],
        // Deliberately null so selecting with a GPU demonstrates "Requiere revisión técnica" for unverified physical clearance!
        caseMaxGpuLengthMm: null,
        caseMaxCoolerHeightMm: 165,
      },
    },

    // Coolers (2)
    {
      sku: "CT-COOL-AK400",
      slug: "deepcool-ak400-cpu-cooler",
      name: "Disipador Torre DeepCool AK400",
      model: "R-AK400-BKNNMN-G-1",
      categorySlug: "refrigeracion",
      brandName: "DeepCool",
      description: "Disipador torre de 4 heatpipes y ventilador PWM de 120 mm, silencioso y apto para gabinetes de 155 mm+.",
      shortSpecs: { Altura: "155 mm", Ventilador: "120 mm PWM", Sockets: "AM4, AM5, LGA1700", Heatpipes: "4 de contacto directo" },
      costCents: 21000,
      priceCents: 29000,
      stockOnHand: 7,
      minStockAlert: 2,
      warrantyMonths: 12,
      warrantyTerms: "Garantía demo de 12 meses en ventilador.",
      compat: {
        componentType: "COOLER",
        coolerHeightMm: 155,
        supportedSockets: ["AM4", "AM5", "LGA1700", "LGA1200"],
      },
    },
    {
      sku: "CT-COOL-PA120SE",
      slug: "thermalright-peerless-assassin-120-se",
      name: "Disipador Doble Torre Thermalright Peerless Assassin 120 SE",
      model: "PA120 SE",
      categorySlug: "refrigeracion",
      brandName: "Thermalright",
      description: "Doble torre con 6 heatpipes y dos ventiladores de 120 mm para CPUs de mayor carga térmica sostenida.",
      shortSpecs: { Altura: "155 mm", Torres: "Doble torre / 2x 120 mm", Sockets: "AM4, AM5, LGA1700", Heatpipes: "6" },
      costCents: 31000,
      priceCents: 42000,
      stockOnHand: 5,
      minStockAlert: 2,
      warrantyMonths: 12,
      warrantyTerms: "Garantía demo de 12 meses.",
      compat: {
        componentType: "COOLER",
        coolerHeightMm: 155,
        supportedSockets: ["AM4", "AM5", "LGA1700"],
      },
    },

    // Laptops (2)
    {
      sku: "CT-LAP-NITRO-V15",
      slug: "acer-nitro-v-15-rtx4050",
      name: "Laptop Gamer Acer Nitro V 15 ANV15-51",
      model: "ANV15-51-51H9",
      categorySlug: "laptops",
      brandName: "Acer",
      description: "Portátil gamer de 15.6\" FHD 144Hz con Intel Core i5-13420H, 16 GB DDR5, SSD 512 GB y NVIDIA GeForce RTX 4050 6 GB.",
      shortSpecs: { Pantalla: "15.6\" FHD IPS 144Hz", CPU: "Intel Core i5-13420H", GPU: "RTX 4050 6 GB", RAM: "16 GB DDR5", SSD: "512 GB NVMe" },
      costCents: 615000,
      priceCents: 719000,
      promoPriceCents: 599000,
      promoLabel: "BLACK FRIDAY -17%",
      stockOnHand: 2,
      minStockAlert: 1,
      warrantyMonths: 12,
      warrantyTerms: "Garantía demo de 12 meses en hardware con revisión en taller autorizado.",
      isFeatured: true,
      compat: { componentType: "LAPTOP" },
    },
    {
      sku: "CT-LAP-IDEAPAD-SLIM3",
      slug: "lenovo-ideapad-slim-3-15irh8",
      name: "Laptop Lenovo IdeaPad Slim 3 15IRH8",
      model: "15IRH8",
      categorySlug: "laptops",
      brandName: "Lenovo",
      description: "Laptop ligera para universidad, tesis y oficina con Intel Core i5-13420H, 16 GB RAM y SSD NVMe 512 GB.",
      shortSpecs: { Pantalla: "15.6\" FHD antirreflejo", CPU: "Intel Core i5-13420H", RAM: "16 GB LPDDR5", SSD: "512 GB NVMe", Peso: "1.62 kg" },
      costCents: 410000,
      priceCents: 485000,
      stockOnHand: 3,
      minStockAlert: 1,
      warrantyMonths: 12,
      warrantyTerms: "Garantía demo de 12 meses.",
      compat: { componentType: "LAPTOP" },
    },

    // Monitors (2)
    {
      sku: "CT-MON-24GS60F",
      slug: "lg-ultragear-24gs60f-180hz",
      name: "Monitor Gamer LG UltraGear 24GS60F-B 24\" 180Hz IPS",
      model: "24GS60F-B",
      categorySlug: "monitores",
      brandName: "LG",
      description: "Panel IPS de 23.8 pulgadas Full HD con 180 Hz, 1 ms GtG y compatibilidad HDR10 / FreeSync.",
      shortSpecs: { Tamaño: "23.8\" FHD (1920x1080)", Panel: "IPS", Refresco: "180 Hz", Respuesta: "1 ms GtG", Entradas: "HDMI + DisplayPort" },
      costCents: 118000,
      priceCents: 145000,
      stockOnHand: 4,
      minStockAlert: 1,
      warrantyMonths: 12,
      warrantyTerms: "Garantía demo de 12 meses (política de píxeles verificada al entregar).",
      isFeatured: true,
      compat: { componentType: "MONITOR" },
    },
    {
      sku: "CT-MON-ODYSSEY-G5",
      slug: "samsung-odyssey-g5-27-qhd",
      name: "Monitor Curvo Samsung Odyssey G5 27\" QHD 165Hz",
      model: "LS27CG550ELXZ",
      categorySlug: "monitores",
      brandName: "Samsung",
      description: "Pantalla curva 1000R de 27 pulgadas en resolución QHD 2560x1440 a 165 Hz para inmersión gamer y espacio de trabajo.",
      shortSpecs: { Tamaño: "27\" QHD (2560x1440)", Curvatura: "1000R", Refresco: "165 Hz", Panel: "VA" },
      costCents: 185000,
      priceCents: 225000,
      promoPriceCents: 179000,
      promoLabel: "BLACK FRIDAY -20%",
      stockOnHand: 2,
      minStockAlert: 1,
      warrantyMonths: 12,
      warrantyTerms: "Garantía demo de 12 meses.",
      compat: { componentType: "MONITOR" },
    },

    // Peripherals (3)
    {
      sku: "CT-PER-G502-HERO",
      slug: "logitech-g502-hero-mouse",
      name: "Mouse Gamer Logitech G502 HERO",
      model: "G502 HERO",
      categorySlug: "perifericos",
      brandName: "Logitech",
      description: "Sensor óptico HERO 25K de alta precisión con 11 botones programables y sistema de pesas ajustables.",
      shortSpecs: { Sensor: "HERO 25K (hasta 25.600 DPI)", Botones: "11 programables", Conexión: "Cable USB trenzado", Pesas: "5x 3.6 g incluidas" },
      costCents: 31000,
      priceCents: 41000,
      promoPriceCents: 29900,
      promoLabel: "BLACK FRIDAY -27%",
      stockOnHand: 7,
      minStockAlert: 2,
      warrantyMonths: 12,
      warrantyTerms: "Garantía demo de 12 meses por fallos de sensor o switches.",
      isFeatured: true,
      compat: { componentType: "PERIPHERAL" },
    },
    {
      sku: "CT-PER-K552",
      slug: "redragon-kumara-k552-mecanico",
      name: "Teclado Mecánico Redragon Kumara K552 RGB TKL",
      model: "K552-RGB",
      categorySlug: "perifericos",
      brandName: "Redragon",
      description: "Teclado compacto tenkeyless con chasis metálico, switches mecánicos táctiles intercambiables y retroiluminación RGB.",
      shortSpecs: { Formato: "TKL (87 teclas)", Switches: "Mecánicos Outemu Red/Blue", Retroiluminación: "RGB configurable", Distribución: "Español" },
      costCents: 25000,
      priceCents: 34000,
      stockOnHand: 6,
      minStockAlert: 2,
      warrantyMonths: 12,
      warrantyTerms: "Garantía demo de 12 meses.",
      compat: { componentType: "PERIPHERAL" },
    },
    {
      sku: "CT-PER-CLOUD-II",
      slug: "hyperx-cloud-ii-headset",
      name: "Audífonos Gamer HyperX Cloud II",
      model: "KHX-HSCP",
      categorySlug: "perifericos",
      brandName: "HyperX",
      description: "Almohadillas de espuma viscoelástica, diadema de aluminio y micrófono desmontable con cancelación de ruido.",
      shortSpecs: { Drivers: "53 mm con imanes de neodimio", Micrófono: "Desmontable", Conexión: "Jack 3.5 mm / USB", Confort: "Memory foam" },
      costCents: 48000,
      priceCents: 62000,
      stockOnHand: 4,
      minStockAlert: 1,
      warrantyMonths: 12,
      warrantyTerms: "Garantía demo de 12 meses.",
      compat: { componentType: "PERIPHERAL" },
    },

    // Accessory (1)
    {
      sku: "CT-ACC-MX4",
      slug: "arctic-mx-4-pasta-termica-4g",
      name: "Pasta Térmica ARCTIC MX-4 (4 g)",
      model: "ACTCP00002B",
      categorySlug: "accesorios",
      brandName: "ARCTIC",
      description: "Compuesto térmico de alta conductividad sin partículas metálicas (no conductivo eléctricamente) para mantenimiento de CPU y GPU.",
      shortSpecs: { Peso: "4 gramos", Conductividad: "No conductora eléctrica", Aplicación: "CPU / GPU / Laptop", Durabilidad: "Larga estabilidad" },
      costCents: 4800,
      priceCents: 7500,
      stockOnHand: 15,
      minStockAlert: 4,
      warrantyMonths: null,
      warrantyTerms: "Consumible sellado; revisión de integridad al momento de la entrega (sin garantía extendida).",
      compat: { componentType: "ACCESSORY" },
    },

    // Prebuilt PCs (3)
    {
      sku: "CT-PC-INICIAL",
      slug: "pc-gamer-inicial-ryzen-5600g",
      name: "PC Gamer Inicial 1080p — Base Actualizable",
      model: "ClickTech Inicial R5-5600G",
      categorySlug: "pcs-armadas",
      brandName: "ClickTech",
      description: "Pensada para presupuesto ajustado (perfil Diego): arranca con Ryzen 5 5600G, 16 GB DDR4 Dual Channel, SSD NVMe 1 TB, placa B550 y fuente 650W para añadir GPU dedicada después sin reemplazar piezas.",
      shortSpecs: { CPU: "Ryzen 5 5600G", Placa: "MSI B550M PRO-VDH WIFI", RAM: "16 GB DDR4-3200", SSD: "1 TB NVMe", Fuente: "650W 80+ Bronze", Ensamblaje: "Incluido con pruebas" },
      costCents: 295000,
      priceCents: 359000,
      stockOnHand: 3,
      minStockAlert: 1,
      warrantyMonths: 12,
      warrantyTerms: "Garantía demo de 12 meses en ensamblaje ClickTech + garantía individual registrada por componente.",
      isFeatured: true,
      isPrebuiltPc: true,
      prebuiltTier: "INICIAL",
      compat: { componentType: "PREBUILT" },
    },
    {
      sku: "CT-PC-EQUILIBRADA",
      slug: "pc-gamer-equilibrada-rtx-4060",
      name: "PC Gamer Equilibrada — Ryzen 5 5600 + RTX 4060",
      model: "ClickTech Equilibrada 4060",
      categorySlug: "pcs-armadas",
      brandName: "ClickTech",
      description: "Configuración balanceada para 1080p competitivo y AAA, streaming y creación digital. Incluye gestión de cables y pruebas térmicas registradas.",
      shortSpecs: { CPU: "Ryzen 5 5600", GPU: "MSI RTX 4060 8 GB", Placa: "MSI B550M PRO-VDH WIFI", RAM: "16 GB DDR4-3200", SSD: "1 TB NVMe", Fuente: "650W 80+ Bronze" },
      costCents: 525000,
      priceCents: 619000,
      promoPriceCents: 529000,
      promoLabel: "BLACK FRIDAY -15%",
      stockOnHand: 2,
      minStockAlert: 1,
      warrantyMonths: 12,
      warrantyTerms: "Garantía demo de 12 meses en ensamblaje y pruebas de estabilidad.",
      isFeatured: true,
      isPrebuiltPc: true,
      prebuiltTier: "EQUILIBRADA",
      compat: { componentType: "PREBUILT" },
    },
    {
      sku: "CT-PC-ESTUDIO",
      slug: "pc-estudio-y-trabajo-confiable",
      name: "PC Estudio y Trabajo Confiable — Silenciosa y Rápida",
      model: "ClickTech Studio i5/1TB",
      categorySlug: "pcs-armadas",
      brandName: "ClickTech",
      description: "Diseñada para tesis, programación, arquitectura, contabilidad y oficina (perfil Andrea): arranque rápido en SSD NVMe, 32 GB RAM para multitarea y chasis discreto.",
      shortSpecs: { CPU: "Ryzen 5 5600G", Placa: "MSI B550M PRO-VDH WIFI", RAM: "32 GB DDR4-3600", SSD: "1 TB Samsung NVMe", Fuente: "550W 80+ Bronze", Gabinete: "Versa H18" },
      costCents: 335000,
      priceCents: 405000,
      stockOnHand: 3,
      minStockAlert: 1,
      warrantyMonths: 12,
      warrantyTerms: "Garantía demo de 12 meses + soporte técnico local en Potosí.",
      isFeatured: true,
      isPrebuiltPc: true,
      prebuiltTier: "ESTUDIO_TRABAJO",
      compat: { componentType: "PREBUILT" },
    },

    // --- 15 Nuevos Productos de Catálogo Ampliado + Black Friday ---
    {
      sku: "CT-PC-STREAM-4070S",
      slug: "pc-gamer-streaming-pro-rtx-4070-super",
      name: "PC Gamer & Streaming Pro — Ryzen 5 7600 + RTX 4070 SUPER",
      model: "ClickTech Pro 4070S",
      categorySlug: "pcs-armadas",
      brandName: "ClickTech",
      description: "Estación extrema QHD 1440p con plataforma AM5 DDR5, RTX 4070 SUPER 12GB, SSD 2TB y fuente modular Gold ATX 3.0.",
      shortSpecs: { CPU: "Ryzen 5 7600 AM5", GPU: "RTX 4070 SUPER 12 GB", RAM: "32 GB DDR5-5600", SSD: "1 TB NVMe PCIe 4.0", Fuente: "750W 80+ Gold" },
      costCents: 790000,
      priceCents: 1049000,
      promoPriceCents: 889000,
      promoLabel: "BLACK FRIDAY -15%",
      stockOnHand: 2,
      minStockAlert: 1,
      warrantyMonths: 12,
      warrantyTerms: "Garantía de 12 meses en ensamblaje ClickTech + soporte gratuito en Potosí.",
      isFeatured: true,
      isPrebuiltPc: true,
      prebuiltTier: "PRO_STREAMING",
      compat: { componentType: "PREBUILT" },
    },
    {
      sku: "CT-PC-CREATOR-32",
      slug: "pc-workstation-diseno-3d-i5-13400f",
      name: "PC Workstation Diseño & Render 3D — Core i5-13400F + 32GB + RTX 4060",
      model: "ClickTech Creator 32G",
      categorySlug: "pcs-armadas",
      brandName: "ClickTech",
      description: "Ensamblada para AutoCAD, Revit, Premiere y Blender: 10 núcleos híbridos Intel, 32 GB RAM y RTX 4060 con pruebas térmicas.",
      shortSpecs: { CPU: "Intel Core i5-13400F", GPU: "RTX 4060 8 GB", RAM: "32 GB DDR4-3600", SSD: "1 TB Samsung NVMe", Fuente: "650W 80+ Bronze" },
      costCents: 615000,
      priceCents: 745000,
      stockOnHand: 2,
      minStockAlert: 1,
      warrantyMonths: 12,
      warrantyTerms: "Garantía de 12 meses en ensamblaje ClickTech.",
      isFeatured: true,
      isPrebuiltPc: true,
      prebuiltTier: "CREATOR_WORKSTATION",
      compat: { componentType: "PREBUILT" },
    },
    {
      sku: "CT-LAP-TUF-F15",
      slug: "laptop-gamer-asus-tuf-f15-rtx4060",
      name: "Laptop Gamer ASUS TUF Gaming F15 RTX 4060 144Hz",
      model: "FX507ZV4",
      categorySlug: "laptops",
      brandName: "ASUS",
      description: "Portátil grado militar con Core i7-12700H, 16 GB RAM, 1 TB NVMe y NVIDIA GeForce RTX 4060 8 GB completa.",
      shortSpecs: { Pantalla: "15.6\" FHD 144Hz IPS", CPU: "Intel Core i7-12700H", GPU: "RTX 4060 8 GB", RAM: "16 GB DDR4", SSD: "1 TB NVMe" },
      costCents: 685000,
      priceCents: 869000,
      promoPriceCents: 719000,
      promoLabel: "BLACK FRIDAY -17%",
      stockOnHand: 3,
      minStockAlert: 1,
      warrantyMonths: 12,
      warrantyTerms: "Garantía de 12 meses con revisión en taller ClickTech.",
      isFeatured: true,
      compat: { componentType: "LAPTOP" },
    },
    {
      sku: "CT-LAP-VICTUS-15",
      slug: "laptop-hp-victus-15-ryzen-rtx3050",
      name: "Laptop HP Victus 15 Ryzen 5 + RTX 3050 16GB",
      model: "15-fb1013la",
      categorySlug: "laptops",
      brandName: "HP",
      description: "Laptop equilibrada para ingeniería, universidad y gaming FHD con pantalla de 144Hz y refrigeración de doble ventilador.",
      shortSpecs: { Pantalla: "15.6\" FHD 144Hz", CPU: "AMD Ryzen 5 7535HS", GPU: "RTX 3050 6 GB", RAM: "16 GB DDR5", SSD: "512 GB NVMe" },
      costCents: 510000,
      priceCents: 619000,
      stockOnHand: 4,
      minStockAlert: 1,
      warrantyMonths: 12,
      warrantyTerms: "Garantía de 12 meses.",
      isFeatured: true,
      compat: { componentType: "LAPTOP" },
    },
    {
      sku: "CT-CPU-R7-7700X",
      slug: "amd-ryzen-7-7700x-am5",
      name: "Procesador AMD Ryzen 7 7700X AM5 8 Núcleos",
      model: "100-100000591WOF",
      categorySlug: "procesadores",
      brandName: "AMD",
      description: "8 núcleos Zen 4 hasta 5.4 GHz para estaciones DDR5 y tarjetas gráficas de alto calibre.",
      shortSpecs: { Núcleos: "8 / 16 hilos", Boost: "Hasta 5.4 GHz", Socket: "AM5", Memoria: "DDR5", TDP: "105 W" },
      costCents: 205000,
      priceCents: 269000,
      promoPriceCents: 229000,
      promoLabel: "BLACK FRIDAY -15%",
      stockOnHand: 4,
      minStockAlert: 1,
      warrantyMonths: 12,
      warrantyTerms: "Garantía de 12 meses.",
      isFeatured: true,
      compat: { componentType: "CPU", socket: "AM5", tdpWatts: 105, hasIntegratedGraphics: true },
    },
    {
      sku: "CT-CPU-I7-13700F",
      slug: "intel-core-i7-13700f-lga1700",
      name: "Procesador Intel Core i7-13700F LGA1700 16 Núcleos",
      model: "BX8071513700F",
      categorySlug: "procesadores",
      brandName: "Intel",
      description: "16 núcleos (8P + 8E / 24 hilos) hasta 5.2 GHz para productividad pesada, compilación y gaming competitivo.",
      shortSpecs: { Núcleos: "16 (8P+8E) / 24 hilos", Boost: "5.2 GHz", Socket: "LGA1700", Gráficos: "Requiere GPU dedicada" },
      costCents: 242000,
      priceCents: 295000,
      stockOnHand: 3,
      minStockAlert: 1,
      warrantyMonths: 12,
      warrantyTerms: "Garantía de 12 meses.",
      compat: { componentType: "CPU", socket: "LGA1700", tdpWatts: 65, hasIntegratedGraphics: false },
    },
    {
      sku: "CT-GPU-RX7700XT",
      slug: "sapphire-pulse-rx-7700-xt-12gb",
      name: "Tarjeta Gráfica Sapphire PULSE Radeon RX 7700 XT 12GB",
      model: "11335-04-20G",
      categorySlug: "tarjetas-graficas",
      brandName: "Sapphire",
      description: "Rendimiento sobresaliente en 1440p Ultra con 12 GB GDDR6 y sistema de triple enfriamiento Dual-X.",
      shortSpecs: { Memoria: "12 GB GDDR6", Longitud: "280 mm", Conector: "2x 8-pin PCIe", FuenteRec: "650W+", TDP: "245 W" },
      costCents: 315000,
      priceCents: 419000,
      promoPriceCents: 349000,
      promoLabel: "BLACK FRIDAY -17%",
      stockOnHand: 3,
      minStockAlert: 1,
      warrantyMonths: 12,
      warrantyTerms: "Garantía de 12 meses.",
      isFeatured: true,
      compat: {
        componentType: "GPU",
        tdpWatts: 245,
        recommendedPsuWatts: 650,
        pcie8PinConnectors: 2,
        pcie12Vhpwr: false,
        gpuLengthMm: 280,
      },
    },
    {
      sku: "CT-MON-AOC-27G2",
      slug: "monitor-gamer-aoc-27-ips-240hz",
      name: "Monitor Gamer AOC 27\" IPS 240Hz 0.5ms HDR",
      model: "27G2Z",
      categorySlug: "monitores",
      brandName: "AOC",
      description: "Monitor esports de 27 pulgadas Fast IPS con 240 Hz reales, 0.5 ms MPRT y base ergonómica ajustable en altura.",
      shortSpecs: { Tamaño: "27\" FHD", Panel: "Fast IPS", Refresco: "240 Hz", Respuesta: "0.5 ms MPRT", Soporte: "Altura y pivote" },
      costCents: 175000,
      priceCents: 249000,
      promoPriceCents: 199000,
      promoLabel: "BLACK FRIDAY -20%",
      stockOnHand: 4,
      minStockAlert: 1,
      warrantyMonths: 12,
      warrantyTerms: "Garantía de 12 meses.",
      isFeatured: true,
      compat: { componentType: "MONITOR" },
    },
    {
      sku: "CT-SSD-WD-SN850X-2TB",
      slug: "wd-black-sn850x-2tb-nvme",
      name: "SSD WD_BLACK SN850X 2TB M.2 NVMe PCIe 4.0",
      model: "WDS200T2X0E",
      categorySlug: "almacenamiento",
      brandName: "WD",
      description: "Unidad NVMe PCIe 4.0 de alto desempeño (hasta 7.300 MB/s) con 2 TB de capacidad para juegos AAA y edición 4K.",
      shortSpecs: { Capacidad: "2 TB", Formato: "M.2 2280", Interfaz: "PCIe 4.0 NVMe", Lectura: "Hasta 7.300 MB/s" },
      costCents: 118000,
      priceCents: 149000,
      stockOnHand: 5,
      minStockAlert: 1,
      warrantyMonths: 24,
      warrantyTerms: "Garantía de 24 meses.",
      isFeatured: true,
      compat: { componentType: "STORAGE", storageInterface: "NVMe_PCIe4" },
    },
    {
      sku: "CT-RAM-CORSAIR-32-D5",
      slug: "corsair-vengeance-rgb-32gb-ddr5-6000",
      name: "Memoria RAM Corsair Vengeance 32GB (2x16GB) DDR5-6000 RGB",
      model: "CMH32GX5M2E6000C36",
      categorySlug: "memorias-ram",
      brandName: "Corsair",
      description: "Kit Dual Channel DDR5 de 6000 MT/s con iluminación iCUE dinámica y disipador de aluminio anodizado.",
      shortSpecs: { Capacidad: "32 GB (2x16 GB)", Tipo: "DDR5", Velocidad: "6000 MT/s", Iluminación: "RGB 10 zonas" },
      costCents: 105000,
      priceCents: 132000,
      stockOnHand: 5,
      minStockAlert: 2,
      warrantyMonths: 24,
      warrantyTerms: "Garantía de 24 meses.",
      compat: { componentType: "RAM", ramGeneration: "DDR5", ramModulesCount: 2, ramCapacityGb: 32 },
    },
    {
      sku: "CT-COOL-AIO-240",
      slug: "deepcool-ls520-se-240mm-argb",
      name: "Refrigeración Líquida AIO DeepCool LS520 SE 240mm ARGB",
      model: "R-LS520-BKAMMM-G-1",
      categorySlug: "refrigeracion",
      brandName: "DeepCool",
      description: "Enfriamiento líquido sellado de 240mm con bomba de 4ª generación y radiador antifugas para procesadores de alto TDP.",
      shortSpecs: { Radiador: "240 mm", Ventiladores: "2x 120 mm ARGB", Sockets: "AM4, AM5, LGA1700", Bomba: "3100 RPM" },
      costCents: 68000,
      priceCents: 89000,
      stockOnHand: 4,
      minStockAlert: 1,
      warrantyMonths: 12,
      warrantyTerms: "Garantía de 12 meses.",
      compat: {
        componentType: "COOLER",
        coolerHeightMm: 55,
        supportedSockets: ["AM4", "AM5", "LGA1700"],
      },
    },
    {
      sku: "CT-CASE-H7-FLOW",
      slug: "nzxt-h7-flow-rgb-atx",
      name: "Gabinete NZXT H7 Flow RGB ATX Mesh",
      model: "CM-H71FB-R1",
      categorySlug: "gabinetes",
      brandName: "NZXT",
      description: "Chasis Mid-Tower amplio con 3 ventiladores frontales RGB de 140mm, gestión de cables oculta y soporte hasta GPU 400mm.",
      shortSpecs: { Placas: "ATX / E-ATX / mATX", MaxGPU: "400 mm", MaxCooler: "185 mm", Ventiladores: "4 incluidos" },
      costCents: 94000,
      priceCents: 119000,
      stockOnHand: 3,
      minStockAlert: 1,
      warrantyMonths: 12,
      warrantyTerms: "Garantía de 12 meses.",
      compat: {
        componentType: "CASE",
        supportedFormFactors: ["ATX", "Micro-ATX", "Mini-ITX"],
        caseMaxGpuLengthMm: 400,
        caseMaxCoolerHeightMm: 185,
      },
    },
    {
      sku: "CT-PSU-RM850E",
      slug: "corsair-rm850e-850w-gold",
      name: "Fuente Modular Corsair RM850e 850W 80 Plus Gold ATX 3.0",
      model: "CP-9020263-NA",
      categorySlug: "fuentes",
      brandName: "Corsair",
      description: "Potencia sobrada 80 Plus Gold 100% modular compatible con ATX 3.0 y tarjetas RTX serie 40/50.",
      shortSpecs: { Potencia: "850 W", Certificación: "80 Plus Gold", Estándar: "ATX 3.0 / 12VHPWR", Cableado: "100% Modular" },
      costCents: 102000,
      priceCents: 129000,
      stockOnHand: 4,
      minStockAlert: 1,
      warrantyMonths: 36,
      warrantyTerms: "Garantía de 36 meses.",
      compat: { componentType: "PSU", psuWatts: 850, pcie8PinConnectors: 4, pcie12Vhpwr: true },
    },
    {
      sku: "CT-PER-DEATHADDER-V3",
      slug: "razer-deathadder-v3-pro-wireless",
      name: "Mouse Gamer Ultraligero Razer DeathAdder V3 Pro",
      model: "RZ01-04630100",
      categorySlug: "perifericos",
      brandName: "Razer",
      description: "Mouse inalámbrico ergonómico de solo 63g con sensor óptico Focus Pro 30K y hasta 90 horas de batería.",
      shortSpecs: { Sensor: "Focus Pro 30K DPI", Peso: "63 gramos", Conexión: "HyperSpeed Wireless / USB-C", Switches: "Ópticos Gen-3" },
      costCents: 58000,
      priceCents: 89000,
      promoPriceCents: 69000,
      promoLabel: "BLACK FRIDAY -22%",
      stockOnHand: 5,
      minStockAlert: 1,
      warrantyMonths: 12,
      warrantyTerms: "Garantía de 12 meses.",
      isFeatured: true,
      compat: { componentType: "PERIPHERAL" },
    },
    {
      sku: "CT-PER-KEYCHRON-K2",
      slug: "hyperx-alloy-origins-65-rgb",
      name: "Teclado Mecánico HyperX Alloy Origins 65 RGB",
      model: "4P5D6AA",
      categorySlug: "perifericos",
      brandName: "HyperX",
      description: "Teclado compacto al 65% con cuerpo completo de aluminio aeronáutico, keycaps PBT y switches lineales HyperX Red.",
      shortSpecs: { Formato: "65% compacto", Chasis: "Aluminio completo", Switches: "HyperX Red Lineal", Cable: "USB-C desmontable" },
      costCents: 56000,
      priceCents: 74000,
      stockOnHand: 6,
      minStockAlert: 2,
      warrantyMonths: 12,
      warrantyTerms: "Garantía de 12 meses.",
      compat: { componentType: "PERIPHERAL" },
    },
  ];

  const productsBySku = new Map<string, { id: string; sku: string; name: string; costCents: number; priceCents: number }>();

  for (const p of productsSeed) {
    const categoryId = categoriesBySlug.get(p.categorySlug)!;
    const brandId = brandsByName.get(p.brandName)!;

    const created = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        name: p.name,
        model: p.model,
        description: p.description,
        shortSpecsJson: p.shortSpecs,
        costCents: p.costCents,
        priceCents: p.priceCents,
        promoPriceCents: p.promoPriceCents ?? null,
        promoLabel: p.promoLabel ?? null,
        minStockAlert: p.minStockAlert,
        warrantyMonths: p.warrantyMonths,
        warrantyTerms: p.warrantyTerms,
        isFeatured: p.isFeatured ?? false,
        isPrebuiltPc: p.isPrebuiltPc ?? false,
        prebuiltTier: p.prebuiltTier ?? null,
      },
      create: {
        sku: p.sku,
        slug: p.slug,
        name: p.name,
        model: p.model,
        categoryId,
        brandId,
        description: p.description,
        shortSpecsJson: p.shortSpecs,
        costCents: p.costCents,
        priceCents: p.priceCents,
        promoPriceCents: p.promoPriceCents ?? null,
        promoLabel: p.promoLabel ?? null,
        stockOnHand: p.stockOnHand,
        stockReserved: 0,
        minStockAlert: p.minStockAlert,
        warrantyMonths: p.warrantyMonths,
        warrantyTerms: p.warrantyTerms,
        isPublished: true,
        isFeatured: p.isFeatured ?? false,
        isPrebuiltPc: p.isPrebuiltPc ?? false,
        prebuiltTier: p.prebuiltTier ?? null,
      },
    });
    productsBySku.set(p.sku, created);

    // CompatibilitySpec
    await prisma.compatibilitySpec.upsert({
      where: { productId: created.id },
      update: {
        componentType: p.compat.componentType,
        socket: p.compat.socket ?? null,
        chipset: p.compat.chipset ?? null,
        biosVersionRequired: p.compat.biosVersionRequired ?? null,
        ramGeneration: p.compat.ramGeneration ?? null,
        ramSlots: p.compat.ramSlots ?? null,
        ramModulesCount: p.compat.ramModulesCount ?? null,
        ramCapacityGb: p.compat.ramCapacityGb ?? null,
        maxRamGb: p.compat.maxRamGb ?? null,
        formFactor: p.compat.formFactor ?? null,
        supportedFormFactors: p.compat.supportedFormFactors ?? undefined,
        tdpWatts: p.compat.tdpWatts ?? null,
        recommendedPsuWatts: p.compat.recommendedPsuWatts ?? null,
        psuWatts: p.compat.psuWatts ?? null,
        pcie8PinConnectors: p.compat.pcie8PinConnectors ?? null,
        pcie12Vhpwr: p.compat.pcie12Vhpwr ?? null,
        gpuLengthMm: p.compat.gpuLengthMm ?? null,
        caseMaxGpuLengthMm:
          p.compat.caseMaxGpuLengthMm === undefined ? null : p.compat.caseMaxGpuLengthMm,
        coolerHeightMm: p.compat.coolerHeightMm ?? null,
        caseMaxCoolerHeightMm: p.compat.caseMaxCoolerHeightMm ?? null,
        supportedSockets: p.compat.supportedSockets ?? undefined,
        m2Slots: p.compat.m2Slots ?? null,
        sataPorts: p.compat.sataPorts ?? null,
        storageInterface: p.compat.storageInterface ?? null,
        hasIntegratedGraphics: p.compat.hasIntegratedGraphics ?? null,
      },
      create: {
        productId: created.id,
        componentType: p.compat.componentType,
        socket: p.compat.socket ?? null,
        chipset: p.compat.chipset ?? null,
        biosVersionRequired: p.compat.biosVersionRequired ?? null,
        ramGeneration: p.compat.ramGeneration ?? null,
        ramSlots: p.compat.ramSlots ?? null,
        ramModulesCount: p.compat.ramModulesCount ?? null,
        ramCapacityGb: p.compat.ramCapacityGb ?? null,
        maxRamGb: p.compat.maxRamGb ?? null,
        formFactor: p.compat.formFactor ?? null,
        supportedFormFactors: p.compat.supportedFormFactors ?? undefined,
        tdpWatts: p.compat.tdpWatts ?? null,
        recommendedPsuWatts: p.compat.recommendedPsuWatts ?? null,
        psuWatts: p.compat.psuWatts ?? null,
        pcie8PinConnectors: p.compat.pcie8PinConnectors ?? null,
        pcie12Vhpwr: p.compat.pcie12Vhpwr ?? null,
        gpuLengthMm: p.compat.gpuLengthMm ?? null,
        caseMaxGpuLengthMm:
          p.compat.caseMaxGpuLengthMm === undefined ? null : p.compat.caseMaxGpuLengthMm,
        coolerHeightMm: p.compat.coolerHeightMm ?? null,
        caseMaxCoolerHeightMm: p.compat.caseMaxCoolerHeightMm ?? null,
        supportedSockets: p.compat.supportedSockets ?? undefined,
        m2Slots: p.compat.m2Slots ?? null,
        sataPorts: p.compat.sataPorts ?? null,
        storageInterface: p.compat.storageInterface ?? null,
        hasIntegratedGraphics: p.compat.hasIntegratedGraphics ?? null,
      },
    });

    // Images from manifest
    const imgs = manifest.products[p.sku] ?? [];
    const existingImgs = await prisma.productImage.count({ where: { productId: created.id } });
    if (existingImgs === 0 && imgs.length > 0) {
      await prisma.productImage.createMany({
        data: imgs.map((im, idx) => ({
          productId: created.id,
          url: im.file,
          altText: im.alt,
          isPrimary: idx === 0,
          isIllustrative: !im.exact,
          author: im.author,
          license: im.license,
          licenseUrl: im.licenseUrl,
          sourceUrl: im.sourceUrl,
          sortOrder: idx,
        })),
      });
    }
  }

  // 6. Technical Services Catalog (7)
  const servicesSeed = [
    {
      slug: "diagnostico-integral",
      name: "Diagnóstico integral de PC o Laptop",
      category: "DIAGNOSTIC" as const,
      description: "Revisión de salud de discos, memoria, temperaturas bajo carga, voltajes de fuente y estado físico para detectar la causa raíz de lentitud o fallas.",
      scope: "Informe escrito de hallazgos, reporte térmico y cotización transparente antes de cualquier intervención.",
      pricingType: "FIXED" as const,
      basePriceCents: 8000, // Bs 80 demo
      estimatedDurationHours: 2,
      conditions: "Precio referencial de demostración. Descontable si se aprueba la reparación cotizada.",
      imageUrl: manifest.services[0]?.file ?? null,
      sortOrder: 1,
    },
    {
      slug: "mantenimiento-preventivo",
      name: "Mantenimiento preventivo completo",
      category: "PREVENTIVE_MAINTENANCE" as const,
      description: "Limpieza interna completa de polvo en ventiladores, disipadores y bahías, más reemplazo de pasta térmica y verificación de temperaturas.",
      scope: "Incluye pasta térmica ARCTIC MX-4, limpieza segura ESD y pruebas térmicas antes y después.",
      pricingType: "FIXED" as const,
      basePriceCents: 15000, // Bs 150 demo
      estimatedDurationHours: 3,
      conditions: "El equipo se entrega con resumen de temperaturas registradas y checklist de pruebas.",
      imageUrl: manifest.services[1]?.file ?? null,
      sortOrder: 2,
    },
    {
      slug: "mantenimiento-correctivo-reparacion",
      name: "Mantenimiento correctivo y reparación de fallas",
      category: "CORRECTIVE_MAINTENANCE" as const,
      description: "Solución a equipos que no encienden, se apagan por temperatura, presentan pantallas azules o daños de hardware/almacenamiento.",
      scope: "Diagnóstico previo obligatorio y cotización por versión aprobada por el cliente.",
      pricingType: "SUBJECT_TO_DIAGNOSIS" as const,
      basePriceCents: null,
      estimatedDurationHours: 6,
      conditions: "Ningún trabajo con costo o cambio de repuesto se ejecuta sin aceptación explícita del cliente.",
      imageUrl: manifest.services[3]?.file ?? null,
      sortOrder: 3,
    },
    {
      slug: "ensamblaje-personalizado",
      name: "Ensamblaje personalizado de PC + Cableado + Pruebas",
      category: "CUSTOM_ASSEMBLY" as const,
      description: "Armado profesional de computadora a medida, gestión ordenada de cables, actualización de BIOS si procede y pruebas de estabilidad.",
      scope: "Verificación de compatibilidad, armado, perfiles XMP/EXPO y pruebas de estrés.",
      pricingType: "FIXED" as const,
      basePriceCents: 18000, // Bs 180 demo
      estimatedDurationHours: 4,
      conditions: "Costo aplicable al configurador «Arma tu PC» cuando se contrata armado en taller.",
      imageUrl: manifest.services[2]?.file ?? null,
      sortOrder: 4,
    },
    {
      slug: "actualizacion-componentes",
      name: "Instalación y actualización de hardware (RAM / SSD / GPU / PSU)",
      category: "UPGRADE" as const,
      description: "Instalación física de mejoras compatibles, migración o inicialización de unidad SSD y verificación de fuente/flujo de aire.",
      scope: "Incluye montaje, actualización de drivers y comprobación de reconocimiento en sistema.",
      pricingType: "FIXED" as const,
      basePriceCents: 9000, // Bs 90 demo
      estimatedDurationHours: 2,
      conditions: "Los componentes pueden adquirirse en ClickTech o ser evaluados previamente por compatibilidad.",
      imageUrl: manifest.services[2]?.file ?? null,
      sortOrder: 5,
    },
    {
      slug: "instalacion-sistema-software",
      name: "Instalación de sistema operativo y software base",
      category: "SOFTWARE_INSTALL" as const,
      description: "Instalación limpia de sistema operativo (con licencia proporcionada por el cliente o software libre), controladores oficiales y respaldo de datos acordado.",
      scope: "Configuración inicial estable sin programas innecesarios ni software no autorizado.",
      pricingType: "FIXED" as const,
      basePriceCents: 10000, // Bs 100 demo
      estimatedDurationHours: 3,
      conditions: "El respaldo previo de archivos críticos debe coordinarse al recibir el equipo.",
      imageUrl: manifest.services[3]?.file ?? null,
      sortOrder: 6,
    },
    {
      slug: "soporte-empresas-pymes",
      name: "Soporte técnico y mantenimiento para PyMEs e Instituciones (B2B)",
      category: "B2B_SUPPORT" as const,
      description: "Atención programada de estaciones de trabajo, evaluación de renovación de hardware y mantenimiento preventivo por lotes en Potosí.",
      scope: "Levantamiento de requerimientos, cotización formal por cantidades y cronograma.",
      pricingType: "SUBJECT_TO_DIAGNOSIS" as const,
      basePriceCents: null,
      estimatedDurationHours: 8,
      conditions: "Sujeto a evaluación de parque de equipos y cobertura.",
      imageUrl: manifest.services[4]?.file ?? null,
      sortOrder: 7,
    },
  ];

  const servicesBySlug = new Map<string, string>();
  for (const s of servicesSeed) {
    const srv = await prisma.serviceCatalog.upsert({
      where: { slug: s.slug },
      update: s,
      create: s,
    });
    servicesBySlug.set(s.slug, srv.id);
  }

  // 7. Pending Business Data & Operational Configuration
  const configEntries = [
    {
      key: "pending_business_contacts",
      isPendingRealData: true,
      description: "Teléfono oficial, WhatsApp Business, correo comercial y dirección física exacta en Potosí.",
      valueJson: {
        whatsappNumber: "",
        publicPhone: "",
        publicEmail: "",
        physicalAddress: "",
        city: "Potosí, Bolivia",
        businessHours: "Pendiente de configuración operativa (zona America/La_Paz)",
      },
    },
    {
      key: "pending_fiscal_legal",
      isPendingRealData: true,
      description: "Razón social, NIT y textos legales definitivos de garantía y devoluciones.",
      valueJson: {
        legalName: "ClickTech (Emprendimiento en configuración)",
        nit: "",
        electronicInvoicingEnabled: false,
        warrantyDefaultPolicy: "Pendiente de validación comercial — verificar duración específica por SKU.",
      },
    },
    {
      key: "payment_settings",
      isPendingRealData: true,
      description: "Cuentas bancarias, QR real y habilitación de pago al recoger.",
      valueJson: {
        demoPaymentSandboxEnabled: true,
        transferQrEnabled: true,
        payOnPickupEnabled: true,
        bankName: "Entidad bancaria pendiente de configuración",
        accountNumber: "",
        accountHolder: "",
        qrConfigured: false,
        demoNotice: "ENTORNO DE DEMOSTRACIÓN: no existen cuentas bancarias reales conectadas; los comprobantes subidos pasan a revisión manual del administrador.",
      },
    },
    {
      key: "workshop_capacity",
      isPendingRealData: false,
      description: "Capacidad diaria y horario de citas técnicas en America/La_Paz.",
      valueJson: {
        timezone: "America/La_Paz",
        maxDailyAppointments: 6,
        openHour: 9,
        closeHour: 19,
      },
    },
  ];

  for (const cfg of configEntries) {
    await prisma.businessConfig.upsert({
      where: { key: cfg.key },
      update: {
        description: cfg.description,
        isPendingRealData: cfg.isPendingRealData,
      },
      create: {
        key: cfg.key,
        valueJson: cfg.valueJson,
        isPendingRealData: cfg.isPendingRealData,
        description: cfg.description,
        updatedById: adminUser.id,
      },
    });
  }

  // 8. Seed Operational Demo Data (only if empty so seed is repeatable without duplicating!)
  const existingOrders = await prisma.order.count();
  if (existingOrders === 0) {
    const supplier = await prisma.supplier.create({
      data: {
        name: "Importadora Hardware Altiplano (Demo)",
        contactName: "Proveedor Mayorista Demo",
        phone: "000-11000",
        city: "La Paz / Potosí",
        notes: "Proveedor ficticio para demostración de compras y recepción.",
      },
    });

    const gpu = productsBySku.get("CT-GPU-RTX4060-VENTUS")!;
    const ssd = productsBySku.get("CT-SSD-NV2-1TB")!;
    const ram = productsBySku.get("CT-RAM-FURY-16-D4")!;
    const mx4 = productsBySku.get("CT-ACC-MX4")!;
    const mouse = productsBySku.get("CT-PER-G502-HERO")!;

    // Completed Purchase Order + Receipt
    const po1 = await prisma.purchaseOrder.create({
      data: {
        code: "OC-2026-DEMO-01",
        supplierId: supplier.id,
        status: "RECEIVED",
        totalCostCents: gpu.costCents * 4 + ssd.costCents * 6,
        notes: "Compra inicial de demostración ya recibida en almacén.",
        createdById: adminUser.id,
        items: {
          create: [
            {
              productId: gpu.id,
              productNameSnapshot: gpu.name,
              skuSnapshot: gpu.sku,
              orderedQty: 4,
              receivedQty: 4,
              unitCostCents: gpu.costCents,
            },
            {
              productId: ssd.id,
              productNameSnapshot: ssd.name,
              skuSnapshot: ssd.sku,
              orderedQty: 6,
              receivedQty: 6,
              unitCostCents: ssd.costCents,
            },
          ],
        },
      },
    });

    await prisma.purchaseReceipt.create({
      data: {
        purchaseOrderId: po1.id,
        idempotencyKey: "seed-po1-receipt",
        receivedById: adminUser.id,
        notes: "Recepción total verificada en almacén demo.",
        itemsJson: [
          { sku: gpu.sku, qty: 4 },
          { sku: ssd.sku, qty: 6 },
        ],
      },
    });

    // Pending Purchase Order (ORDERED, not yet received -> stock not increased!)
    await prisma.purchaseOrder.create({
      data: {
        code: "OC-2026-DEMO-02",
        supplierId: supplier.id,
        status: "ORDERED",
        totalCostCents: ram.costCents * 5,
        notes: "Pedido en tránsito (stock NO sumado hasta recepción física).",
        createdById: adminUser.id,
        items: {
          create: [
            {
              productId: ram.id,
              productNameSnapshot: ram.name,
              skuSnapshot: ram.sku,
              orderedQty: 5,
              receivedQty: 0,
              unitCostCents: ram.costCents,
            },
          ],
        },
      },
    });

    // Initial Inventory ledger records
    await prisma.inventoryMovement.createMany({
      data: [
        {
          productId: gpu.id,
          type: "PURCHASE_RECEIPT",
          quantityDelta: 4,
          stockOnHandAfter: 4,
          stockReservedAfter: 0,
          unitCostCentsSnapshot: gpu.costCents,
          referenceType: "PURCHASE",
          referenceId: po1.id,
          idempotencyKey: "seed-mov-gpu-po1",
          reason: "Ingreso por orden de compra OC-2026-DEMO-01",
          actorId: adminUser.id,
        },
        {
          productId: ssd.id,
          type: "PURCHASE_RECEIPT",
          quantityDelta: 6,
          stockOnHandAfter: 10,
          stockReservedAfter: 0,
          unitCostCentsSnapshot: ssd.costCents,
          referenceType: "PURCHASE",
          referenceId: po1.id,
          idempotencyKey: "seed-mov-ssd-po1",
          reason: "Ingreso por orden de compra OC-2026-DEMO-01",
          actorId: adminUser.id,
        },
      ],
    });

    // Demo Delivered Order for Diego + Warranty
    const order1 = await prisma.order.create({
      data: {
        orderNumber: "CT-2026-DEMO-001",
        idempotencyKey: "seed-order-001",
        userId: diegoUser.id,
        status: "DELIVERED",
        paymentStatus: "APPROVED",
        deliveryMethod: "PICKUP_POTOSI",
        deliveryStatus: "DELIVERED",
        subtotalCents: mouse.priceCents + ssd.priceCents,
        totalCents: mouse.priceCents + ssd.priceCents,
        paymentMethod: "TRANSFER_QR_MANUAL",
        notes: "Pedido de demostración entregado para verificar historial y garantías.",
        items: {
          create: [
            {
              productId: mouse.id,
              skuSnapshot: mouse.sku,
              productNameSnapshot: mouse.name,
              modelSnapshot: "G502 HERO",
              unitPriceCentsSnapshot: mouse.priceCents,
              unitCostCentsSnapshot: mouse.costCents,
              warrantyMonthsSnapshot: 12,
              warrantyTermsSnapshot: "Garantía demo de 12 meses.",
              quantity: 1,
              lineTotalCents: mouse.priceCents,
            },
            {
              productId: ssd.id,
              skuSnapshot: ssd.sku,
              productNameSnapshot: ssd.name,
              modelSnapshot: "SNV2S/1000G",
              unitPriceCentsSnapshot: ssd.priceCents,
              unitCostCentsSnapshot: ssd.costCents,
              warrantyMonthsSnapshot: 12,
              warrantyTermsSnapshot: "Garantía demo de 12 meses.",
              quantity: 1,
              lineTotalCents: ssd.priceCents,
            },
          ],
        },
        payments: {
          create: {
            idempotencyKey: "seed-pay-001",
            method: "TRANSFER_QR_MANUAL",
            amountCents: mouse.priceCents + ssd.priceCents,
            status: "APPROVED",
            referenceNumber: "DEMO-REF-001",
            submittedByUserId: diegoUser.id,
            reviewedByUserId: adminUser.id,
            reviewedAt: new Date(Date.now() - 86400_000 * 3),
            reviewNotes: "Pago demo conciliado correctamente.",
          },
        },
      },
      include: { items: true },
    });

    await prisma.warranty.create({
      data: {
        code: "GAR-DEMO-G502-01",
        userId: diegoUser.id,
        orderItemId: order1.items[0].id,
        itemLabel: `${mouse.name} (1x)`,
        durationMonths: 12,
        startsAt: new Date(Date.now() - 86400_000 * 3),
        expiresAt: new Date(Date.now() + 86400_000 * 362),
        terms: "Garantía demo de 12 meses contra fallos de fábrica.",
        deliveryEvidenceNotes: "Entrega registrada en pedido CT-2026-DEMO-001",
      },
    });

    // Demo Order with Payment under Review
    await prisma.order.create({
      data: {
        orderNumber: "CT-2026-DEMO-002",
        idempotencyKey: "seed-order-002",
        userId: customerUser.id,
        status: "PAYMENT_UNDER_REVIEW",
        paymentStatus: "PROOF_SUBMITTED",
        deliveryMethod: "LOCAL_DELIVERY",
        deliveryStatus: "PENDING",
        deliveryFeeCents: 1500,
        subtotalCents: ram.priceCents,
        totalCents: ram.priceCents + 1500,
        paymentMethod: "TRANSFER_QR_MANUAL",
        reservationExpiresAt: new Date(Date.now() + 86400_000),
        notes: "Comprobante de prueba pendiente de revisión por Ventas/Admin.",
        items: {
          create: [
            {
              productId: ram.id,
              skuSnapshot: ram.sku,
              productNameSnapshot: ram.name,
              modelSnapshot: "KF432C16BBK2/16",
              unitPriceCentsSnapshot: ram.priceCents,
              unitCostCentsSnapshot: ram.costCents,
              warrantyMonthsSnapshot: 24,
              warrantyTermsSnapshot: "Garantía demo de 24 meses.",
              quantity: 1,
              lineTotalCents: ram.priceCents,
            },
          ],
        },
        payments: {
          create: {
            idempotencyKey: "seed-pay-002",
            method: "TRANSFER_QR_MANUAL",
            amountCents: ram.priceCents + 1500,
            status: "PROOF_SUBMITTED",
            referenceNumber: "DEMO-COMPROBANTE-782",
            submittedByUserId: customerUser.id,
          },
        },
      },
    });

    // Demo Service Order for Andrea (at QUOTE_PENDING_APPROVAL so user can test accepting!)
    const srvMaintId = servicesBySlug.get("mantenimiento-preventivo")!;
    const so1 = await prisma.serviceOrder.create({
      data: {
        ticketNumber: "ST-2026-DEMO-001",
        userId: andreaUser.id,
        customerName: andreaUser.name,
        customerEmail: andreaUser.email,
        customerPhone: "000-00006",
        serviceCatalogId: srvMaintId,
        deviceType: "LAPTOP",
        deviceBrandModel: "Lenovo IdeaPad 3 (Demo)",
        deviceSerial: "DEMO-SN-99182",
        accessoriesReceived: "Cargador original de 65W",
        initialPhysicalState: "Carcasa íntegra, ventilación obstruida con polvo.",
        reportedSymptoms: "Lentitud al abrir hojas de cálculo y calentamiento en teclado tras 20 minutos.",
        preferredSchedule: new Date(Date.now() + 86400_000),
        deliveryModality: "DROP_OFF_POINT",
        status: "QUOTE_PENDING_APPROVAL",
        assignedTechId: techUser.id,
        diagnosisReport: "Pasta térmica reseca y obstrucción de rejilla de disipación; disco SSD al 94% de salud.",
        internalNotes: "SOLO PERSONAL INTERNO: Revisar bisagra derecha con leve holgura antes de cerrar carcasa.",
        laborCents: 15000,
        partsTotalCents: mx4.priceCents,
        activeQuoteVersion: 1,
      },
    });

    await prisma.serviceOrderTimeline.createMany({
      data: [
        {
          serviceOrderId: so1.id,
          fromStatus: null,
          toStatus: "REQUEST_RECEIVED",
          publicMessage: "Solicitud de mantenimiento preventivo recibida.",
          actorId: andreaUser.id,
        },
        {
          serviceOrderId: so1.id,
          fromStatus: "REQUEST_RECEIVED",
          toStatus: "EQUIPMENT_RECEIVED",
          publicMessage: "Equipo recibido con cargador original; estado físico inicial documentado.",
          actorId: techUser.id,
        },
        {
          serviceOrderId: so1.id,
          fromStatus: "EQUIPMENT_RECEIVED",
          toStatus: "QUOTE_PENDING_APPROVAL",
          publicMessage: "Diagnóstico completado. Se emitió cotización v1 con mano de obra y pasta térmica ARCTIC MX-4.",
          internalNote: "Bisagra derecha requiere ajuste de tornillo sin costo adicional.",
          actorId: techUser.id,
        },
      ],
    });

    await prisma.quote.create({
      data: {
        quoteNumber: "COT-ST-2026-DEMO-001",
        type: "SERVICE_ORDER",
        userId: andreaUser.id,
        customerName: andreaUser.name,
        customerEmail: andreaUser.email,
        customerPhone: "000-00006",
        status: "SENT_PENDING_APPROVAL",
        currentVersion: 1,
        validUntil: new Date(Date.now() + 86400_000 * 7),
        serviceOrderId: so1.id,
        versions: {
          create: {
            version: 1,
            itemsSnapshotJson: [
              { kind: "LABOR", label: "Mantenimiento preventivo completo", quantity: 1, unitPriceCents: 15000, lineTotalCents: 15000 },
              { kind: "PART", sku: mx4.sku, label: mx4.name, quantity: 1, unitPriceCents: mx4.priceCents, lineTotalCents: mx4.priceCents },
            ],
            subtotalCents: mx4.priceCents,
            assemblyOrLaborCents: 15000,
            totalCents: 15000 + mx4.priceCents,
            termsSnapshot: "Incluye pruebas térmicas antes y después. Cambios de costo requieren nueva aceptación.",
            changeReason: "Cotización tras diagnóstico inicial",
            status: "PENDING",
            createdById: techUser.id,
          },
        },
      },
    });

    // B2B Quote Request example
    await prisma.quote.create({
      data: {
        quoteNumber: "COT-B2B-2026-001",
        type: "B2B_CORPORATE",
        customerName: "Coordinación Informática (Demo)",
        customerEmail: "b2b.demo@clicktech.example",
        customerPhone: "000-22000",
        companyName: "Estudio Contable Potosí (Demo)",
        notes: "Solicitud de 4 PCs de oficina + mantenimiento semestral.",
        status: "SENT_PENDING_APPROVAL",
        currentVersion: 1,
        validUntil: new Date(Date.now() + 86400_000 * 10),
        versions: {
          create: {
            version: 1,
            itemsSnapshotJson: [
              { kind: "PRODUCT", sku: "CT-PC-ESTUDIO", label: "PC Estudio y Trabajo Confiable", quantity: 4, unitPriceCents: 405000, lineTotalCents: 1620000 },
            ],
            subtotalCents: 1620000,
            assemblyOrLaborCents: 0,
            totalCents: 1620000,
            termsSnapshot: "Propuesta B2B de demostración; precios sujetos a confirmación de stock.",
            changeReason: "Propuesta corporativa inicial",
            status: "PENDING",
            createdById: adminUser.id,
          },
        },
      },
    });

    // Demo Consultation linked to Order 1
    await prisma.consultation.create({
      data: {
        userId: diegoUser.id,
        customerName: diegoUser.name,
        customerEmail: diegoUser.email,
        subject: "Consulta sobre futura instalación de GPU dedicada en PC Inicial",
        orderId: order1.id,
        status: "ANSWERED",
        messages: {
          create: [
            {
              senderRole: "CUSTOMER",
              senderName: diegoUser.name,
              body: "Hola, cuando decida agregar una RTX 4060 el próximo semestre, ¿necesito cambiar mi fuente de 650W?",
            },
            {
              senderRole: "TECH",
              senderName: techUser.name,
              body: "Hola Diego, con una fuente de 650W 80 Plus Bronze y un conector PCIe de 8 pines cubres sin problema una RTX 4060. Puedes traer el equipo para instalación y prueba de estabilidad.",
            },
          ],
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: adminUser.id,
        actorRole: "ADMIN",
        action: "DEMO_SEED_COMPLETED",
        entityType: "SYSTEM",
        entityId: "seed-v1",
        afterJson: { productsCount: productsSeed.length, servicesCount: servicesSeed.length },
      },
    });
  }

  console.log("Seed finished. Dev credentials written to .dev-credentials.local (gitignored).");
}

main()
  .catch((err) => {
    console.error("Seed error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
