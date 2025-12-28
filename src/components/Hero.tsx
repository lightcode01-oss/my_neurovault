import { Sparkles, Shield, Database } from 'lucide-react';
import { motion } from 'framer-motion';
import { ScrollReveal } from './ScrollReveal';

export function Hero() {
  return (
    <div className="container mx-auto px-4 py-16 text-center relative">
      {/* Decorative blockchain elements */}
      <motion.div
        className="absolute top-10 left-10 w-20 h-20 border border-purple-500/20 rounded-lg"
        animate={{
          rotate: [0, 90, 180, 270, 360],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      <motion.div
        className="absolute bottom-10 right-10 w-16 h-16 border border-cyan-500/20 rounded-lg"
        animate={{
          rotate: [360, 270, 180, 90, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div 
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-900/30 border border-purple-500/30 rounded-full mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            animate={{
              rotate: [0, 360],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </motion.div>
          <span className="text-sm text-purple-200">Powered by AI + Arbitrum Blockchain</span>
        </motion.div>

        <motion.h2 
          className="text-5xl md:text-6xl bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Decentralized AI Memory Network
        </motion.h2>
        
        <motion.p 
          className="text-xl text-purple-200/80 mb-12 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Create, verify, and retrieve AI-generated knowledge units. 
          An immutable, collective memory layer where AI cognition meets blockchain verifiability.
        </motion.p>

        <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <ScrollReveal delay={0.3}>
            <FeatureCard
              icon={<Sparkles className="w-6 h-6" />}
              title="AI-Generated"
              description="Memories created by advanced AI agents with cryptographic signatures"
            />
          </ScrollReveal>
          <ScrollReveal delay={0.4}>
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Verified On-Chain"
              description="Validated by community and stored immutably on Arbitrum"
            />
          </ScrollReveal>
          <ScrollReveal delay={0.5}>
            <FeatureCard
              icon={<Database className="w-6 h-6" />}
              title="IPFS Storage"
              description="Full payloads stored off-chain with on-chain provenance"
            />
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <motion.div 
      className="bg-gradient-to-br from-purple-900/40 to-slate-900/40 border border-purple-500/20 rounded-xl p-6 backdrop-blur-sm group hover:border-purple-500/40 transition-colors relative overflow-hidden"
      whileHover={{ y: -5 }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-cyan-500/0 group-hover:from-purple-500/10 group-hover:to-cyan-500/10"
        transition={{ duration: 0.3 }}
      />
      <motion.div 
        className="w-12 h-12 bg-gradient-to-br from-purple-600/30 to-cyan-600/30 rounded-lg flex items-center justify-center mb-4 mx-auto text-cyan-400 relative z-10"
        whileHover={{ rotate: 360, scale: 1.1 }}
        transition={{ duration: 0.5 }}
      >
        {icon}
      </motion.div>
      <h3 className="text-white mb-2 relative z-10">{title}</h3>
      <p className="text-sm text-purple-300/70 relative z-10">{description}</p>
    </motion.div>
  );
}