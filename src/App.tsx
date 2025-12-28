import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { MemorySubmission } from './components/MemorySubmission';
import { MemoryGallery } from './components/MemoryGallery';
import { ValidationDashboard } from './components/ValidationDashboard';
import { Stats } from './components/Stats';
import AnimatedBackground from './components/AnimatedBackgroundSafe';
import { FooterStatus } from './components/FooterStatus';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [activeTab, setActiveTab] = useState<'explore' | 'submit' | 'validate'>('explore');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 relative overflow-hidden">
      {/* Animated background elements */}
      <AnimatedBackground />

      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="relative z-10">
        <Hero />
        <Stats />
        
        <AnimatePresence mode="wait">
          {activeTab === 'explore' && (
            <motion.div
              key="explore"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <MemoryGallery />
            </motion.div>
          )}
          {activeTab === 'submit' && (
            <motion.div
              key="submit"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <MemorySubmission />
            </motion.div>
          )}
          {activeTab === 'validate' && (
            <motion.div
              key="validate"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ValidationDashboard />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t border-purple-900/20 bg-slate-950/50 backdrop-blur-sm py-8 mt-20 relative z-10">
        <div className="container mx-auto px-4 text-center text-purple-300/60">
          <p>NeuroVault Protocol • Arbitrum Network • Decentralized AI Memory</p>
        </div>
      </footer>

      <Toaster />
      <FooterStatus />
    </div>
  );
}