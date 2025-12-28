import { useState, useRef, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import { Button } from './ui/button';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from './ui/popover';
import {
  Wallet,
  ChevronDown,
  Copy,
  Check,
  LogOut,
  Network,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface ConnectWalletProps {
  onConnect?: (address: string, chainId: number) => void;
  onDisconnect?: () => void;
}

// Chain ID to name mapping
const CHAIN_NAMES: Record<number, string> = {
  42161: 'Arbitrum One',
  42170: 'Arbitrum Nova',
  421614: 'Arbitrum Sepolia',
  1: 'Ethereum',
  11155111: 'Sepolia',
};

export function ConnectWallet({ onConnect, onDisconnect }: ConnectWalletProps) {
  const { address, chainId, connected, connect, disconnect, switchChain, error } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get target chain ID from environment or default to Arbitrum Sepolia
  const targetChainId = import.meta.env.VITE_TARGET_CHAIN_ID
    ? parseInt(import.meta.env.VITE_TARGET_CHAIN_ID as string, 10)
    : 421614;

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '';

  const chainName = chainId ? (CHAIN_NAMES[chainId] || `Chain ${chainId}`) : '';
  const needsChainSwitch = connected && chainId !== targetChainId;

  // Handle disconnect
  const handleDisconnect = async () => {
    try {
      setSwitchError(null);
      await disconnect();
      setIsOpen(false);
      onDisconnect?.();
      toast.success('Wallet disconnected');
    } catch (err: any) {
      setSwitchError('Failed to disconnect');
      console.error('Disconnect error:', err);
    }
  };

  // Handle switch chain
  const handleSwitchChain = async () => {
    try {
      setSwitchError(null);
      await switchChain(targetChainId);
      toast.success(`Switched to ${CHAIN_NAMES[targetChainId] || `Chain ${targetChainId}`}`);
    } catch (err: any) {
      setSwitchError('Failed to switch chain');
      console.error('Switch chain error:', err);
    }
  };

  // Handle copy address
  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success('Address copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Handle connect
  const handleConnect = async () => {
    try {
      setSwitchError(null);
      await connect();
    } catch (err: any) {
      setSwitchError('Failed to connect');
      console.error('Connect error:', err);
    }
  };

  // Notify parent of connection changes
  useEffect(() => {
    if (connected && address && chainId) {
      onConnect?.(address, chainId);
    }
  }, [connected, address, chainId, onConnect]);

  // Close dropdown on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  if (!connected) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        {error && (
          <motion.div
            className="mb-2 text-xs text-red-400 max-w-sm text-right"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            onClick={handleConnect}
            className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white relative overflow-hidden group"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 opacity-0 group-hover:opacity-100"
              transition={{ duration: 0.3 }}
            />
            <Wallet className="w-4 h-4 mr-2 relative z-10" />
            <span className="relative z-10">Connect Wallet</span>
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex items-center gap-2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      ref={dropdownRef}
    >
      {/* Switch Chain Button */}
      {needsChainSwitch && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            onClick={handleSwitchChain}
            size="sm"
            className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-3"
            title={`Switch to ${CHAIN_NAMES[targetChainId]}`}
          >
            <Network className="w-3 h-3 mr-1" />
            Switch to {CHAIN_NAMES[targetChainId]?.split(' ')[0]}
          </Button>
        </motion.div>
      )}

      {/* Connected Address Pill with Dropdown */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <button
              className="flex items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r from-purple-900/40 to-cyan-900/40 border border-purple-500/30 hover:border-purple-500/50 text-white text-sm transition-all duration-200"
              aria-label={`Connected: ${shortAddress}`}
              aria-haspopup="menu"
              aria-expanded={isOpen}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <Wallet className="w-3 h-3" />
              <span className="font-mono font-semibold">{shortAddress}</span>
              <ChevronDown className="w-3 h-3 text-purple-300/50" />
            </button>
          </motion.div>
        </PopoverTrigger>

        <PopoverContent
          align="end"
          className="w-80 bg-slate-950 border border-purple-500/20 rounded-xl p-4 shadow-xl backdrop-blur-sm"
          role="menu"
        >
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Header */}
              <div>
                <p className="text-xs text-purple-300/60 uppercase tracking-wide mb-1">
                  Connected Address
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono text-white bg-slate-900/50 border border-purple-500/20 rounded px-3 py-2 break-all">
                    {address}
                  </code>
                  <motion.button
                    onClick={handleCopyAddress}
                    className="p-2 hover:bg-purple-900/30 rounded-lg transition-colors"
                    title="Copy address"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-purple-400" />
                    )}
                  </motion.button>
                </div>
              </div>

              {/* Network Info */}
              <div className="pt-2 border-t border-purple-500/20">
                <p className="text-xs text-purple-300/60 uppercase tracking-wide mb-2">
                  Network
                </p>
                <div className="flex items-center gap-2 text-sm text-white">
                  <div className="relative flex h-2 w-2 flex-shrink-0">
                    <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </div>
                  <span>
                    {chainName} <span className="text-xs text-purple-300/60">({chainId})</span>
                  </span>
                </div>
              </div>

              {/* Error Message */}
              {switchError && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-900/20 border border-red-500/30 rounded-lg p-2 text-xs text-red-300"
                >
                  {switchError}
                </motion.div>
              )}

              {/* Disconnect Button */}
              <motion.button
                onClick={handleDisconnect}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 hover:border-red-500/50 rounded-lg text-red-400 hover:text-red-300 text-sm font-medium transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                role="menuitem"
              >
                <LogOut className="w-4 h-4" />
                Disconnect
              </motion.button>
            </motion.div>
          </AnimatePresence>
        </PopoverContent>
      </Popover>
    </motion.div>
  );
}

