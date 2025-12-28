# Manual E2E Checklist — NeuroVault Memory Network

Run these manually during local dev (Vite) or in a staging deploy. Each step includes expected results and how to force failure states for testing.

1. Wallet connect (fresh session)
   - Steps: Open app -> Click `Connect Wallet` -> Approve connection in wallet
   - Expected: Address pill appears, network displays, `neurovault.connected` saved to `localStorage`
   - Force failure: Disable `window.ethereum` in browser (or use a browser without MetaMask)

2. Wallet reconnect (page reload)
   - Steps: Reload the page
   - Expected: Wallet auto-reconnects without prompting, address pill restores
   - Force failure: Clear `localStorage` key `neurovault.connected`

3. Switch network
   - Steps: Use the `Switch Network` button in the wallet dropdown
   - Expected: Wallet attempts to switch to target chain; UI updates chain ID and explorer link
   - Force failure: Set `VITE_TARGET_CHAIN_ID` to an unsupported chain or disconnect wallet

4. Submit a memory (happy path)
   - Steps: Fill form -> Upload image (optional) -> Submit
   - Expected: Progress bar advances -> CID and txHash shown on success -> Memory saved on-chain (if configured)
   - Force failure: Temporarily set `VITE_IPFS_API_URL` to an invalid URL to force fallback and observe retry behavior

5. IPFS fallback
   - Steps: Configure `VITE_IPFS_API_URL` to invalid -> Submit memory
   - Expected: Infura attempt times out -> web3.storage fallback used -> upload succeeds (if key provided)
   - Force failure: Remove `VITE_WEB3STORAGE_KEY` to see error surfaced to UI

6. Retry cached payload
   - Steps: Submit but fail contract tx (e.g., set `VITE_MEMORY_REGISTRY_ADDRESS` invalid) -> Click retry
   - Expected: `retryLastPayload()` re-uploads and re-submits; UI shows progress
   - Force failure: Simulate tx revert in test contract or disconnect network during `submitMemory` call

7. Large payload handling
   - Steps: Submit a large JSON payload or large image
   - Expected: Progress shows incremental updates; upload does not hang indefinitely
   - Force failure: Use very small `timeoutMs` in client to force timeout path

8. Disconnect wallet
   - Steps: Open wallet dropdown -> Click `Disconnect`
   - Expected: Address pill removed, `neurovault.connected` cleared, UI returns to pre-connected state

9. Copy address / Open explorer
   - Steps: Click `Copy Address` -> Click `Open on Explorer`
   - Expected: Clipboard has address; explorer opens in new tab using `VITE_BLOCK_EXPLORER_BASE`

10. Error reporting and messaging
   - Steps: Force an IPFS and contract failure
   - Expected: UI displays actionable error message with retry link; logs available in console

Notes for testers:
- Ensure `.env` contains working `VITE_RPC_URL`, `VITE_MEMORY_REGISTRY_ADDRESS`, `VITE_IPFS_API_URL` (or `VITE_WEB3STORAGE_KEY`), and `VITE_BLOCK_EXPLORER_BASE` where applicable.
- Use browser devtools to throttle network to observe progress events more clearly.
- For contract tests, prefer Stylus/WASM tooling and a Stylus-enabled node. If you must run legacy Solidity tests, you can use a local Hardhat/Anvil network with a deployed `MemoryRegistry` and set `VITE_MEMORY_REGISTRY_ADDRESS` accordingly (legacy).
