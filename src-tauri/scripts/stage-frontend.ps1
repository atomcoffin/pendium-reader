#requires -Version 5.1
# Stages the Tomen web app into src-tauri/dist/ for Tauri to bundle.
# Runs from src-tauri/ as Tauri's working directory for beforeCommand hooks.

$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$dist = Join-Path $PSScriptRoot '..\dist'

if (Test-Path $dist) {
    Remove-Item -Recurse -Force $dist
}
New-Item -ItemType Directory -Path $dist | Out-Null

$files = @(
    'index.html',
    'manifest.json',
    'sw.js',
    'icon-192.png',
    'icon-512.png'
)
foreach ($f in $files) {
    $src = Join-Path $root $f
    if (Test-Path $src) {
        Copy-Item -LiteralPath $src -Destination $dist -Force
    }
}

$dirs = @('fonts', 'vendor')
foreach ($d in $dirs) {
    $src = Join-Path $root $d
    if (Test-Path $src) {
        Copy-Item -LiteralPath $src -Destination $dist -Recurse -Force
    }
}
