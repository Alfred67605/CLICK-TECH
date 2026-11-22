# Pieza Audiovisual de Marca — ClickTech (`HyperFrames`)

- **Herramienta y versión**: `hyperframes@0.9.72` (CLI ejecutado en modo autónomo local).
- **Fuente editable**: [index.html](file:///c:/Users/llano/Downloads/PROYECTO%20EMP.%20DIGITAL/clicktech/brand-video/index.html)
- **Especificaciones de salida**:
  - Maestro MP4 (H.264, 1920×1080, 30 fps, sin pista de audio): `public/media/brand/clicktech-brand.mp4` (`5,614,431` bytes, duración verificada por `ffprobe`: `8.000000 s`).
  - Versión web optimizada (VP9, 1280×720, sin audio): `public/media/brand/clicktech-brand.webm` (`300,727` bytes, duración verificada por `ffprobe`: `8.000000 s`).
  - Portada estática / alternativa de movimiento reducido: `public/media/brand/clicktech-brand-poster.webp` y `public/media/brand/clicktech-brand-poster.jpg` (extraída en `t=6.2s`).
- **Composición y línea de tiempo (8 s)**:
  1. `0.0s – 4.8s`: Acercamiento suave sobre hardware gamer real (`hero-1.webp`) con barrido luminoso cian (`#00E5FF`) / morado (`#8B5CF6`) y marco biselado.
  2. `1.1s – 5.0s`: Transición hacia tarjeta gráfica (`hero-2.webp`), ingreso del logotipo transparente original `logo_user_overlay.png` (`expo.out`) y revelación del lema «Tecnología a tu medida» + «Más que tecnología, es tu pasión».
  3. `4.2s – 8.0s`: Insignia de ubicación «POTOSÍ, BOLIVIA · HARDWARE & SERVICIO TÉCNICO» y estabilización para bucle limpio.
- **Variables editables (`data-composition-variables`)**: `heroPlatePrimary`, `heroPlateSecondary`, `brandLogo`, `sloganPrimary`, `sloganSecondary`, `locationLabel`.
- **Fuentes y activos**: `Orbitron` y `Space Grotesk` bajo licencia SIL OFL 1.1 (`assets/fonts/`), logotipo provisto por el propietario (`logo_user_overlay.png`) y fotografías reales de Wikimedia Commons documentadas en `docs/ASSETS.md`.
- **Comandos verificados**:
  - `npx hyperframes lint` (0 errores)
  - `npx hyperframes check --json` (`ok: true`, `errorCount: 0`)
  - `npx hyperframes snapshot --at 1,4,6.5` (4 fotogramas inspeccionados en `contact-sheet.jpg`)
  - `npx hyperframes render --quality delivery -o ..\public\media\brand\clicktech-brand.mp4`
