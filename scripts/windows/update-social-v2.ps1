# Run from the existing Vestige folder. Does not touch Catia, GPS or saved progress.
param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[0-9a-f]{40}$')]
    [string]$Revision
)
$ErrorActionPreference = 'Stop'
$root = (Get-Location).Path
if (!(Test-Path -LiteralPath (Join-Path $root 'package.json'))) {
    throw 'Ouvrez PowerShell dans le dossier Vestige contenant package.json.'
}
$package = Get-Content -LiteralPath (Join-Path $root 'package.json') -Raw | ConvertFrom-Json
if ($package.name -ne 'vestige') { throw 'Ce dossier ne contient pas Vestige.' }
$stage = Join-Path $env:TEMP ('Vestige-social-v2-patch-' + [guid]::NewGuid().ToString('N'))
$backup = Join-Path (Split-Path $root -Parent) ('Vestige-social-v2-backup-' + (Get-Date -Format 'yyyyMMdd-HHmmss-fff'))
New-Item -ItemType Directory -Path $stage -Force | Out-Null
$manifestPath = Join-Path $stage 'social-v2-update-files.json'
Invoke-WebRequest -UseBasicParsing -Uri "https://raw.githubusercontent.com/zaven69-ai/vestige/$Revision/scripts/windows/social-v2-update-files.json" -OutFile $manifestPath
$files = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
# Refuse an old differential package that cannot repair a missing V1 dependency.
$paths = @($files | ForEach-Object { [string]$_.path })
foreach ($required in @('src/components/exploration/PlayerMarker.tsx', 'src/components/exploration/CatiaSprite.tsx', 'src/components/exploration/avatar/catiaSprites.ts', 'src/components/exploration/PoiClusterMarker.tsx', 'src/components/poi/assets.ts', 'src/lib/mapViewport.ts', 'src/lib/poi.ts', 'src/components/exploration/IllustratedPoiMarker.tsx', 'src/components/poi/nativeMapAssets.ts', 'src/components/poi/illustrated.ts', 'assets/poi/illustrated/temple.png', 'assets/poi/illustrated/castle.png', 'assets/poi/illustrated/religious.png', 'assets/poi/illustrated/museum.png', 'assets/poi/illustrated/industrial.png', 'assets/poi/illustrated/nature.png', 'assets/poi/illustrated/other.png')) {
    if ($paths -notcontains $required) { throw "Paquet incomplet : $required. Utilisez la revision du correctif cumulatif." }
}
Write-Host "Installation dans : $root"
Write-Host "Reception de $($files.Count) fichiers de la Catia carte V1..."
# Bounded parallel downloads work with Windows PowerShell 5.1 (no extra module).
# All network reads and checks finish before modifying any project file.
Add-Type -AssemblyName System.Net.Http
$client = New-Object System.Net.Http.HttpClient
try {
    for ($offset = 0; $offset -lt $files.Count; $offset += 8) {
        $jobs = @()
        $last = [Math]::Min($offset + 8, $files.Count)
        for ($index = $offset; $index -lt $last; $index++) {
            $entry = $files[$index]
            $file = [string]$entry.path
            $target = [IO.Path]::GetFullPath((Join-Path $root $file))
            if (!$target.StartsWith($root.TrimEnd('\') + '\', [StringComparison]::OrdinalIgnoreCase)) { throw "Chemin inattendu : $file" }
            $download = Join-Path $stage $file
            New-Item -ItemType Directory -Path (Split-Path $download -Parent) -Force | Out-Null
            $jobs += [PSCustomObject]@{ Entry = $entry; Path = $download; Task = $client.GetByteArrayAsync("https://raw.githubusercontent.com/zaven69-ai/vestige/$Revision/$file") }
        }
        foreach ($job in $jobs) {
            $bytes = $job.Task.GetAwaiter().GetResult()
            [IO.File]::WriteAllBytes($job.Path, $bytes)
            if ((Get-FileHash -LiteralPath $job.Path -Algorithm SHA256).Hash.ToLowerInvariant() -ne $job.Entry.sha256) { throw "SHA256 incorrect : $($job.Entry.path). Aucun fichier du projet n'a ete modifie." }
        }
        Write-Progress -Activity 'Vestige Catia carte - telechargement verifie' -Status "$last / $($files.Count)" -PercentComplete ([int](100 * $last / $files.Count))
    }
    Write-Progress -Activity 'Vestige Catia carte - telechargement verifie' -Completed
} finally { $client.Dispose() }
Write-Host "Verification terminee. Sauvegarde des fichiers existants..."
foreach ($entry in $files) {
    $target = Join-Path $root $entry.path
    if (Test-Path -LiteralPath $target) {
        $saved = Join-Path $backup $entry.path
        New-Item -ItemType Directory -Path (Split-Path $saved -Parent) -Force | Out-Null
        Copy-Item -LiteralPath $target -Destination $saved
    }
}
$oldManifest = Join-Path $root 'scripts/windows/social-v2-update-files.json'
if (Test-Path -LiteralPath $oldManifest) {
    $savedManifest = Join-Path $backup 'scripts/windows/social-v2-update-files.json'
    New-Item -ItemType Directory -Path (Split-Path $savedManifest -Parent) -Force | Out-Null
    Copy-Item -LiteralPath $oldManifest -Destination $savedManifest
}
# An old emitted JS or platform-specific file can override the updated TSX.
# Quarantine only competing renderers not supplied by this version, with backup.
$renderers = @('src/components/exploration/PlayerMarker', 'src/components/exploration/CatiaSprite', 'src/components/exploration/CatiaMapPreview', 'src/components/exploration/avatar/catiaSprites', 'src/app/(tabs)/index', 'src/components/exploration/IllustratedPoiMarker', 'src/components/exploration/HistoricalMarker', 'src/components/exploration/PoiClusterMarker', 'src/components/poi/nativeMapAssets', 'src/components/exploration/MapOptions')
foreach ($base in $renderers) {
    foreach ($extension in @('.ts', '.tsx', '.ios.ts', '.ios.tsx', '.native.ts', '.native.tsx', '.js', '.jsx', '.ios.js', '.ios.jsx', '.native.js', '.native.jsx')) {
        $relative = $base + $extension
        $candidate = Join-Path $root $relative
        if (($paths -notcontains $relative) -and (Test-Path -LiteralPath $candidate)) {
            $saved = Join-Path $backup $relative
            New-Item -ItemType Directory -Path (Split-Path $saved -Parent) -Force | Out-Null
            Move-Item -LiteralPath $candidate -Destination $saved
            Write-Host "Ancienne variante de rendu sauvegardee : $relative"
        }
    }
}
foreach ($entry in $files) {
    $target = Join-Path $root $entry.path
    New-Item -ItemType Directory -Path (Split-Path $target -Parent) -Force | Out-Null
    Copy-Item -LiteralPath (Join-Path $stage $entry.path) -Destination $target -Force
}
Copy-Item -LiteralPath $manifestPath -Destination (Join-Path $root 'scripts/windows/social-v2-update-files.json') -Force
# Verify the installed files too, so a failed copy never reports success.
foreach ($entry in $files) {
    $target = Join-Path $root $entry.path
    if (!(Test-Path -LiteralPath $target) -or (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash.ToLowerInvariant() -ne $entry.sha256) {
        throw "Copie incomplete : $($entry.path). Sauvegarde disponible : $backup"
    }
}
Write-Host "Vestige Catia carte V1 installe. Sauvegarde : $backup"
Write-Host 'Verifiez les dependances : npm.cmd install ; puis npx.cmd expo start --tunnel --clear --port 8088'
