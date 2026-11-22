$ErrorActionPreference = "Stop"

$root = "c:\Users\llano\Downloads\PROYECTO EMP. DIGITAL\clicktech"
$ffmpeg = "C:\Users\llano\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin\ffmpeg.exe"
$ffprobe = "C:\Users\llano\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin\ffprobe.exe"
$ua = "ClickTechAcademicDemo/1.0 (https://example.org; Potosi Bolivia academic demo)"
$rawDir = Join-Path $root ".tmp_assets_raw"
New-Item -ItemType Directory -Force $rawDir | Out-Null

$manifestPath = "$root\prisma\seed-data\images.json"
$manifest = Get-Content $manifestPath -Raw -Encoding utf8 | ConvertFrom-Json

function Strip-Html([string]$t) {
  if ([string]::IsNullOrWhiteSpace($t)) { return "" }
  return ([regex]::Replace($t, '<[^>]+>', '') -replace '\s+', ' ').Trim()
}

function Is-CompatibleLicense([string]$l) {
  if ([string]::IsNullOrWhiteSpace($l)) { return $false }
  $u = $l.ToUpperInvariant()
  if ($u -match 'NC|ND|FAIR|COPYRIGHT|ALL RIGHTS') { return $false }
  return ($u -match 'CC0|CC-BY|CC BY|PUBLIC DOMAIN|PD|PDM')
}

function Pick-CommonsFile {
  param(
    [string[]]$Queries,
    [string]$MustMatchRegex = "",
    [switch]$LandscapeWide,
    [string[]]$ExcludeRegex = @('diagram|schematic|logo|icon|map|chart|patent|screenshot|video|Geekerwan|провал|Drummer|Corporation|Building|HQ|GamePad|Old_photos|00\.\d+\.\d+')
  )
  $excl = ($ExcludeRegex -join '|')
  foreach ($q in $Queries) {
    $enc = [Uri]::EscapeDataString($q)
    $url = "https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=$enc&gsrlimit=25&prop=imageinfo&iiprop=url|extmetadata|size|mime&iiurlwidth=1400&format=json"
    $resp = Invoke-RestMethod -Uri $url -Headers @{ "User-Agent" = $ua } -TimeoutSec 20
    if (-not $resp.query -or -not $resp.query.pages) { continue }
    $pages = $resp.query.pages.PSObject.Properties.Value | Sort-Object -Property index
    foreach ($p in $pages) {
      if ($p.title -match '\.(svg|pdf|djvu|ogv|webm|gif|tif|tiff)$') { continue }
      if ($p.title -match "(?i)$excl") { continue }
      if ($MustMatchRegex -and ($p.title -notmatch "(?i)$MustMatchRegex")) { continue }
      $ii = $p.imageinfo[0]
      if (-not $ii -or $ii.mime -notmatch '^image/(jpeg|png|webp)$') { continue }
      if ($ii.width -lt 600) { continue }
      if ($LandscapeWide -and ($ii.width -lt ($ii.height * 1.25))) { continue }
      $meta = $ii.extmetadata
      $lic = Strip-Html ($meta.LicenseShortName.value)
      if (-not (Is-CompatibleLicense $lic)) { continue }
      $author = Strip-Html ($meta.Artist.value)
      if ([string]::IsNullOrWhiteSpace($author)) { $author = "Wikimedia Commons contributor" }
      return @{
        title      = $p.title
        dlUrl      = if ($ii.thumburl) { $ii.thumburl } else { $ii.url }
        sourceUrl  = "https://commons.wikimedia.org/wiki/" + [Uri]::EscapeDataString($p.title.Replace(' ', '_'))
        author     = $author
        license    = $lic
        licenseUrl = if ($meta.LicenseUrl.value) { $meta.LicenseUrl.value } else { "https://commons.wikimedia.org/wiki/" + [Uri]::EscapeDataString($p.title.Replace(' ', '_')) }
      }
    }
    Start-Sleep -Milliseconds 200
  }
  return $null
}

function Save-Replacement($info, $relPath, $maxDim = 1200) {
  $outPath = Join-Path $root ("public" + $relPath.Replace('/', '\'))
  $ext = if ($info.dlUrl -match '\.png(\?|$)') { ".png" } else { ".jpg" }
  $tmp = Join-Path $rawDir ([Guid]::NewGuid().ToString("N") + $ext)
  $wc = New-Object System.Net.WebClient
  $wc.Headers.Add("User-Agent", $ua)
  $wc.DownloadFile($info.dlUrl, $tmp)
  $wc.Dispose()
  & $ffmpeg -y -v error -i $tmp -vf "scale='min($maxDim,iw)':'min($maxDim,ih)':force_original_aspect_ratio=decrease" -c:v libwebp -quality 84 $outPath
  Remove-Item $tmp -ErrorAction SilentlyContinue
  $dims = (& $ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 $outPath) -join ""
  Write-Host "Replaced $relPath -> $($info.title) [$dims]"
}

# Replacements for mismatched/slide images
$fixes = @(
  @{ kind="product"; key="CT-GPU-RTX4060-VENTUS"; rel="/images/products/ct-gpu-rtx4060-ventus.webp"; alt="Imagen ilustrativa de tarjeta gráfica NVIDIA GeForce RTX"; exact=$false; queries=@("GeForce RTX 4070","GeForce RTX 3060","ASUS GeForce RTX","NVIDIA GeForce RTX graphics card"); must="RTX|GeForce" },
  @{ kind="product"; key="CT-CPU-I5-12400F"; rel="/images/products/ct-cpu-i5-12400f.webp"; alt="Imagen ilustrativa de procesador Intel Core"; exact=$false; queries=@("Intel Core i5-12","Intel Core i5 LGA","Intel Core i7-12700K","Intel Core CPU"); must="Intel_Core|Core_i" },
  @{ kind="product"; key="CT-MON-ODYSSEY-G5"; rel="/images/products/ct-mon-odyssey-g5.webp"; alt="Imagen ilustrativa de monitor gamer curvo"; exact=$false; queries=@("curved gaming monitor","Samsung curved monitor","AOC gaming monitor","ultrawide monitor"); must="monitor|display|Odyssey|AOC|LG" },
  @{ kind="product"; key="CT-PER-CLOUD-II"; rel="/images/products/ct-per-cloud-ii.webp"; alt="Imagen ilustrativa de audífonos gamer con micrófono"; exact=$false; queries=@("HyperX Cloud headset","gaming headset microphone","Sennheiser gaming headset","headphones microphone"); must="headset|headphone|HyperX|SteelSeries|Razer" },
  @{ kind="product"; key="CT-ACC-MX4"; rel="/images/products/ct-acc-mx4.webp"; alt="Imagen ilustrativa de pasta térmica para CPU"; exact=$false; queries=@("thermal paste","thermal compound","Arctic Silver","CPU thermal grease"); must="thermal|paste|grease|compound|Arctic" },
  @{ kind="product"; key="CT-MB-B650M-A-WIFI"; rel="/images/products/ct-mb-b650m-a-wifi.webp"; alt="Imagen ilustrativa de placa madre AM5 DDR5"; exact=$false; queries=@("ASUS ROG motherboard","AM5 motherboard","MSI MPG motherboard","B650 motherboard"); must="motherboard|Płyta|Mainboard|ASUS|MSI|Gigabyte" },
  @{ kind="category"; key="pcs-armadas"; rel="/images/categories/pcs-armadas.webp"; alt="Categoría PCs armadas"; exact=$false; queries=@("Gaming-PC 2024","custom gaming PC","RGB desktop computer"); must="PC|Computer|Tower|Gaming" },
  @{ kind="hero"; index=0; rel="/images/hero/hero-1.webp"; alt="PC gamer armada con iluminación interior cian y morada"; queries=@("Gaming-PC 2024","custom gaming computer RGB","watercooled gaming PC"); must="PC|Gaming|Computer"; wide=$true },
  @{ kind="hero"; index=1; rel="/images/hero/hero-2.webp"; alt="Placa madre y tarjeta gráfica instalada en gabinete gamer"; queries=@("PC inside graphics card motherboard","computer hardware motherboard GPU","ASUS GeForce RTX installed"); must="PC|motherboard|GPU|RTX|GeForce"; wide=$true }
)

foreach ($f in $fixes) {
  $info = Pick-CommonsFile -Queries $f.queries -MustMatchRegex $f.must -LandscapeWide:([bool]$f.wide)
  if (-not $info) {
    Write-Warning "Could not find replacement for $($f.key) / $($f.rel)"
    continue
  }
  $maxD = if ($f.kind -eq "hero") { 1600 } else { 1100 }
  Save-Replacement -info $info -relPath $f.rel -maxDim $maxD

  $entry = [ordered]@{
    file       = $f.rel
    alt        = $f.alt
    exact      = [bool]$f.exact
    title      = $info.title
    author     = $info.author
    license    = $info.license
    licenseUrl = $info.licenseUrl
    sourceUrl  = $info.sourceUrl
  }
  if ($f.kind -eq "product") {
    $manifest.products.($f.key) = @($entry)
  } elseif ($f.kind -eq "category") {
    $manifest.categories.($f.key) = $entry
  } elseif ($f.kind -eq "hero") {
    $manifest.hero[$f.index] = $entry
  }
}

# Enforce strict honesty on exact vs illustrative: only true when Wikimedia filename literally matches the exact SKU model
$strictExactSkus = @("CT-SSD-MX500-1TB","CT-PER-G502-HERO")
foreach ($prop in $manifest.products.PSObject.Properties) {
  $sku = $prop.Name
  $arr = $prop.Value
  foreach ($item in $arr) {
    if ($strictExactSkus -notcontains $sku) {
      $item.exact = $false
      if ($item.alt -notmatch '^Imagen ilustrativa') {
        $item.alt = "Imagen ilustrativa — " + $item.alt
      }
    }
  }
}

$manifest | ConvertTo-Json -Depth 6 | Set-Content -Path $manifestPath -Encoding utf8

# Copy hero-1 and hero-2 into brand-video/assets for HyperFrames
Copy-Item "$root\public\images\hero\hero-1.webp" "$root\brand-video\assets\hero-1.webp" -Force
Copy-Item "$root\public\images\hero\hero-2.webp" "$root\brand-video\assets\hero-2.webp" -Force

# Regenerate docs/ASSETS.md cleanly from final manifest
$md = @(
  "# Registro de Activos Visuales y Licencias — ClickTech",
  "",
  "Todos los recursos gráficos utilizados en ClickTech provienen del propietario de la marca (logotipos originales), fuentes tipográficas libres (SIL OFL) o fotografías reales verificadas vía API pública de **Wikimedia Commons** bajo licencias compatibles con uso comercial y modificación (**CC0**, **Public Domain**, **CC BY**, **CC BY-SA**).",
  "",
  "## 1. Logotipos Oficiales y Fuentes",
  "| Recurso | Archivo | Origen / Autor | Licencia / Condición |",
  "|---|---|---|---|",
  "| Logotipo transparente | ``/brand/logo_user_overlay.png`` | Provisto por el propietario de ClickTech | Uso autorizado del proyecto |",
  "| Logotipo recortado para navbar | ``/brand/logo_trimmed.png`` | Derivado por recorte de margen transparente de ``logo_user_overlay.png`` | Uso autorizado del proyecto |",
  "| Logotipo fondo oscuro | ``/brand/clicktech_logo_original.jpg`` | Provisto por el propietario de ClickTech | Uso autorizado del proyecto |",
  "| Tipografías de marca | ``Orbitron``, ``Space Grotesk``, ``Plus Jakarta Sans`` | Google Fonts | SIL Open Font License (OFL 1.1) |",
  "",
  "## 2. Fotografías de Hardware, Categorías, Hero y Servicios",
  "",
  "| Tipo | SKU / Clave | Archivo Local | Correspondencia | Autor | Licencia | Fuente |",
  "|---|---|---|---|---|---|---|"
)
foreach ($prop in $manifest.products.PSObject.Properties | Sort-Object Name) {
  $r = $prop.Value[0]
  $corr = if ($r.exact) { "Exacta (modelo verificado)" } else { "Ilustrativa de categoría" }
  $auth = ($r.author -replace '\|', '/').Trim()
  $md += "| product | ``$($prop.Name)`` | ``$($r.file)`` | $corr | $auth | $($r.license) | [Wikimedia Commons]($($r.sourceUrl)) |"
}
foreach ($prop in $manifest.categories.PSObject.Properties | Sort-Object Name) {
  $r = $prop.Value
  $auth = ($r.author -replace '\|', '/').Trim()
  $md += "| category | ``$($prop.Name)`` | ``$($r.file)`` | Ilustrativa de categoría | $auth | $($r.license) | [Wikimedia Commons]($($r.sourceUrl)) |"
}
for ($i=0; $i -lt $manifest.hero.Count; $i++) {
  $r = $manifest.hero[$i]
  $auth = ($r.author -replace '\|', '/').Trim()
  $md += "| hero | ``hero-$($i+1)`` | ``$($r.file)`` | Ambiental / Hardware real | $auth | $($r.license) | [Wikimedia Commons]($($r.sourceUrl)) |"
}
for ($i=0; $i -lt $manifest.services.Count; $i++) {
  $r = $manifest.services[$i]
  $auth = ($r.author -replace '\|', '/').Trim()
  $md += "| service | ``srv-$($i+1)`` | ``$($r.file)`` | Ilustrativa de taller/servicio | $auth | $($r.license) | [Wikimedia Commons]($($r.sourceUrl)) |"
}
$md += ""
$md += "## 3. Limitaciones y Obligaciones de Atribución"
$md += "- Solo los SKUs cuyo archivo fuente en Wikimedia Commons corresponde exactamente al modelo (``CT-SSD-MX500-1TB`` y ``CT-PER-G502-HERO``) figuran como fotografía exacta; el resto de los productos se muestran con fotografía real representativa rotulada explícitamente como **Imagen ilustrativa de categoría**, reemplazable desde **Admin → Productos**."
$md += "- Todas las imágenes fueron redimensionadas y optimizadas a **WebP** mediante FFmpeg."
$md += "- Las atribuciones requeridas por las licencias **CC BY / CC BY-SA** están accesibles en ``/creditos``."

Set-Content -Path "$root\docs\ASSETS.md" -Value ($md -join "`n") -Encoding utf8
Remove-Item $rawDir -Recurse -Force -ErrorAction SilentlyContinue
"ASSETS CLEANED AND UPDATED"
