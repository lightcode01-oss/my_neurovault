#!/bin/bash
# Quick start script for MemoryRegistry development

set -e

echo "🚀 MemoryRegistry Quick Start"
echo "============================="
echo ""

# Check dependencies
echo "📋 Checking dependencies..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.10+"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm"
    exit 1
fi

echo "✅ Dependencies found"
echo ""

# Setup environment
echo "🔧 Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file"
    echo "⚠️  Please fill in your API keys in .env"
else
    echo "✅ .env file exists"
fi
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps
pip install -r backend/requirements.txt
echo "✅ Dependencies installed"
echo ""

# Create data directory
echo "📁 Creating data directories..."
mkdir -p data
mkdir -p build
echo "✅ Directories created"
echo ""

echo "🎉 Quick start setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env with your configuration"
echo "2. (Deprecated) Hardhat steps removed — use Stylus/WASM workflow"
echo "   See: contracts/stylus/ and .github/workflows/build_and_release_wasm.yml for wasm build & deploy"
echo "3. Start backend: cd backend && python -m uvicorn app:app --reload --port 8000"
echo "4. Start frontend: npm run dev"
echo ""
echo "Or run full setup with: make full-demo"
