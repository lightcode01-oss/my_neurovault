<#
Build helper for the Stylus MemoryRegistry crate (PowerShell).

Usage:
  .\build-memory-registry.ps1

Prerequisites:
- Rust toolchain (rustup)
- `wasm32-unknown-unknown` target added

#>

Set-StrictMode -Version Latest

Write-Host "Building Stylus memory_registry crate..."

if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
    Write-Host "cargo not found. Please install Rust (rustup) first." -ForegroundColor Yellow
    exit 1
}

rustup target add wasm32-unknown-unknown | Out-Null

Push-Location -Path "$PSScriptRoot"

cargo build --release --target wasm32-unknown-unknown

$wasm = Join-Path -Path "$PSScriptRoot" -ChildPath "target/wasm32-unknown-unknown/release/memory_registry_stylus.wasm"
if (Test-Path $wasm) {
    Write-Host "Built WASM artifact at: $wasm"
} else {
    Write-Host "Build finished but WASM artifact not found. Check cargo output." -ForegroundColor Yellow
}

Pop-Location
