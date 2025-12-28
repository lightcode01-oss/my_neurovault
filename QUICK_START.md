# 🚀 Quick Integration Guide - Wallet Connect UI

## Installation Status: ✅ COMPLETE

All files are created, configured, and ready. No npm installs needed.

---

## 5-Minute Integration

### Step 1: Verify Environment File
Check that `.env` has (or add if missing):
```dotenv
VITE_TARGET_CHAIN_ID=421614
```

### Step 2: Find Your Header Component
Locate where you render your header (usually `src/components/Header.tsx` or in `App.tsx`).

### Step 3: Import & Use
```tsx
import { ConnectWallet } from './ConnectWallet';  // Or your path

export function Header() {
  return (
    <header className="flex items-center justify-between">
      <h1>NeuroVault</h1>
      
      {/* Add this line: */}
      <ConnectWallet />
      
    </header>
  );
}
```

That's it! 🎉

---

## Optional: Add Callbacks

If you want to react to connection state changes:

```tsx
<ConnectWallet
  onConnect={(address, chainId) => {
    console.log(`Connected: ${address} on chain ${chainId}`);
    // Update global state, redirect, etc.
  }}
  onDisconnect={() => {
    console.log('User disconnected');
    // Clear user data, redirect to home, etc.
  }}
/>
```

---

## Optional: Use Wallet Hook Directly

If you need wallet info in other components:

```tsx
import { useWallet } from '../hooks/useWallet';

function MyComponent() {
  const { 
    address,      // Connected address or null
    chainId,      // Current chain ID or null
    connected,    // true/false
    connect,      // () => Promise<void>
    disconnect,   // () => Promise<void>
    switchChain,  // (chainId: number) => Promise<void>
    error         // Error message or null
  } = useWallet();

  return (
    <div>
      {connected ? (
        <>
          <p>Connected: {address}</p>
          <p>Chain: {chainId}</p>
          <button onClick={() => switchChain(42161)}>
            Switch to Arbitrum One
          </button>
          <button onClick={disconnect}>Disconnect</button>
        </>
      ) : (
        <button onClick={connect}>Connect Wallet</button>
      )}
    </div>
  );
}
```

---

## Testing Locally

1. **Start dev server** (already running):
   ```bash
   npm run dev
   ```

2. **Open browser**:
   ```
   http://localhost:3001
   ```

3. **Install MetaMask** (if not already):
   - Chrome: Search "MetaMask" in Chrome Web Store
   - Firefox: Search "MetaMask" in Firefox Add-ons

4. **Test the flow**:
   - [ ] Click "Connect Wallet"
   - [ ] Approve in MetaMask popup
   - [ ] See address pill with green indicator
   - [ ] Click pill to open dropdown
   - [ ] Click copy button
   - [ ] Click disconnect button
   - [ ] Verify "Connect Wallet" button returns
   - [ ] Refresh page
   - [ ] Address should still show (persistence!)

---

## Chain Configuration

### Available Chains

Edit `VITE_TARGET_CHAIN_ID` in `.env`:

```dotenv
# Arbitrum Networks
VITE_TARGET_CHAIN_ID=42161    # Arbitrum One (mainnet)
VITE_TARGET_CHAIN_ID=42170    # Arbitrum Nova
VITE_TARGET_CHAIN_ID=421614   # Arbitrum Sepolia (testnet) [DEFAULT]

# Other Networks
VITE_TARGET_CHAIN_ID=1        # Ethereum mainnet
VITE_TARGET_CHAIN_ID=11155111 # Sepolia testnet
```

When user is on a different chain, a "Switch to [ChainName]" button appears.

---

## Customization

### Change Colors

Edit `src/components/ConnectWallet.tsx`:

**Address pill gradient** (search for `from-purple-900/40`):
```tsx
// Change from:
className="... from-purple-900/40 to-cyan-900/40 ..."
// To:
className="... from-blue-900/40 to-indigo-900/40 ..."
```

**Switch button color** (search for `bg-orange-600`):
```tsx
// Change from:
className="... bg-orange-600 hover:bg-orange-700 ..."
// To:
className="... bg-yellow-600 hover:bg-yellow-700 ..."
```

**Disconnect button color** (search for `bg-red-600/20`):
```tsx
// Change from:
className="... bg-red-600/20 hover:bg-red-600/30 ..."
// To:
className="... bg-rose-600/20 hover:bg-rose-600/30 ..."
```

### Change Button Text

Search for these strings and modify:
- `"Connect Wallet"` → Your text
- `"Disconnect"` → Your text
- `"Connected Address"` → Your text
- `"Network"` → Your text

---

## Common Issues & Solutions

### Issue: "Connect Wallet" button doesn't work
**Solution:**
1. Make sure MetaMask is installed
2. Open DevTools Console (F12)
3. Type: `window.ethereum` and press Enter
4. Should see MetaMask provider object
5. If undefined, MetaMask isn't installed

### Issue: Address doesn't persist after refresh
**Solution:**
1. Make sure you're not in Private/Incognito mode
2. Check localStorage:
   - Open DevTools Console
   - Type: `localStorage.getItem('neurovault.connected')`
   - Should return `'1'`
3. If not found, user disconnected or localStorage disabled

### Issue: "Switch to Arbitrum" button doesn't appear
**Solution:**
1. Verify `VITE_TARGET_CHAIN_ID` is set in `.env`
2. Check current chain in MetaMask
3. Make sure you're NOT already on the target chain
4. Open DevTools Console, type: `import.meta.env.VITE_TARGET_CHAIN_ID`

### Issue: Dropdown doesn't close when clicking outside
**Solution:**
1. Refresh page
2. Check browser console for errors
3. Make sure no other component is intercepting clicks
4. Try pressing Escape key instead

---

## Troubleshooting Commands

### Check Wallet Provider
```javascript
// In browser DevTools Console:
window.ethereum

// Should return MetaMask provider object with methods like:
// - request()
// - on()
// - off()
```

### Check Connection Flag
```javascript
// In browser DevTools Console:
localStorage.getItem('neurovault.connected')

// Should return '1' if connected, null if not
```

### Clear Connection Flag
```javascript
// In browser DevTools Console (if you want to test disconnect):
localStorage.removeItem('neurovault.connected')
```

### Check Environment Variables
```javascript
// In browser DevTools Console:
import.meta.env.VITE_TARGET_CHAIN_ID
// Should return your target chain ID
```

### Get Connected Address
```javascript
// In browser DevTools Console:
await window.ethereum.request({ method: 'eth_accounts' })

// Should return array like: ['0x1234567890abcdef...']
```

---

## Production Checklist

Before deploying to production:

- [ ] Set `VITE_TARGET_CHAIN_ID=42161` (Arbitrum One mainnet)
- [ ] Test with real MetaMask on mainnet
- [ ] Verify localStorage works in your hosting environment
- [ ] Test on mobile (MetaMask mobile app)
- [ ] Configure error tracking (Sentry, etc.)
- [ ] Add analytics for connection events
- [ ] Update documentation with your chain choice
- [ ] Test with real funds (small amounts) if applicable

---

## Support Resources

| Resource | Link |
|----------|------|
| Full Guide | `WALLET_CONNECT_GUIDE.md` |
| Code Reference | `WALLET_CONNECT_REFERENCE.md` |
| Implementation Notes | `WALLET_CONNECT_IMPLEMENTATION.md` |
| This Guide | `WALLET_CONNECT_DELIVERY.md` |

---

## File Structure

```
src/
├── components/
│   └── ConnectWallet.tsx        ← Main component (use this)
├── hooks/
│   └── useWallet.ts             ← Enhanced hook
└── vite-env.d.ts                ← Updated types

.env.example                      ← Configuration template
```

---

## That's It! 🎉

You now have a beautiful, production-ready wallet connection UI.

**Next steps:**
1. Add `<ConnectWallet />` to your Header
2. Set `VITE_TARGET_CHAIN_ID` in `.env`
3. Test locally with MetaMask
4. Deploy with confidence!

Questions? Check the documentation files or examine the component code directly.

Happy coding! 🚀
