import { motion } from 'framer-motion';

// Simplified, motion-safe background. Avoids string keyframes and CSS calc/vh values
// which caused framer-motion unit-conversion errors in the original implementation.
export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Three large orbs with numeric transforms only */}
      <motion.div
        className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.25, 0.5, 0.25],
          x: [0, 60, 0],
          y: [0, 40, 0],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="absolute bottom-0 right-1/4 w-[450px] h-[450px] bg-cyan-500/10 rounded-full blur-3xl"
        animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0.6, 0.4], x: [0, -50, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-3xl"
        animate={{ scale: [1, 1.18, 1], opacity: [0.15, 0.45, 0.15], x: [0, -40, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Floating particles (limited) - numeric keyframes only */}
      {Array.from({ length: 20 }).map((_, i) => {
        const size = 1 + Math.round(Math.random() * 3);
        const left = Math.round(Math.random() * 100);
        const top = Math.round(Math.random() * 100);
        const dx = Math.round(Math.random() * 80) - 40;
        const dy = Math.round(Math.random() * 80) - 40;
        return (
          <motion.div
            key={`particle-${i}`}
            className="absolute rounded-full"
            style={{ width: `${size}px`, height: `${size}px`, left: `${left}%`, top: `${top}%`, backgroundColor: i % 3 === 0 ? 'rgba(168,85,247,0.25)' : i % 3 === 1 ? 'rgba(34,211,238,0.2)' : 'rgba(236,72,153,0.18)' }}
            animate={{ x: [0, dx, 0], y: [0, dy, 0], opacity: [0, 1, 0], scale: [0.6, 1, 0.6] }}
            transition={{ duration: 6 + (i % 5), repeat: Infinity, delay: (i % 7) * 0.2, ease: 'easeInOut' }}
          />
        );
      })}

      {/* Simple SVG network lines with numeric path animations */}
      <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none">
        {Array.from({ length: 6 }).map((_, i) => {
          const x1 = 10 + i * 14;
          const y1 = 30 + ((i % 2) * 30);
          const x2 = x1 + 12;
          const y2 = 30 + (((i + 1) % 2) * 30);
          return (
            <g key={`net-${i}`}>
              <motion.line
                x1={`${x1}%`}
                y1={`${y1}%`}
                x2={`${x2}%`}
                y2={`${y2}%`}
                stroke="rgba(168,85,247,0.45)"
                strokeWidth={1}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 0], opacity: [0, 0.5, 0] }}
                transition={{ duration: 3.5 + (i % 3) * 0.6, repeat: Infinity, delay: i * 0.2 }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default AnimatedBackground;