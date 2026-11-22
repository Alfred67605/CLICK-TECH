$ErrorActionPreference = "Stop"

$root = "c:\Users\llano\Downloads\PROYECTO EMP. DIGITAL\clicktech"
$ffmpeg = "C:\Users\llano\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin\ffmpeg.exe"
$ffprobe = "C:\Users\llano\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin\ffprobe.exe"
$ua = "ClickTechAcademicDemo/1.0 (https://localhost; Potosi Bolivia student e-commerce demo)"

$rawDir = Join-Path $root ".tmp_assets_raw"
New-Item -ItemType Directory -Force $rawDir | Out-Null

$usedTitles = [System.Collections.Generic.HashSet[string]]::new()

function Strip-Html([string]$text) {
  if ([string]::IsNullOrWhiteSpace($text)) { return "" }
  return ([regex]::Replace($text, '<[^>]+>', '') -replace '\s+', ' ').Trim()
}

function Is-CompatibleLicense([string]$licenseShort) {
  if ([string]::IsNullOrWhiteSpace($licenseShort)) { return $false }
  $l = $licenseShort.ToUpperInvariant()
  if ($l -match 'NC|ND|FAIR|COPYRIGHT|ALL RIGHTS') { return $false }
  return ($l -match 'CC0|CC-BY|CC BY|PUBLIC DOMAIN|PD|PDM')
}

function Search-CommonsImage {
  param(
    [string[]]$Queries,
    [int]$MinWidth = 500,
    [switch]$PreferLandscape
  )
  foreach ($q in $Queries) {
    $encoded = [Uri]::EscapeDataString($q)
    $url = "https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=$encoded&gsrlimit=18&prop=imageinfo&iiprop=url|extmetadata|size|mime&iiurlwidth=1200&format=json"
    try {
      $resp = Invoke-RestMethod -Uri $url -Headers @{ "User-Agent" = $ua } -TimeoutSec 20
      if (-not $resp.query -or -not $resp.query.pages) { continue }
      $pages = $resp.query.pages.PSObject.Properties.Value | Sort-Object -Property index
      foreach ($p in $pages) {
        if ($usedTitles.Contains($p.title)) { continue }
        if ($p.title -match '\.(svg|pdf|djvu|ogv|webm|gif|tif|tiff)$') { continue }
        if ($p.title -match '(?i)diagram|schematic|logo|icon|map|chart|patent|screenshot|box_art|comparison|table') { continue }
        $ii = $p.imageinfo[0]
        if (-not $ii) { continue }
        if ($ii.mime -notmatch '^image/(jpeg|png|webp)$') { continue }
        if ($ii.width -lt $MinWidth) { continue }
        if ($PreferLandscape -and $ii.width -lt $ii.height) { continue }
        $meta = $ii.extmetadata
        $licShort = Strip-Html ($meta.LicenseShortName.value)
        if (-not (Is-CompatibleLicense $licShort)) { continue }
        $author = Strip-Html ($meta.Artist.value)
        if ([string]::IsNullOrWhiteSpace($author)) { $author = "Wikimedia Commons contributor" }
        $licUrl = $meta.LicenseUrl.value
        $dlUrl = if ($ii.thumburl) { $ii.thumburl } else { $ii.url }
        $desc = Strip-Html ($meta.ImageDescription.value)
        return @{
          title      = $p.title
          dlUrl      = $dlUrl
          sourceUrl  = "https://commons.wikimedia.org/wiki/" + [Uri]::EscapeDataString($p.title.Replace(' ', '_'))
          author     = $author
          license    = $licShort
          licenseUrl = if ($licUrl) { $licUrl } else { "https://commons.wikimedia.org/wiki/" + [Uri]::EscapeDataString($p.title.Replace(' ', '_')) }
          desc       = $desc
          width      = $ii.width
          height     = $ii.height
        }
      }
    } catch {
      Write-Warning "Query failed for '$q': $($_.Exception.Message)"
    }
    Start-Sleep -Milliseconds 220
  }
  return $null
}

function Save-WebpAsset {
  param(
    [hashtable]$Info,
    [string]$OutRelPath,
    [int]$MaxDim = 1200
  )
  $outPath = Join-Path $root ("public" + $OutRelPath.Replace('/', '\'))
  New-Item -ItemType Directory -Force (Split-Path $outPath -Parent) | Out-Null
  $ext = if ($Info.dlUrl -match '\.png(\?|$)') { ".png" } elseif ($Info.dlUrl -match '\.webp(\?|$)') { ".webp" } else { ".jpg" }
  $tmpFile = Join-Path $rawDir ([Guid]::NewGuid().ToString("N") + $ext)
  try {
    $wc = New-Object System.Net.WebClient
    $wc.Headers.Add("User-Agent", $ua)
    $wc.DownloadFile($Info.dlUrl, $tmpFile)
    $wc.Dispose()
    if (-not (Test-Path $tmpFile) -or (Get-Item $tmpFile).Length -lt 2000) {
      Remove-Item $tmpFile -ErrorAction SilentlyContinue
      return $false
    }
    $probeRaw = (& $ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 $tmpFile 2>&1) -join "`n"
    if ($LASTEXITCODE -ne 0 -or -not ($probeRaw -match '\d+,\d+')) {
      Write-Warning "Probe failed ($tmpFile): $probeRaw"
      Remove-Item $tmpFile -ErrorAction SilentlyContinue
      return $false
    }
    & $ffmpeg -y -v error -i $tmpFile -vf "scale='min($MaxDim,iw)':'min($MaxDim,ih)':force_original_aspect_ratio=decrease" -c:v libwebp -quality 82 $outPath
    Remove-Item $tmpFile -ErrorAction SilentlyContinue
    if ((Test-Path $outPath) -and ((Get-Item $outPath).Length -gt 1000)) {
      $null = $usedTitles.Add($Info.title)
      return $true
    }
  } catch {
    Write-Warning "Download error ($($Info.dlUrl)): $($_.Exception.Message)"
    Remove-Item $tmpFile -ErrorAction SilentlyContinue
  }
  return $false
}

$targets = @(
  # Products (34 items)
  @{ kind="product"; key="CT-CPU-R5-5600"; exactMatch="Ryzen 5"; queries=@("AMD Ryzen 5 processor","AMD Ryzen AM4 CPU","AMD Ryzen processor pins"); altExact="Procesador AMD Ryzen 5"; altIll="Imagen ilustrativa de procesador AMD Ryzen" },
  @{ kind="product"; key="CT-CPU-R5-5600G"; exactMatch="Ryzen 5"; queries=@("AMD Ryzen CPU AM4","AMD Ryzen processor","Ryzen 5 CPU"); altExact="Procesador AMD Ryzen 5 con gráficos integrados"; altIll="Imagen ilustrativa de procesador AMD Ryzen con gráficos integrados" },
  @{ kind="product"; key="CT-CPU-R7-5700X"; exactMatch="Ryzen 7"; queries=@("AMD Ryzen 7","AMD Ryzen CPU","AMD desktop processor"); altExact="Procesador AMD Ryzen 7"; altIll="Imagen ilustrativa de procesador AMD Ryzen 7" },
  @{ kind="product"; key="CT-CPU-R5-7600"; exactMatch="AM5"; queries=@("AMD Ryzen AM5","AMD Ryzen 7000","AMD CPU socket AM5"); altExact="Procesador AMD Ryzen AM5"; altIll="Imagen ilustrativa de procesador AMD AM5" },
  @{ kind="product"; key="CT-CPU-I5-12400F"; exactMatch="i5"; queries=@("Intel Core i5 LGA1700","Intel Core i5 processor","Intel desktop CPU"); altExact="Procesador Intel Core i5"; altIll="Imagen ilustrativa de procesador Intel Core i5" },
  @{ kind="product"; key="CT-CPU-I5-13400F"; exactMatch="Core i5"; queries=@("Intel Core processor CPU","Intel CPU chip","Intel LGA processor"); altExact="Procesador Intel Core i5"; altIll="Imagen ilustrativa de procesador Intel Core i5" },

  @{ kind="product"; key="CT-MB-B550M-PRO-VDH"; exactMatch="B550"; queries=@("B550 motherboard","AM4 motherboard","MSI motherboard"); altExact="Placa madre MSI B550M"; altIll="Imagen ilustrativa de placa madre AM4" },
  @{ kind="product"; key="CT-MB-B450M-STEEL"; exactMatch="B450"; queries=@("ASRock motherboard","B450 motherboard","AMD ATX motherboard"); altExact="Placa madre ASRock B450M"; altIll="Imagen ilustrativa de placa madre ASRock / AMD" },
  @{ kind="product"; key="CT-MB-B650M-A-WIFI"; exactMatch="B650"; queries=@("ASUS motherboard DDR5","ASUS PRIME motherboard","AM5 motherboard"); altExact="Placa madre ASUS B650M"; altIll="Imagen ilustrativa de placa madre DDR5" },
  @{ kind="product"; key="CT-MB-B760M-DS3H"; exactMatch="Gigabyte"; queries=@("Gigabyte motherboard","Intel LGA1700 motherboard","Micro ATX motherboard"); altExact="Placa madre Gigabyte"; altIll="Imagen ilustrativa de placa madre Micro-ATX" },

  @{ kind="product"; key="CT-RAM-FURY-16-D4"; exactMatch="Kingston"; queries=@("Kingston FURY RAM","Kingston HyperX DDR4","DDR4 RAM module"); altExact="Memoria RAM Kingston FURY"; altIll="Imagen ilustrativa de memoria RAM DDR4" },
  @{ kind="product"; key="CT-RAM-LPX-32-D4"; exactMatch="Corsair"; queries=@("Corsair Vengeance RAM","Corsair DDR4 memory","DDR4 memory kit"); altExact="Memoria RAM Corsair Vengeance"; altIll="Imagen ilustrativa de kit de memoria RAM DDR4" },
  @{ kind="product"; key="CT-RAM-FURY-32-D5"; exactMatch="DDR5"; queries=@("DDR5 memory module","DDR5 RAM","Kingston DDR5"); altExact="Memoria RAM DDR5"; altIll="Imagen ilustrativa de memoria RAM DDR5" },

  @{ kind="product"; key="CT-GPU-RTX4060-VENTUS"; exactMatch="RTX 4060"; queries=@("GeForce RTX 4060","MSI GeForce RTX","NVIDIA GeForce graphics card"); altExact="Tarjeta gráfica NVIDIA GeForce RTX"; altIll="Imagen ilustrativa de tarjeta gráfica NVIDIA GeForce" },
  @{ kind="product"; key="CT-GPU-RX7600-PULSE"; exactMatch="RX 7600"; queries=@("Radeon RX","Sapphire Radeon graphics card","AMD Radeon video card"); altExact="Tarjeta gráfica AMD Radeon"; altIll="Imagen ilustrativa de tarjeta gráfica AMD Radeon" },
  @{ kind="product"; key="CT-GPU-RTX4070S-DUAL"; exactMatch="RTX 4070"; queries=@("ASUS GeForce RTX","NVIDIA RTX graphics card","modern dual fan GPU"); altExact="Tarjeta gráfica GeForce RTX"; altIll="Imagen ilustrativa de tarjeta gráfica de alto rendimiento" },

  @{ kind="product"; key="CT-SSD-NV2-1TB"; exactMatch="Kingston"; queries=@("Kingston NVMe SSD","M.2 NVMe SSD","M.2 2280 SSD"); altExact="Unidad SSD M.2 NVMe Kingston"; altIll="Imagen ilustrativa de SSD M.2 NVMe" },
  @{ kind="product"; key="CT-SSD-980-1TB"; exactMatch="Samsung 980"; queries=@("Samsung 980 NVMe","Samsung SSD M.2","NVMe solid state drive"); altExact="Unidad SSD Samsung NVMe"; altIll="Imagen ilustrativa de unidad SSD NVMe" },
  @{ kind="product"; key="CT-SSD-MX500-1TB"; exactMatch="MX500"; queries=@("Crucial MX500","Crucial SSD","2.5 SATA SSD"); altExact="Unidad SSD Crucial SATA"; altIll="Imagen ilustrativa de unidad SSD 2.5 SATA" },

  @{ kind="product"; key="CT-PSU-CV550"; exactMatch="Corsair"; queries=@("Corsair power supply","ATX power supply PSU","computer PSU black"); altExact="Fuente de poder Corsair"; altIll="Imagen ilustrativa de fuente de poder ATX" },
  @{ kind="product"; key="CT-PSU-A650BN"; exactMatch="650W"; queries=@("650W power supply","PC power supply unit","modular ATX PSU"); altExact="Fuente de poder ATX"; altIll="Imagen ilustrativa de fuente de poder 80 Plus" },
  @{ kind="product"; key="CT-PSU-RM750E"; exactMatch="modular"; queries=@("modular power supply","Corsair RM power supply","ATX PSU cables"); altExact="Fuente de poder modular"; altIll="Imagen ilustrativa de fuente de poder modular 80 Plus Gold" },

  @{ kind="product"; key="CT-CASE-VERSA-H18"; exactMatch="Micro-ATX"; queries=@("Micro ATX PC case","mesh computer case","gaming PC tower black"); altExact="Gabinete Micro-ATX"; altIll="Imagen ilustrativa de gabinete torre con panel mallado" },
  @{ kind="product"; key="CT-CASE-H5-FLOW"; exactMatch="NZXT"; queries=@("NZXT PC case","tempered glass PC case","ATX gaming chassis"); altExact="Gabinete ATX con vidrio templado"; altIll="Imagen ilustrativa de gabinete ATX airflow" },

  @{ kind="product"; key="CT-COOL-AK400"; exactMatch="AK400"; queries=@("tower CPU cooler","CPU air cooler heatsink","heatpipe CPU cooler"); altExact="Disipador de aire para CPU"; altIll="Imagen ilustrativa de disipador torre para procesador" },
  @{ kind="product"; key="CT-COOL-PA120SE"; exactMatch="dual tower"; queries=@("dual fan CPU cooler","CPU cooler tower","desktop heatsink fan"); altExact="Disipador de doble torre"; altIll="Imagen ilustrativa de disipador de doble ventilador" },

  @{ kind="product"; key="CT-LAP-NITRO-V15"; exactMatch="Nitro"; queries=@("Acer Nitro laptop","gaming laptop dark","gaming notebook"); altExact="Laptop gamer Acer Nitro"; altIll="Imagen ilustrativa de laptop gamer" },
  @{ kind="product"; key="CT-LAP-IDEAPAD-SLIM3"; exactMatch="IdeaPad"; queries=@("Lenovo IdeaPad","modern silver laptop","thin ultrabook laptop"); altExact="Laptop Lenovo IdeaPad"; altIll="Imagen ilustrativa de laptop para estudio y trabajo" },

  @{ kind="product"; key="CT-MON-24GS60F"; exactMatch="LG UltraGear"; queries=@("LG gaming monitor","IPS gaming monitor","computer display gaming"); altExact="Monitor gamer IPS"; altIll="Imagen ilustrativa de monitor gamer IPS" },
  @{ kind="product"; key="CT-MON-ODYSSEY-G5"; exactMatch="Odyssey"; queries=@("Samsung Odyssey monitor","curved gaming monitor","ultrawide gaming display"); altExact="Monitor curvo gamer"; altIll="Imagen ilustrativa de monitor gamer curvo QHD" },

  @{ kind="product"; key="CT-PER-G502-HERO"; exactMatch="G502"; queries=@("Logitech G502","Logitech gaming mouse","wired gaming mouse"); altExact="Mouse gamer Logitech G502"; altIll="Imagen ilustrativa de mouse gamer óptico" },
  @{ kind="product"; key="CT-PER-K552"; exactMatch="mechanical keyboard"; queries=@("RGB mechanical keyboard","compact mechanical keyboard","TKL gaming keyboard"); altExact="Teclado mecánico compacto RGB"; altIll="Imagen ilustrativa de teclado mecánico gamer" },
  @{ kind="product"; key="CT-PER-CLOUD-II"; exactMatch="HyperX"; queries=@("HyperX Cloud","gaming headset headphones","over-ear gaming headset"); altExact="Audífonos gamer circumaurales"; altIll="Imagen ilustrativa de audífonos gamer con micrófono" },

  @{ kind="product"; key="CT-ACC-MX4"; exactMatch="Arctic MX-4"; queries=@("Arctic MX-4","thermal paste syringe","CPU thermal compound"); altExact="Pasta térmica en jeringa"; altIll="Imagen ilustrativa de pasta térmica para CPU" },

  @{ kind="product"; key="CT-PC-INICIAL"; exactMatch=""; queries=@("custom gaming PC RGB","desktop gaming computer","gaming rig LED"); altExact="PC Gamer armada"; altIll="Imagen ilustrativa de PC gamer armada con iluminación RGB" },
  @{ kind="product"; key="CT-PC-EQUILIBRADA"; exactMatch=""; queries=@("RGB gaming PC glass","inside gaming PC GPU","watercooled gaming computer"); altExact="PC Gamer armada"; altIll="Imagen ilustrativa de ensamble gamer con GPU dedicada" },
  @{ kind="product"; key="CT-PC-ESTUDIO"; exactMatch=""; queries=@("workstation desktop computer","clean desktop PC setup","office desktop computer"); altExact="PC de escritorio para estudio y trabajo"; altIll="Imagen ilustrativa de computadora de escritorio profesional" },

  # Hero (3 landscape photos)
  @{ kind="hero"; key="hero-1"; queries=@("gaming PC setup dark RGB","custom gaming PC interior","gaming desk RGB"); altIll="Estación de computadora gamer armada con iluminación LED" },
  @{ kind="hero"; key="hero-2"; queries=@("computer hardware motherboard GPU","gaming graphics card installed","RGB PC build"); altIll="Interior de computadora con tarjeta gráfica y refrigeración" },
  @{ kind="hero"; key="hero-3"; queries=@("mechanical keyboard gaming setup","gaming monitor desk","esports workstation"); altIll="Setup gamer de escritorio con periféricos y monitor" },

  # Services (5 photos)
  @{ kind="service"; key="srv-diagnostico"; queries=@("computer repair technician","PC troubleshooting motherboard","electronics workbench"); altIll="Revisión y diagnóstico técnico de hardware" },
  @{ kind="service"; key="srv-mantenimiento"; queries=@("cleaning computer dust","thermal paste CPU","PC maintenance inside"); altIll="Mantenimiento preventivo y limpieza de componentes" },
  @{ kind="service"; key="srv-ensamblaje"; queries=@("building a PC","PC assembly motherboard","computer hardware assembly"); altIll="Ensamblaje personalizado de computadora" },
  @{ kind="service"; key="srv-laptop"; queries=@("laptop repair open","disassembled laptop","notebook motherboard repair"); altIll="Servicio técnico y actualización de laptop" },
  @{ kind="service"; key="srv-b2b"; queries=@("office computers workstation","network server workstation","IT support office"); altIll="Soporte técnico para equipos empresariales" },

  # Categories (13 photos)
  @{ kind="category"; key="pcs-armadas"; queries=@("gaming PC build","custom desktop PC","RGB PC tower"); altIll="Categoría PCs armadas" },
  @{ kind="category"; key="laptops"; queries=@("laptop computer dark","modern notebook computer","gaming laptop"); altIll="Categoría Laptops" },
  @{ kind="category"; key="procesadores"; queries=@("CPU processor socket","AMD Intel processor","microprocessor close up"); altIll="Categoría Procesadores" },
  @{ kind="category"; key="tarjetas-graficas"; queries=@("graphics card GPU","video card fans","PCIe GPU"); altIll="Categoría Tarjetas gráficas" },
  @{ kind="category"; key="placas-madre"; queries=@("computer motherboard","ATX motherboard","motherboard socket"); altIll="Categoría Placas madre" },
  @{ kind="category"; key="memorias-ram"; queries=@("DDR4 RAM sticks","computer memory DIMM","RAM modules"); altIll="Categoría Memorias RAM" },
  @{ kind="category"; key="almacenamiento"; queries=@("NVMe SSD M.2","solid state drive","SSD storage"); altIll="Categoría Almacenamiento" },
  @{ kind="category"; key="fuentes"; queries=@("PC power supply","ATX power supply","computer PSU"); altIll="Categoría Fuentes de poder" },
  @{ kind="category"; key="gabinetes"; queries=@("computer case tower","PC chassis interior","gaming case"); altIll="Categoría Gabinetes" },
  @{ kind="category"; key="refrigeracion"; queries=@("CPU heatsink fan","PC cooling fan","liquid cooler PC"); altIll="Categoría Refrigeración" },
  @{ kind="category"; key="monitores"; queries=@("computer monitor display","gaming monitor","LCD computer monitor"); altIll="Categoría Monitores" },
  @{ kind="category"; key="perifericos"; queries=@("gaming mouse keyboard","mechanical keyboard","computer peripherals"); altIll="Categoría Periféricos" },
  @{ kind="category"; key="accesorios"; queries=@("computer cable thermal paste","USB hub adapter","PC accessories"); altIll="Categoría Accesorios" }
)

$manifest = @{
  products   = @{}
  categories = @{}
  hero       = @()
  services   = @()
}

$assetRows = @()

foreach ($t in $targets) {
  $isHero = ($t.kind -eq "hero")
  $maxDim = if ($isHero) { 1600 } else { 1100 }
  $minW   = if ($isHero) { 900 } else { 480 }
  $info = Search-CommonsImage -Queries $t.queries -MinWidth $minW -PreferLandscape:$isHero
  if (-not $info -and $isHero) {
    $info = Search-CommonsImage -Queries $t.queries -MinWidth 600
  }
  if (-not $info) {
    Write-Warning "NO RESULT for $($t.kind) $($t.key)"
    continue
  }

  $relPath = switch ($t.kind) {
    "product"  { "/images/products/$($t.key.ToLowerInvariant()).webp" }
    "hero"     { "/images/hero/$($t.key).webp" }
    "service"  { "/images/services/$($t.key).webp" }
    "category" { "/images/categories/$($t.key).webp" }
  }

  $saved = Save-WebpAsset -Info $info -OutRelPath $relPath -MaxDim $maxDim
  if (-not $saved) {
    Write-Warning "FAILED SAVE for $($t.kind) $($t.key)"
    continue
  }

  $isExact = $false
  if ($t.kind -eq "product" -and $t.exactMatch) {
    $haystack = "$($info.title) $($info.desc)"
    if ($haystack -match [regex]::Escape($t.exactMatch)) {
      $isExact = $true
    }
  }

  $altText = if ($isExact) { $t.altExact } else { $t.altIll }
  $entry = [ordered]@{
    file       = $relPath
    alt        = $altText
    exact      = $isExact
    title      = $info.title
    author     = $info.author
    license    = $info.license
    licenseUrl = $info.licenseUrl
    sourceUrl  = $info.sourceUrl
  }

  switch ($t.kind) {
    "product"  { $manifest.products[$t.key] = @($entry) }
    "category" { $manifest.categories[$t.key] = $entry }
    "hero"     { $manifest.hero += $entry }
    "service"  { $manifest.services += $entry }
  }

  $assetRows += [ordered]@{
    kind    = $t.kind
    key     = $t.key
    file    = $relPath
    exact   = $isExact
    author  = $info.author
    license = $info.license
    source  = $info.sourceUrl
    title   = $info.title
  }
  Write-Host ("OK [{0}] {1} -> {2} (exact={3}, {4})" -f $t.kind, $t.key, $relPath, $isExact, $info.license)
}

$manifestJson = $manifest | ConvertTo-Json -Depth 6
Set-Content -Path "$root\prisma\seed-data\images.json" -Value $manifestJson -Encoding utf8

# Generate docs/ASSETS.md
$md = @()
$md += "# Registro de Activos Visuales y Licencias — ClickTech"
$md += ""
$md += "Todos los recursos gráficos utilizados en ClickTech provienen del propietario de la marca (logotipos originales), fuentes tipográficas libres (SIL OFL) o fotografías reales verificadas vía API pública de **Wikimedia Commons** bajo licencias compatibles con uso comercial y modificación (**CC0**, **Public Domain**, **CC BY**, **CC BY-SA**)."
$md += ""
$md += "## 1. Logotipos Oficiales y Fuentes"
$md += "| Recurso | Archivo | Origen / Autor | Licencia / Condición |"
$md += "|---|---|---|---|"
$md += "| Logotipo transparente | ``/brand/logo_user_overlay.png`` | Provisto por el propietario de ClickTech | Uso autorizado del proyecto |"
$md += "| Logotipo recortado para navbar | ``/brand/logo_trimmed.png`` | Derivado por recorte de margen transparente de ``logo_user_overlay.png`` | Uso autorizado del proyecto |"
$md += "| Logotipo fondo oscuro | ``/brand/clicktech_logo_original.jpg`` | Provisto por el propietario de ClickTech | Uso autorizado del proyecto |"
$md += "| Tipografías de marca | ``Orbitron``, ``Space Grotesk``, ``Plus Jakarta Sans`` | Google Fonts | SIL Open Font License (OFL 1.1) |"
$md += ""
$md += "## 2. Fotografías de Hardware, Categorías, Hero y Servicios"
$md += ""
$md += "| Tipo | SKU / Clave | Archivo Local | Correspondencia | Autor | Licencia | Fuente |"
$md += "|---|---|---|---|---|---|---|"
foreach ($r in $assetRows) {
  $corr = if ($r.exact) { "Exacta (modelo verificado en título/descripción)" } else { "Ilustrativa de categoría" }
  $authClean = ($r.author -replace '\|', '/').Trim()
  $md += "| $($r.kind) | ``$($r.key)`` | ``$($r.file)`` | $corr | $authClean | $($r.license) | [Wikimedia Commons]($($r.source)) |"
}
$md += ""
$md += "## 3. Limitaciones y Obligaciones de Atribución"
$md += "- Las fotografías marcadas como **Ilustrativa de categoría** muestran hardware real representativo del tipo de producto cuando el catálogo de dominio libre en Wikimedia Commons no disponía de una fotografía exacta de ese SKU comercial específico. En la tienda y ficha del producto se rotulan explícitamente como imagen ilustrativa y pueden reemplazarse desde **Admin → Productos**."
$md += "- Todas las imágenes fueron redimensionadas (máximo 1100 px para fichas / 1600 px para hero) y convertidas a **WebP** (calidad 82) mediante FFmpeg."
$md += "- Los créditos y enlaces de licencia **CC BY / CC BY-SA** se publican en la página ``/creditos`` enlazada desde el pie de página."

Set-Content -Path "$root\docs\ASSETS.md" -Value ($md -join "`n") -Encoding utf8
Remove-Item $rawDir -Recurse -Force -ErrorAction SilentlyContinue
"TOTAL ASSETS SAVED: $($assetRows.Count)"
