import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '../hooks/useWallet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { Copy, Check } from 'lucide-react';

export function FooterStatus() {
  const { address, chainId, connected } = useWallet();
  const [copied, setCopied] = useState(false);

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '';

  const chainName = chainId
    ? getChainName(chainId)
    : 'Unknown';

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      className="fixed bottom-4 right-4 flex flex-col items-end gap-2 z-40"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Chain info */}
      <div className="text-xs text-purple-300/70 px-3 py-1.5 bg-slate-900/80 border border-purple-500/20 rounded-lg backdrop-blur-sm">
        Chain: {chainName} {chainId && `(${chainId})`}
      </div>

      {/* Wallet status */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <motion.div
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 border border-purple-500/20 rounded-lg backdrop-blur-sm text-xs cursor-pointer hover:border-purple-500/40"
              >
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-gray-400'}`} />
                <span className="text-purple-300/70">
                  {connected ? shortAddress : 'Not connected'}
                </span>

                {address && (
                  <motion.button
                    onClick={handleCopyAddress}
                    className="ml-1 p-0.5 hover:text-purple-300 text-purple-400/60 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    title="Copy address"
                  >
                    <AnimatePresence mode="wait">
                      {copied ? (
                        <motion.div
                          key="check"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                        >
                          <Check className="w-3 h-3" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="copy"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                        >
                          <Copy className="w-3 h-3" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                )}
              </motion.div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {address ? `Full address: ${address}` : 'Not connected'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </motion.div>
  );
}

function getChainName(chainId: number): string {
  const chains: Record<number, string> = {
    1: 'Ethereum',
    5: 'Goerli',
    11155111: 'Sepolia',
    42161: 'Arbitrum One',
    421613: 'Arbitrum Sepolia',
    421614: 'Arbitrum Sepolia',
    137: 'Polygon',
    80001: 'Mumbai',
  };

  return chains[chainId] || 'Unknown';
}
