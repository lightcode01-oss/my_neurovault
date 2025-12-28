import { Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { ConnectWallet } from './ConnectWallet';

interface HeaderProps {
  activeTab: 'explore' | 'submit' | 'validate';
  setActiveTab: (tab: 'explore' | 'submit' | 'validate') => void;
}

export function Header({ activeTab, setActiveTab }: HeaderProps) {
  return (
    <header className="border-b border-purple-900/20 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div 
              className="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center relative overflow-hidden"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"
                animate={{
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
              <Brain className="w-6 h-6 text-white relative z-10" />
            </motion.div>
            <div>
              <h1 className="text-white">NeuroVault</h1>
              <p className="text-xs text-purple-300/60">AI Memory Network</p>
            </div>
          </motion.div>

          <nav className="hidden md:flex items-center gap-2">
            {(['explore', 'submit', 'validate'] as const).map((tab, index) => (
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Button
                  variant={activeTab === tab ? 'default' : 'ghost'}
                  onClick={() => setActiveTab(tab)}
                  className={activeTab === tab ? 'bg-purple-600 hover:bg-purple-700 relative overflow-hidden' : 'text-purple-300 hover:text-white hover:bg-purple-900/30'}
                >
                  {activeTab === tab && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-700"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 capitalize">{tab}</span>
                </Button>
              </motion.div>
            ))}
          </nav>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ConnectWallet />
          </motion.div>
        </div>
      </div>
    </header>
  );
}