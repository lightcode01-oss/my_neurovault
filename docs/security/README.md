# Security Hardening Guide

## Overview

This document outlines security best practices for NeuroVault Memory Network deployment and operation.

## 1. Secrets Management

### Environment Variables (Never Commit)

```bash
# .env.local (add to .gitignore)
DEPLOYER_KEY=0x...                    # Private key for deployment
VALIDATOR_KEY=0x...                   # Private key for validator wallet
OPENAI_KEY=sk-...                     # Optional: OpenAI API key
RPC_URL=https://...                   # RPC endpoint
STYLUS_MODULE_ID=0x...                # Deployed contract address
```

### Secure Storage

- **Development:** Use `.env.local` (git-ignored)
- **CI/CD:** Use GitHub Secrets
- **Production:** Use vault service (HashiCorp, AWS Secrets Manager, etc.)

### Key Rotation

```bash
# Rotate validator key
# 1. Generate new key
openssl ecparam -name secp256k1 -genkey -noout | openssl ec -text -noout

# 2. Update .env.local
VALIDATOR_KEY=0x<new_key>

# 3. Update GitHub secret
gh secret set VALIDATOR_KEY --body "0x<new_key>"

# 4. Announce new validator address to network
# (requires updating smart contract allowlist if applicable)
```

## 2. WASM Artifact Security

### Integrity Verification

All WASM artifacts should be signed and verified:

```bash
# Sign WASM with GPG
gpg --default-key your-key-id --sign --armor contracts/stylus/memory_registry/target/wasm32-unknown-unknown/release/memory_registry.wasm

# Verify signature
gpg --verify memory_registry.wasm.asc memory_registry.wasm

# Check SHA256
sha256sum memory_registry.wasm > memory_registry.wasm.sha256
cat memory_registry.wasm.sha256  # Publish publicly
```

### Supply Chain Security

- Pin all dependency versions in `Cargo.toml`
- Use `cargo vendor` to audit dependencies locally
- Sign all releases with GPG

## 3. API Security

### Rate Limiting

The backend includes a simple rate-limit middleware (token bucket):

```typescript
// backend/middleware/rateLimiter.ts
const rateLimitMiddleware = (req, res, next) => {
  const ip = req.ip;
  const limit = 100; // requests
  const window = 60; // seconds

  // TODO: Implement token bucket or sliding window
  // For now, using simple dict-based approach
};
```

### Input Validation

All endpoints validate:
- JSON schema compliance
- Field type checking
- Length limits (e.g., title max 256 chars)
- UTF-8 encoding

### CORS

```typescript
// backend/app.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
```

### HTTPS / TLS

- Always use HTTPS in production
- Pin certificates using HPKP headers
- Use TLS 1.3 minimum

## 4. Smart Contract Security

### Auditing

Before mainnet deployment:
- [ ] Formal verification of contract logic
- [ ] Third-party security audit
- [ ] Fuzzing tests on edge cases

### Deployment Safety

- [ ] Deploy to testnet first
- [ ] Run extended period on testnet (1+ weeks)
- [ ] Gather community feedback
- [ ] Final audit before mainnet
- [ ] Staged rollout (e.g., 10% of users first)

### Admin Controls

- [ ] Pause mechanism for emergency
- [ ] Upgrade path (proxy contracts)
- [ ] Timelock for critical changes (24-72 hours)

## 5. Validator Security

### Validator Key Management

```bash
# Use hardware wallet or secure enclave in production
# DO NOT store unencrypted on server

# Example: Use AWS KMS
aws kms encrypt --key-id alias/validator-key --plaintext 0x...

# Or use Hashicorp Vault
vault kv put secret/neurovault validator_key=0x...
```

### Validator Registration

- [ ] Whitelist validators on-chain
- [ ] Bond/slash mechanism to prevent malicious behavior
- [ ] Reputation scoring

## 6. Backend Security

### Database

```sql
-- Use parameterized queries (avoid SQL injection)
SELECT * FROM memories WHERE id = ?  -- ✅ Safe
SELECT * FROM memories WHERE id = '" + user_input + "'"  -- ❌ Unsafe
```

### Logging & Monitoring

- Log all validator submissions
- Alert on unusual patterns
- Track gas costs for anomalies
- Monitor for DoS attacks

## 7. Frontend Security

### Content Security Policy

```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net">
```

### WASM Integrity

```typescript
// Verify WASM SHA256 before loading
const wasmHash = "0x...";  // Published in releases
const wasmFile = await fetch("/stylus/memory_registry.wasm");
const computed = await crypto.subtle.digest("SHA-256", await wasmFile.arrayBuffer());

if (computed !== wasmHash) {
  throw new Error("WASM integrity check failed!");
}
```

## 8. Release Security Checklist

- [ ] All tests passing
- [ ] Type checking: `npx tsc --noEmit`
- [ ] Linting: `npm run lint`
- [ ] WASM signed with GPG
- [ ] SHA256 hash published
- [ ] Release notes in CHANGELOG
- [ ] Tagged with semver: `vX.Y.Z`
- [ ] Changelog entry for security fixes (if any)

## 9. Incident Response

### If Private Key is Compromised

1. **Immediately rotate keys:**
   ```bash
   # Stop all services
   # Generate new keys
   # Update environment variables
   # Redeploy with new keys
   ```

2. **Notify users** if validator key was exposed

3. **Audit logs** for unauthorized submissions

4. **Post-mortem** analysis

### If WASM Artifact is Compromised

1. **Revoke** current artifact version
2. **Rebuild** from clean source
3. **Sign** with GPG
4. **Publish** new release
5. **Notify** all integrations

## 10. References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Ethereum Smart Contract Security](https://docs.soliditylang.org/en/latest/security-considerations.html)
- [Arbitrum Security](https://docs.arbitrum.io/security/)

---

Last updated: 2025-11-23
