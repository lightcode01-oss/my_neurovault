/**
 * WALLET CONNECT UI - QUICK REFERENCE
 * 
 * Polished, accessible wallet connection component for NeuroVault
 * with network switching, address display, and dropdown menu.
 */

// ============================================================================
// 1. BASIC USAGE
// ============================================================================

import { ConnectWallet } from '@/components/ConnectWallet';

export function App() {
  return (
    <div>
      <header className="flex justify-between p-4">
        <h1>NeuroVault</h1>
        <ConnectWallet
          onConnect={(address, chainId) => {
            console.log('User connected:', address, 'on chain', chainId);
          }}
          onDisconnect={() => {
            console.log('User disconnected');
          }}
        />
      </header>
      {/* ... rest of app */}
    </div>
  );
}

// ============================================================================
// 2. ENVIRONMENT CONFIGURATION (.env)
// ============================================================================

// Set target chain for "Switch to Arbitrum" button
VITE_TARGET_CHAIN_ID=421614  // Arbitrum Sepolia (default)

// Other options:
// VITE_TARGET_CHAIN_ID=42161   // Arbitrum One (mainnet)
// VITE_TARGET_CHAIN_ID=42170   // Arbitrum Nova
// VITE_TARGET_CHAIN_ID=1       // Ethereum mainnet
// VITE_TARGET_CHAIN_ID=11155111 // Sepolia testnet

// ============================================================================
// 3. COMPONENT BEHAVIOR
// ============================================================================

/**
 * DISCONNECTED STATE
 * ─────────────────────────────────────
 * Shows: [🔗 Connect Wallet] button
 * Action: Click to open MetaMask, request accounts
 * Result: If approved, transitions to CONNECTED state
 * 
 * 
 * CONNECTED STATE
 * ─────────────────────────────────────
 * If WRONG CHAIN (chainId !== targetChainId):
 *   [Switch to Arbitrum] [● 0x6353...7F22 ▼]
 *    └─ Orange button      └─ Green indicator
 * 
 * If CORRECT CHAIN:
 *   [● 0x6353...7F22 ▼]
 *    └─ Green indicator
 * 
 * 
 * DROPDOWN MENU (click address pill)
 * ─────────────────────────────────────
 * ┌──────────────────────────────────┐
 * │ Connected Address                │
 * │ [0x6353...7F22]  [Copy]         │
 * │                                  │
 * │ Network                          │
 * │ ● Arbitrum Sepolia (421614)     │
 * │                                  │
 * │ [🚪 Disconnect]  (red button)   │
 * └──────────────────────────────────┘
 */

// ============================================================================
// 4. HOOK USAGE (useWallet)
// ============================================================================

import { useWallet } from '@/hooks/useWallet';

function MyComponent() {
  const {
    address,           // string | null - Full wallet address
    chainId,          // number | null - Current chain ID
    connected,        // boolean - Is wallet connected?
    connect,          // () => Promise<void> - Request connection
    reconnect,        // () => Promise<void> - Reconnect to saved wallet
    disconnect,       // () => Promise<void> - Clear session & localStorage
    switchChain,      // (targetChainId: number) => Promise<void> - Switch chain
    error,            // string | null - Last error message
  } = useWallet();

  return (
    <div>
      {connected ? (
        <>
          <p>Connected: {address}</p>
          <p>Chain ID: {chainId}</p>
          <button onClick={() => switchChain(42161)}>
            Switch to Arbitrum One
          </button>
          <button onClick={disconnect}>Disconnect</button>
        </>
      ) : (
        <>
          <p>Not connected</p>
          <button onClick={connect}>Connect</button>
        </>
      )}
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}

// ============================================================================
// 5. CHAIN NAME MAPPING
// ============================================================================

// Supported chains with human-friendly names:
const CHAIN_NAMES = {
  42161: 'Arbitrum One',      // Mainnet
  42170: 'Arbitrum Nova',     // Nova testnet
  421614: 'Arbitrum Sepolia', // Sepolia testnet (default target)
  1: 'Ethereum',              // Ethereum mainnet
  11155111: 'Sepolia',        // Sepolia testnet
};

// For unsupported chains, displays: "Chain {chainId}"

// ============================================================================
// 6. LOCALSTORAGE PERSISTENCE
// ============================================================================

/**
 * When user connects:
 * ├─ localStorage.setItem('neurovault.connected', '1')
 * └─ Saved for persistence across page reloads
 * 
 * When user disconnects:
 * ├─ localStorage.removeItem('neurovault.connected')
 * └─ Next reload will show "Connect Wallet" button
 * 
 * On page load:
 * ├─ Check if 'neurovault.connected' flag exists
 * ├─ If yes, call eth_accounts (non-popup)
 * ├─ If accounts found, restore connection
 * └─ If no accounts, clear flag (user disconnected externally)
 */

// ============================================================================
// 7. EVENT CALLBACKS
// ============================================================================

/**
 * onConnect(address: string, chainId: number)
 * ───────────────────────────────────────────
 * Fired when:
 * - User successfully connects wallet
 * - ConnectWallet component validates address & chainId
 * 
 * Usage:
 */
<ConnectWallet
  onConnect={(address, chainId) => {
    // Update global state
    store.setUser({ address, chainId });
    
    // Log analytics
    analytics.track('wallet_connected', {
      address,
      chainId,
      timestamp: Date.now(),
    });
    
    // Redirect to dashboard
    navigate('/dashboard');
  }}
/>;

/**
 * onDisconnect()
 * ─────────────
 * Fired when:
 * - User clicks "Disconnect" in dropdown
 * - Component clears session
 * 
 * Usage:
 */
<ConnectWallet
  onDisconnect={() => {
    // Clear global state
    store.clearUser();
    
    // Reset form data
    resetFormData();
    
    // Show message
    toast.info('Wallet disconnected');
  }}
/>;

// ============================================================================
// 8. ERROR HANDLING
// ============================================================================

/**
 * Common errors and how they're handled:
 * 
 * 1. "MetaMask or compatible wallet not found"
 *    └─ Shown when window.ethereum is not available
 *    └─ User needs to install MetaMask
 * 
 * 2. "Connection rejected by user"
 *    └─ User clicked "Cancel" in MetaMask popup
 *    └─ Can try again with another click
 * 
 * 3. "Failed to switch chain"
 *    └─ Shown in dropdown when wallet_switchEthereumChain fails
 *    └─ Usually network connectivity issue
 * 
 * 4. "Chain not available. Please add it manually in your wallet."
 *    └─ Target chain not installed in wallet
 *    └─ User must add it in MetaMask settings
 * 
 * Errors are cleared when operation succeeds.
 */

// ============================================================================
// 9. ACCESSIBILITY FEATURES
// ============================================================================

/**
 * ARIA Attributes:
 * ├─ aria-haspopup="menu" - Indicates button opens menu
 * ├─ aria-expanded - Shows if dropdown is open/closed
 * ├─ role="menu" - Semantic role for dropdown content
 * └─ role="menuitem" - Semantic role for disconnect button
 * 
 * Keyboard Navigation:
 * ├─ Tab - Focus address pill
 * ├─ Enter/Space - Open dropdown
 * ├─ Escape - Close dropdown
 * └─ Tab - Move through menu items
 * 
 * Screen Reader:
 * ├─ "Connected button showing 0x6353...7F22"
 * ├─ "Dropdown menu, showing network and disconnect option"
 * └─ "Red disconnect button"
 */

// ============================================================================
// 10. STYLING & CUSTOMIZATION
// ============================================================================

/**
 * Default Colors:
 * ├─ Address pill: Purple-cyan gradient
 * ├─ Switch button: Orange (on chain mismatch)
 * ├─ Disconnect button: Red
 * ├─ Status indicator: Green (connected)
 * └─ Network indicator: Cyan
 * 
 * To customize, edit ConnectWallet.tsx className values:
 * 
 * Address pill:
 *   className="... from-purple-900/40 to-cyan-900/40 ..."
 *   Change to your colors, e.g.: "from-blue-900/40 to-purple-900/40"
 * 
 * Switch button:
 *   className="... bg-orange-600 hover:bg-orange-700 ..."
 *   Change to: "bg-yellow-600 hover:bg-yellow-700"
 * 
 * Disconnect button:
 *   className="... bg-red-600/20 hover:bg-red-600/30 ..."
 *   Change to: "bg-red-500/30 hover:bg-red-500/40"
 * 
 * Status indicators:
 *   Search for "bg-green-500" and "bg-cyan-500"
 *   Change to your preferred colors
 */

// ============================================================================
// 11. TESTING
// ============================================================================

/**
 * Manual Testing Checklist:
 * 
 * [ ] Connect Wallet
 *     └─ Click "Connect Wallet" button
 *     └─ Approve in MetaMask popup
 *     └─ Address pill appears with green indicator
 * 
 * [ ] Address Display
 *     └─ Pill shows truncated address (0x6353...7F22)
 *     └─ Click pill to open dropdown
 *     └─ Dropdown shows full address
 * 
 * [ ] Copy Address
 *     └─ Click copy icon in dropdown
 *     └─ "Address copied!" toast appears
 *     └─ Paste (Ctrl+V) to verify
 * 
 * [ ] Chain Detection
 *     └─ Open MetaMask
 *     └─ Switch to different chain
 *     └─ "Switch to Arbitrum" button appears (if on wrong chain)
 * 
 * [ ] Chain Switch
 *     └─ Click "Switch to Arbitrum" button
 *     └─ Approve in MetaMask
 *     └─ Button disappears after successful switch
 * 
 * [ ] Persistence
 *     └─ Refresh page (Ctrl+R)
 *     └─ Address pill still shows (no re-connect popup)
 * 
 * [ ] Disconnect
 *     └─ Click address pill to open dropdown
 *     └─ Click red "Disconnect" button
 *     └─ Component switches back to "Connect Wallet" button
 *     └─ localStorage flag is cleared
 * 
 * [ ] Keyboard Navigation
 *     └─ Tab to address pill
 *     └─ Press Enter to open dropdown
 *     └─ Press Escape to close dropdown
 * 
 * [ ] Error Handling
 *     └─ Disconnect internet
 *     └─ Try to connect/switch chain
 *     └─ Error message appears inline
 *     └─ Reconnect internet and retry
 */

// ============================================================================
// 12. DEPLOYMENT CHECKLIST
// ============================================================================

/**
 * Before deploying to production:
 * 
 * [ ] Set VITE_TARGET_CHAIN_ID in production .env
 *     └─ Usually 42161 (Arbitrum One mainnet)
 * 
 * [ ] Test with real MetaMask on mainnet
 * 
 * [ ] Verify localStorage works in production
 * 
 * [ ] Test on mobile (MetaMask mobile app)
 * 
 * [ ] Check analytics/logging integration
 * 
 * [ ] Verify error messages are user-friendly
 * 
 * [ ] Test RPC endpoints for failover
 * 
 * [ ] Add sentry/error tracking for wallet operations
 */

// ============================================================================
