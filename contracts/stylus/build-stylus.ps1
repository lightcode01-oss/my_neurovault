<#
Build script for Stylus example (Windows PowerShell).

Prerequisites:
- Install Rust (rustup) and add the `wasm32-unknown-unknown` target.

Usage:
  .\build-stylus.ps1

#>

Set-StrictMode -Version Latest

Write-Host "Building Stylus (WASM) example..."

if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
    Write-Host "cargo not found. Please install Rust (rustup) first." -ForegroundColor Yellow
    exit 1
}

# Ensure target exists
rustup target add wasm32-unknown-unknown | Out-Null

Push-Location -Path "$PSScriptRoot"

cargo build --release --target wasm32-unknown-unknown

$wasm = Join-Path -Path "$PSScriptRoot" -ChildPath "target/wasm32-unknown-unknown/release/stylus_example.wasm"
if (Test-Path $wasm) {
    Write-Host "Built WASM artifact at: $wasm"
} else {
    Write-Host "Build finished but WASM artifact not found. Check cargo output." -ForegroundColor Yellow
}

Pop-Location
