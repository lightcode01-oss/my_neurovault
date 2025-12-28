# Makefile for MemoryRegistry
# Provides convenient commands for development, testing, and deployment

.PHONY: help install dev test build deploy clean docker logs

help:
	@echo "MemoryRegistry Makefile - Available commands:"
	@echo ""
	@echo "Setup:"
	@echo "  make install          Install all dependencies"
	@echo "  make env              Copy .env.example to .env"
	@echo ""
	@echo "Development:"
	@echo "  make dev              Start dev server (frontend) — Hardhat node disabled (see Stylus/WASM)"
	@echo "  make dev-frontend     Start frontend only"
	@echo "  make dev-hardhat      Start Hardhat node (legacy/disabled)"
	@echo ""
	@echo "Blockchain:"
	@echo "  make deploy           Deploy contract to local network"
	@echo "  make deploy-sepolia   Deploy contract to Arbitrum Sepolia"
	@echo "  make test-contracts   Run contract tests (legacy Hardhat - prefer Stylus/WASM)"
	@echo "  make seed             Seed demo memories"
	@echo ""
	@echo "Backend:"
	@echo "  make backend          Start FastAPI backend"
	@echo "  make backend-test     Run backend tests"
	@echo "  make indexer          Start event indexer"
	@echo "  make validator        Run validator automation"
	@echo ""
	@echo "Testing:"
	@echo "  make test-all         Run all tests"
	@echo "  make test-e2e         Run end-to-end tests"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build     Build Docker images"
	@echo "  make docker-up        Start containers"
	@echo "  make docker-down      Stop containers"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean            Remove build artifacts"
	@echo "  make logs             Show recent logs"
	@echo ""

# ==================== Setup ====================

install:
	npm install
	pip install -r backend/requirements.txt
	@echo "✅ All dependencies installed"

env:
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "✅ Created .env from .env.example"; \
		echo "⚠️  Please fill in your API keys in .env"; \
	else \
		echo ".env already exists"; \
	fi

# ==================== Development ====================

dev: dev-frontend dev-backend
	@echo "🚀 Full dev environment running (Hardhat node disabled by migration)"

dev-frontend:
	npm run dev

dev-hardhat:
	@echo "⚠️  dev-hardhat is disabled: project migrated to Stylus/WASM."
	@echo "If you need a local EVM environment for legacy Solidity artifacts, re-enable this target or run 'npx hardhat node' manually."

dev-indexer:
	node infra/indexer.js --from-block 0

dev-backend:
	cd backend && python -m uvicorn app:app --reload --port 8000

# ==================== Blockchain ====================

deploy: env
	@echo "⚠️  deploy (Hardhat) is deprecated: project migrated to Stylus/WASM."
	@echo "Use Stylus deploy tooling or the CI workflow to publish WASM artifacts. See contracts/stylus/README.md"
	@echo "No action taken."

deploy-sepolia: env
	@echo "⚠️  deploy-sepolia is deprecated: project migrated to Stylus/WASM."
	@echo "Use Stylus deploy tooling or CI to publish WASM artifacts to Stylus-enabled networks."
	@echo "No action taken."

test-contracts:
	@echo "⚠️  test-contracts (Hardhat) is deprecated: run Stylus-specific tests or see tests/ for legacy tests."
	@echo "No action taken."

seed: env
	@echo "⚠️  seed (Hardhat) is deprecated: seed demo data using backend scripts or Stylus tooling."
	@echo "No action taken."

# ==================== Backend ====================

backend: env
	cd backend && python app.py

backend-test:
	cd backend && pytest tests/ -v

indexer: env
	@echo "🔍 Starting event indexer..."
	node infra/indexer.js --from-block 0

validator: env
	@echo "👮 Starting validator automation..."
	python backend/validators/validator.py --once

# ==================== Testing ====================

test-all: backend-test
	@echo "✅ Backend tests complete (contract tests are deprecated)."

test-e2e: env
	@echo "⚠️  test-e2e previously relied on Hardhat deploy; adapt to Stylus/WASM deployments before running."
	@echo "Skipping E2E run."

# ==================== Docker ====================

docker-build:
	docker build -t neurovault-backend:latest -f Dockerfile.backend .
	@echo "✅ Docker image built"

docker-up:
	docker compose up -d
	@echo "✅ Containers started"

docker-down:
	docker compose down
	@echo "✅ Containers stopped"

# ==================== Utilities ====================

clean:
	rm -rf build dist artifacts cache
	rm -rf node_modules
	rm -rf __pycache__ backend/__pycache__
	rm -rf .pytest_cache
	rm -f data/*.db
	@echo "✅ Cleaned"

logs:
	@echo "Recent changes:"
	@git log --oneline -5

# ==================== Quick Workflows ====================

quick-start: install env deploy seed dev-frontend
	@echo "🚀 Quick start complete!"

full-demo: install env deploy seed indexer backend validator dev-frontend
	@echo "🎉 Full demo running!"

# ==================== CI/CD ====================

lint:
	npm run lint

type-check:
	npm run type-check

build:
	npm run build

# ==================== Default ====================

.DEFAULT_GOAL := help
