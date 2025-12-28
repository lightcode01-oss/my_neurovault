# Monitoring Checklist

Minimal monitoring guidance for NeuroVault deployment (Stylus + Backend + Frontend).

1. Health endpoint pings
   - Poll `/health/full` every 30s (or use Prometheus blackbox exporter).
   - Alerts if `ok` is false or db query fails.

2. Indexer lag
   - Monitor `infra/indexer.js` index_state table `last_block_indexed` vs chain head.
   - Alert if lag > 500 blocks for 30+ minutes.

3. Validator failures
   - Capture validator stdout/stderr to logs.
   - Alert if consecutive failures > 3 or no validations processed in 10 minutes.

4. WASM availability
   - Ensure `public/stylus/memory_registry.wasm` is downloadable from CDN.
   - Verify `wasm_test_ping` returns expected value periodically.

5. IPFS / web3.storage
   - Monitor IPFS gateway response times and error rates.
   - Monitor web3.storage uploads and failures.

6. Logging & Sentry
   - Ensure backend Sentry DSN is configured for production.
   - Log rotation and retention policy set for backend logs.

7. Dashboards / Alerts
   - Create dashboards for API latency, memory submission rate, validation rate.
   - PagerDuty/Slack alerts for critical issues (service down, DB corruption).

8. Maintenance tasks
   - Nightly DB backup (rotate last 7 days)
   - Weekly dependency security scan (npm audit, pip-audit)
