<#
PowerShell helper to build the Stylus WASM artifact.

This script will:
- Check for `cargo` (Rust). If missing, download and install rustup (Windows installer).
- Ensure the `wasm32-unknown-unknown` target is installed.
- Run a release build for the `contracts/stylus/memory_registry` crate.

Usage (from project root):
  pwsh ./scripts/build_wasm.ps1
  pwsh ./scripts/build_wasm.ps1 -WasmPath "./contracts/stylus/memory_registry/target/wasm32-unknown-unknown/release/memory_registry.wasm"

Run with elevated privileges if installing rustup.
#>
param(
    [string]
    $WasmPath = "./contracts/stylus/memory_registry/target/wasm32-unknown-unknown/release/memory_registry.wasm"
)

Write-Host "Building Stylus WASM artifact..." -ForegroundColor Cyan

function Ensure-Rust {
    $cargo = Get-Command cargo -ErrorAction SilentlyContinue
    if ($null -ne $cargo) {
        Write-Host "cargo found: $($cargo.Path)" -ForegroundColor Green
        return $true
    }

    Write-Host "cargo not found. Installing rustup..." -ForegroundColor Yellow
    $installer = "$env:TEMP\rustup-init.exe"
    try {
        Invoke-WebRequest -Uri "https://win.rustup.rs" -OutFile $installer -UseBasicParsing -ErrorAction Stop
    } catch {
        Write-Host "Failed to download rustup installer. Please install Rust manually from https://rustup.rs" -ForegroundColor Red
        return $false
    }

    Write-Host "Running rustup installer (silent)..." -ForegroundColor Yellow
    $proc = Start-Process -FilePath $installer -ArgumentList "-y" -Wait -PassThru
    if ($proc.ExitCode -ne 0) {
        Write-Host "rustup installer exited with code $($proc.ExitCode). Please install Rust manually." -ForegroundColor Red
        return $false
    }

    # Refresh PATH for current session if cargo now available
    $cargo = Get-Command cargo -ErrorAction SilentlyContinue
    if ($null -ne $cargo) {
        Write-Host "cargo installed: $($cargo.Path)" -ForegroundColor Green
        return $true
    }

    Write-Host "cargo still not found after installation. Restart your shell or add `%USERPROFILE%\\.cargo\\bin` to PATH and re-run this script." -ForegroundColor Red
    return $false
}

if (-not (Ensure-Rust)) {
    exit 1
}

# Ensure wasm target
Write-Host "Ensuring wasm32 target is installed..." -ForegroundColor Cyan
rustup target add wasm32-unknown-unknown
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to add wasm target. You may need to run rustup manually." -ForegroundColor Red
    exit 1
}

# Build
Push-Location "contracts/stylus/memory_registry"
try {
    Write-Host "Running: cargo build --target wasm32-unknown-unknown --release" -ForegroundColor Cyan
    cargo build --target wasm32-unknown-unknown --release
    if ($LASTEXITCODE -ne 0) {
        Write-Host "cargo build failed (exit code $LASTEXITCODE)." -ForegroundColor Red
        exit 1
    }
} finally {
    Pop-Location
}

# Verify artifact
if (Test-Path $WasmPath) {
    $bytes = (Get-Item $WasmPath).Length
    Write-Host "✅ WASM built: $WasmPath ($bytes bytes)" -ForegroundColor Green
    Write-Host "You can now run the deploy script in dry-run:" -ForegroundColor Cyan
    Write-Host "npx ts-node contracts/stylus/deploy-stylus.ts --network arbitrumSepolia --wasm-path $WasmPath --dry-run" -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "❌ Expected WASM not found at $WasmPath" -ForegroundColor Red
    exit 1
}
