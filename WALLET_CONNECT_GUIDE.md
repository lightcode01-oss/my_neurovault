# Wallet Connect UI Component

## Overview
The enhanced `ConnectWallet` component provides a polished, accessible wallet connection UI with network switching, address display, and dropdown menu. It's fully self-contained and ready to drop into your NeuroVault frontend.

## Features

### 1. **Polished Visual Design**
- Clean, modern pill-shaped address display with gradient backgrounds
- Green pulsing indicator showing connected status
- Smooth animations powered by Framer Motion
- Responsive layout with mobile-friendly spacing

### 2. **Connected State UI**
```
┌─────────────────────────────────────────────────┐
│ [Switch to Arbitrum] [● 0x6353...7F22 ▼]       │
└─────────────────────────────────────────────────┘
     (shown only on wrong chain)    (dropdown pill)
```

When connected, displays:
- **Network button** (if on wrong chain): Allows switching to target chain
- **Address pill**: Shows truncated address with green connection indicator
- **Dropdown toggle**: Click to reveal full address, network details, and disconnect option

### 3. **Disconnected State UI**
```
┌────────────────────────────────┐
│ [🔗 Connect Wallet]            │
└────────────────────────────────┘
```

When not connected, shows a gradient "Connect Wallet" button with hover animations.

### 4. **Dropdown Menu**
When the address pill is clicked, a dropdown appears showing:
- **Full Address**: Copyable full wallet address with copy button
- **Network Info**: Chain name and ID with green status indicator
- **Error Messages**: Inline error feedback for failed operations
- **Disconnect Button**: Red button to disconnect and clear session

### 5. **Network Switching**
- Automatically detects when wallet is on the wrong chain
- Shows orange "Switch to Arbitrum" button when chain mismatch detected
- Reads target chain from `VITE_TARGET_CHAIN_ID` env var (defaults to Arbitrum Sepolia: 421614)
- Supports all Arbitrum chains and standard EVM networks

### 6. **Accessibility**
- **ARIA attributes**: `aria-haspopup`, `aria-expanded`, `role="menu"` for dropdown
- **Keyboard navigation**: Press `Escape` to close dropdown
- **Focus management**: Click outside dropdown to close
- **Semantic HTML**: Proper button and menu roles
- **Screen reader friendly**: Descriptive labels and status text

### 7. **LocalStorage Persistence**
- Saves connection state in `localStorage` under `neurovault.connected` flag
- On page reload, automatically reconnects if previously connected
- Uses `eth_accounts` (non-interactive) to check for existing accounts
- Never forces popup on page load; waits for user gesture

### 8. **Error Handling**
- Graceful error messages for wallet operations
- Displays inline error in dropdown when chain switch fails
- Shows "Chain not available" message for unsupported chains
- Error dismissal after successful retry

## Component Files

### 1. `src/components/ConnectWallet.tsx`
The main component file containing:
- Connected state UI with address pill and dropdown
- Disconnected state UI with connect button
- Network switching logic with chain name mapping
- Copy-to-clipboard functionality
- Error handling and display

**Key functions:**
- `handleConnect()`: Request wallet connection
- `handleDisconnect()`: Clear session and disconnect
- `handleSwitchChain()`: Switch to target chain ID
- `handleCopyAddress()`: Copy full address to clipboard

### 2. `src/hooks/useWallet.ts` (Updated)
Enhanced wallet hook with new methods:

```typescript
interface UseWalletReturn {
  address: string | null;
  chainId: number | null;
  connected: boolean;
  connect: () => Promise<void>;
  reconnect: () => Promise<void>;
  disconnect: () => Promise<void>;      // NEW
  switchChain: (targetChainId: number) => Promise<void>;  // NEW
  error: string | null;
}
```

**New methods:**
- `disconnect()`: Clear local state and localStorage flag
- `switchChain(targetChainId)`: Request chain switch via `wallet_switchEthereumChain` RPC

## Usage

### Basic Integration
```tsx
import { ConnectWallet } from '@/components/ConnectWallet';

export function Header() {
  return (
    <header className="flex items-center justify-between p-4">
      <h1>NeuroVault</h1>
      <ConnectWallet 
        onConnect={(address, chainId) => console.log('Connected:', address, chainId)}
        onDisconnect={() => console.log('Disconnected')}
      />
    </header>
  );
}
```

### Props
```typescript
interface ConnectWalletProps {
  onConnect?: (address: string, chainId: number) => void;
  onDisconnect?: () => void;
}
```

**Callbacks:**
- `onConnect(address, chainId)`: Called when wallet successfully connects, includes full address and chain ID
- `onDisconnect()`: Called when wallet is disconnected

### Environment Variables
Add to `.env`:
```dotenv
# Target chain ID for "Switch to Arbitrum" button
# Defaults to 421614 (Arbitrum Sepolia)
VITE_TARGET_CHAIN_ID=421614

# Other chain IDs:
# 42161 = Arbitrum One (mainnet)
# 42170 = Arbitrum Nova
# 1 = Ethereum mainnet
# 11155111 = Sepolia testnet
```

## Chain Support

### Built-in Chain Names
The component includes human-friendly names for common chains:
```typescript
const CHAIN_NAMES: Record<number, string> = {
  42161: 'Arbitrum One',
  42170: 'Arbitrum Nova',
  421614: 'Arbitrum Sepolia',
  1: 'Ethereum',
  11155111: 'Sepolia',
};
```

For unsupported chains, displays "Chain {chainId}".

### Adding New Chains
To add support for a new chain name, update `CHAIN_NAMES` in `ConnectWallet.tsx`:
```typescript
const CHAIN_NAMES: Record<number, string> = {
  // ... existing chains
  137: 'Polygon', // Add this line
};
```

## Styling

### Color Scheme
- **Connected pill**: `from-purple-900/40 to-cyan-900/40` gradient with `border-purple-500/30`
- **Switch button**: Orange (`bg-orange-600`) when chain mismatch detected
- **Disconnect button**: Red (`bg-red-600/20` hover `bg-red-600/30`)
- **Status indicator**: Green (`bg-green-500` with pulsing animation)
- **Network indicator**: Cyan (`bg-cyan-500` with pulsing animation)
- **Dropdown**: Dark slate (`bg-slate-950`) with purple border and backdrop blur

### Customization
All styling uses Tailwind CSS classes. To customize:

1. **Change address pill colors**:
   ```tsx
   className="... from-blue-900/40 to-purple-900/40 border-blue-500/30 ..."
   ```

2. **Change button colors**:
   ```tsx
   className="bg-gradient-to-r from-green-600 to-emerald-600 ..."
   ```

3. **Change dropdown background**:
   ```tsx
   className="bg-blue-950 border-blue-500/20 ..."
   ```

## Event Flow Diagram

```
User clicks "Connect Wallet" button
         ↓
   handleConnect()
         ↓
   window.ethereum.request({ method: 'eth_requestAccounts' })
         ↓
   User confirms in MetaMask
         ↓
   address & chainId updated
         ↓
   localStorage flag set
         ↓
   onConnect callback fired
         ↓
   Component switches to Connected state (pill + dropdown)
```

```
User clicks address pill
         ↓
   Popover opens (dropdown visible)
         ↓
   User clicks "Copy" or "Disconnect"
         ↓
   If Disconnect:
     - handleDisconnect()
     - localStorage flag cleared
     - Component switches to Disconnected state
     - onDisconnect callback fired
```

## Browser Requirements
- **MetaMask** or compatible injected wallet provider (`window.ethereum`)
- **ES2020+** JavaScript support
- **React 16.8+** (hooks support)

## Testing Checklist

- [ ] **Connect Wallet**: Click button, approve in MetaMask, address appears
- [ ] **Address Display**: Full address visible in dropdown, truncated in pill
- [ ] **Copy Address**: Click copy icon, verify clipboard contents
- [ ] **Chain Detection**: Switch chains in MetaMask, UI updates immediately
- [ ] **Chain Switch**: Click "Switch to Arbitrum", chain changes in wallet
- [ ] **Persistence**: Refresh page, address still shows (no re-popup)
- [ ] **Disconnect**: Click disconnect button, returns to "Connect Wallet" button
- [ ] **Error Handling**: Simulate network error, verify error message displays
- [ ] **Keyboard**: Press Escape in dropdown, dropdown closes
- [ ] **Mobile**: Test on mobile device (if applicable)

## Troubleshooting

### "MetaMask or compatible wallet not found"
- Ensure MetaMask (or compatible provider) is installed
- Check browser console for `window.ethereum` availability

### "Connect Wallet" button appears but clicking does nothing
- Check browser console for errors
- Verify `window.ethereum` is available and not blocked by CSP
- Clear browser cache and reload

### Address doesn't persist on reload
- Check if `localStorage` is available (not in private/incognito mode)
- Verify localStorage flag is being set: `localStorage.getItem('neurovault.connected')`

### "Chain not available" error
- The target chain may not be added to the wallet
- User must manually add the chain in MetaMask settings
- Provide RPC URL to user: `VITE_RPC_URL` from your environment

### Dropdown doesn't close on Escape
- Check if another component has intercepted the Escape key
- Verify `isOpen` state is being managed correctly

## Browser Support
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Opera 76+

## Performance Notes
- Component uses `memo` optimization via Framer Motion
- Popover opens with smooth animation and no jank
- HMR (hot module reload) updates smoothly in dev mode
- No unnecessary re-renders via proper dependency arrays

## File Summary

| File | Lines | Purpose |
|------|-------|---------|
| `src/components/ConnectWallet.tsx` | ~380 | Main component with UI & behavior |
| `src/hooks/useWallet.ts` | ~180 | Enhanced wallet hook with disconnect/switchChain |
| `.env.example` | +1 | Added `VITE_TARGET_CHAIN_ID` |
| `src/vite-env.d.ts` | +3 | Added new env var types |

## Next Steps

1. **Update Header.tsx** to use new ConnectWallet component
2. **Subscribe to callbacks** in parent components (e.g., App.tsx)
3. **Test with MetaMask** before deploying
4. **Customize colors** to match your brand if needed
5. **Add VITE_TARGET_CHAIN_ID** to your `.env` file
