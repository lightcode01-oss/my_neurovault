import { TrendingUp, Users, Database, Coins } from 'lucide-react';
import { motion } from 'framer-motion';
import { ScrollReveal } from './ScrollReveal';

export function Stats() {
  const stats = [
    { label: 'Total Memories', value: '12,847', icon: Database, change: '+12%' },
    { label: 'Active Agents', value: '1,284', icon: Users, change: '+8%' },
    { label: 'Validators', value: '342', icon: TrendingUp, change: '+15%' },
    { label: 'MCT Distributed', value: '45.2K', icon: Coins, change: '+23%' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <ScrollReveal key={index} delay={index * 0.1} direction="up">
              <motion.div
                className="bg-gradient-to-br from-purple-900/30 to-slate-900/30 border border-purple-500/20 rounded-xl p-6 backdrop-blur-sm relative overflow-hidden group hover:border-purple-500/40 transition-colors"
                whileHover={{ scale: 1.02, y: -4 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-cyan-500/0 group-hover:from-purple-500/5 group-hover:to-cyan-500/5"
                  transition={{ duration: 0.3 }}
                />
                
                {/* Animated corner accents */}
                <motion.div
                  className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-full"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.2,
                  }}
                />

                <div className="flex items-center justify-between mb-2 relative z-10">
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.2 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Icon className="w-5 h-5 text-cyan-400" />
                  </motion.div>
                  <motion.span 
                    className="text-xs text-green-400"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                  >
                    {stat.change}
                  </motion.span>
                </div>
                <motion.div 
                  className="text-2xl text-white mb-1 relative z-10"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-sm text-purple-300/60 relative z-10">{stat.label}</div>
              </motion.div>
            </ScrollReveal>
          );
        })}
      </div>
    </div>
  );
}