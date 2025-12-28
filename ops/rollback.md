# Rollback Procedure for Stylus Module Deployment

This document describes how to rollback the active `STYLUS_MODULE_ID` used
by the NeuroVault deployment in case a newly-deployed Stylus module introduces
critical issues.

Steps (safe, idempotent):

1. Identify the previous stable module ID (from release metadata or GitHub Release notes).

2. Update environment variables (CI/GitHub Secrets)

   - Update GitHub secret `STYLUS_MODULE_ID` with the previous module id:

     ```bash
     gh secret set STYLUS_MODULE_ID --body "0xPREVIOUSMODULEID"
     ```

   - Update any server `.env` files (on backend hosts):

     ```bash
     # on each server
     export STYLUS_MODULE_ID=0xPREVIOUSMODULEID
     systemctl restart neurovault-backend
     ```

3. Re-deploy frontend with the older module id (if module id was baked into frontend build):

   ```bash
   VITE_STYLUS_MODULE_ID=0xPREVIOUSMODULEID npm run build
   # deploy build/ to hosting provider
   ```

4. Verify rollback

   - Run health check: `curl https://your-backend/health/full`
   - Run smoke E2E: `npm run test:run` or `pytest backend/tests/test_validation_flow.py`

5. If the faulty module needs to be deactivated on-chain, coordinate with Stylus operator
   and/or multisig owner to disable or revoke the module using the official Stylus
   tooling (this is an operator/manual step). !!! ACTION REQUIRED

Notes:
 - Keep a secure record of module IDs and release SHAs for quick rollbacks.
 - Do not store private keys in Git.
