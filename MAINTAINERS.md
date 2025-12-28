# Maintainers Checklist

This document is for project maintainers and describes ongoing maintenance and release procedures.

## 🔄 Weekly Maintenance

- [ ] Review open issues and PRs
- [ ] Run security scan: `npm audit` & `pip check`
- [ ] Verify CI/CD pipeline passes
- [ ] Update dependencies (non-major): `npm update` & `pip install --upgrade`
- [ ] Check for deprecated APIs in logs

## 🔒 Security

- [ ] Review security audit results
- [ ] Rotate secrets if accessed recently
- [ ] Check for new vulnerability disclosures
- [ ] Update SECURITY.md with latest advisories

## 📊 Monitoring (Production)

- [ ] Check contract event logs
- [ ] Monitor indexer block sync progress
- [ ] Review validator submission patterns
- [ ] Analyze gas costs and performance
- [ ] Check IPFS upload success rate

## 🚀 Release Process

### Pre-Release (1-2 weeks before)

1. **Feature freeze:** No new features, only bug fixes
2. **Update versions:**
   ```bash
   npm version patch  # or minor/major
   # Updates package.json, package-lock.json, creates git tag
   ```

3. **Update CHANGELOG:**
   ```markdown
   ## [1.0.1] - 2025-11-30

   ### Added
   - New security checks in validator
   
   ### Fixed
   - WASM instantiation on Node.js 20+
   - Rate limiter edge case

   ### Security
   - Updated dependencies for CVE fixes
   ```

4. **Code review:**
   - All code reviewed by 2+ maintainers
   - All tests passing
   - Documentation updated

### Release Day

Execute the steps in [FINALIZE.md](../FINALIZE.md#-final-prompt-for-maintainers).

### Post-Release (1 week)

1. **Monitor reports:**
   - Watch for bug reports
   - Monitor production metrics
   - Gather user feedback

2. **Prepare patch if needed:**
   ```bash
   git hotfix start v1.0.1
   # Make fixes
   git hotfix finish v1.0.1
   ```

3. **Announce:**
   - Tweet / social media
   - Discord / community
   - Email subscribers

## 🔐 Key Rotation

**When to rotate:**
- Every 90 days (recommended)
- If key is suspected compromised
- When team member leaves

**Steps:**

```bash
# 1. Generate new key
openssl ecparam -name secp256k1 -genkey -noout | openssl ec -text -noout

# 2. Update .env.local
echo "DEPLOYER_KEY=0x..." >> .env.local

# 3. Update GitHub Secret
gh secret set DEPLOYER_KEY --body "0x..."

# 4. Test new key
export DEPLOYER_KEY=0x...
npm run deploy:test  # Deploy to testnet to verify

# 5. Announce to team
# (share new address, revoke old address if applicable)
```

## 📚 Documentation Updates

### When to update README.md

- [ ] New features added
- [ ] Deployment instructions change
- [ ] CLI commands added/modified
- [ ] Environment variables changed
- [ ] API endpoints modified

### Docs that require regular updates

- `CHANGELOG.md` — Every release
- `contracts/stylus/DEPLOY_GUIDE.md` — When deployment process changes
- `docs/security/README.md` — When vulnerabilities are discovered
- `backend/docs/API.md` — When API changes
- `FINALIZE.md` — When release process changes

## 🧪 Testing Responsibilities

- [ ] Run full test suite before merge
- [ ] E2E tests on testnet weekly
- [ ] Smoke tests on production monthly
- [ ] Load testing before major releases
- [ ] Security testing before releases

## 🐛 Bug Triage

When a bug is reported:

1. **Verify:** Can you reproduce it?
2. **Classify:** Critical / High / Medium / Low
3. **Assign:** Pick a maintainer
4. **Label:** `bug`, `needs-investigation`, etc.
5. **Target:** Assign to milestone
6. **Timeline:**
   - Critical: Fix immediately
   - High: Fix within 1 week
   - Medium: Fix within 2 weeks
   - Low: Fix in next release

## 📈 Scaling Considerations

As the project grows:

- [ ] Database scaling (sharding if needed)
- [ ] Indexer performance (batch commits)
- [ ] API rate limiting (increase as needed)
- [ ] WASM contract upgrades (proxy pattern)
- [ ] Multi-chain coordination (keep state in sync)

## 🎓 Onboarding New Maintainers

1. Add to GitHub team
2. Grant access to secrets manager
3. Add to CI/CD notifications
4. Assign mentorship tasks
5. Provide key rotation schedule
6. Share documentation access

### New maintainer checklist:

- [ ] GitHub write access
- [ ] Key management access
- [ ] Monitoring dashboards
- [ ] Emergency contact list
- [ ] Release runbook review

## 📞 Emergency Procedures

### If Mainnet Contract is Hacked

1. **Pause:** Invoke emergency pause mechanism
2. **Assess:** What was stolen/damaged?
3. **Notify:** Users, community, auditors
4. **Investigate:** Post-mortem analysis
5. **Plan:** Fix and relaunch
6. **Communicate:** Timeline and next steps

### If Private Key is Leaked

1. **Stop using immediately**
2. **Generate new key**
3. **Update all references** (env, GitHub secrets, etc.)
4. **Audit logs** for unauthorized access
5. **Notify users** if sensitive data exposed
6. **Rotate all related keys** (indexer, validator, etc.)

## 🔗 Useful Links

- GitHub Issues: https://github.com/YOUR_ORG/NeuroVault-Memory-Network/issues
- GitHub Projects: https://github.com/YOUR_ORG/NeuroVault-Memory-Network/projects
- CI Dashboard: https://github.com/YOUR_ORG/NeuroVault-Memory-Network/actions
- Deployed Contract (testnet): https://sepolia.arbiscan.io/address/0x...
- Monitoring Dashboard: [YOUR_MONITORING_TOOL]
- Secrets Manager: [YOUR_VAULT_SERVICE]

## 📅 Maintenance Calendar

- **Weekly:** Security audits, dependency checks
- **Monthly:** Load testing, performance review
- **Quarterly:** Security audit, key rotation
- **Annually:** Full code audit, dependency refresh

## 👥 Contact

- **Lead Maintainer:** @maintainer-name
- **Deputy:** @deputy-name
- **Security:** security@example.com
- **On-call:** [YOUR_ROTATION_SCHEDULE]

---

Last updated: 2025-11-23
For questions, open an issue or contact the maintainers.
