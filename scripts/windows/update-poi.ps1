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
$stage = Join-Path $env:TEMP ('Vestige-POI-patch-' + [guid]::NewGuid().ToString('N'))
$backup = Join-Path (Split-Path $root -Parent) ('Vestige-POI-backup-' + (Get-Date -Format 'yyyyMMdd-HHmmss-fff'))
New-Item -ItemType Directory -Path $stage -Force | Out-Null
$manifestPath = Join-Path $stage 'poi-update-files.json'
Invoke-WebRequest -UseBasicParsing -Uri "https://raw.githubusercontent.com/zaven69-ai/vestige/$Revision/scripts/windows/poi-update-files.json" -OutFile $manifestPath
$files = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
# Download and verify every byte before modifying any existing file.
foreach ($entry in $files) {
    $file = [string]$entry.path
    $target = [IO.Path]::GetFullPath((Join-Path $root $file))
    if (!$target.StartsWith($root.TrimEnd('\') + '\', [StringComparison]::OrdinalIgnoreCase)) {
        throw "Chemin inattendu : $file"
    }
    $download = Join-Path $stage $file
    New-Item -ItemType Directory -Path (Split-Path $download -Parent) -Force | Out-Null
    Invoke-WebRequest -UseBasicParsing -Uri "https://raw.githubusercontent.com/zaven69-ai/vestige/$Revision/$file" -OutFile $download
    if ((Get-FileHash -LiteralPath $download -Algorithm SHA256).Hash.ToLowerInvariant() -ne $entry.sha256) {
        throw "Verification SHA256 echouee : $file. Aucun fichier du projet n'a ete modifie."
    }
}
foreach ($entry in $files) {
    $target = Join-Path $root $entry.path
    if (Test-Path -LiteralPath $target) {
        $saved = Join-Path $backup $entry.path
        New-Item -ItemType Directory -Path (Split-Path $saved -Parent) -Force | Out-Null
        Copy-Item -LiteralPath $target -Destination $saved
    }
}
$oldManifest = Join-Path $root 'scripts/windows/poi-update-files.json'
if (Test-Path -LiteralPath $oldManifest) {
    $savedManifest = Join-Path $backup 'scripts/windows/poi-update-files.json'
    New-Item -ItemType Directory -Path (Split-Path $savedManifest -Parent) -Force | Out-Null
    Copy-Item -LiteralPath $oldManifest -Destination $savedManifest
}
foreach ($entry in $files) {
    $target = Join-Path $root $entry.path
    New-Item -ItemType Directory -Path (Split-Path $target -Parent) -Force | Out-Null
    Copy-Item -LiteralPath (Join-Path $stage $entry.path) -Destination $target -Force
}
Copy-Item -LiteralPath $manifestPath -Destination (Join-Path $root 'scripts/windows/poi-update-files.json') -Force
Write-Host "Marqueurs POI mis a jour. Sauvegarde : $backup"
Write-Host 'Aucune dependance nouvelle. Lancez : npx.cmd expo start --tunnel --clear'
