# DESIGN.md — Sistema Visual y Movimiento de ClickTech

## 1. Dirección Visual (`Taste Skill` + Identidad ClickTech)

La identidad de **ClickTech** (*«Tecnología a tu medida»*) combina precisión técnica racional (confianza en compatibilidad, precios y diagnóstico) con la energía visual del hardware gamer:

| Token CSS | Valor (Tema Oscuro — Principal) | Valor (Tema Claro) | Uso |
| --- | --- | --- | --- |
| `--bg-chassis` | `#02040A` | `#F8FAFC` | Fondo principal negro chasis |
| `--bg-surface` | `#0A0F1D` | `#FFFFFF` | Tarjetas, paneles, tablas y drawer |
| `--bg-card-media` | `#0F1629` | `#E2E8F0` | Fondo neutro para fotografía `contain` de hardware |
| `--accent-cyan` | `#00E5FF` | `#0369A1` | Acento principal, CTA de compra, compatibilidad, foco |
| `--accent-purple` | `#8B5CF6` | `#6D28D9` | Acento secundario gamer, asesoría por presupuesto, ensamblaje |
| `--text-primary` | `#FFFFFF` | `#0F172A` | Títulos, precios en Bs y etiquetas clave |
| `--text-secondary` | `#CBD5E1` | `#334155` | Cuerpo de texto (>= 7:1 sobre negro chasis) |
| `--text-muted` | `#94A3B8` | `#475569` | Metadatos, SKUs y ayudas (>= 4.6:1 sobre superficie) |

### Resolución de Conflictos entre `Taste Skill` y el Brief de ClickTech
- **Paleta morada (`#8B5CF6`):** La regla genérica de `taste-skill` sugiere evitar tonos violeta por defecto; sin embargo, la regla explícita de identidad del brief de ClickTech (`ClickTech_Presentacion_Marca_v2.html` y `ClickTech_Prompt_Maestro_Antigravity.md`) establece `#00E5FF` (cian) y `#8B5CF6` (morado) como colores oficiales. Conforme a la jerarquía del brief («el brief gana»), se conservó `#8B5CF6` como acento secundario gamer sin saturar los bloques de datos ni las tablas de gestión.
- **Portada comercial vs sitio estático de marketing:** `taste-skill` orienta sitios de una sección por pantalla sin rejillas densas; ClickTech es una tienda operativa de comercio electrónico y servicio técnico, por lo que se adoptó el encabezado fijo funcional con buscador y carrito, hero amplio con fotografía real + pieza HyperFrames y rejillas de 4 columnas en catálogo (`object-contain` en productos, `object-cover` en banners).

### Tipografía
- **Display:** `Orbitron` (`700`, `800`) en títulos hero, pieza HyperFrames y marcadores de identidad con cortes biselados a 45° (`.ct-chassis-cut`).
- **Encabezados y precios:** `Space Grotesk` (`500`, `600`, `700`) con `font-variant-numeric: tabular-nums` en importes en `Bs`, SKUs y existencias.
- **Cuerpo y formularios:** `Plus Jakarta Sans` (`400`–`700`).

---

## 2. Revisión Aplicada de `Impeccable` (`craft-floor` / `audit` / `polish`)

| Aspecto revisado | Hallazgo inicial / Riesgo | Corrección implementada |
| --- | --- | --- |
| **Logotipo transparente en navbar** | `logo_user_overlay.png` (500×500) incluía amplio margen vacío transparente, haciendo pequeño el isotipo. | Se generó `public/brand/logo_trimmed.png` (430×325) recortando el exceso transparente sin deformar ni alterar el arte original. |
| **Superficies del navegador** | Scrollbar, selección de texto y foco con estilos por defecto del navegador. | Se diseñaron `::selection`, `::-webkit-scrollbar` y `:focus-visible` (`2px solid var(--accent-cyan)`) en `src/app/globals.css`. |
| **Contraste en modo claro y oscuro** | `#00E5FF` sobre fondo blanco no alcanza contraste 4.5:1 en texto o botones. | En `[data-theme="light"]` se mapeó `--accent-cyan` a `#0369A1` con texto `#FFFFFF`, garantizando contraste WCAG AA en ambos temas. |
| **Honestidad visual de fotografías** | Fotografías de categoría podían confundirse con fotos exactas de un SKU o mostrar capturas con texto ajeno. | Se auditaron y sustituyeron capturas de video/edificios en Wikimedia Commons y cada tarjeta muestra badge explícito («Foto del modelo» vs «Imagen ilustrativa»). |
| **Uso de iconografía** | Riesgo de emojis o iconos dispares en estados y tarjetas. | Iconografía unificada exclusivamente con `lucide-react` y badges semánticos de color con texto explícito. |

---

## 3. Revisión de Movimiento (`Emil Kowalski`: `emil-design-eng`, `animate`, `review-animations`)

| Antes (riesgo común) | Después (implementación en `globals.css` y componentes) | Justificación |
| --- | --- | --- |
| `transition: all 200ms` en botones y tarjetas | Propiedades explícitas: `transition: transform 160ms var(--ease-out), background-color 150ms ease, border-color 150ms ease` | Evita recalcular propiedades no GPU y animaciones involuntarias de layout. |
| Falta de respuesta táctil al presionar botones | `.ct-btn:active:not(:disabled) { transform: scale(0.97); }` | Retroalimentación física inmediata (160ms `ease-out`). |
| `:hover` activado por toque en móviles | `.ct-card:hover` encapsulado en `@media (hover: hover) and (pointer: fine)` | Evita estados hover pegajosos en pantallas táctiles (360px / tablet). |
| Entradas desde `scale(0)` o movimiento lento | `.ct-hero-enter` y `.ct-modal` parten de `scale(0.985)` / `scale(0.96)` + `opacity: 0` en 220–420ms `cubic-bezier(0.23, 1, 0.32, 1)` | Nada aparece de la nada; curva `ease-out` fuerte de respuesta inmediata. |
| Drawer de carrito con curva lineal o genérica | `.ct-drawer` usa `--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)` a 350ms | Movimiento tipo hoja nativa sin rebote artificial. |
| Animaciones continuas ignorando accesibilidad | `@media (prefers-reduced-motion: reduce)` anula desplazamientos y `HyperFramesHeroPlayer` muestra la portada estática `clicktech-brand-poster.webp` | Cumple accesibilidad para sensibilidad al movimiento sin ocultar contenido. |

---

## 4. Pieza Audiovisual HyperFrames

- Fuente editable: `brand-video/index.html` (`1920×1080`, `30 fps`, `8.0 s`, sin audio).
- Integración en Inicio: `src/components/catalog/HyperFramesHeroPlayer.tsx` reproduce `clicktech-brand.webm` (300 KB) con respaldo `clicktech-brand.mp4`, póster `clicktech-brand-poster.webp`, botón accesible de reproducción/pausa y conmutación automática a imagen estática bajo `prefers-reduced-motion: reduce`.
