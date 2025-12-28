**Run & WASM publishing quick reference**

Local quickstart (development):

- Copy example env:

  `cp .env.example .env.local`

- Install dependencies (frontend & backend):

  `npm install` (for frontend tooling)
  `python -m venv .venv && .\.venv\Scripts\Activate.ps1 && pip install fastapi uvicorn requests`

- Start backend:

  `python backend/app.py`

- Seed demo data:

  `npx ts-node scripts/seed_demo.ts --backend http://localhost:8000`

- Verify wasm locally (after CI artifact or build):

  `node scripts/fetch_wasm.js --local ./stylus_wasm.wasm --out ./public/stylus_wasm.wasm`
  `node scripts/verify_wasm_fetch.js --local ./public/stylus_wasm.wasm`

- Run the indexer once:

  `node infra/indexer.js --rpc http://localhost:8545 --from-block 0 --once`

- Validator dry-run example (no VALIDATOR_KEY):

  `python backend/validators/validator.py --backend http://localhost:8000 --once --dry`

- Auto submit validation (dry):

  `npx ts-node scripts/autoSubmitValidation.ts --memoryId 1 --score 0.8 --valid true --dry`

CI notes (high level):

- Workflow `build_and_release_wasm.yml` builds the wasm artifact, computes a sha256 file, uploads the artifact, and runs a smoke test via `scripts/verify_wasm_fetch.js`.
- TODO: wire GH secrets `OPENAI_KEY`, `VALIDATOR_KEY`, `RPC_URL` into Actions and use a secure CD pipeline to publish wasm and artifacts.

Security & production TODOs:

- Move secrets to a secure vault and never store private keys in repository.
- Add ABI checks, signed releases, and integrity verification for wasm artifacts.
- Harden backend with auth, rate-limiting, DB migrations, and monitoring.

If anything above fails, open an issue and include `npx tsc --noEmit` and `npx vitest --run` logs when relevant.
