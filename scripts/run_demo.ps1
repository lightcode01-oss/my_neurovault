#!/usr/bin/env pwsh
# Quick start script for MemoryRegistry development (PowerShell)

Write-Host ""
Write-Host "🚀 MemoryRegistry Quick Start (PowerShell)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check dependencies
Write-Host "📋 Checking dependencies..." -ForegroundColor Yellow

$nodeVersion = node --version 2>$null
if ($null -eq $nodeVersion) {
    Write-Host "❌ Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

$pythonVersion = python --version 2>$null
if ($null -eq $pythonVersion) {
    Write-Host "❌ Python 3 not found. Please install Python 3.10+" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Dependencies found" -ForegroundColor Green
Write-Host ""

# Setup environment
Write-Host "🔧 Setting up environment..." -ForegroundColor Yellow

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Created .env file" -ForegroundColor Green
    Write-Host "⚠️  Please fill in your API keys in .env" -ForegroundColor Yellow
} else {
    Write-Host "✅ .env file exists" -ForegroundColor Green
}
Write-Host ""

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow

npm install --legacy-peer-deps | Out-Null
pip install -r backend/requirements.txt | Out-Null

Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Create data directory
Write-Host "📁 Creating data directories..." -ForegroundColor Yellow

$dirs = @("data", "build")
foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir | Out-Null
    }
}

Write-Host "✅ Directories created" -ForegroundColor Green
Write-Host ""

Write-Host "🎉 Quick start setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env with your configuration"
Write-Host "2. (Legacy) Hardhat local node: npx hardhat node — deprecated in this repo"
Write-Host "3. (Legacy) Hardhat deploy: npx hardhat run scripts\deploy.ts --network localhost — deprecated"
Write-Host "   For Stylus/WASM workflows, see contracts/stylus/ and .github/workflows/build_and_release_wasm.yml"
Write-Host "4. Run in terminal 3: npm run dev"
Write-Host ""
Write-Host "Or run full orchestrated demo:" -ForegroundColor Cyan
Write-Host "  pwsh scripts\full_demo.ps1"
Write-Host ""
