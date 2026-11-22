import fs from "node:fs";
import path from "node:path";

interface ImgEntry {
  file: string;
  alt: string;
  exact: boolean;
  title: string;
  author: string;
  license: string;
  licenseUrl: string;
  sourceUrl: string;
}

export default function CreditosPage() {
  const manifestPath = path.resolve(process.cwd(), "prisma", "seed-data", "images.json");
  const raw = JSON.parse(fs.readFileSync(manifestPath, "utf-8").replace(/^\uFEFF/, "")) as {
    products: Record<string, ImgEntry[]>;
    categories: Record<string, ImgEntry>;
    hero: ImgEntry[];
    services: ImgEntry[];
  };

  const rows: Array<{ scope: string; entry: ImgEntry }> = [];
  for (const [sku, arr] of Object.entries(raw.products)) {
    if (arr[0]) rows.push({ scope: `Producto (${sku})`, entry: arr[0] });
  }
  for (const [slug, e] of Object.entries(raw.categories)) {
    rows.push({ scope: `Categoría (${slug})`, entry: e });
  }
  raw.hero.forEach((e, idx) => rows.push({ scope: `Hero #${idx + 1}`, entry: e }));
  raw.services.forEach((e, idx) => rows.push({ scope: `Servicio #${idx + 1}`, entry: e }));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold">
          Créditos Visuales y Licencias
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
          Atribuciones de fotografías de hardware bajo licencias libres (CC0, Public Domain, CC BY, CC BY-SA) obtenidas mediante la API pública de Wikimedia Commons, además de los logotipos originales provistos por el propietario de ClickTech y tipografías SIL OFL 1.1.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border-subtle)" }}>
        <table className="w-full text-xs text-left" style={{ backgroundColor: "var(--bg-surface)" }}>
          <thead>
            <tr className="border-b" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
              <th className="p-3">Uso</th>
              <th className="p-3">Correspondencia</th>
              <th className="p-3">Autor</th>
              <th className="p-3">Licencia</th>
              <th className="p-3">Fuente</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="p-3 font-medium">{r.scope}</td>
                <td className="p-3">
                  {r.entry.exact ? "Exacta" : "Ilustrativa de categoría"}
                </td>
                <td className="p-3">{r.entry.author}</td>
                <td className="p-3">
                  <a
                    href={r.entry.licenseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                    style={{ color: "var(--accent-cyan)" }}
                  >
                    {r.entry.license}
                  </a>
                </td>
                <td className="p-3">
                  <a
                    href={r.entry.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Wikimedia Commons
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
