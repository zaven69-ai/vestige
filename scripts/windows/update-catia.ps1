# Run from the existing Vestige folder (containing package.json).
# Downloads only this fix; does not touch models, dependencies or user data.
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
if ($package.name -ne 'vestige') { throw 'Ce dossier ne contient pas le projet Vestige.' }
$files = @(
    'metro.config.js',
    'src/app/catia.tsx',
    'src/components/avatars/Catia3DPreview.tsx',
    'tests/catia-native-resolution.test.ts',
    'scripts/avatars/catia/inspect-native-module.cjs',
    'scripts/windows/update-catia.ps1',
    'docs/expo-go/CATIA_IPHONE_FIX.md',
    'docs/expo-go/catia-module-resolution.json'
)
$obsolete = @(
    'src/components/avatars/Catia3DPreviewLoader.tsx',
    'src/lib/avatars/catiaModule.ts',
    'tests/catia-module.test.ts'
)
$stage = Join-Path $env:TEMP ('Vestige-Catia-patch-' + [guid]::NewGuid().ToString('N'))
$backup = Join-Path (Split-Path $root -Parent) ('Vestige-Catia-backup-' + (Get-Date -Format 'yyyyMMdd-HHmmss-fff'))
# Finish all network reads before modifying the working copy.
foreach ($file in $files) {
    $download = Join-Path $stage $file
    New-Item -ItemType Directory -Path (Split-Path $download -Parent) -Force | Out-Null
    Invoke-WebRequest -Uri "https://raw.githubusercontent.com/zaven69-ai/vestige/$Revision/$file" -OutFile $download
}
foreach ($file in ($files + $obsolete)) {
    $target = Join-Path $root $file
    if (Test-Path -LiteralPath $target) {
        $saved = Join-Path $backup $file
        New-Item -ItemType Directory -Path (Split-Path $saved -Parent) -Force | Out-Null
        Copy-Item -LiteralPath $target -Destination $saved
    }
}
foreach ($file in $files) {
    $target = Join-Path $root $file
    New-Item -ItemType Directory -Path (Split-Path $target -Parent) -Force | Out-Null
    Copy-Item -LiteralPath (Join-Path $stage $file) -Destination $target -Force
}
# These three unused files belong to the previous loader workaround.
# Existing contents have been backed up above, including any local edits.
foreach ($file in $obsolete) {
    $target = Join-Path $root $file
    if (Test-Path -LiteralPath $target) { Remove-Item -LiteralPath $target }
}
Write-Host "Correctif installe. Sauvegarde des fichiers precedents : $backup"
Write-Host 'Lancez : npx.cmd expo start --tunnel --clear'
