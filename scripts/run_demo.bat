@echo off
REM Quick start script for MemoryRegistry development (Windows)

setlocal enabledelayedexpansion

echo.
echo 🚀 MemoryRegistry Quick Start (Windows)
echo ========================================
echo.

REM Check dependencies
echo 📋 Checking dependencies...

where node >nul 2>nul
if errorlevel 1 (
    echo ❌ Node.js not found. Please install Node.js 18+
    exit /b 1
)

where python >nul 2>nul
if errorlevel 1 (
    echo ❌ Python 3 not found. Please install Python 3.10+
    exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
    echo ❌ npm not found. Please install npm
    exit /b 1
)

echo ✅ Dependencies found
echo.

REM Setup environment
echo 🔧 Setting up environment...
if not exist .env (
    copy .env.example .env
    echo ✅ Created .env file
    echo ⚠️  Please fill in your API keys in .env
) else (
    echo ✅ .env file exists
)
echo.

REM Install dependencies
echo 📦 Installing dependencies...
call npm install --legacy-peer-deps
pip install -r backend\requirements.txt
if errorlevel 1 (
    echo ❌ Dependency installation failed
    exit /b 1
)
echo ✅ Dependencies installed
echo.

REM Create data directory
echo 📁 Creating data directories...
if not exist data mkdir data
if not exist build mkdir build
echo ✅ Directories created
echo.

echo 🎉 Quick start setup complete!
echo.
echo Next steps:
echo 1. Edit .env with your configuration
echo 2. (Legacy) Hardhat local node: npx hardhat node  (deprecated in this repo)
echo 3. (Legacy) Hardhat deploy: npx hardhat run scripts\deploy.ts --network localhost  (deprecated)
echo    For Stylus/WASM workflows, see contracts/stylus/ and .github/workflows/build_and_release_wasm.yml
echo 4. Run: npm run dev (in another terminal)
echo.
echo Or run full setup with PowerShell:
echo   .\scripts\run_demo.ps1
echo.

endlocal
